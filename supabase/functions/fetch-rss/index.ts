import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source?: string;
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rssUrl } = await req.json();
    
    if (!rssUrl) {
      return new Response(
        JSON.stringify({ error: "RSS URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching RSS from: ${rssUrl}`);
    
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SUFOX Terminal/1.0)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
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