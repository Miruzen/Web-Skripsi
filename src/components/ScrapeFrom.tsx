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

// Interface ScrapeResult dari Kode 1 untuk type safety yang lebih baik
interface ScrapeResult {
  url: string;
  domain: string;
  count: number;
  items: Array<{
    title: string;
    link: string;
    content?: string; // Menjaga kemampuan untuk menampilkan konten penuh
    author?: string;
    date?: string;
  }>;
}

export default function ScrapeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null); // Menggunakan ScrapeResult
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!url) return;

    setLoading(true);
    try {
      // Panggil fungsi Supabase seperti di Kode 1
      const { data, error } = await supabase.functions.invoke<ScrapeResult>("scrape-news", {
        body: { url }
      });

      if (error) {
        throw error; // Melemparkan error untuk ditangkap di blok catch
      }

      setResult(data);
      // Logika toast dari Kode 1
      toast({
        title: "Berhasil!",
        description: data.items[0]?.content
          ? "Artikel berhasil di-scrape"
          : `${data.count} berita berhasil di-scrape`,
      });
    } catch (err: any) {
      console.error("Scrape error:", err);
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Mendukung:</span>
              <a 
                href="https://www.investing.com/currencies/eur-usd-news" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                investing.com <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a 
                href="https://www.dailyforex.com/forex-news" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                dailyforex.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !url} // Validasi dari Kode 2
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
              disabled={!result} // Validasi dari Kode 2
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
              {result.items[0]?.content ? (
                // Tampilan konten artikel penuh dari Kode 1
                <ScrollArea className="h-64 rounded-lg border bg-muted/20 p-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{result.items[0].title}</h3>
                    {result.items[0].author && (
                      <div className="text-sm text-muted-foreground">Author: {result.items[0].author}</div>
                    )}
                    {result.items[0].date && (
                      <div className="text-sm text-muted-foreground">Date: {result.items[0].date}</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap mt-2">{result.items[0].content}</p>
                  </div>
                </ScrollArea>
              ) : (
                // Tampilan daftar link berita dari Kode 2
                <ScrollArea className="h-64 rounded-lg border bg-muted/20 p-4">
                  <ul className="space-y-2">
                    {result.items.map((item, i) => (
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
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}