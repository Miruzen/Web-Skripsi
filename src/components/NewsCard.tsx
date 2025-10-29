import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  source: string;
  impact: "High" | "Medium" | "Low";
  url: string;
}

interface ScrapedNewsItem {
  title: string;
  link: string;
  summary?: string;
  content?: string;
  author?: string;
  date?: string;
}

const NEWS_SOURCES = [
  "https://www.investing.com/news/forex-news",
  "https://www.dailyforex.com/articles/currency-pairs/english/5754/1"
];

const NewsCard = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        const allNews: NewsItem[] = [];
        
        for (const sourceUrl of NEWS_SOURCES) {
          try {
            const { data, error } = await supabase.functions.invoke('scrape-news', {
              body: { url: sourceUrl }
            });

            if (error) {
              console.error(`Error fetching from ${sourceUrl}:`, error);
              continue;
            }

            if (data?.items && Array.isArray(data.items)) {
              const sourceName = sourceUrl.includes('investing.com') ? 'Investing.com' : 'DailyForex';
              
              const formattedNews: NewsItem[] = data.items.slice(0, 5).map((item: ScrapedNewsItem, index: number) => ({
                id: `${sourceName}-${index}`,
                title: item.title,
                summary: item.summary || item.content?.substring(0, 150) + '...' || 'Klik untuk membaca artikel lengkap',
                timestamp: item.date || new Date().toISOString(),
                source: sourceName,
                impact: (index === 0 ? "High" : index < 3 ? "Medium" : "Low") as "High" | "Medium" | "Low",
                url: item.link
              }));
              
              allNews.push(...formattedNews);
            }
          } catch (error) {
            console.error(`Error processing ${sourceUrl}:`, error);
          }
        }

        if (allNews.length > 0) {
          // Sort by timestamp (newest first) and limit to 8 items
          const sortedNews = allNews
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 8);
          
          setNews(sortedNews);
        } else {
          toast({
            title: "Info",
            description: "Tidak ada berita yang berhasil dimuat. Menggunakan data contoh.",
            variant: "default",
          });
          // Fallback to empty array if no news fetched
          setNews([]);
        }
      } catch (error) {
        console.error("Error fetching news:", error);
        toast({
          title: "Error",
          description: "Gagal memuat berita terbaru.",
          variant: "destructive",
        });
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [toast]);
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
          Berita Forex Terbaru
        </CardTitle>
        <p className="text-muted-foreground">
          Data diambil langsung dari sumber terpercaya (Investing.com dan DailyForex.com)
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Tidak ada berita tersedia saat ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((newsItem) => {
              const impactBadge = getImpactBadge(newsItem.impact);
              
              return (
                <div key={newsItem.id} className="p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-smooth">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground leading-tight">
                      {newsItem.title}
                    </h3>
                    {/* <Badge {...impactBadge}>
                      {newsItem.impact}
                    </Badge> */}
                  </div>
                  
                  {/* <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {newsItem.summary}
                  </p> */}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{newsItem.source}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(newsItem.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs gap-1"
                      onClick={() => window.open(newsItem.url, '_blank', 'noopener,noreferrer')}
                    >
                      Baca Selengkapnya
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsCard;