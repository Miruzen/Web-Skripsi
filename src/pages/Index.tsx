import Navigation from "@/components/Navigation";
import LiveRate from "@/components/LiveRate";
import PredictionCard from "@/components/PredictionCard";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, Newspaper, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-card border-b border-border">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <Badge variant="outline" className="text-accent border-accent/50 mb-4">
                Powered by Hybrid AI Model
              </Badge>
              <h1 className="text-5xl font-bold text-foreground mb-6">
                Advanced EUR/USD <span className="text-accent">Predictions</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Real-time Forex predictions using cutting-edge hybrid AI models. 
                Get accurate EUR/USD forecasts with comprehensive market analysis.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/analysis" className="gap-2">
                  <BarChart3 className="h-5 w-5" />
                  View Analysis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <Brain className="h-5 w-5" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Rate - Full width on mobile, 1 column on desktop */}
          <div className="lg:col-span-1">
            <LiveRate />
          </div>
          
          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Today's Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">1.0863</div>
                  <div className="text-sm text-muted-foreground">94.2% confidence</div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Model Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">97.3%</div>
                  <div className="text-sm text-muted-foreground">MAPE Score</div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Market Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">Bullish</div>
                  <div className="text-sm text-success">+2.1% trend</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Predictions and News Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <PredictionCard />
          <NewsCard />
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="shadow-card bg-gradient-primary">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Ready for Deeper Analysis?
              </h2>
              <p className="text-primary-foreground/90 mb-6 text-lg">
                Explore detailed prediction comparisons, historical accuracy, and advanced metrics
              </p>
              <Button variant="outline" size="lg" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link to="/analysis" className="gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Open Analysis Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
