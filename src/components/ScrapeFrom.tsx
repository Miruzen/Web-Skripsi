import React, { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Download,
  Loader2,
  ExternalLink,
  Sparkles,
  Newspaper,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface ScrapeResult {
  url: string;
  domain: string;
  count: number;
  items: Array<{
    title: string;
    link: string;
    content?: string;
    author?: string;
    date?: string;
  }>;
}

interface NewsArticle {
  title: string;
  content: string;
  author?: string;
  date?: string;
}

interface ScrapeFormProps {
  onNewsClick?: (article: NewsArticle) => void;
}

export default function ScrapeForm({ onNewsClick }: ScrapeFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [loadingArticle, setLoadingArticle] = useState<string | null>(null);

  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!url) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<ScrapeResult>(
        "scrape-news",
        { body: { url } }
      );

      if (error) throw error;

      setResult(data);

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

  async function handleNewsClick(articleUrl: string) {
    if (!onNewsClick) return;

    setLoadingArticle(articleUrl);

    try {
      const { data, error } = await supabase.functions.invoke<ScrapeResult>(
        "scrape-news",
        { body: { url: articleUrl } }
      );
      if (error) throw error;
      const article = data.items[0];

      if (article?.content) {
        onNewsClick({
          title: article.title,
          content: article.content,
          author: article.author,
          date: article.date,
        });

        toast({
          title: "Artikel Dimuat",
          description: "Artikel siap untuk dianalisis",
        });
      } else {
        throw new Error("Konten artikel tidak dapat diambil");
      }
    } catch (err: any) {
      console.error("Article fetch error:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal mengambil konten artikel",
        variant: "destructive",
      });
    } finally {
      setLoadingArticle(null);
    }
  }

  function downloadExcel() {
  if (!result) return;

  const sheetData = result.items.map((item, index) => ({
    No: index + 1,
    Judul: item.title,
    Link: item.link,
    Konten: item.content || "",
    Penulis: item.author || "",
    Tanggal: item.date || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Scraped News");
  const filename = `Hasil Scraping -${result.domain}.xlsx`;
  XLSX.writeFile(workbook, filename);

  toast({
    title: "Download dimulai",
    description: "File Excel berhasil diunduh",
  });
}

  async function autoScrape(source: "investing" | "dailyforex") {
    const targetUrl =
      source === "investing"
        ? "https://www.investing.com/currencies/eur-usd-news"
        : "https://www.dailyforex.com/forex-news";

    setUrl(targetUrl);
    setResult(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<ScrapeResult>(
        "scrape-news",
        { body: { url: targetUrl } }
      );

      if (error) throw error;

      setResult(data);

      toast({
        title: `Scrape ${source === "investing" ? "Investing" : "DailyForex"} sukses`,
        description: `${data.count} berita berhasil diambil.`,
      });
    } catch (err: any) {
      console.error("Auto scrape error:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal scraping otomatis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Scrape Berita Forex
        </CardTitle>

        {/* 🟦 GUIDE SECTION */}
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Pilih salah satu metode scraping:
          <br />
          <strong>1)</strong> Scrape otomatis dari Investing.com  
          <br />
          <strong>2)</strong> Scrape otomatis dari DailyForex  
          <br />
          <strong>3)</strong> Atau gunakan input manual di bagian bawah.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* 🟦 SECTION 1 — AUTO SCRAPE */}
        <div className="space-y-2">
          <Label className="font-semibold">Scraping Otomatis</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => autoScrape("investing")}
              disabled={loading}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Investing
            </Button>

            <Button
              type="button"
              onClick={() => autoScrape("dailyforex")}
              disabled={loading}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              DailyForex
            </Button>
          </div>
        </div>

        {/* 🟦 SECTION 2 — MANUAL SCRAPE */}
        <div className="pt-4 border-t">
          <Label className="font-semibold">Scraping Manual</Label>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Masukkan URL berita..."
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading || !url}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Scraping...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" /> Scrape Manual
                </>
              )}
            </Button>
          </form>
        </div>

        {/* 🟦 SECTION 3 — RESULTS */}
        {result && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <div>
                <p className="text-sm font-medium">Domain</p>
                <p className="text-xs text-muted-foreground">{result.domain}</p>
              </div>
              <Badge>{result.count} berita</Badge>
            </div>

            {result.items[0]?.content ? (
              // Full article view
              <ScrollArea className="h-64 border rounded-md p-4 bg-muted/10">
                <h3 className="font-bold text-lg">{result.items[0].title}</h3>
                <p className="text-sm whitespace-pre-wrap mt-2">
                  {result.items[0].content}
                </p>
              </ScrollArea>
            ) : (
              // List of articles
              <ScrollArea className="h-64 border rounded-md p-4 bg-muted/10">
                <ul className="space-y-2">
                  {result.items.map((item, i) => (
                    <li key={i} className="flex items-start justify-between">
                      <a
                        href={item.link}
                        target="_blank"
                        className="flex items-start gap-2"
                      >
                        <ExternalLink className="h-4 w-4 text-primary mt-1" />
                        <span className="text-sm">{item.title}</span>
                      </a>

                      {onNewsClick && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleNewsClick(item.link)}
                          disabled={loadingArticle === item.link}
                          className="h-6 px-2 text-xs"
                        >
                          {loadingArticle === item.link ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span className="ml-1">Analysis</span>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}

            <Button
            onClick={downloadExcel}
            disabled={!result}
            variant="outline"
            className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
            Download Excel (.xlsx)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
