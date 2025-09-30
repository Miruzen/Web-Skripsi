import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Clock } from "lucide-react";

interface Prediction {
  id: string;
  timestamp: string;
  predicted_rate: number;
  confidence: number;
  timeframe: string;
  model: string;
}

const mockPredictions: Prediction[] = [
  {
    id: "1",
    timestamp: "2024-01-15 14:30:00",
    predicted_rate: 1.0863,
    confidence: 94.2,
    timeframe: "1H",
    model: "Hybrid Model C"
  },
  {
    id: "2", 
    timestamp: "2024-01-15 14:15:00",
    predicted_rate: 1.0858,
    confidence: 91.8,
    timeframe: "4H",
    model: "Hybrid Model C"
  },
  {
    id: "3",
    timestamp: "2024-01-15 14:00:00", 
    predicted_rate: 1.0871,
    confidence: 96.1,
    timeframe: "1D",
    model: "Hybrid Model C"
  }
];

const PredictionCard = () => {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) return { variant: "default" as const, label: "Excellent" };
    if (confidence >= 90) return { variant: "secondary" as const, label: "Very Good" };
    if (confidence >= 85) return { variant: "outline" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Low" };
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          Latest EUR/USD Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPredictions.map((prediction) => {
            const confidenceBadge = getConfidenceBadge(prediction.confidence);
            
            return (
              <div key={prediction.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium text-lg">
                      {prediction.predicted_rate.toFixed(4)}
                    </span>
                  </div>
                  <Badge {...confidenceBadge}>
                    {prediction.confidence}%
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Timeframe</div>
                    <div className="font-medium">{prediction.timeframe}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Model</div>
                    <div className="font-medium">{prediction.model}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Generated
                    </div>
                    <div className="font-medium">
                      {new Date(prediction.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionCard;