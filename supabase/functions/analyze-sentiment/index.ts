import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// 1️⃣ HuggingFace Space utama kamu
const HF_SPACE_URL = "https://miruzen-modela-api.hf.space/analyze";

// 2️⃣ Router inference baru (backup)
const HF_ROUTER_URL = "https://router.huggingface.co/hf-inference";

const HF_API_KEY = Deno.env.get("HF_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, content } = await req.json();
    if (!title && !content) {
      return new Response(JSON.stringify({ error: "Title or content required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Coba HuggingFace Space dulu
    let response = await fetch(HF_SPACE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    // Jika gagal total, fallback ke router inference (baru)
    if (!response.ok) {
      console.warn(`⚠️ Space gagal (${response.status}), mencoba router inference...`);
      response = await fetch(HF_ROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: content || title,
          model: "ProsusAI/finbert",
        }),
      });
    }

    const result = await response.json();

    // Format sesuai schema frontend
    const formatted = {
      title: result.details?.title
        ? {
            sentiment: result.details.title.label,
            probabilities: result.details.title.scores,
            model: "FinBERT",
          }
        : null,
      content: result.details?.content
        ? {
            sentiment: result.details.content.label,
            probabilities: result.details.content.scores,
            model: "Longformer",
          }
        : null,
      mood_score: result.mood_score ?? null,
      errors: result.errors ?? [],
    };

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("❌ analyze-sentiment error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
