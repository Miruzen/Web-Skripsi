import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Target, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ScrapeForm from "@/components/ScrapeFrom";
import HistoricalDataForm from "@/components/HistoricalDataForm";
import { PredictionCard } from "@/components/PredictionCard";

// ==============================
// 📊 Mock Data Generator
// ==============================
const generateMockData = (timeframe: string) => {
  const dataPoints = timeframe === "1D" ? 24 : timeframe === "7D" ? 7 : timeframe === "1M" ? 30 : 90;
  const data = [];

  for (let i = 0; i < dataPoints; i++) {
    const baseRate = 1.0850;
    const actual = baseRate + (Math.random() - 0.5) * 0.02;
    const predicted = actual + (Math.random() - 0.5) * 0.005;

    data.push({
      time: timeframe === "1D" ? `${i}:00` : `Hari ${i + 1}`,
      actual: parseFloat(actual.toFixed(4)),
      predicted: parseFloat(predicted.toFixed(4)),
    });
  }

  return data;
};

// ==============================
// 🧩 Types
// ==============================
interface SentimentAnalysisResult {
  sentiment: string;
  probabilities: {
    positive: number;
    neutral: number;
    negative: number;
  };
  model?: string;
}

interface AnalysisResponse {
  title: SentimentAnalysisResult | null;
  content: SentimentAnalysisResult | null;
  errors?: string[];
}

interface HistoricalData {
  close: number;
  EMA20: number;
  EMA50: number;
}

// ==============================
// ⚙️ Main Component
// ==============================
const Analysis = () => {
  const [timeframe, setTimeframe] = useState("7D"); // State ini tetap ada, tapi tidak digunakan di UI
  const [chartData, setChartData] = useState(() => generateMockData(timeframe)); 
  
  // State Sentimen
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State Data Historis
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Fungsi ini tetap dipanggil karena 'timeframe' masih digunakan oleh generateMockData
    setChartData(generateMockData(timeframe));
  }, [timeframe]);

  // Placeholder untuk logika API Sentimen
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
      // Simulasi pemanggilan API/Fungsi Supabase (menggunakan kode asli)
      const { data, error } = await supabase.functions.invoke<AnalysisResponse>(
        'analyze-sentiment',
        {
          body: { title: titleInput, content: contentInput }
        }
      );
    
    console.log("Hasil Analisis Sentimen:", data);
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
      console.error('Kesalahan analisis sentimen:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menganalisis sentimen. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =====================================
  // 🎨 Helpers (Dibutuhkan untuk rendering kartu hasil)
  // =====================================

  const getSentimentLabel = (sentiment: string | undefined) => {
    switch (sentiment) {
      case "positive": return "Positif";
      case "negative": return "Negatif";
      case "neutral": return "Netral";
      default: return "Tidak Diketahui";
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const mape = chartData.reduce((acc, point) => {
    return acc + Math.abs((point.actual - point.predicted) / point.actual);
  }, 0) / chartData.length * 100;

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
            Hasil Analisis {type} 
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
        </CardContent>
      </Card>
    );
  };

  // =====================================
  // 🧠 Render Component
  // =====================================
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-8">
          {/* JUDUL DIPUSATKAN DI SINI */}
          <div className="flex items-center justify-center text-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Analisis Prediksi EUR/USD
              </h1>
              <p className="text-muted-foreground">
                Bandingkan prediksi Model C dengan data pasar aktual
              </p>
            </div>
            {/* Bagian kanan (Timeframe & Rentang Kustom) DIHAPUS */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <ScrapeForm />

        <HistoricalDataForm onDataFetched={setHistoricalData} />

        {/* === SENTIMENT SECTION === */}
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

              {/* BAGIAN HASIL ANALISIS SENTIMEN (Kolom Kanan) */}
              <div className="space-y-4">
                {(sentimentResult?.title || sentimentResult?.content) ? (
                  <>
                    {sentimentResult?.title && renderSentimentResultCard("Judul", sentimentResult.title)}
                    {sentimentResult?.content && renderSentimentResultCard("Konten", sentimentResult.content)}
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground italic p-3 rounded-lg bg-muted/20 border border-border/50">
                        <strong>Catatan:</strong> Analisis berita menggunakan model FinBERT dan LongFormer untuk menentukan 
                        sentimen berdasarkan konteks. Probabilitas menunjukkan tingkat keyakinan
                        untuk setiap kategori sentimen.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Hasil analisis akan muncul di sini
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <PredictionCard sentimentData={sentimentResult} historicalData={historicalData} />

      </div>
    </div>
  );
};

export default Analysis;