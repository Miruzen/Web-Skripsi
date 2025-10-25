import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TrendAnalysis {
  trend: string;
  strength: string;
  price_position: string;
  ema_gap_percent: number;
}

interface HistoricalData {
  status: string;
  pair: string;
  as_of_date: string;
  close: number;
  EMA20: number;
  EMA50: number;
  trend_analysis: TrendAnalysis;
}

const HistoricalDataForm = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoricalData | null>(null);
  const { toast } = useToast();

  const fetchHistoricalData = async () => {
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
    try {
      const response = await fetch("https://miruzen-modelb-api.hf.space/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data historis");
      }

      const result = await response.json();
      setData(result);

      toast({
        title: "Data Berhasil Diambil",
        description: "Data historis telah berhasil dimuat.",
      });
    } catch (error: any) {
      console.error("Error fetching historical data:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data historis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: string) => {
    return trend === "bearish" ? "text-destructive" : "text-success";
  };

  const getTrendBadgeVariant = (trend: string) => {
    return trend === "bearish" ? "destructive" : "default";
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Data Historis & Analisis EMA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tanggal Mulai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Akhir</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          onClick={fetchHistoricalData}
          disabled={loading || !startDate || !endDate}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat Data...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Ambil Data Historis
            </>
          )}
        </Button>

        {data && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Informasi Pasangan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pasangan:</span>
                    <span className="font-semibold">{data.pair}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tanggal:</span>
                    <span className="font-medium">{data.as_of_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Harga Penutupan:</span>
                    <span className="font-bold text-primary">{data.close.toFixed(6)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Perhitungan EMA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">EMA 20:</span>
                    <span className="font-bold text-success">{data.EMA20.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">EMA 50:</span>
                    <span className="font-bold text-accent">{data.EMA50.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gap EMA:</span>
                    <span className="font-medium">{data.trend_analysis.ema_gap_percent.toFixed(3)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Analisis Tren & Mood
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">Tren:</span>
                  <Badge variant={getTrendBadgeVariant(data.trend_analysis.trend)} className="px-3 py-1">
                    {data.trend_analysis.trend.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">Kekuatan:</span>
                  <span className="font-semibold capitalize">{data.trend_analysis.strength}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-muted-foreground">Posisi Harga:</span>
                  <p className="text-sm mt-1">{data.trend_analysis.price_position}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalDataForm;
