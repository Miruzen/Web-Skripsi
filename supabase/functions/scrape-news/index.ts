/// <reference lib="deno.ns" />
import { DOMParser, Element, Document } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
];

function normalizeUrl(base: string, href: string | null) {
  try {
    if (!href) return null;
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isNewsCandidate(href: string | null, text: string) {
  if (!href && !text) return false;
  const h = (href || "").toLowerCase();
  const t = (text || "").toLowerCase();
  if (h.includes("/news") || /\/article|\/story|\/press|\/analysis|\/articles\//i.test(h)) return true;
  if (/news|article|press|analysis|report|headline/i.test(t)) return true;
  return false;
}

async function fetchWithRetry(url: string, attempts = 3) {
  const headers = {
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0"
  };

  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      // Add random delay between attempts
      if (i > 0) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      }

      const res = await fetch(url, { headers });
      if (res.ok) return res;
      
      // Handle specific status codes
      if (res.status === 403 || res.status === 429) {
        console.log(`Rate limited (${res.status}), retrying...`);
        continue;
      }
      
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
    }
  }
  throw lastErr;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json body" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const url = (body?.url || "").trim();
  if (!url) return new Response(JSON.stringify({ error: "url is required" }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: "invalid url" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const allowed = ["investing.com", "dailyforex.com"];
  if (!allowed.some((d) => parsed.hostname.includes(d))) {
    return new Response(JSON.stringify({ error: "domain not allowed" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log(`Fetching URL: ${url}`);
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      console.error(`Fetch failed with status: ${res.status}`);
      return new Response(JSON.stringify({ error: `fetch failed: ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const text = await res.text();
    console.log(`Received ${text.length} bytes, content-type: ${contentType}`);

    const items: Array<{ title: string; link: string; summary?: string; content?: string; author?: string; date?: string }> = [];

    // Helper function to detect if URL is a single article page
    function isArticlePage(urlString: string): boolean {
      const articlePatterns = [
        /\/news\/forex-news\/[^\/]+$/,  // investing.com article pattern
        /\/forex-technical-analysis\/\d{4}\/\d{2}\//,  // dailyforex.com article pattern
        /\/articles\//,
        /\/analysis\//,
        /-\d{5,}$/  // Ends with article ID
      ];
      return articlePatterns.some(pattern => pattern.test(urlString));
    }

    // Extract article content helper function
    async function extractArticleContent(doc: Document, domain: string): Promise<{ content: string; author: string; date: string; title: string }> {
      let content = "";
      let author = "";
      let date = "";
      let title = "";

      try {
        // Get title from meta tags or h1
        const titleMeta = doc.querySelector('meta[property="og:title"]');
        const h1 = doc.querySelector('h1');
        title = titleMeta?.getAttribute("content") || h1?.textContent?.trim() || "";

        if (domain.includes("investing.com")) {
          console.log("Extracting from investing.com article");
          // Investing.com selectors
          const articleDiv = doc.querySelector("div#article") || doc.querySelector("article");
          if (articleDiv) {
            const paragraphs = articleDiv.querySelectorAll("p");
            const contentParts = [];
            for (const p of paragraphs) {
              const text = p.textContent?.trim() || "";
              if (text && !text.toLowerCase().includes("advertisement") && text.length > 20) {
                contentParts.push(text);
              }
            }
            content = contentParts.join("\n\n");
          }

          // Extract author and date
          const authorEl = doc.querySelector('a[data-test="article-provider-link"]') || 
                          doc.querySelector('.author-name') ||
                          doc.querySelector('[rel="author"]');
          const dateEl = doc.querySelector('time[data-test="article-publish-date"]') ||
                        doc.querySelector('time');
          
          author = authorEl?.textContent?.trim() || "";
          date = dateEl?.getAttribute("datetime") || dateEl?.textContent?.trim() || "";

        } else if (domain.includes("dailyforex.com")) {
          console.log("Extracting from dailyforex.com article");
          // DailyForex selectors
          const contentDiv = doc.querySelector("div.content-body.article-content") || 
                            doc.querySelector("div.article-content") ||
                            doc.querySelector("article");
          if (contentDiv) {
            const paragraphs = contentDiv.querySelectorAll("p");
            const contentParts = [];
            for (const p of paragraphs) {
              const text = p.textContent?.trim() || "";
              if (text && text.length > 20) {
                contentParts.push(text);
              }
            }
            content = contentParts.join("\n\n");
          }

          // Extract author and date from JSON-LD if available
          const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent || "");
              if (data["@type"] === "NewsArticle" || data["@type"] === "Article") {
                author = data.author?.name || data.author || "";
                date = data.datePublished || data.dateModified || "";
                if (!title) title = data.headline || "";
                break;
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        }
        
        console.log(`Extracted article - Title length: ${title.length}, Content length: ${content.length}`);
      } catch (error) {
        console.error("Error extracting content:", error);
      }

      return { content, author, date, title };
    }

    // Check if this is a single article page first
    if (isArticlePage(url)) {
      console.log("Detected as article page, extracting content...");
      const doc = new DOMParser().parseFromString(text, "text/html");
      if (!doc) {
        return new Response(
          JSON.stringify({ error: "failed to parse html" }),
          { status: 500, headers: corsHeaders }
        );
      }

      const { content, author, date, title } = await extractArticleContent(doc, parsed.hostname);
      
      if (content && content.length > 100) {
        console.log("Successfully extracted article content");
        items.push({
          title,
          link: url,
          content,
          author,
          date
        });
        
        // Return immediately for single article
        return new Response(
          JSON.stringify({
            url,
            domain: parsed.hostname,
            count: 1,
            items: items,
          }),
          { headers: corsHeaders }
        );
      } else {
        console.warn("Failed to extract article content or content too short");
        return new Response(
          JSON.stringify({ error: "Could not extract article content. The page might be protected or have a different structure." }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    console.log("Detected as listing page, extracting news links...");
    try {
      if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          const parsedJson = JSON.parse(text);
          const candidates = parsedJson.items || parsedJson.page?.items || parsedJson;
          if (Array.isArray(candidates)) {
            for (const it of candidates) {
              const href = it.href || it.url || it.link || "";
              const title = it.titleText || it.title || it.name || "";
              if (!href || !title) continue;
              const full = normalizeUrl(url, href);
              if (!full) continue;
              items.push({ title: String(title).trim(), link: full });
            }
          }
        } catch { }
      }
    } catch { }

    if (items.length === 0) {
      const doc = new DOMParser().parseFromString(text, "text/html");
      if (!doc) return new Response(JSON.stringify({ error: "failed parse html" }), { status: 500 });

      if (parsed.hostname.includes("investing.com")) {
        const anchors = Array.from(doc.querySelectorAll('a[data-test="article-title-link"], a[class*="title"], article a'));
        for (const a of anchors) {
          try {
            const href = (a as Element).getAttribute("href");
            const title = ((a as Element).textContent || "").trim();
            if (!title) continue;
            const full = normalizeUrl(url, href);
            if (!full) continue;
            if (!isNewsCandidate(href, title) && !full.includes("/news")) continue;
            items.push({ title, link: full });
          } catch { }
        }
        if (items.length === 0) {
          const articles = Array.from(doc.querySelectorAll("article"));
          for (const art of articles) {
            try {
              const a = (art as Element).querySelector('a[data-test="article-title-link"]') || (art as Element).querySelector("a");
              if (!a) continue;
              const href = a.getAttribute("href");
              const title = (a.textContent || "").trim();
              const full = normalizeUrl(url, href);
              if (title && full) items.push({ title, link: full });
            } catch { }
          }
        }
      }

      if (parsed.hostname.includes("dailyforex.com")) {
        const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const txt = (s as Element).textContent || "";
            if (!txt) continue;
            const parsedJson = JSON.parse(txt);
            const arr = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
            for (const obj of arr) {
              if (!obj) continue;
              if (obj.itemListElement && Array.isArray(obj.itemListElement)) {
                for (const el of obj.itemListElement) {
                  const link = el.url || el["@id"] || (el.item && el.item.url) || "";
                  const title = el.name || (el.item && el.item.name) || "";
                  const full = normalizeUrl(url, link);
                  if (full && title) items.push({ title: String(title).trim(), link: full });
                }
              }
              if (obj["@type"] === "NewsArticle" || obj["@type"] === "Article") {
                const link = obj.url || obj.mainEntityOfPage || "";
                const title = obj.headline || obj.name || "";
                const full = normalizeUrl(url, link);
                if (full && title) items.push({ title: String(title).trim(), link: full, summary: obj.description || "" });
              }
            }
          } catch { }
        }
        if (items.length === 0) {
          const anchors = Array.from(doc.querySelectorAll("a"));
          for (const a of anchors) {
            try {
              const href = (a as Element).getAttribute("href");
              const title = ((a as Element).textContent || "").trim();
              if (!title) continue;
              if (!isNewsCandidate(href, title)) continue;
              const full = normalizeUrl(url, href);
              if (!full) continue;
              items.push({ title, link: full });
            } catch { }
          }
        }
      }

      if (items.length === 0) {
        const anchors = Array.from(doc.querySelectorAll("a"));
        for (const a of anchors) {
          try {
            const href = (a as Element).getAttribute("href");
            const title = ((a as Element).textContent || "").trim();
            if (!title) continue;
            if (!isNewsCandidate(href, title)) continue;
            const full = normalizeUrl(url, href);
            if (!full) continue;
            items.push({ title, link: full });
          } catch { }
        }
      }
    }

    // Deduplicate results
    const map = new Map<string, { title: string; link: string; summary?: string; content?: string; author?: string; date?: string }>();
    for (const it of items) {
      if (!it.link) continue;
      if (!map.has(it.link)) map.set(it.link, { title: it.title, link: it.link, summary: it.summary });
    }
    const unique = Array.from(map.values()).slice(0, 1000);

    return new Response(
      JSON.stringify({
        url,
        domain: parsed.hostname,
        count: unique.length,
        items: unique,
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('Scrape error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});