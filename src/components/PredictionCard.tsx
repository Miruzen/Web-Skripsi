import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Target, Loader2, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { id } from "date-fns/locale";

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
  summary: {
    close: number;
    EMA20: number;
    EMA50: number;
    as_of_date: string;
    pair: string;
    trend_analysis: any;
  };
  analyze?: {
    start_date?: string;
    end_date?: string;
  };
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
    toast({
      title: "⚠️ Data Tidak Lengkap",
      description: "Pastikan data historis dan sentimen sudah diambil sebelum prediksi.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  try {
    console.log("📊 Data historis diterima untuk prediksi:", historicalData);
    console.log("🧠 Data sentimen diterima untuk prediksi:", sentimentData);

    // Hitung skor sentimen komposit
    const titleSentiment = calculateSentimentScore(sentimentData.title);
    const contentSentiment = calculateSentimentScore(sentimentData.content);
    const compositeSentiment = (titleSentiment + contentSentiment) / 2;

    // Ambil data EMA & harga dari data historis
    const ema20 = historicalData.summary.EMA20;
    const ema50 = historicalData.summary.EMA50;
    const current_close = historicalData.summary.close;

    // Validasi data
    if (
      ema20 === undefined ||
      ema50 === undefined ||
      current_close === undefined
    ) {
      throw new Error(
        "Data EMA atau harga penutupan tidak ditemukan. Pastikan format data sesuai."
      );
    }

    const body = {
      ema20: ema20,
      ema50: ema50,
      current_close: current_close,
      sentiment_score: compositeSentiment,
    };

    console.log("📡 Payload dikirim ke LSTM:", body);

    // Kirim request ke Supabase Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lstm-prediction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Response Error:", errorText);
      throw new Error(
        `Gagal menghasilkan prediksi dari API (status ${response.status})`
      );
    }

    const data = await response.json();
    console.log("✅ Hasil prediksi LSTM:", data);

    setPrediction(data);
    toast({
      title: "✅ Prediksi LSTM Dihasilkan",
      description:
        "Prediksi EUR/USD hari berikutnya berhasil dihitung dengan evaluasi MAPE.",
    });
  } catch (error) {
    console.error("❌ Kesalahan Prediksi:", error);
    toast({
      title: "❌ Prediksi Gagal",
      description:
        error instanceof Error
          ? error.message
          : "Gagal menghasilkan prediksi dari API",
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

  // Hitung tanggal prediksi (H+1 dari Tanggal Akhir)
  const getPredictionDate = (): string => {
    if (!historicalData?.summary?.as_of_date) return "-";
    try {
      const endDate = parseISO(historicalData.summary.as_of_date);
      const predictionDate = addDays(endDate, 1);
      return format(predictionDate, "dd MMMM yyyy", { locale: id });
    } catch {
      return "-";
    }
  };

  // Ambil rentang tanggal untuk analisis tren
  const getTrendDateRange = (): { start: string; end: string } => {
    const startDate = historicalData?.analyze?.start_date || "-";
    const endDate = historicalData?.summary?.as_of_date || "-";
    
    try {
      return {
        start: startDate !== "-" ? format(parseISO(startDate), "dd MMM yyyy", { locale: id }) : "-",
        end: endDate !== "-" ? format(parseISO(endDate), "dd MMM yyyy", { locale: id }) : "-"
      };
    } catch {
      return { start: "-", end: "-" };
    }
  };

  // =====================================
  // 🎨 Rendering
  // =====================================

  // Case 1: Menunggu Input (Placeholder)
  if (!sentimentData || !historicalData) {
    return (
      <Card className="border-2 shadow-card hover:border-primary/30 transition-colors bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-5 w-5 text-primary" />
                Prediksi Harga Hari Berikutnya (AI)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Menggunakan model LSTM untuk memprediksi harga EUR/USD esok hari
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 px-6 rounded-lg border-2 border-dashed border-border">
            <Brain className="h-16 w-16 mb-4 opacity-30" />
            <p className="font-medium text-lg">Menunggu Data Input</p>
            <p className="text-sm mt-2 max-w-md">
              Lengkapi Langkah 2 (Data Historis) dan Langkah 3 (Analisis Sentimen) 
              untuk menghasilkan prediksi otomatis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Case 2: Data Tersedia, Sedang Memuat (Loading)
  if (loading) {
    return (
        <Card className="border-2 shadow-card hover:border-primary/30 transition-colors bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="h-5 w-5 text-primary" />
                    Prediksi Harga Hari Berikutnya (AI)
                </CardTitle>
                <CardDescription>
                    Menggunakan model LSTM untuk analisis prediktif...
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col items-center justify-center py-16 rounded-lg border-2 border-dashed border-border">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-medium">Memproses data dengan AI...</p>
                    <p className="text-sm text-muted-foreground mt-2">Menghitung prediksi berdasarkan EMA dan sentimen</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  // Case 3: Hasil Prediksi Sudah Ada
  return (
    <Card className="border-2 shadow-card hover:border-primary/30 transition-colors bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-5 w-5 text-primary" />
          Prediksi Harga Hari Berikutnya (AI)
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Hasil prediksi EUR/USD menggunakan model LSTM berdasarkan analisis teknikal dan sentimen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {prediction && (
          <div className="space-y-6">
            {/* Main Prediction Display */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary/30 shadow-lg">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Prediksi Harga Penutupan Tanggal: {getPredictionDate()}
                  </span>
                </div>
                <p className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ${prediction.predicted_close.toFixed(5)}
                </p>
                <div className="flex flex-col items-center gap-3 text-base pt-2">
                  <div className="flex items-center gap-3">
                    {prediction.trend_direction.toLowerCase() === "bullish" ? (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border-2 border-green-500/30">
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-600">BULLISH</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border-2 border-red-500/30">
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">BEARISH</span>
                      </div>
                    )}
                    <div className="px-4 py-2 rounded-full bg-muted border-2">
                      <span className="font-semibold">
                        {(prediction.confidence * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                  </div>
                  {/* Trend Date Range */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 border border-border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Analisis Periode: <span className="font-semibold text-foreground">
                        {getTrendDateRange().start} - {getTrendDateRange().end}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-semibold text-muted-foreground">Model Accuracy (MAPE)</p>
                </div>
                <p className="text-4xl font-bold text-green-600">
                  {prediction.mape.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Mean Absolute Percentage Error</p>
              </div>
              
              <div className="p-5 rounded-xl bg-card border-2">
                <p className="text-xs text-muted-foreground mb-2">📊 EMA 20</p>
                <p className="text-2xl font-bold">
                  {prediction.aggregated_data.avg_ema20.toFixed(5)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rata-rata periode 20 hari</p>
              </div>
              
              <div className="p-5 rounded-xl bg-card border-2">
                <p className="text-xs text-muted-foreground mb-2">📈 EMA 50</p>
                <p className="text-2xl font-bold">
                  {prediction.aggregated_data.avg_ema50.toFixed(5)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Rata-rata periode 50 hari</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-muted/30 border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💡 <strong>Catatan:</strong> Prediksi ini dihasilkan oleh model LSTM yang menganalisis 
                pola historis harga, indikator teknikal (EMA), dan sentimen berita. Hasil prediksi sebaiknya 
                digunakan sebagai referensi tambahan dalam pengambilan keputusan trading.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}