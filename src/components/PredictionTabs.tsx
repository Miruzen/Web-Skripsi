import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Activity, Brain, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MoodSeriesRecord {
  date: string;
  mood_score: number;
  close: number;
  ema20?: number;
  ema50?: number;
}

const PredictionTabs = () => {
  const { toast } = useToast();
  const [data, setData] = useState<MoodSeriesRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<7 | 30>(7);
  const [activeTab, setActiveTab] = useState("ema");

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - range);
// Fetch data dari Supabase Function 'get-mood-series'
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mood-series`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            start_date: format(pastDate, "yyyy-MM-dd"),
            end_date: format(today, "yyyy-MM-dd"),
          }),
        }
      );

      if (!response.ok) throw new Error("Gagal mengambil data dari Supabase");
      const result = await response.json();
      const formatted = (result.data || []).map((d: any) => ({
        ...d,
        date: new Date(d.date).toISOString().split("T")[0],
      }));

      setData(formatted);
      console.log("📊 Data Loaded:", formatted);
    } catch (err: any) {
      console.error("❌ Error Fetching Data:", err);
      toast({
        title: "Gagal Memuat Data",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  return (
    <Card className="shadow-card bg-card/90 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Grafik Prediksi
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="ema">EMA 20/50 (Teknikal)</TabsTrigger>
            <TabsTrigger value="mood">Suasana Pasar</TabsTrigger>
            {/* <TabsTrigger value="lstm">Prediksi LSTM</TabsTrigger> */}
          </TabsList>

          {/* ============================== */}
          {/* 📊 TAB 1 - EMA 20/50 */}
          {/* ============================== */}
          <TabsContent value="ema" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan perbandingan harga aktual dengan EMA 20 dan EMA 50.
              </p>
              <div className="space-x-2">
                <Button
                  variant={range === 7 ? "default" : "outline"}
                  onClick={() => setRange(7)}
                >
                  7 Hari
                </Button>
                <Button
                  variant={range === 30 ? "default" : "outline"}
                  onClick={() => setRange(30)}
                >
                  30 Hari
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  {/* ✅ Tambahkan domain tetap dari 1.0 hingga 1.5 */}
                  <YAxis domain={[1.15, 1.19]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#00bcd4"
                    strokeWidth={2}
                    dot={false}
                    name="Harga Aktual"
                  />
                  <Line
                    type="monotone"
                    dataKey="ema20"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                    name="EMA 20"
                  />
                  <Line
                    type="monotone"
                    dataKey="ema50"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={false}
                    name="EMA 50"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          {/* ============================== */}
          {/* 💭 TAB 2 - Mood Series */}
          {/* ============================== */}
          <TabsContent value="mood" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Grafik suasana pasar berdasarkan agregasi sentimen berita harian.
              </p>
              <div className="space-x-2">
                <Button
                  variant={range === 7 ? "default" : "outline"}
                  onClick={() => setRange(7)}
                >
                  7 Hari
                </Button>
                <Button
                  variant={range === 30 ? "default" : "outline"}
                  onClick={() => setRange(30)}
                >
                  30 Hari
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-0.6, 1.19]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="mood_score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Mood Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Harga EUR/USD"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          {/* ==============================
          {/* 🧠 TAB 3 - LSTM Placeholder */}
          {/* ============================== */}
          {/* <TabsContent
            value="lstm"
            className="mt-6 text-center py-12 text-muted-foreground"
          >
            <Activity className="h-8 w-8 mx-auto mb-3 text-primary opacity-70" />
            <p>Prediksi LSTM akan tersedia segera.</p>
          </TabsContent> */} 
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PredictionTabs;
