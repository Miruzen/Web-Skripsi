import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Loader2, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PredictionResult {
  predicted_close: number;
  confidence: number;
  trend_direction: string;
  aggregated_data: {
    avg_ema20: number;
    avg_ema50: number;
    avg_sentiment: number;
    days_analyzed: number;
  };
}

export function PredictionCard() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  const handlePredict = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lstm-prediction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate prediction");
      }

      const data = await response.json();
      setPrediction(data);
      
      toast({
        title: "Prediction Generated",
        description: "LSTM model has predicted the next day's closing price",
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

  return (
    <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          LSTM Prediction
        </CardTitle>
        <CardDescription>
          Predict next day's EUR/USD closing price using 7-day EMA and sentiment aggregation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pred-start-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </Label>
            <Input
              id="pred-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pred-end-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              End Date
            </Label>
            <Input
              id="pred-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-2"
            />
          </div>
        </div>

        <Button
          onClick={handlePredict}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Prediction...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate LSTM Prediction
            </>
          )}
        </Button>

        {prediction && (
          <div className="mt-6 space-y-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Predicted Next Day Close</p>
                <p className="text-4xl font-bold text-primary">
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
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Avg EMA20</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema20.toFixed(5)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Avg EMA50</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema50.toFixed(5)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Avg Sentiment</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_sentiment.toFixed(3)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">Days Analyzed</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.days_analyzed}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
