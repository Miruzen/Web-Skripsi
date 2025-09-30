import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const LiveRate = () => {
  const [rate, setRate] = useState(1.0847);
  const [change, setChange] = useState(0.0023);
  const [changePercent, setChangePercent] = useState(0.21);

  // Simulate live rate updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newRate = 1.0847 + (Math.random() - 0.5) * 0.01;
      const newChange = newRate - 1.0824;
      const newChangePercent = (newChange / 1.0824) * 100;
      
      setRate(newRate);
      setChange(newChange);
      setChangePercent(newChangePercent);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const isPositive = change >= 0;

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            EUR/USD Live Rate
          </span>
          <Badge variant="outline" className="text-accent border-accent/50">
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-4xl font-bold text-foreground">
            {rate.toFixed(4)}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-danger'}`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-medium">
                {isPositive ? '+' : ''}{change.toFixed(4)}
              </span>
            </div>
            
            <div className={`${isPositive ? 'text-success' : 'text-danger'}`}>
              ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">24h High</div>
              <div className="font-medium">1.0892</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h Low</div>
              <div className="font-medium">1.0801</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveRate;