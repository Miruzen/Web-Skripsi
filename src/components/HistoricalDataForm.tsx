import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, TrendingUp, Loader2, BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TrendAnalysis {
  trend: string;
  strength: string;
  price_position: string;
  ema_gap_percent: number;
}

interface TimeSeriesPoint {
  date: string;
  close: number;
  EMA20: number;
  EMA50: number;
  norm_close?: number;
}

interface SummaryResponse {
  status: string;
  pair: string;
  as_of_date: string;
  close: number;
  EMA20: number;
  EMA50: number;
  trend_analysis: TrendAnalysis;
  message?: string;
}

interface AnalyzeResponse {
  status: string;
  pair: string;
  chart_data?: {
    dates: string[];
    close: number[];
    EMA20: number[];
    EMA50: number[];
    norm_close: number[];
  };
  message?: string;
}

interface HistoricalDataFormProps {
  onDataFetched?: (data: { summary: SummaryResponse; analyze: AnalyzeResponse }) => void;
}

const HistoricalDataForm = ({ onDataFetched }: HistoricalDataFormProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
  const { toast } = useToast();

  // ==========================
  // Hardcoded API Endpoints
  // ==========================
  const SUMMARY_API = "https://miruzen-modelb-api.hf.space/summary";
  const ANALYZE_API = "https://miruzen-modelb-api.hf.space/analyze";

  const fetchData = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Tanggal Diperlukan",
        description: "Silakan pilih tanggal mulai dan tanggal akhir.",
        variant: "destructive",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Tanggal Tidak Valid",
        description: "Tanggal mulai harus sebelum tanggal akhir.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSummary(null);
    setAnalyze(null);

    try {
      const body = JSON.stringify({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      });

      console.log("📡 Mengirim request ke API dengan body:", body);

      const [summaryRes, analyzeRes] = await Promise.all([
        fetch(SUMMARY_API, { method: "POST", headers: { "Content-Type": "application/json" }, body }),
        fetch(ANALYZE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body }),
      ]);

      const summaryData = await summaryRes.json();
      const analyzeData = await analyzeRes.json();

      console.log("✅ Hasil /summary:", summaryData);
      console.log("✅ Hasil /analyze:", analyzeData);

      // Error handling untuk API yang gagal atau kosong
      if (!summaryRes.ok || summaryData.status !== "ok") {
        throw new Error(summaryData.message || "Gagal memuat data ringkasan (summary).");
      }
      if (!analyzeRes.ok || analyzeData.status !== "ok" || !analyzeData.chart_data) {
        throw new Error(analyzeData.message || "Gagal memuat data analisis grafik (analyze).");
      }

      // Deteksi jika data terlalu sedikit (<50 hari)
      const dataPoints = analyzeData.chart_data.dates?.length || 0;
      if (dataPoints < 50) {
        toast({
          title: "Data Terlalu Sedikit",
          description: `Data yang tersedia hanya ${dataPoints} hari. Minimum 50 hari dibutuhkan untuk analisis yang stabil.`,
          variant: "destructive",
        });
      }

      setSummary(summaryData);
      setAnalyze(analyzeData);

      if (onDataFetched) onDataFetched({ summary: summaryData, analyze: analyzeData });

      toast({
        title: "Berhasil",
        description: "Data historis dan analisis tren berhasil dimuat.",
      });
    } catch (error: any) {
      console.error("❌ Error fetching data:", error);
      toast({
        title: "Terjadi Kesalahan",
        description: error.message || "Gagal mengambil data historis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!summary || !analyze) return;

    const wsData = [
      ["EUR/USD EMA & Trend Analysis"],
      [""],
      ["Date Range", `${format(startDate!, "yyyy-MM-dd")} to ${format(endDate!, "yyyy-MM-dd")}`],
      [""],
      ["Pair", summary.pair],
      ["As of Date", summary.as_of_date],
      ["Close", summary.close],
      ["EMA20", summary.EMA20],
      ["EMA50", summary.EMA50],
      ["Trend", summary.trend_analysis.trend],
      ["Strength", summary.trend_analysis.strength],
      ["Position", summary.trend_analysis.price_position],
      [""],
      ["Date", "Close", "EMA20", "EMA50", "Normalized Close"],
    ];

    analyze.chart_data?.dates.forEach((d, i) => {
      wsData.push([
        d,
        analyze.chart_data!.close[i],
        analyze.chart_data!.EMA20[i],
        analyze.chart_data!.EMA50[i],
        analyze.chart_data!.norm_close[i],
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `EURUSD_Analysis_${format(startDate!, "yyyyMMdd")}_${format(endDate!, "yyyyMMdd")}.xlsx`);

    toast({
      title: "Download Berhasil",
      description: "Data berhasil diunduh dalam format Excel.",
    });
  };

  const getTrendBadgeVariant = (trend: string) => (trend === "bearish" ? "destructive" : "default");

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Data Historis & Analisis EMA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ================= Date Pickers ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !startDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Akhir</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !endDate && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ================= Action Buttons ================= */}
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} className="flex-1 gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat Data...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" /> Kalkulasi Data Historis
              </>
            )}
          </Button>

          <Button onClick={downloadExcel} disabled={!summary || !analyze} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Download Excel
          </Button>
        </div>

        {/* ================= Display Summary ================= */}
        {summary && summary.status === "ok" && (
          <div className="space-y-4 border-t pt-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Ringkasan Tren</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="font-semibold">{summary.as_of_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Penutupan:</span>
                  <span className="font-bold text-primary">{summary.close.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>EMA20:</span>
                  <span className="font-semibold text-success">{summary.EMA20.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>EMA50:</span>
                  <span className="font-semibold text-accent">{summary.EMA50.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tren:</span>
                  <Badge variant={getTrendBadgeVariant(summary.trend_analysis.trend)}>
                    {summary.trend_analysis.trend.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= Chart Visualization ================= */}
        {analyze && analyze.status === "ok" && analyze.chart_data && (
          <Card className="border-2 mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Grafik EMA & Harga Penutupan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={analyze.chart_data.dates.map((d, i) => ({
                    date: d,
                    close: analyze.chart_data!.close[i],
                    EMA20: analyze.chart_data!.EMA20[i],
                    EMA50: analyze.chart_data!.EMA50[i],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={["auto", "auto"]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="close" stroke="#8884d8" name="Close" dot={false} />
                  <Line type="monotone" dataKey="EMA20" stroke="#22c55e" name="EMA20" dot={false} />
                  <Line type="monotone" dataKey="EMA50" stroke="#f59e0b" name="EMA50" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalDataForm;
