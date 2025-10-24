import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Target, BarChart3, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ScrapeForm from "@/components/ScrapeFrom";

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

interface SentimentAnalysis {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
  negativeIndicators: string[];
}

const Analysis = () => {
  const [timeframe, setTimeframe] = useState("7D");
  const [data] = useState(() => generateMockData(timeframe));
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [titleAnalysis, setTitleAnalysis] = useState<SentimentAnalysis | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeSentiment = async () => {
    if (!titleInput.trim() || !contentInput.trim()) {
      toast({
        title: "Error",
        description: "Silakan isi judul dan konten terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { title: titleInput, content: contentInput }
      });

      if (error) throw error;

      setTitleAnalysis(result.title);
      setContentAnalysis(result.content);
      
      toast({
        title: "Analisis Selesai",
        description: "Sentimen telah berhasil dianalisis",
      });
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      toast({
        title: "Error",
        description: "Gagal menganalisis sentimen. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "default";
      case "negative":
        return "destructive";
      case "neutral":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "Positif";
      case "negative":
        return "Negatif";
      case "neutral":
        return "Netral";
      default:
        return sentiment;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Calculate MAPE (Mean Absolute Percentage Error)
  const mape = data.reduce((acc, point) => {
    return acc + Math.abs((point.actual - point.predicted) / point.actual);
  }, 0) / data.length * 100;

  const timeframes = [
    { value: "1D", label: "Harian" },
    { value: "1M", label: "Bulanan" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Analisis Prediksi EUR/USD
              </h1>
              <p className="text-muted-foreground">
                Bandingkan prediksi Model C dengan data pasar aktual
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
                Rentang Kustom
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Sentiment Analysis Section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Analisis Sentimen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4 lg:col-span-1">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Judul</Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul untuk analisis..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-semibold">Konten</Label>
                  <Textarea
                    id="content"
                    placeholder="Masukkan konten untuk analisis..."
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    rows={8}
                    className="transition-all resize-none"
                  />
                </div>
                <Button 
                  onClick={analyzeSentiment} 
                  disabled={isAnalyzing}
                  className="w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isAnalyzing ? "Menganalisis..." : "Analisis Sentimen"}
                </Button>
              </div>

              <div className="lg:col-span-1">
                <ScrapeForm />
              </div>

              <div className="space-y-4 lg:col-span-1">
                {titleAnalysis && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Hasil Analisis Judul
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground">Sentimen:</span>
                        <Badge variant={getSentimentColor(titleAnalysis.sentiment)} className="px-3 py-1">
                          {getSentimentLabel(titleAnalysis.sentiment)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 p-3 rounded-lg bg-muted/20">
                        <p className="text-sm font-semibold text-foreground">Probabilitas:</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Positif:</span>
                            <span className="font-bold text-success">{formatPercentage(titleAnalysis.probabilities.positive)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Netral:</span>
                            <span className="font-bold">{formatPercentage(titleAnalysis.probabilities.neutral)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Negatif:</span>
                            <span className="font-bold text-destructive">{formatPercentage(titleAnalysis.probabilities.negative)}</span>
                          </div>
                        </div>
                      </div>

                      {titleAnalysis.negativeIndicators.length > 0 && (
                        <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                          <p className="text-sm font-semibold text-destructive">Indikator Negatif:</p>
                          <div className="flex flex-wrap gap-2">
                            {titleAnalysis.negativeIndicators.map((indicator, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs font-medium">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {contentAnalysis && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Hasil Analisis Konten
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground">Sentimen:</span>
                        <Badge variant={getSentimentColor(contentAnalysis.sentiment)} className="px-3 py-1">
                          {getSentimentLabel(contentAnalysis.sentiment)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 p-3 rounded-lg bg-muted/20">
                        <p className="text-sm font-semibold text-foreground">Probabilitas:</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Positif:</span>
                            <span className="font-bold text-success">{formatPercentage(contentAnalysis.probabilities.positive)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Netral:</span>
                            <span className="font-bold">{formatPercentage(contentAnalysis.probabilities.neutral)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Negatif:</span>
                            <span className="font-bold text-destructive">{formatPercentage(contentAnalysis.probabilities.negative)}</span>
                          </div>
                        </div>
                      </div>

                      {contentAnalysis.negativeIndicators.length > 0 && (
                        <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                          <p className="text-sm font-semibold text-destructive">Indikator Negatif:</p>
                          <div className="flex flex-wrap gap-2">
                            {contentAnalysis.negativeIndicators.map((indicator, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs font-medium">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {!titleAnalysis && !contentAnalysis && (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Hasil analisis akan muncul di sini
                      </p>
                    </div>
                  </div>
                )}
                
                {(titleAnalysis || contentAnalysis) && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground italic p-3 rounded-lg bg-muted/20 border border-border/50">
                      <strong>Catatan:</strong> Analisis sentimen menggunakan AI untuk menentukan 
                      sentimen berdasarkan konteks. Probabilitas menunjukkan tingkat kepercayaan 
                      untuk setiap kategori sentimen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Akurasi Model (MAPE)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {mape.toFixed(2)}%
              </div>
              <Badge variant="secondary" className="mt-2">
                Sangat Baik
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Kurs Saat Ini
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
                Jumlah Prediksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Titik data
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Korelasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                0.97
              </div>
              <div className="text-sm text-muted-foreground">
                Korelasi tinggi
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Kurs EUR/USD Aktual vs Prediksi
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
                    name="Kurs Aktual"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                    name="Prediksi Model C"
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
              <CardTitle>Ringkasan Performa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deviasi Rata-rata</span>
                <span className="font-medium">±0.0018</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kesalahan Maksimum</span>
                <span className="font-medium">0.0045</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kepercayaan Prediksi</span>
                <Badge variant="default">97.2%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status Model</span>
                <Badge className="bg-success text-success-foreground">Aktif</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Wawasan Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Model C menunjukkan akurasi prediksi yang sangat baik dengan MAPE {mape.toFixed(2)}%, 
                menandakan performa yang kuat dalam meramalkan pergerakan EUR/USD.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm">Akurasi tinggi dalam prediksi tren</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Performa konsisten di berbagai timeframe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-sm">Adaptabilitas waktu nyata</span>
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