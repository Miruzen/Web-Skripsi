import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Clock } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  source: string;
  impact: "High" | "Medium" | "Low";
  url: string;
}

const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "ECB Signals Potential Rate Changes in Q2",
    summary: "European Central Bank officials hint at monetary policy adjustments following inflation data...",
    timestamp: "2024-01-15 13:45:00",
    source: "Reuters",
    impact: "High",
    url: "#"
  },
  {
    id: "2",
    title: "US Dollar Strengthens on Employment Data",
    summary: "Latest employment figures exceed expectations, boosting USD confidence across major pairs...",
    timestamp: "2024-01-15 12:30:00", 
    source: "Bloomberg",
    impact: "Medium",
    url: "#"
  },
  {
    id: "3",
    title: "European Manufacturing Data Shows Recovery",
    summary: "Manufacturing PMI indicates continued growth in the eurozone, supporting EUR outlook...",
    timestamp: "2024-01-15 11:15:00",
    source: "Financial Times",
    impact: "Medium", 
    url: "#"
  },
  {
    id: "4",
    title: "Fed Minutes Reveal Cautious Optimism",
    summary: "Federal Reserve meeting minutes suggest measured approach to future rate decisions...",
    timestamp: "2024-01-15 10:00:00",
    source: "MarketWatch",
    impact: "Low",
    url: "#"
  }
];

const NewsCard = () => {
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "High":
        return { variant: "destructive" as const, className: "bg-danger text-danger-foreground" };
      case "Medium":
        return { variant: "default" as const, className: "bg-warning text-warning-foreground" };
      case "Low":
        return { variant: "secondary" as const };
      default:
        return { variant: "secondary" as const };
    }
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent" />
          Latest Forex News
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockNews.map((news) => {
            const impactBadge = getImpactBadge(news.impact);
            
            return (
              <div key={news.id} className="p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-smooth">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground leading-tight">
                    {news.title}
                  </h3>
                  <Badge {...impactBadge}>
                    {news.impact}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {news.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{news.source}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(news.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    Read More
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default NewsCard;