import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface MoodSeriesChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface MoodSeriesRecord {
  date: string;
  mood_score: number;
  close: number;
}

const MoodSeriesChart = ({ startDate, endDate }: MoodSeriesChartProps) => {
  const { toast } = useToast();
  const [useCustom, setUseCustom] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MoodSeriesRecord[]>([]);

  // Jika pakai custom → ambil tanggal custom
  // Jika tidak → pakai tanggal dari historical form
  const effectiveStart = useCustom ? customStart : startDate;
  const effectiveEnd = useCustom ? customEnd : endDate;

  const fetchMoodSeries = async () => {
    if (!effectiveStart || !effectiveEnd) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL_2}/functions/v1/get-mood-series`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            start_date: format(effectiveStart, "yyyy-MM-dd"),
            end_date: format(effectiveEnd, "yyyy-MM-dd"),
          }),
        }
      );

      if (!response.ok) throw new Error("Gagal mengambil data Mood Series");
      const result = await response.json();
      console.log("✅ Hasil Mood Series:", result);

      const formatted = (result.data || []).map((item: any) => ({
        ...item,
        date: new Date(item.date).toISOString().split("T")[0],
      }));

      console.log("📊 Data Siap Render:", formatted);
      setData(formatted);
    } catch (err: any) {
      console.error("❌ Gagal mengambil Mood Series:", err);
      toast({
        title: "Gagal Memuat Mood Series",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch ketika tanggal historis berubah (jika tidak pakai custom)
  useEffect(() => {
    if (!useCustom && startDate && endDate) {
      fetchMoodSeries();
    }
  }, [startDate, endDate, useCustom]);

  return (
    <div className="space-y-6">
      {/* ====== Pilihan Mode ====== */}
      <div className="flex flex-wrap gap-3 items-center">
        <p className="text-sm text-muted-foreground">
          Gunakan tanggal dari data historis (Langkah 2) atau pilih periode khusus:
        </p>
        <Button
          variant={useCustom ? "default" : "outline"}
          onClick={() => setUseCustom(true)}
          size="sm"
          className="gap-2"
        >
          📅 Pilih Tanggal Kustom
        </Button>
        {useCustom && (
          <Button
            variant="ghost"
            onClick={() => setUseCustom(false)}
            size="sm"
          >
            Gunakan Data Langkah 2
          </Button>
        )}
      </div>

        {/* ====== Custom Range Picker ====== */}
        {useCustom && (
          <div className="p-4 rounded-lg bg-muted/30 border-2 border-dashed border-border space-y-4">
            <p className="text-sm font-medium">Pilih Rentang Tanggal Kustom</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStart && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customStart ? format(customStart, "PPP") : "Tanggal Mulai"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStart}
                    onSelect={setCustomStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEnd && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customEnd ? format(customEnd, "PPP") : "Tanggal Akhir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEnd}
                    onSelect={setCustomEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={fetchMoodSeries}
              disabled={!customStart || !customEnd || loading}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat Data...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" /> Tampilkan Grafik
                </>
              )}
            </Button>
          </div>
        )}

        {/* ====== Chart Section ====== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border-2 border-dashed border-border">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Memuat data mood series...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-background border-2 border-primary/10">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="hsl(var(--primary))"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Mood Score', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="hsl(var(--accent))"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Harga (USD)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mood_score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  name="📊 Mood Score"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={false}
                  name="💰 Harga EUR/USD"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-4">
              📈 Grafik menampilkan korelasi antara sentimen berita (mood score) dan pergerakan harga EUR/USD
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16 px-6 rounded-lg border-2 border-dashed border-border">
            <Activity className="h-12 w-12 mb-4 opacity-40" />
            <p className="font-medium">Belum Ada Data Grafik</p>
            <p className="text-sm mt-2">
              {useCustom 
                ? "Pilih rentang tanggal dan klik tombol 'Tampilkan Grafik'" 
                : "Ambil data historis di Langkah 2 terlebih dahulu"}
            </p>
          </div>
        )}
      </div>
    );
  };

export default MoodSeriesChart;
