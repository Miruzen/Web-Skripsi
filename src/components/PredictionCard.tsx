import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Target, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";

// ==============================
// 🧩 Types (Diterjemahkan)
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
}

interface HistoricalData {
  close: number;
  EMA20: number;
  EMA50: number;
}

interface PredictionResult {
  predicted_close: number;
  confidence: number;
  trend_direction: string;
  mape: number;
  aggregated_data: {
    avg_ema20: number;
    avg_ema50: number;
    avg_sentiment: number;
  };
}

interface PredictionCardProps {
  sentimentData: AnalysisResponse | null;
  historicalData: HistoricalData | null;
}

// ==============================
// ⚙️ Prediction Card Component
// ==============================
export function PredictionCard({ sentimentData, historicalData }: PredictionCardProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  // Memicu prediksi saat data input berubah
  useEffect(() => {
    // Mereset hasil prediksi lama saat data input baru terdeteksi
    setPrediction(null); 
    if (sentimentData && historicalData) {
      generatePrediction();
    }
  }, [sentimentData, historicalData]);

  // =====================================
  // 🧠 Logic Functions
  // =====================================

  const generatePrediction = async () => {
    if (!sentimentData || !historicalData) {
      return;
    }

    setLoading(true);
    try {
      // Menghitung skor sentimen komposit
      const titleSentiment = calculateSentimentScore(sentimentData.title);
      const contentSentiment = calculateSentimentScore(sentimentData.content);
      const compositeSentiment = (titleSentiment + contentSentiment) / 2;

      // Payload ke Supabase Edge Function (Asumsi endpoint VITE_SUPABASE_URL sudah diset)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lstm-prediction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            ema20: historicalData.EMA20,
            ema50: historicalData.EMA50,
            current_close: historicalData.close,
            sentiment_score: compositeSentiment,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menghasilkan prediksi dari API");
      }

      const data = await response.json();
      // Asumsi data yang diterima sudah bertipe PredictionResult
      setPrediction(data); 
      
      toast({
        title: "✅ Prediksi LSTM Dihasilkan",
        description: "Prediksi EUR/USD hari berikutnya dengan evaluasi MAPE selesai.",
      });
    } catch (error) {
      console.error("Kesalahan Prediksi:", error);
      toast({
        title: "❌ Prediksi Gagal",
        description: error instanceof Error ? error.message : "Gagal menghasilkan prediksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSentimentScore = (analysis: SentimentAnalysisResult | null): number => {
    if (!analysis) return 0;
    // Mengubah probabilitas menjadi skor -1 hingga +1
    const { positive, negative } = analysis.probabilities;
    return positive - negative;
  };

  // =====================================
  // 🎨 Rendering
  // =====================================

  // Case 1: Menunggu Input (Placeholder)
  if (!sentimentData || !historicalData) {
    return (
      <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Prediksi LSTM
          </CardTitle>
          <CardDescription>
            Memerlukan hasil sentimen & data historis untuk menghasilkan prediksi H+1.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Menunggu analisis sentimen dan data teknikal...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Case 2: Data Tersedia, Sedang Memuat (Loading)
  if (loading) {
    return (
        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Prediksi LSTM (H+1)
                </CardTitle>
                <CardDescription>
                    Memproses input EMA dan Sentimen...
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Menghasilkan prediksi...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  // Case 3: Hasil Prediksi Sudah Ada
  return (
    <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Prediksi LSTM (H+1)
        </CardTitle>
        <CardDescription>
          Prediksi EUR/USD hari berikutnya menggunakan agregasi sentimen dan EMA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prediction && (
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Prediksi Harga Penutupan H+1 EUR/USD</p>
                <p className="text-5xl font-bold text-primary">
                  ${prediction.predicted_close.toFixed(5)}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  {/* Menampilkan ikon dan warna berdasarkan tren */}
                  {prediction.trend_direction.toLowerCase() === "bullish" ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-destructive rotate-180" /> // Menggunakan rotate untuk tren bearish
                  )}
                  <span className={
                    prediction.trend_direction.toLowerCase() === "bullish" ? "text-success" : "text-destructive"
                  }>
                    {prediction.trend_direction.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">
                    ({(prediction.confidence * 100).toFixed(1)}% keyakinan)
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Metrik dan Data Agregasi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="w-full p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-success" />
                  <p className="text-xs font-semibold text-muted-foreground">Evaluasi MAPE</p>
                </div>
                <p className="text-3xl font-bold text-success">
                  {prediction.mape.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Akurasi Model</p>
              </div>
              
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">EMA20</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema20.toFixed(5)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground">EMA50</p>
                <p className="text-lg font-semibold">
                  {prediction.aggregated_data.avg_ema50.toFixed(5)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}