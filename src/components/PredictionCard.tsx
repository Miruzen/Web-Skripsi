import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Target, Loader2 } from "lucide-react";

interface SentimentAnalysisResult {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface AnalysisResponse {
  title: SentimentAnalysisResult | null;
  content: SentimentAnalysisResult | null;
}

interface HistoricalData {
  close: number;
  EMA20: number;
  EMA50: number;
}

interface PredictionResult {
  predicted_close: number;
  confidence: number;
  trend_direction: string;
  mape: number;
  aggregated_data: {
    avg_ema20: number;
    avg_ema50: number;
    avg_sentiment: number;
  };
}

interface PredictionCardProps {
  sentimentData: AnalysisResponse | null;
  historicalData: HistoricalData | null;
}

export function PredictionCard({ sentimentData, historicalData }: PredictionCardProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sentimentData && historicalData) {
      generatePrediction();
    }
  }, [sentimentData, historicalData]);

  const generatePrediction = async () => {
    if (!sentimentData || !historicalData) {
      return;
    }

    setLoading(true);
    try {
      // Calculate composite sentiment score from title and content
      const titleSentiment = calculateSentimentScore(sentimentData.title);
      const contentSentiment = calculateSentimentScore(sentimentData.content);
      const compositeSentiment = (titleSentiment + contentSentiment) / 2;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lstm-prediction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            ema20: historicalData.EMA20,
            ema50: historicalData.EMA50,
            current_close: historicalData.close,
            sentiment_score: compositeSentiment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prediction");
      }

      const data = await response.json();
      setPrediction(data);
      
      toast({
        title: "LSTM Prediction Generated",
        description: "Next day EUR/USD prediction with MAPE evaluation complete",
      });
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Failed to generate prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSentimentScore = (analysis: SentimentAnalysisResult | null): number => {
    if (!analysis) return 0;
    
    const { positive, neutral, negative } = analysis.probabilities;
    // Convert to -1 to +1 scale
    return positive - negative;
  };

  if (!sentimentData || !historicalData) {
    return (
      <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            LSTM Prediction
          </CardTitle>
          <CardDescription>
            H+1 EUR/USD prediction using EMA and sentiment aggregation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Awaiting sentiment analysis and historical data to generate prediction</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          LSTM Prediction (H+1)
        </CardTitle>
        <CardDescription>
          Next day EUR/USD prediction using 7-day EMA and composite sentiment aggregation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating LSTM prediction...</p>
          </div>
        )}

        {!loading && prediction && (
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">H+1 Predicted EUR/USD Close</p>
                <p className="text-5xl font-bold text-primary">
                  ${prediction.predicted_close.toFixed(5)}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <TrendingUp className={`h-4 w-4 ${
                    prediction.trend_direction === "bullish" ? "text-success" : "text-destructive"
                  }`} />
                  <span className={
                    prediction.trend_direction === "bullish" ? "text-success" : "text-destructive"
                  }>
                    {prediction.trend_direction.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">
                    ({(prediction.confidence * 100).toFixed(1)}% confidence)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  <p className="text-xs font-semibold text-muted-foreground">MAPE Evaluation</p>
                </div>
                <p className="text-3xl font-bold text-success">
                  {prediction.mape.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Model Accuracy</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-2">Composite Sentiment</p>
                <p className="text-2xl font-bold">
                  {prediction.aggregated_data.avg_sentiment.toFixed(3)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prediction.aggregated_data.avg_sentiment > 0 ? "Positive" : 
                   prediction.aggregated_data.avg_sentiment < 0 ? "Negative" : "Neutral"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">EMA20</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema20.toFixed(5)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">EMA50</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema50.toFixed(5)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
