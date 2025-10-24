import React, { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Download, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ScrapeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!url) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-news", { 
        body: { url } 
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Gagal scraping berita",
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      toast({
        title: "Berhasil!",
        description: `${data.count} berita berhasil di-scrape`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Terjadi kesalahan saat scraping",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function downloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `scrape-${result.domain}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(u);
    
    toast({
      title: "Download dimulai",
      description: "File JSON berhasil diunduh",
    });
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Scrape Berita Forex
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scrape-url" className="text-sm font-semibold">URL Berita</Label>
            <Input
              id="scrape-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.investing.com/currencies/eur-usd-news"
              className="transition-all"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Mendukung: investing.com, dailyforex.com
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !url}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Scrape Berita
                </>
              )}
            </Button>
            <Button 
              type="button" 
              onClick={downloadJson} 
              disabled={!result}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <p className="text-sm font-medium">Domain</p>
                <p className="text-xs text-muted-foreground">{result.domain}</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {result.count} berita
              </Badge>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Hasil Scraping</Label>
              <ScrollArea className="h-64 rounded-lg border bg-muted/20 p-4">
                <ul className="space-y-2">
                  {result.items.map((item: any, i: number) => (
                    <li key={i} className="group">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}