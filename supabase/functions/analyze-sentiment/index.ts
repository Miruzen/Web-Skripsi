import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// HuggingFace Space utama
const HF_SPACE_URL = "https://miruzen-modela-api.hf.space/analyze";

// HuggingFace Router URL (new endpoint)
const HF_ROUTER_URL = "https://router.huggingface.co/hf-inference/models";
const HF_API_KEY = Deno.env.get("HF_API_KEY");

// Function to call HF model via router
async function callHfRouter(text: string, model: string) {
  const response = await fetch(`${HF_ROUTER_URL}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF Router error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Parse FinBERT response format
function parseFinBertResponse(result: any) {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    const scores = result[0];
    const sentiments = scores.reduce((acc: any, item: any) => {
      acc[item.label.toLowerCase()] = item.score;
      return acc;
    }, {});
    
    const maxScore = Math.max(...scores.map((s: any) => s.score));
    const label = scores.find((s: any) => s.score === maxScore)?.label || "neutral";
    
    return {
      label: label.toLowerCase(),
      scores: sentiments,
    };
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();
    if (!title && !content) {
      return new Response(JSON.stringify({ error: "Title or content required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    let titleResult = null;
    let contentResult = null;
    const errors: string[] = [];

    // Try HuggingFace Space first
    try {
      console.log("Trying HF Space...");
      const spaceResponse = await fetch(HF_SPACE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (spaceResponse.ok) {
        const spaceResult = await spaceResponse.json();
        console.log("HF Space success:", spaceResult);
        
        // Return Space result if successful
        const formatted = {
          title: spaceResult.details?.title
            ? {
                sentiment: spaceResult.details.title.label,
                probabilities: spaceResult.details.title.scores,
                model: "FinBERT",
              }
            : null,
          content: spaceResult.details?.content
            ? {
                sentiment: spaceResult.details.content.label,
                probabilities: spaceResult.details.content.scores,
                model: "Longformer",
              }
            : null,
          mood_score: spaceResult.mood_score ?? null,
          errors: spaceResult.errors ?? [],
        };

        return new Response(JSON.stringify(formatted), {
          status: 200,
          headers: corsHeaders,
        });
      } else {
        console.warn(`HF Space failed (${spaceResponse.status}), trying router...`);
      }
    } catch (spaceError) {
      console.warn("HF Space error:", spaceError);
    }

    // Fallback to HF Router with FinBERT
    console.log("Using HF Router fallback with FinBERT...");
    
    // Analyze title with FinBERT
    if (title) {
      try {
        const result = await callHfRouter(title, "ProsusAI/finbert");
        titleResult = parseFinBertResponse(result);
        if (titleResult) {
          console.log("Title analysis success:", titleResult);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("Title analysis error:", err);
        errors.push(`Title analysis error: ${errorMsg}`);
      }
    }

    // Analyze content with FinBERT (or could use another model for longer text)
    if (content) {
      try {
        // Truncate content if too long for FinBERT (max ~512 tokens)
        const truncatedContent = content.slice(0, 1500);
        const result = await callHfRouter(truncatedContent, "ProsusAI/finbert");
        contentResult = parseFinBertResponse(result);
        if (contentResult) {
          console.log("Content analysis success:", contentResult);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("Content analysis error:", err);
        errors.push(`Content analysis error: ${errorMsg}`);
      }
    }

    // Calculate mood score
    let moodScore = null;
    if (titleResult || contentResult) {
      const scores: number[] = [];
      if (titleResult) {
        const tScore = (titleResult.scores.positive || 0) - (titleResult.scores.negative || 0);
        scores.push(tScore);
      }
      if (contentResult) {
        const cScore = (contentResult.scores.positive || 0) - (contentResult.scores.negative || 0);
        scores.push(cScore);
      }
      if (scores.length > 0) {
        moodScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    const formatted = {
      title: titleResult
        ? {
            sentiment: titleResult.label,
            probabilities: titleResult.scores,
            model: "FinBERT",
          }
        : null,
      content: contentResult
        ? {
            sentiment: contentResult.label,
            probabilities: contentResult.scores,
            model: "FinBERT",
          }
        : null,
      mood_score: moodScore,
      errors,
    };

    console.log("Returning analysis results:", { hasTitle: !!titleResult, hasContent: !!contentResult });

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    console.error("analyze-sentiment error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({
        error: errorMsg,
        stack: errorStack,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
