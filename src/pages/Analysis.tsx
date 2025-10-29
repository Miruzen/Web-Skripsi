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
  close: number;
  EMA20: number;
  EMA50: number;
  startDate: Date;
  endDate: Date;
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

  // ==============================
  // ⚙️ Render
  // ==============================
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-10 text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Analisis Prediksi EUR/USD
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Analisis menggunakan data historis, analisis berita, dan model prediktif 
            berbasis <span className="font-semibold text-primary">FinBERT</span>,{" "}
            <span className="font-semibold text-primary">Longformer</span>, dan{" "}
            <span className="font-semibold text-primary">LSTM</span>.
          </p>
        </div>
      </div>

      {/* ===== MAIN BODY ===== */}
      <div className="container mx-auto px-6 py-10 space-y-10">

        {/* 📘 Intro Informasi Singkat */}
        <Card className="bg-card/70 shadow-lg border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Tentang Analisis Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed space-y-2">
            <p>
              Sistem ini menggabungkan 3 pendekatan utama:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <b>Scraping Berita:</b> Mengambil berita finansial terkini secara otomatis untuk bahan analisis berita.
              </li>
              <li>
                <b>Mood Series:</b> Mengukur suasana pasar berdasarkan rata-rata skor sentimen harian dari berita.
              </li>
              <li>
                <b>Model LSTM:</b> Menggunakan data teknikal & sentimen untuk memprediksi pergerakan harga EUR/USD berikutnya.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 🧾 Step 1: Ambil Data Berita */}
        <Card className="shadow-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Langkah 1 — Ambil Berita Terkini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gunakan form ini untuk melakukan <b>scraping berita Forex</b> dari sumber data.
              Sistem akan menyiapkan data berita untuk dianalisa
            </p>
            <ScrapeForm />
          </CardContent>
        </Card>

        {/* 📈 Step 2: Data Historis */}
        <Card className="shadow-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Langkah 2 — Ambil Data Historis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tentukan rentang tanggal untuk mengambil data historis EUR/USD,
              yang akan digunakan untuk menghitung <b>EMA20</b> dan <b>EMA50</b>.
            </p>
            <HistoricalDataForm
              onDataFetched={(data: any) => {
                setHistoricalData(data);
                if (data?.startDate && data?.endDate) {
                  setStartDate(new Date(data.startDate));
                  setEndDate(new Date(data.endDate));
                }
              }}
            />
          </CardContent>
        </Card>

        {/* 💬 Step 3: Analisis Sentimen */}
        <Card className="shadow-card border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Langkah 3 — Analisis Sentimen Berita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Masukkan judul atau isi berita Forex untuk melihat hasil analisis berita
              berdasarkan model <b>FinBERT</b> dan <b>Longformer</b>.
            </p>
            {/* === form input + hasil === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="space-y-4">
                <div>
                  <Label>Judul</Label>
                  <Input
                    placeholder="Masukkan judul berita..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <Label>Konten</Label>
                  <Textarea
                    placeholder="Masukkan isi berita..."
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    rows={8}
                    disabled={isAnalyzing}
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
                  <>
                    {sentimentResult.title && (
                      <Card className="p-3">
                        <p className="font-semibold mb-1">Hasil Analisis Judul</p>
                        {renderProbabilities(sentimentResult.title)}
                      </Card>
                    )}
                    {sentimentResult.content && (
                      <Card className="p-3">
                        <p className="font-semibold mb-1">Hasil Analisis Konten</p>
                        {renderProbabilities(sentimentResult.content)}
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-60" />
                    Hasil akan muncul di sini setelah analisis dilakukan.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📊 Step 4: Mood Series */}
        <MoodSeriesChart startDate={startDate ?? undefined} endDate={endDate ?? undefined} />

        {/* 🔮 Step 5: Prediksi Akhir (LSTM) */}
        <PredictionCard sentimentData={sentimentResult} historicalData={historicalData} />
      </div>
    </div>
  );
};

export default Analysis;
