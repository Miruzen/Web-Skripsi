// ...existing code...
import { DOMParser } from "https://deno.land/x/deno_dom@0.1.36/deno-dom-wasm.ts";

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
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        // follow redirects by default
      });
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));
    }
  }
  throw lastErr;
}

export default async function (req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json body" }), { status: 400 });
  }

  const url = (body?.url || "").trim();
  if (!url) return new Response(JSON.stringify({ error: "url is required" }), { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response(JSON.stringify({ error: "invalid url" }), { status: 400 });
  }

  const allowed = ["investing.com", "dailyforex.com"];
  if (!allowed.some((d) => parsed.hostname.includes(d))) {
    return new Response(JSON.stringify({ error: "domain not allowed" }), { status: 400 });
  }

  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `fetch failed: ${res.status}` }), { status: 502 });
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const text = await res.text();

    // Try JSON listing first (DailyForex listing endpoints may return JSON)
    const items: Array<{ title: string; link: string; summary?: string }> = [];
    try {
      if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          const parsedJson = JSON.parse(text);
          // common shape used in existing scraper: items array with href/titleText/openDate
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
        } catch {
          // ignore JSON parse errors
        }
      }
    } catch {
      // ignore
    }

    // If JSON didn't yield results, parse HTML
    if (items.length === 0) {
      const doc = new DOMParser().parseFromString(text, "text/html");
      if (!doc) return new Response(JSON.stringify({ error: "failed parse html" }), { status: 500 });

      // 1) investing.com specific selectors
      if (parsed.hostname.includes("investing.com")) {
        // try article anchors
        const anchors = Array.from(doc.querySelectorAll('a[data-test="article-title-link"], a[class*="title"], article a'));
        for (const a of anchors) {
          try {
            const href = (a as HTMLAnchorElement).getAttribute("href");
            const title = ((a as HTMLAnchorElement).textContent || "").trim();
            if (!title) continue;
            const full = normalizeUrl(url, href);
            if (!full) continue;
            if (!isNewsCandidate(href, title) && !full.includes("/news")) continue;
            items.push({ title, link: full });
          } catch {
            // ignore
          }
        }
        // fallback: article blocks
        if (items.length === 0) {
          const articles = Array.from(doc.querySelectorAll("article"));
          for (const art of articles) {
            try {
              const a = art.querySelector('a[data-test="article-title-link"]') || art.querySelector("a");
              if (!a) continue;
              const href = a.getAttribute("href");
              const title = (a.textContent || "").trim();
              const full = normalizeUrl(url, href);
              if (title && full) items.push({ title, link: full });
            } catch {
              // ignore
            }
          }
        }
      }

      // 2) dailyforex: check JSON-LD or links on page
      if (parsed.hostname.includes("dailyforex.com")) {
        // try JSON-LD scripts
        const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const txt = s.textContent || "";
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
              // NewsArticle single object fallback
              if (obj["@type"] === "NewsArticle" || obj["@type"] === "Article") {
                const link = obj.url || obj.mainEntityOfPage || "";
                const title = obj.headline || obj.name || "";
                const full = normalizeUrl(url, link);
                if (full && title) items.push({ title: String(title).trim(), link: full, summary: obj.description || "" });
              }
            }
          } catch {
            // ignore
          }
        }

        // fallback to anchors if still empty
        if (items.length === 0) {
          const anchors = Array.from(doc.querySelectorAll("a"));
          for (const a of anchors) {
            try {
              const href = a.getAttribute("href");
              const title = (a.textContent || "").trim();
              if (!title) continue;
              if (!isNewsCandidate(href, title)) continue;
              const full = normalizeUrl(url, href);
              if (!full) continue;
              items.push({ title, link: full });
            } catch {
              // ignore
            }
          }
        }
      }

      // generic fallback for other pages on allowed domains
      if (items.length === 0) {
        const anchors = Array.from(doc.querySelectorAll("a"));
        for (const a of anchors) {
          try {
            const href = a.getAttribute("href");
            const title = (a.textContent || "").trim();
            if (!title) continue;
            if (!isNewsCandidate(href, title)) continue;
            const full = normalizeUrl(url, href);
            if (!full) continue;
            items.push({ title, link: full });
          } catch {
            // ignore
          }
        }
      }
    }

    // dedupe
    const map = new Map<string, { title: string; link: string; summary?: string }>();
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
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
// ...existing code...