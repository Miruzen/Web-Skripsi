import React, { useState } from "react";
import { supabase } from "../integrations/supabase/client";

export default function ScrapeForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!url) return;
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("scrape-news", { body: JSON.stringify({ url }) });
      if ((res as any).error) {
        setError((res as any).error.message || "function error");
      } else {
        // supabase.functions.invoke may return binary data in res.data
        let data: any = (res as any).data;
        if (data instanceof Uint8Array) {
          const text = new TextDecoder().decode(data);
          data = JSON.parse(text);
        }
        setResult(data);
      }
    } catch (err: any) {
      setError(err?.message || String(err));
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
    a.download = "scrape-result.json";
    a.click();
    URL.revokeObjectURL(u);
  }

  return (
    <div className="p-4 border rounded-md">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste investing.com or dailyforex listing URL"
          className="w-full p-2 border rounded"
        />
        <div className="flex gap-2">
          <button type="submit" className="btn" disabled={loading || !url}>
            {loading ? "Scraping..." : "Scrape"}
          </button>
          <button type="button" onClick={downloadJson} disabled={!result}>
            Download JSON
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 mt-2">{error}</div>}

      {result && (
        <div className="mt-3">
          <div>Domain: {result.domain}</div>
          <div>Count: {result.count}</div>
          <div className="max-h-56 overflow-auto mt-2">
            <ul className="list-disc pl-5">
              {result.items.map((it: any, i: number) => (
                <li key={i}>
                  <a href={it.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {it.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
// ...existing code...