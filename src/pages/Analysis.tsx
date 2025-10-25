import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Target, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast"; // Pastikan path ini benar untuk useToast
import ScrapeForm from "@/components/ScrapeFrom";

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

// Interface SentimentAnalysis yang diperbarui sesuai dengan output fungsi Supabase Anda
interface SentimentAnalysisResult {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
  // `negativeIndicators` tidak ada di skrip kedua, jadi kita hapus atau jadikan opsional
  // negativeIndicators?: string[]; // Jadikan opsional atau hapus jika tidak digunakan
  model?: string; // Menambahkan model dari skrip kedua
}

interface AnalysisResponse {
  title: SentimentAnalysisResult | null;
  content: SentimentAnalysisResult | null;
  errors?: string[];
}

const Analysis = () => {
  const [timeframe, setTimeframe] = useState("7D");
  const [chartData, setChartData] = useState(() => generateMockData(timeframe)); // Ganti nama `data` menjadi `chartData`
  
  // State untuk Analisis Sentimen (dari skrip kedua)
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState<AnalysisResponse | null>(null); // Menggabungkan hasil title & content
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    setChartData(generateMockData(timeframe));
  }, [timeframe]);

  const analyzeSentiment = async () => {
    if (!titleInput.trim() && !contentInput.trim()) {
      toast({
        title: "Input Dibutuhkan",
        description: "Silakan masukkan judul atau konten untuk dianalisis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke<AnalysisResponse>(
        'analyze-sentiment',
        {
          body: { title: titleInput, content: contentInput }
        }
      );

      if (error) {
        throw error;
      }

      setSentimentResult(data);

      if (data?.errors?.length) {
        toast({
          title: "Peringatan Analisis",
          description: data.errors.join(". "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analisis Selesai",
          description: "Sentimen telah berhasil dianalisis.",
        });
      }
    } catch (error: any) {
      console.error('Sentiment analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menganalisis sentimen. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      case "neutral":
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  };

  const getSentimentLabel = (sentiment: string | undefined) => {
    switch (sentiment) {
      case "positive":
        return "Positif";
      case "negative":
        return "Negatif";
      case "neutral":
        return "Netral";
      default:
        return "Tidak Diketahui";
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const mape = chartData.reduce((acc, point) => {
    return acc + Math.abs((point.actual - point.predicted) / point.actual);
  }, 0) / chartData.length * 100;

  const timeframes = [
    { value: "1D", label: "Harian" },
    { value: "7D", label: "Mingguan" }, // Menambahkan 7D
    { value: "1M", label: "Bulanan" },
  ];

  const renderProbabilities = (analysis: SentimentAnalysisResult) => {
    if (!analysis?.probabilities) return null;

    const { positive, neutral, negative } = analysis.probabilities;
    return (
      <div className="grid grid-cols-3 gap-2 text-sm mt-2">
        <div className="flex flex-col items-center p-2 rounded-md bg-green-50/50">
          <span className="font-semibold text-green-700">Positif</span>
          <span>{formatPercentage(positive)}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-gray-50/50">
          <span className="font-semibold text-gray-700">Netral</span>
          <span>{formatPercentage(neutral)}</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-red-50/50">
          <span className="font-semibold text-red-700">Negatif</span>
          <span>{formatPercentage(negative)}</span>
        </div>
      </div>
    );
  };

  const renderSentimentResultCard = (
    type: 'Judul' | 'Konten',
    analysis: SentimentAnalysisResult | null
  ) => {
    if (!analysis) return null;

    return (
      <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Hasil Analisis {type} ({analysis.model || 'Model Tidak Diketahui'})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">Sentimen:</span>
            <Badge variant={
                analysis.sentiment === "positive" ? "default" :
                analysis.sentiment === "negative" ? "destructive" :
                "secondary"
              } className="px-3 py-1">
              {getSentimentLabel(analysis.sentiment)}
            </Badge>
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Probabilitas:</p>
            {renderProbabilities(analysis)}
          </div>
          {/* Karena negativeIndicators tidak ada di skrip kedua, bagian ini dihapus */}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
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
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Analisis Sentimen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Judul</Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul untuk analisis..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="transition-all"
                    disabled={isAnalyzing}
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
                    disabled={isAnalyzing}
                  />
                </div>
                <Button 
                  onClick={analyzeSentiment} 
                  disabled={isAnalyzing || (!titleInput.trim() && !contentInput.trim())}
                  className="w-full gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analisis Sentimen
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                {sentimentResult?.title && renderSentimentResultCard('Judul', sentimentResult.title)}
                {sentimentResult?.content && renderSentimentResultCard('Konten', sentimentResult.content)}

                {!sentimentResult && (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Hasil analisis akan muncul di sini
                      </p>
                    </div>
                  </div>
                )}
                
                {(sentimentResult?.title || sentimentResult?.content) && (
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

        <ScrapeForm />

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
                {chartData.length}
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
                <LineChart data={chartData}>
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