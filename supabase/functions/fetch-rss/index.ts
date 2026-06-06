import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
}

// Allowlist of permitted RSS feed domains for security
const ALLOWED_DOMAINS = [
  'feeds.bloomberg.com',
  'bloomberg.com',
  'feeds.reuters.com',
  'reuters.com',
  'rss.nytimes.com',
  'nytimes.com',
  'feeds.feedburner.com',
  'feedburner.com',
  'feeds.wsj.com',
  'wsj.com',
  'feeds.ft.com',
  'ft.com',
  'finance.yahoo.com',
  'feeds.finance.yahoo.com',
  'cnbc.com',
  'feeds.cnbc.com',
  'marketwatch.com',
  'feeds.marketwatch.com',
  'seekingalpha.com',
  'feeds.seekingalpha.com',
  'investing.com',
  'thestreet.com',
  'barrons.com',
  'economist.com',
  'forbes.com',
  'businessinsider.com',
  'morningstar.com',
  'fool.com',
  'zacks.com'
];

// Block private/internal IP ranges and cloud metadata endpoints
function isBlockedHost(hostname: string): boolean {
  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254') return true;
  if (hostname === 'metadata.google.internal') return true;
  if (hostname.endsWith('.internal')) return true;
  
  // Block localhost and loopback
  if (hostname === 'localhost') return true;
  if (hostname === '127.0.0.1') return true;
  if (hostname.startsWith('127.')) return true;
  
  // Block private IP ranges
  const ipParts = hostname.split('.').map(Number);
  if (ipParts.length === 4 && ipParts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
    // 10.0.0.0/8
    if (ipParts[0] === 10) return true;
    // 172.16.0.0/12
    if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return true;
    // 192.168.0.0/16
    if (ipParts[0] === 192 && ipParts[1] === 168) return true;
    // 0.0.0.0/8
    if (ipParts[0] === 0) return true;
  }
  
  return false;
}

function isAllowedUrl(urlString: string): { allowed: boolean; reason?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { allowed: false, reason: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    // Block internal/private hosts
    if (isBlockedHost(url.hostname)) {
      return { allowed: false, reason: 'Internal or private network addresses are not allowed' };
    }
    
    // Check against allowlist
    const isAllowed = ALLOWED_DOMAINS.some(domain => {
      return url.hostname === domain || url.hostname.endsWith('.' + domain);
    });
    
    if (!isAllowed) {
      return { 
        allowed: false, 
        reason: `Domain "${url.hostname}" is not in the allowed list. Permitted domains include: Bloomberg, Reuters, WSJ, FT, CNBC, Yahoo Finance, and other major financial news sources.` 
      };
    }
    
    return { allowed: true };
  } catch {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  
  // Extract channel title for source
  const channelTitleMatch = xml.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
  const channelTitle = channelTitleMatch ? channelTitleMatch[1].trim() : undefined;
  
  // Find all items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    // Extract title
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract link
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    // Extract pubDate
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    
    // Extract source if available
    const sourceMatch = itemContent.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/);
    const source = sourceMatch ? sourceMatch[1].trim() : channelTitle;
    
    if (title && link) {
      items.push({ title, link, pubDate, source });
    }
  }
  
  return items;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Verify caller is authenticated
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const { rssUrl } = await req.json();
    
    if (!rssUrl) {
      return new Response(
        JSON.stringify({ error: "RSS URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL against allowlist
    const validation = isAllowedUrl(rssUrl);
    if (!validation.allowed) {
      console.log(`Blocked RSS request for URL: ${rssUrl} - Reason: ${validation.reason}`);
      return new Response(
        JSON.stringify({ error: validation.reason }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching RSS from allowed source: ${rssUrl}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    let response: Response;
    try {
      response = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SUFOX Terminal/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // Return empty items on timeout instead of error
        console.log('RSS fetch timed out, returning empty items');
        return new Response(
          JSON.stringify({ items: [], timeout: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Return empty items instead of error for non-critical failures
      console.log(`RSS fetch failed with status ${response.status}, returning empty items`);
      return new Response(
        JSON.stringify({ items: [], error: `HTTP ${response.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();
    
    // Limit response size to prevent memory exhaustion (max 1MB)
    if (xmlText.length > 1024 * 1024) {
      throw new Error('RSS feed response too large');
    }
    
    const items = parseRssXml(xmlText);
    
    console.log(`Parsed ${items.length} RSS items`);

    return new Response(
      JSON.stringify({ items }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("RSS fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch RSS feed";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
