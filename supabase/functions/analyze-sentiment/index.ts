import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content } = await req.json();
    console.log('Analyzing sentiment for:', { title, content });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Analyze title sentiment
    const titleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with ONLY ONE WORD: "positive", "negative", or "neutral". No explanation, just the sentiment.' 
          },
          { role: 'user', content: `Analyze the sentiment of this title: "${title}"` }
        ],
      }),
    });

    if (!titleResponse.ok) {
      const errorText = await titleResponse.text();
      console.error('Title sentiment API error:', titleResponse.status, errorText);
      throw new Error(`Title sentiment analysis failed: ${titleResponse.status}`);
    }

    const titleData = await titleResponse.json();
    const titleSentiment = titleData.choices[0].message.content.trim().toLowerCase();

    // Analyze content sentiment
    const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with ONLY ONE WORD: "positive", "negative", or "neutral". No explanation, just the sentiment.' 
          },
          { role: 'user', content: `Analyze the sentiment of this content: "${content}"` }
        ],
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('Content sentiment API error:', contentResponse.status, errorText);
      throw new Error(`Content sentiment analysis failed: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    const contentSentiment = contentData.choices[0].message.content.trim().toLowerCase();

    console.log('Sentiment analysis results:', { titleSentiment, contentSentiment });

    return new Response(
      JSON.stringify({ 
        titleSentiment,
        contentSentiment 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});