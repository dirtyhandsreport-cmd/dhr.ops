// Node 22+ has built-in fetch — no dependencies needed
const fs   = require("fs");
const path = require("path");

const FEEDS = [
  { url:"https://feeds.reuters.com/reuters/businessNews",       source:"Reuters",           category:"GENERAL" },
  { url:"https://oilprice.com/rss/main",                        source:"OilPrice.com",      category:"GENERAL" },
  { url:"https://www.rigzone.com/news/rss/rigzone_latest.aspx", source:"Rigzone",           category:"GENERAL" },
  { url:"https://www.eia.gov/rss/whatsnew.xml",                 source:"EIA",               category:"PRICES"  },
  { url:"https://www.rigzone.com/jobs/rss/",                    source:"Rigzone Jobs",      category:"JOBS"    },
  { url:"https://www.csb.gov/news/rss/",                        source:"CSB",               category:"SAFETY"  },
];

function clean(s) {
  if (!s) return "";
  return String(s)
    .replace(/<!\[CDATA\[|\]\]>/g,"")
    .replace(/<[^>]*>/g,"")
    .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ")
    .trim();
}

function toISO(s) {
  try { const d = new Date(s); if (!isNaN(d)) return d.toISOString(); } catch(e) {}
  return new Date().toISOString();
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)   return Math.floor(diff/60)  + "m ago";
  if (diff < 86400)  return Math.floor(diff/3600) + "h ago";
  if (diff < 172800) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}

function scoreDHR(title, summary) {
  const t = (title + " " + summary).toLowerCase();
  if (["fatal","death","killed","explosion","fire","layoff","layoffs","strike","shutdown","spill","blowout","record","historic","surge","collapse","crash","billion","merger","acquired","ban"].some(w=>t.includes(w))) return 3;
  if (["hiring","jobs","rig count","price","safety","regulation","drilling","production","earnings","wireline","completions","workforce","opec","pipeline","permit"].some(w=>t.includes(w))) return 2;
  return 1;
}

function parseRSS(xml, feed) {
  const items = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const get = tag => {
      const r = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"));
      return r ? clean(r[1]) : "";
    };
    const title = get("title");
    if (!title) continue;
    const iso     = toISO(get("pubDate") || get("date") || get("published"));
    const summary = get("description") || get("summary") || "";
    items.push({
      title:     title.slice(0,160),
      source:    feed.source,
      category:  feed.category,
      url:       get("link") || get("guid") || "#",
      date:      iso,
      dateLabel: timeAgo(iso),
      summary:   summary.slice(0,200),
      sentiment: "neutral",
      dhrScore:  scoreDHR(title, summary),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "DHR-RSS-Bot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feed);
  } catch(e) {
    console.warn(`[SKIP] ${feed.source}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log("Fetching RSS feeds...");
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const seen = new Set();
  const all  = [];
  for (const list of results) {
    for (const item of list) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,60);
      if (!seen.has(key)) { seen.add(key); all.push(item); }
    }
  }
  all.sort((a,b) => new Date(b.date) - new Date(a.date));

  const outDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });

  const output = { ok:true, count:all.length, updated_at:new Date().toISOString(), items:all };
  fs.writeFileSync(path.join(outDir,"feed.json"), JSON.stringify(output, null, 2));
  console.log(`Done — ${all.length} items written to public/feed.json`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
function scoreDHR(title, summary) {
  const t = (title + " " + summary).toLowerCase();
  if (["fatal","death","killed","explosion","fire","layoff","layoffs","strike","shutdown","spill","blowout","record","historic","surge","collapse","crash","billion","merger","acquired","ban"].some(w=>t.includes(w))) return 3;
  if (["hiring","jobs","rig count","price","safety","regulation","drilling","production","earnings","wireline","completions","workforce","opec","pipeline","permit"].some(w=>t.includes(w))) return 2;
  return 1;
}

function parseRSS(xml, feed) {
  const items = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    const get = tag => {
      const r = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"));
      return r ? clean(r[1]) : "";
    };
    const title = get("title");
    if (!title) continue;
    const iso = toISO(get("pubDate") || get("date") || get("published"));
    const summary = get("description") || get("summary") || "";
    items.push({
      title:     title.slice(0,160),
      source:    feed.source,
      category:  feed.category,
      url:       get("link") || get("guid") || "#",
      date:      iso,
      dateLabel: timeAgo(iso),
      summary:   summary.slice(0,200),
      sentiment: "neutral",
      dhrScore:  scoreDHR(title, summary),
    });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "DHR-RSS-Bot/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feed);
  } catch(e) {
    console.warn(`[SKIP] ${feed.source}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log("Fetching RSS feeds...");
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const seen = new Set();
  const all = [];
  for (const list of results) {
    for (const item of list) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,60);
      if (!seen.has(key)) { seen.add(key); all.push(item); }
    }
  }
  all.sort((a,b) => new Date(b.date) - new Date(a.date));

  const outDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });

  const output = { ok:true, count:all.length, updated_at:new Date().toISOString(), items:all };
  fs.writeFileSync(path.join(outDir,"feed.json"), JSON.stringify(output, null, 2));
  console.log(`Done — ${all.length} items written to public/feed.json`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600)   return Math.floor(diff / 60) + "m ago";
  if (diff < 86400)  return Math.floor(diff / 3600) + "h ago";
  if (diff < 172800) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

function scoreDHR(title, summary) {
  const t = (title + " " + summary).toLowerCase();
  const high = ["fatal","death","killed","explosion","fire","layoff","layoffs","strike","shutdown","spill","blowout","record","historic","surge","collapse","crash","billion","merger","acquired","ban"];
  const med  = ["hiring","jobs","rig count","price","safety","regulation","drilling","production","earnings","wireline","completions","workforce","opec","pipeline","permit"];
  if (high.some(w => t.includes(w))) return 3;
  if (med.some(w => t.includes(w)))  return 2;
  return 1;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "DHR-RSS-Bot/1.0 (dirtyhandsoil.com)" },
      timeout: 8000,
    });
    if (!res.ok) return [];
    const xml  = await res.text();
    const data = parser.parse(xml);
    const items = data?.rss?.channel?.item || data?.feed?.entry || [];
    const arr   = Array.isArray(items) ? items : [items];

    return arr.map(item => {
      const title   = clean(item.title);
      const summary = clean(item.description || item.summary || item["content:encoded"] || "");
      const iso     = toISO(item.pubDate || item["dc:date"] || item.published || item.updated || "");
      return {
        title:     title.slice(0, 160),
        source:    feed.source,
        category:  feed.category,
        url:       clean(item.link || item.guid || "#"),
        date:      iso,
        dateLabel: timeAgo(iso),
        summary:   summary.slice(0, 200),
        sentiment: "neutral",
        dhrScore:  scoreDHR(title, summary),
      };
    }).filter(i => i.title);

  } catch(e) {
    console.warn(`[SKIP] ${feed.source}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log("Fetching RSS feeds...");
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const seen = new Set();
  const all  = [];
  for (const list of results) {
    for (const item of list) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,60);
      if (!seen.has(key)) { seen.add(key); all.push(item); }
    }
  }

  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    ok:         true,
    count:      all.length,
    updated_at: new Date().toISOString(),
    items:      all,
  };

  // Write to public/feed.json so it's served as a static file
  const outDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
  fs.writeFileSync(path.join(outDir, "feed.json"), JSON.stringify(output, null, 2));
  console.log(`Done — ${all.length} items written to public/feed.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
