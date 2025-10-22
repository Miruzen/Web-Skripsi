import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentDetail {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
  negativeIndicators: string[];
}

async function analyzeSentimentDetailed(text: string, LOVABLE_API_KEY: string): Promise<SentimentDetail> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
          content: `You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with a JSON object in this exact format:
{
  "sentiment": "positive|negative|neutral",
  "probabilities": {
    "positive": 0.0-1.0,
    "neutral": 0.0-1.0,
    "negative": 0.0-1.0
  },
  "negativeIndicators": ["word1", "word2", "phrase1"]
}

The probabilities should sum to 1.0. Include specific words or phrases that indicate negative sentiment in the negativeIndicators array. If sentiment is not negative, the array can be empty.
Respond ONLY with valid JSON, no other text.` 
        },
        { role: 'user', content: `Analyze this text: "${text}"` }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sentiment API error:', response.status, errorText);
    throw new Error(`Sentiment analysis failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Remove markdown code blocks if present
  const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
  
  try {
    return JSON.parse(jsonContent);
  } catch (e) {
    console.error('Failed to parse JSON:', jsonContent);
    throw new Error('Invalid JSON response from AI');
  }
}

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

    // Analyze title sentiment with details
    const titleAnalysis = await analyzeSentimentDetailed(title, LOVABLE_API_KEY);
    
    // Analyze content sentiment with details
    const contentAnalysis = await analyzeSentimentDetailed(content, LOVABLE_API_KEY);

    console.log('Sentiment analysis results:', { titleAnalysis, contentAnalysis });

    return new Response(
      JSON.stringify({ 
        title: titleAnalysis,
        content: contentAnalysis
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