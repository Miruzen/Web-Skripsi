import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LiveRate = () => {
  const { toast } = useToast();
  const [rate, setRate] = useState<number | null>(null);
  const [prevRate, setPrevRate] = useState<number | null>(null);
  const [high, setHigh] = useState<number | null>(null);
  const [low, setLow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveRate = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL_2}/functions/v1/get-live-rate`, 
        {
        method: "GET",
        headers: {
            // ✅ Tambahkan Header Otorisasi dengan Anon Key
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 
            "Content-Type": "application/json",
        },}
      );

      if (!response.ok) throw new Error(`Gagal mengambil data (${response.status})`);
      const { rate: currentRate } = await response.json();

      if (typeof currentRate !== "number") {
        throw new Error("Response tidak valid dari Edge Function");
      }

      setPrevRate(rate);
      setRate(currentRate);

      // Update high & low (24 jam)
      setHigh((prev) => (prev === null || currentRate > prev ? currentRate : prev));
      setLow((prev) => (prev === null || currentRate < prev ? currentRate : prev));

    } catch (err: any) {
      console.error("❌ Error memuat Live Rate:", err);
      toast({
        title: "Gagal Memuat Live Rate",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRate();
    const interval = setInterval(fetchLiveRate, 30000); // refresh tiap 30 detik
    return () => clearInterval(interval);
  }, []);

  const change = rate && prevRate ? rate - prevRate : 0;
  const changePercent = prevRate ? (change / prevRate) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Kurs EUR/USD Langsung
          </span>
          <Badge variant="outline" className="text-accent border-accent/50 animate-pulse">
            LANGSUNG
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rate ? (
          <div className="space-y-4">
            <div className="text-4xl font-bold text-foreground">
              {rate.toFixed(4)}
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 ${
                  isPositive ? "text-success" : "text-destructive"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isPositive ? "+" : ""}
                  {change.toFixed(4)}
                </span>
              </div>

              <div className={`${isPositive ? "text-success" : "text-destructive"}`}>
                ({isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tertinggi 24j</div>
                <div className="font-medium">
                  {high ? high.toFixed(4) : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Terendah 24j</div>
                <div className="font-medium">
                  {low ? low.toFixed(4) : "-"}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Gagal memuat kurs. Coba lagi nanti.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveRate;
