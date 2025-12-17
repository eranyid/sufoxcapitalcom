import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting trash cleanup job...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffISO = cutoffDate.toISOString();

    console.log(`Cleaning up items deleted before: ${cutoffISO}`);

    // Delete old soft-deleted items from all tables
    const tables = [
      'transactions',
      'valuations',
      'crm_tasks',
      'crm_companies',
      'crm_funds',
      'crm_projects',
    ];

    const results: Record<string, number> = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoffISO)
        .select('id');

      if (error) {
        console.error(`Error cleaning ${table}:`, error.message);
        results[table] = -1;
      } else {
        const count = data?.length || 0;
        results[table] = count;
        console.log(`Cleaned ${count} items from ${table}`);
      }
    }

    const totalCleaned = Object.values(results).filter(v => v > 0).reduce((a, b) => a + b, 0);
    console.log(`Trash cleanup complete. Total items permanently deleted: ${totalCleaned}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete. Deleted ${totalCleaned} items.`,
        details: results,
        cutoffDate: cutoffISO,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cleanup job failed:', errorMessage);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
