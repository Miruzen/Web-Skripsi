// supabase/functions/get-mood-series/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // ✅ Handle preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Ambil konfigurasi dari environment
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ||
      Deno.env.get("VITE_SUPABASE_URL") ||
      "https://gxvtpfroptavwkibqlss.supabase.co";

    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase credentials!");
      return new Response(
        JSON.stringify({
          error:
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / ANON_KEY in environment",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // ✅ Inisialisasi Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      },
    });

    // ✅ Ambil body request
    const body = await req.json().catch(() => ({}));
    const start_date =
      body.start_date || body.startDate || body.start || null;
    const end_date = body.end_date || body.endDate || body.end || null;

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({
          error: "start_date and end_date required (YYYY-MM-DD)",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📅 Fetching mood_series from ${start_date} → ${end_date}`);

    // ✅ Query ke tabel
    const { data, error } = await supabase
      .from("mood_series")
      .select("*")
      .gte("date", start_date)
      .lte("date", end_date)
      .order("date", { ascending: true });

    if (error) {
      console.error("❌ Supabase query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const formatted = (data || []).map((d: any) => ({
      date: d.date,
      mood_score: d.mood_score,
      t_pos: d.t_pos,
      t_neg: d.t_neg,
      t_neutral: d.t_neutral,
      c_pos: d.c_pos,
      c_neg: d.c_neg,
      c_neutral: d.c_neutral,
      close: d.close,
      ema20: d.ema20,
      ema50: d.ema50,
      norm_ema20: d.norm_ema20,
      norm_ema50: d.norm_ema50,
      norm_close: d.norm_close,
    }));

    return new Response(JSON.stringify({ data: formatted }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error("❌ Error get-mood-series:", err);
    return new Response(
      JSON.stringify({
        error: String(err?.message ?? err),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
