import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Brain, Activity, Database, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import ScrapeForm from "@/components/ScrapeFrom";
import HistoricalDataForm from "@/components/HistoricalDataForm";
import { PredictionCard } from "@/components/PredictionCard";
import MoodSeriesChart from "@/components/MoodSeriesChart";

// ==============================
// 🧠 Types
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
  summary: {
    close: number;
    EMA20: number;
    EMA50: number;
    as_of_date: string;
    pair: string;
    trend_analysis: any;
  };
  analyze?: any;
}

// ==============================
// ⚙️ Main Component
// ==============================
const Analysis = () => {
  const [sentimentResult, setSentimentResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { toast } = useToast();

  // ==============================
  // 🔍 Analisis Sentimen
  // ==============================
  const analyzeSentiment = async () => {
    if (!titleInput.trim() && !contentInput.trim()) {
      toast({
        title: "Input Dibutuhkan",
        description: "Masukkan judul atau konten berita untuk dianalisis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke<AnalysisResponse>(
        "analyze-sentiment",
        {
          body: { title: titleInput, content: contentInput },
        }
      );

      if (error) throw error;
      setSentimentResult(data);

      toast({
        title: "Analisis Selesai ✅",
        description: "Sentimen berhasil dianalisis menggunakan model FinBERT/LongFormer.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menganalisis sentimen.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==============================
  // 🧭 Helper Rendering
  // ==============================
  const getSentimentLabel = (sentiment?: string) => {
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

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const renderProbabilities = (analysis: SentimentAnalysisResult) => {
    const { positive, neutral, negative } = analysis.probabilities;
    const maxValue = Math.max(positive, neutral, negative);
    
    return (
      <div className="grid grid-cols-3 gap-3 text-sm mt-2">
        <div className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
          positive === maxValue 
            ? 'bg-green-500/20 border-green-500/50 scale-105' 
            : 'bg-card border-border'
        }`}>
          <span className="font-semibold text-green-600">😊 Positif</span>
          <span className="text-2xl font-bold mt-1">{formatPercentage(positive)}</span>
        </div>
        <div className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
          neutral === maxValue 
            ? 'bg-gray-500/20 border-gray-500/50 scale-105' 
            : 'bg-card border-border'
        }`}>
          <span className="font-semibold text-gray-600">😐 Netral</span>
          <span className="text-2xl font-bold mt-1">{formatPercentage(neutral)}</span>
        </div>
        <div className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
          negative === maxValue 
            ? 'bg-red-500/20 border-red-500/50 scale-105' 
            : 'bg-card border-border'
        }`}>
          <span className="font-semibold text-red-600">😟 Negatif</span>
          <span className="text-2xl font-bold mt-1">{formatPercentage(negative)}</span>
        </div>
      </div>
    );
  };

  // ==============================
  // ⚙️ Render
  // ==============================
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto px-6 py-12 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Analisis Prediktif EUR/USD</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Prediksi Harga EUR/USD
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
            Platform analisis cerdas yang menggabungkan data historis, sentimen berita, 
            dan kecerdasan buatan untuk memprediksi pergerakan mata uang.
          </p>
        </div>
      </div>

      {/* ===== MAIN BODY ===== */}
      <div className="container mx-auto px-6 py-10 space-y-10">

        {/* 📘 Intro Informasi Singkat */}
        <Card className="bg-gradient-to-br from-primary/5 to-background shadow-card border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              Cara Kerja Sistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-base leading-relaxed">
              Platform ini menggunakan teknologi canggih untuk memberikan prediksi yang akurat:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">1. Berita Terkini</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mengambil berita forex terbaru untuk analisis sentimen pasar.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">2. Data Historis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Menganalisis pergerakan harga dan indikator teknikal EMA.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">3. Prediksi AI</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Menggabungkan semua data untuk prediksi harga masa depan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🧾 Step 1: Ambil Data Berita */}
        <Card className="shadow-card border-2 hover:border-primary/30 transition-colors">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                1
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Ambil Berita Forex Terkini
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Kumpulkan berita forex terbaru untuk analisis sentimen
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrapeForm />
          </CardContent>
        </Card>

        {/* 📈 Step 2: Data Historis */}
        <Card className="shadow-card border-2 hover:border-primary/30 transition-colors">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                2
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Database className="h-5 w-5 text-primary" />
                  Ambil Data Historis & Grafik
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Pilih rentang tanggal untuk melihat pergerakan harga dan indikator EMA
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <HistoricalDataForm
              onDataFetched={(data: any) => {
                setHistoricalData(data);
                // Sinkronisasi tanggal dari data yang diambil
                if (data?.analyze?.start_date && data?.analyze?.end_date) {
                  setStartDate(new Date(data.analyze.start_date));
                  setEndDate(new Date(data.analyze.end_date));
                }
              }}
            />
          </CardContent>
        </Card>

        {/* 💬 Step 3: Analisis Sentimen */}
        <Card className="shadow-card border-2 hover:border-primary/30 transition-colors">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                3
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Analisis Sentimen Berita
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Uji sentimen berita untuk mengetahui mood pasar (positif, netral, atau negatif)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* === form input + hasil === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Judul Berita</Label>
                  <Input
                    placeholder="Contoh: EUR/USD Melonjak Setelah Data Ekonomi AS..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    disabled={isAnalyzing}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Isi Berita</Label>
                  <Textarea
                    placeholder="Masukkan konten lengkap berita forex yang ingin dianalisis..."
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    rows={8}
                    disabled={isAnalyzing}
                    className="mt-2"
                  />
                </div>
                <Button onClick={analyzeSentiment} disabled={isAnalyzing} className="w-full gap-2">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Menganalisis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Analisis Berita
                    </>
                  )}
                </Button>
              </div>

              {/* Hasil */}
              <div className="space-y-4">
                {sentimentResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Hasil Analisis
                      </h3>
                      {sentimentResult.title && (
                        <div className="mb-4">
                          <p className="font-medium mb-2 text-sm text-muted-foreground">📰 Sentimen Judul</p>
                          {renderProbabilities(sentimentResult.title)}
                        </div>
                      )}
                      {sentimentResult.content && (
                        <div>
                          <p className="font-medium mb-2 text-sm text-muted-foreground">📄 Sentimen Konten</p>
                          {renderProbabilities(sentimentResult.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 px-6 rounded-lg border-2 border-dashed border-border">
                    <Sparkles className="h-12 w-12 mb-4 opacity-40" />
                    <p className="font-medium">Hasil Analisis Akan Muncul Di Sini</p>
                    <p className="text-sm mt-2">Masukkan teks berita dan klik tombol analisis</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📊 Step 4: Mood Series */}
        <Card className="shadow-card border-2 hover:border-primary/30 transition-colors">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                4
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-primary" />
                  Grafik Mood Pasar
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualisasi suasana pasar berdasarkan sentimen berita harian
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <MoodSeriesChart startDate={startDate ?? undefined} endDate={endDate ?? undefined} />
          </CardContent>
        </Card>

        {/* 🔮 Step 5: Prediksi Akhir (LSTM) */}
        <div className="relative">
          <div className="absolute -top-6 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg z-10 shadow-lg">
            5
          </div>
          <PredictionCard sentimentData={sentimentResult} historicalData={historicalData} />
        </div>
      </div>
    </div>
  );
};

export default Analysis;
