import LiveRate from "@/components/LiveRate";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, Newspaper, BarChart3, ArrowRight, CornerRightUp } from "lucide-react";
import { Link } from "react-router-dom";
import PredictionTabs from "@/components/PredictionTabs";

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
            {/* Kolom Kiri: Model Prediksi Interaktif */}
            <div className="space-y-6">
              <PredictionTabs />
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