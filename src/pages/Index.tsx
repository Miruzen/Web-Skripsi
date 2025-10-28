import LiveRate from "@/components/LiveRate";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, Newspaper, BarChart3, ArrowRight, CornerRightUp } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      
      {/* ================================== */}
      {/* Hero Section (Dipertahankan) */}
      {/* ================================== */}
      <div className="bg-gradient-card border-b border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-5xl font-extrabold text-foreground mb-6 leading-tight">
                Prediksi EUR/USD 
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Prediksi EUR/USD yang menggunakan model 
              </p>
              <p className="text-xl text-muted-foreground leading-relaxed">
                FinBERT, Longformer (Sentimen), dan Moving Average (Teknikal).
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/analysis" className="gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Mulai Analisis Mendalam
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================== */}
      {/* Main Content & Modules */}
      {/* ================================== */}
      <div className="container mx-auto px-6 py-12 space-y-12">
        
        {/* SECTION 1: Live Rate - DIJADIKAN SATU KOLOM LEBAR */}
        <div className="grid grid-cols-1 mb-8">
          <LiveRate />
        </div>

        <hr className="border-t border-border" />
        
        {/* SECTION 2: Prediksi dan Berita (2 Kolom) */}
        <h2 className="text-3xl font-bold text-foreground mb-6">
            Berita Forex dan Analisa Hari ini
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Kolom Kiri: Prediksi & Panduan */}
            <div className="space-y-6">
                <Card className="shadow-card p-6 h-full bg-card/90">
                    <CardHeader className="p-0 mb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Brain className="h-5 w-5 text-primary" />
                            Akses Model Prediksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        <p className="text-muted-foreground">
                            Model kami menggabungkan data Moving Average (teknikal) dengan sentimen (berita) 
                            untuk memprediksi harga penutupan esok hari (H+1).
                        </p>
                        
                        <div className="space-y-2 pt-2">
                            <p className="text-sm font-semibold text-foreground">Komponen Analisis:</p>
                            <Badge variant="secondary" className="mr-2">EMA 20/50 (Teknikal)</Badge>
                            <Badge variant="secondary" className="mr-2">Sentimen Judul (FinBERT)</Badge>
                            <Badge variant="secondary">Sentimen Konten (Longformer)</Badge>
                        </div>

                        <Button variant="premium" className="w-full mt-4 gap-2" asChild>
                            <Link to="/analysis">
                                <CornerRightUp className="h-4 w-4" />
                                Lanjutkan ke Halaman Analisis
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* Kolom Kanan: Berita Terbaru (NewsCard) */}
            <div className="h-full">
                {/* NewsCard sudah mencakup Card Header dan Title internalnya */}
                <NewsCard /> 
            </div>

        </div>
      </div>
      
      {/* Footer atau bagian akhir halaman */}
    </div>
  );
};

export default Index;