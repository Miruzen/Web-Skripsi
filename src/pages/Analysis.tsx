import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Target, BarChart3 } from "lucide-react";

// Mock data for demonstration
const generateMockData = (timeframe: string) => {
  const dataPoints = timeframe === "1D" ? 24 : timeframe === "7D" ? 7 : timeframe === "1M" ? 30 : 90;
  const data = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const baseRate = 1.0850;
    const actual = baseRate + (Math.random() - 0.5) * 0.02;
    const predicted = actual + (Math.random() - 0.5) * 0.005;
    
    data.push({
      time: timeframe === "1D" ? `${i}:00` : `Day ${i + 1}`,
      actual: parseFloat(actual.toFixed(4)),
      predicted: parseFloat(predicted.toFixed(4)),
    });
  }
  
  return data;
};

const Analysis = () => {
  const [timeframe, setTimeframe] = useState("7D");
  const [data] = useState(() => generateMockData(timeframe));
  
  // Calculate MAPE (Mean Absolute Percentage Error)
  const mape = data.reduce((acc, point) => {
    return acc + Math.abs((point.actual - point.predicted) / point.actual);
  }, 0) / data.length * 100;

  const timeframes = [
    { value: "1D", label: "24 Hours" },
    { value: "7D", label: "7 Days" },
    { value: "1M", label: "1 Month" },
    { value: "3M", label: "3 Months" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                EUR/USD Prediction Analysis
              </h1>
              <p className="text-muted-foreground">
                Compare Model C predictions against actual market data
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Custom Range
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Model Accuracy (MAPE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {mape.toFixed(2)}%
              </div>
              <Badge variant="secondary" className="mt-2">
                Excellent
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                1.0847
              </div>
              <div className="text-sm text-success">+0.0023 (+0.21%)</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Prediction Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Data points
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Correlation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                0.97
              </div>
              <div className="text-sm text-muted-foreground">
                High correlation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Actual vs Predicted EUR/USD Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    name="Actual Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                    name="Model C Prediction"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Additional Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Deviation</span>
                <span className="font-medium">±0.0018</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Maximum Error</span>
                <span className="font-medium">0.0045</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Prediction Confidence</span>
                <Badge variant="default">97.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Model Status</span>
                <Badge className="bg-success text-success-foreground">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Model Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Model C demonstrates excellent predictive accuracy with a MAPE of {mape.toFixed(2)}%, 
                indicating strong performance in forecasting EUR/USD movements.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm">High accuracy in trend prediction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Consistent performance across timeframes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-sm">Real-time adaptability</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;