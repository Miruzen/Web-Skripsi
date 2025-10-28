import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
      setData(result);
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

  useEffect(() => {
  if (startDate && endDate) {
    fetchMoodSeries();
  }
}, [startDate, endDate, useCustom]);


  return (
    <Card className="shadow-card border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Mood Series Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ====== Pilihan Mode ====== */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant={!useCustom ? "default" : "outline"}
            onClick={() => setUseCustom(false)}
            className="gap-2"
          >
            📈 Ikuti Tanggal Historis
          </Button>
          <Button
            variant={useCustom ? "default" : "outline"}
            onClick={() => setUseCustom(true)}
            className="gap-2"
          >
            📅 Gunakan Custom Range
          </Button>
        </div>

        {/* ====== Custom Range Picker ====== */}
        {useCustom && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  {customStart ? format(customStart, "PPP") : "Pilih tanggal mulai"}
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
                  {customEnd ? format(customEnd, "PPP") : "Pilih tanggal akhir"}
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

            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={fetchMoodSeries}
                disabled={!customStart || !customEnd || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat Data...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" /> Lihat Grafik
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ====== Chart Section ====== */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mood_score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Mood Score"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                name="Harga EUR/USD"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            📅 Pilih rentang tanggal terlebih dahulu untuk melihat grafik Mood Series.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodSeriesChart;
