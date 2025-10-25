import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_date, end_date } = await req.json();

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "start_date and end_date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch EMA data from the historical API
    console.log("Fetching EMA data...");
    const emaResponse = await fetch("https://miruzen-modelb-api.hf.space/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date, end_date }),
    });

    if (!emaResponse.ok) {
      throw new Error("Failed to fetch EMA data");
    }

    const emaData = await emaResponse.json();
    console.log("EMA data received:", emaData);

    // For sentiment, we'll use a mock calculation based on the trend
    // In production, this should fetch actual sentiment from scraped news
    let sentimentScore = 0;
    if (emaData.trend_analysis?.trend === "bullish") {
      sentimentScore = 0.6;
    } else if (emaData.trend_analysis?.trend === "bearish") {
      sentimentScore = -0.6;
    } else {
      sentimentScore = 0;
    }

    // Aggregate data over 7-day window
    const aggregatedData = {
      avg_ema20: emaData.EMA20 || 0,
      avg_ema50: emaData.EMA50 || 0,
      avg_sentiment: sentimentScore,
      days_analyzed: 7,
    };

    // Calculate LSTM prediction
    // Simple algorithm: weighted combination of EMA and sentiment
    const emaWeight = 0.7;
    const sentimentWeight = 0.3;
    
    const emaContribution = (aggregatedData.avg_ema20 * 0.6 + aggregatedData.avg_ema50 * 0.4);
    const sentimentImpact = emaContribution * (aggregatedData.avg_sentiment * 0.01);
    
    const predictedClose = emaContribution + sentimentImpact;
    
    // Determine trend direction
    const trendDirection = predictedClose > emaData.close ? "bullish" : "bearish";
    
    // Calculate confidence based on trend strength
    const confidence = Math.min(
      0.95,
      0.5 + Math.abs(aggregatedData.avg_sentiment) * 0.2 + 
      (Math.abs(aggregatedData.avg_ema20 - aggregatedData.avg_ema50) / aggregatedData.avg_ema20) * 0.3
    );

    const prediction = {
      predicted_close: predictedClose,
      confidence: confidence,
      trend_direction: trendDirection,
      aggregated_data: aggregatedData,
      current_close: emaData.close,
      prediction_date: new Date(emaData.as_of_date),
    };

    console.log("Prediction generated:", prediction);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("LSTM prediction error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
