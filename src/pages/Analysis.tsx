import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
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

  // Data historis dan tanggal
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
        description: "Masukkan judul atau konten untuk dianalisis.",
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

      console.log("📊 Hasil Analisis Sentimen:", data);

      if (error) throw error;
      setSentimentResult(data);

      toast({
        title: "Analisis Selesai ✅",
        description: "Sentimen berhasil dianalisis menggunakan model FinBERT/LongFormer.",
      });
    } catch (error: any) {
      console.error("❌ Kesalahan analisis sentimen:", error);
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
  // 🧭 Helper Rendering Sentimen
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

  const renderSentimentResultCard = (
    type: "Judul" | "Konten",
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
            <Badge
              variant={
                analysis.sentiment === "positive"
                  ? "default"
                  : analysis.sentiment === "negative"
                  ? "destructive"
                  : "secondary"
              }
              className="px-3 py-1"
            >
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

  // ==============================
  // ⚙️ Render Component
  // ==============================
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analisis Prediksi EUR/USD
          </h1>
          <p className="text-muted-foreground">
            Gunakan model analitik untuk memahami sentimen pasar dan tren teknikal EUR/USD
          </p>
        </div>
      </div>

      {/* ===== BODY CONTENT ===== */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        <ScrapeForm />

        {/* 🧾 Data Historis */}
        <HistoricalDataForm
          onDataFetched={(data: any) => {
            setHistoricalData(data);
            if (data?.startDate && data?.endDate) {
              setStartDate(new Date(data.startDate));
              setEndDate(new Date(data.endDate));
            }
          }}
        />

        {/* 💬 Analisis Sentimen */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Analisis Sentimen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* === INPUT === */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Judul
                  </Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul berita..."
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                <div>
                  <Label htmlFor="content" className="text-sm font-semibold">
                    Konten
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Masukkan isi berita..."
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    rows={8}
                    disabled={isAnalyzing}
                  />
                </div>

                <Button
                  onClick={analyzeSentiment}
                  disabled={isAnalyzing}
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

              {/* === HASIL === */}
              <div className="space-y-4">
                {sentimentResult?.title || sentimentResult?.content ? (
                  <>
                    {sentimentResult?.title &&
                      renderSentimentResultCard("Judul", sentimentResult.title)}
                    {sentimentResult?.content &&
                      renderSentimentResultCard("Konten", sentimentResult.content)}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Hasil analisis akan muncul di sini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 Mood Series Chart */}
        <MoodSeriesChart startDate={startDate ?? undefined} endDate={endDate ?? undefined} />

        {/* 🔮 LSTM Prediction */}
        <PredictionCard
          sentimentData={sentimentResult}
          historicalData={historicalData}
        />
      </div>
    </div>
  );
};

export default Analysis;
