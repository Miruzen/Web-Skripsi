import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface SentimentDetail {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

function normalizeLabel(lbl: string) {
  return (lbl || "").toLowerCase();
}

function mapItemsToScores(items: any[]): SentimentDetail {
  const labelMap: Record<string, keyof SentimentDetail["probabilities"]> = {
    "label_0": "negative",
    "label_1": "neutral",
    "label_2": "positive",
    "negative": "negative",
    "neutral": "neutral",
    "positive": "positive",
    "neg": "negative",
    "neu": "neutral",
    "pos": "positive",
  };

  const scores: { positive: number; neutral: number; negative: number } = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const unknown: any[] = [];

  for (const it of items) {
    const raw = (it.label || "").toLowerCase();
    const mapped = labelMap[raw as keyof typeof labelMap];
    const score = Number(it.score ?? 0);

    if (mapped) scores[mapped] = score;
    else unknown.push({ label: raw, score });
  }

  if ((scores.positive === 0 && scores.neutral === 0 && scores.negative === 0) && items.length === 3) {
    scores.negative = Number(items[0]?.score ?? 0);
    scores.neutral  = Number(items[1]?.score ?? 0);
    scores.positive = Number(items[2]?.score ?? 0);
  }

  const sentiment = Object.entries(scores).reduce((a: any, b: any) => (a[1] > b[1] ? a : b))[0];

  return {
    sentiment,
    probabilities: scores,
  };
}


async function callHfModel(model: string, text: string, HF_API_KEY: string) {
  const body = { inputs: text, options: { wait_for_model: true } };
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body), 
  });

  if (res.status === 404) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Model not found (404). Check model slug "${model}" and token permissions. ${txt}`);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HF API error (${res.status}): ${txt}`);
  }

  const data = await res.json().catch((e) => {
    throw new Error("Invalid JSON response from Hugging Face: " + String(e));
  });

  if (data?.error) {
    throw new Error("HF API returned error: " + String(data.error));
  }

  return data;
}

async function analyzeWithModel(model: string, text: string, HF_API_KEY: string): Promise<SentimentDetail> {
  const data = await callHfModel(model, text, HF_API_KEY);
  let items: any[] = [];

  if (Array.isArray(data)) {
    if (Array.isArray(data[0])) items = data[0];
    else items = data;
  } else if (typeof data === "object" && data !== null) {
    if (data.label && typeof data.score === "number") items = [data];
    else {
      const arr = data.results || data.output || data.predictions;
      if (Array.isArray(arr)) items = arr;
    }
  }

  if (!items || items.length === 0) {
    throw new Error("Unexpected HF response format, no classification items found");
  }

  // 🔹 Tambahan debugging optional
  console.log("HF raw response:", JSON.stringify(items, null, 2));

  return mapItemsToScores(items);
}


async function analyzeWithFinBERT(text: string, HF_API_KEY: string): Promise<SentimentDetail> {
  return analyzeWithModel("ProsusAI/finbert", text, HF_API_KEY);
}

async function analyzeWithLongFormer(text: string, HF_API_KEY: string): Promise<SentimentDetail> {
  return analyzeWithModel("allenai/longformer-base-4096", text, HF_API_KEY);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, content } = await req.json().catch(() => ({}));

    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      return new Response(JSON.stringify({ error: "HF_API_KEY not configured on Edge Function" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let titleAnalysis: SentimentDetail | null = null;
    let contentAnalysis: SentimentDetail | null = null;
    const errors: string[] = [];

    if (title) {
      try {
        titleAnalysis = await analyzeWithFinBERT(title, HF_API_KEY);
      } catch (err: any) {
        console.error("Title analysis failed:", err);
        errors.push(`Title analysis error: ${err?.message ?? String(err)}`);
      }
    }

    if (content) {
      try {
        contentAnalysis = await analyzeWithLongFormer(content, HF_API_KEY);
      } catch (err: any) {
        console.error("Content analysis failed:", err);
        errors.push(`Content analysis error: ${err?.message ?? String(err)}`);
      }
    }

    console.log("Returning analysis results:", { 
      hasTitle: !!titleAnalysis, 
      hasContent: !!contentAnalysis 
    });

    return new Response(
      JSON.stringify({
        title: titleAnalysis,
        content: contentAnalysis,
        errors: errors.length ? errors : null,
      }),
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
        details: err instanceof Error ? err.stack : null,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});