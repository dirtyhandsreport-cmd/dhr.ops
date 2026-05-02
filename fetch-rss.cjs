// Node 22+ has built-in fetch — no dependencies needed
const fs   = require("fs");
const path = require("path");

const FEEDS = [
  // ── OILFIELD / ENERGY TRADE ──────────────────────────────────────────────
  { url:"https://oilprice.com/rss/main",                              source:"OilPrice.com",        category:"GENERAL"      },
  { url:"https://www.rigzone.com/news/rss/rigzone_latest.aspx",       source:"Rigzone",             category:"GENERAL"      },
  { url:"https://www.hartenergy.com/rss/oil-gas-news",                source:"Hart Energy",         category:"GENERAL"      },
  { url:"https://www.worldoil.com/rss",                               source:"World Oil",           category:"GENERAL"      },
  { url:"https://www.drillingcontractor.org/feed",                    source:"Drilling Contractor", category:"GENERAL"      },
  { url:"https://www.ogj.com/rss/home.rss",                          source:"Oil & Gas Journal",   category:"GENERAL"      },
  { url:"https://www.upstreamonline.com/rss",                         source:"Upstream Online",     category:"GENERAL"      },
  { url:"https://www.spglobal.com/commodityinsights/en/rss",          source:"S&P Global",          category:"PRICES"       },
  { url:"https://energynow.com/feed/",                                source:"Energy Now",          category:"GENERAL"      },
  { url:"https://www.naturalgasintel.com/feed/",                      source:"Natural Gas Intel",   category:"NAT_GAS"      },

  // ── GOVERNMENT / DATA ────────────────────────────────────────────────────
  { url:"https://www.eia.gov/rss/todayinenergy.xml",                  source:"EIA",                 category:"PRICES"       },
  { url:"https://www.eia.gov/rss/whatsnew.xml",                       source:"EIA Updates",         category:"PRICES"       },
  { url:"https://www.iea.org/feed/news",                              source:"IEA",                 category:"GENERAL"      },
  { url:"https://www.bsee.gov/newsroom/rss.xml",                      source:"BSEE",                category:"SAFETY"       },
  { url:"https://www.doi.gov/rss.xml",                                source:"Dept of Interior",    category:"POLICY"       },
  { url:"https://www.blm.gov/rss.xml",                                source:"BLM",                 category:"POLICY"       },

  // ── SAFETY ───────────────────────────────────────────────────────────────
  { url:"https://www.csb.gov/news/rss/",                              source:"CSB",                 category:"SAFETY"       },
  { url:"https://www.osha.gov/rss/news.xml",                          source:"OSHA",                category:"SAFETY"       },
  { url:"https://www.phmsa.dot.gov/rss.xml",                          source:"PHMSA",               category:"SAFETY"       },

  // ── NORTH DAKOTA / BAKKEN LOCAL ──────────────────────────────────────────
  { url:"https://kfyrtv.com/feed/",                                   source:"KFYR TV",             category:"LOCAL_ND"     },
  { url:"https://www.kxnet.com/feed/",                                source:"KX News",             category:"LOCAL_ND"     },
  { url:"https://bismarcktribune.com/search/?f=rss&t=article&c=news/state-and-regional/energy&l=50", source:"Bismarck Tribune", category:"LOCAL_ND" },
  { url:"https://www.willistonherald.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc", source:"Williston Herald", category:"LOCAL_ND" },
  { url:"https://www.minotdailynews.com/feed/",                       source:"Minot Daily News",    category:"LOCAL_ND"     },
  { url:"https://www.thedickinsonpress.com/feed/",                    source:"Dickinson Press",     category:"LOCAL_ND"     },
  { url:"https://ndmonitor.com/feed/",                                source:"ND Monitor",          category:"LOCAL_ND"     },

  // ── GEOPOLITICAL / GLOBAL OIL ────────────────────────────────────────────
  { url:"https://feeds.reuters.com/reuters/businessNews",             source:"Reuters",             category:"GENERAL"      },
  { url:"https://feeds.reuters.com/reuters/worldNews",                source:"Reuters World",       category:"GEOPOLITICAL" },
  { url:"https://feeds.bloomberg.com/energy/news.rss",                source:"Bloomberg Energy",    category:"PRICES"       },
  { url:"https://apnews.com/rss/energy",                              source:"AP News",             category:"GENERAL"      },
  { url:"https://www.arabnews.com/category/tags/oil/feed",            source:"Arab News",           category:"GEOPOLITICAL" },
  { url:"https://www.middleeasteye.net/categories/economy/feed",      source:"Middle East Eye",     category:"GEOPOLITICAL" },

  // ── PIPELINE / MIDSTREAM ─────────────────────────────────────────────────
  { url:"https://www.pipelineandgasjournal.com/rss.xml",              source:"Pipeline & Gas Journal", category:"PIPELINES" },
  { url:"https://www.gasprocessingnews.com/feed/",                    source:"Gas Processing News", category:"NAT_GAS"     },

  // ── FINANCIAL / MARKET ───────────────────────────────────────────────────
  { url:"https://seekingalpha.com/tag/oil/feed.xml",                  source:"Seeking Alpha",       category:"PRICES"       },
  { url:"https://finance.yahoo.com/rss/industry?industry=energy",     source:"Yahoo Finance Energy",category:"PRICES"       },

  // ── JOBS ─────────────────────────────────────────────────────────────────
  { url:"https://www.rigzone.com/jobs/rss/",                          source:"Rigzone Jobs",        category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=oilfield+jobs&l=North+Dakota",  source:"Indeed ND Oilfield",  category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=wireline+operator",             source:"Indeed Wireline",     category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=frac+hand&l=Bakken",           source:"Indeed Frac Bakken",  category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=rig+hand+roughneck",            source:"Indeed Rig Hand",     category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=oil+gas+jobs&l=Dickinson+ND",  source:"Indeed Dickinson",    category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=oil+gas+jobs&l=Williston+ND",  source:"Indeed Williston",    category:"JOBS"         },
  { url:"https://www.indeed.com/rss?q=drilling+hand+oilfield",        source:"Indeed Drilling",     category:"JOBS"         },
  { url:"https://careers.conocophillips.com/rss/",                    source:"ConocoPhillips Jobs", category:"JOBS"         },
  { url:"https://jobs.halliburton.com/rss/",                          source:"Halliburton Jobs",    category:"JOBS"         },
  { url:"https://careers.slb.com/rss/",                              source:"SLB Jobs",            category:"JOBS"         },
  { url:"https://www.patenergy.com/careers/rss/",                     source:"Patterson-UTI Jobs",  category:"JOBS"         },
  { url:"https://www.helmerichpayne.com/careers/rss/",                source:"H&P Jobs",            category:"JOBS"         },
  { url:"https://www.linkedin.com/jobs/search/?keywords=oilfield&location=North+Dakota&f_TPR=r86400&format=json", source:"LinkedIn ND Oilfield", category:"JOBS" },
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
  // TIER 5 — post immediately, 500K+ range
  if (["mass casualty","multiple fatalities","multiple workers killed","multiple killed","major blowout","uncontrolled blowout","well blowout",
       "federal drilling ban","national drilling moratorium","opec supply cut","opec production cut","output cut agreement",
       "hormuz closure","strait of hormuz","hormuz blocked","oil field attack","oil infrastructure attack",
       "refinery explosion","catastrophic explosion","catastrophic fire","national energy emergency","energy emergency declaration",
       "oil price crash","crude price collapse","price war","demand collapse","drilling moratorium"].some(w=>t.includes(w))) return 5;
  // TIER 4 — high DHR potential, 100-300K range
  if (["executive order","presidential permit","presidential action","trump signs","biden reverses","administration blocks",
       "federal energy policy","permit freeze","drilling ban","drilling ban lifted","federal moratorium","permit denied",
       "mass layoff","major layoff","thousand workers","workforce reduction","company exits","mass firing","pink slip",
       "worker killed","fatality","fatal accident","worker dead","fatal incident","fatalities",
       "pipeline rupture","major spill","pipeline explosion","significant leak","pipeline fire",
       "record high","record low","all-time high","all-time low","historic price","52-week low","52-week high",
       "billion dollar","major acquisition","major merger","company acquired","buyout","bankruptcy","chapter 11",
       "iran sanction","venezuela sanction","russia oil","opec meeting","opec+ decision","opec cut",
       "blowout","explosion","fire","rig fire","well fire","h2s","hydrogen sulfide","well control","bop",
       "drug","alcohol","addiction","mental health","suicide","ptsd","crew shortage"].some(w=>t.includes(w))) return 4;
  // TIER 3 — solid DHR content, 50-100K range
  if (["bakken","williston","north dakota oil","dickinson","watford city","three forks","fort berthold",
       "rig count","baker hughes","active rigs","rigs operating","rig activity",
       "permian","eagle ford","dj basin","niobrara","anadarko",
       "hiring surge","major hiring","expanding workforce","oilfield hiring",
       "pipeline approved","pipeline canceled","pipeline project","pipeline permit",
       "osha","csb investigation","safety violation","well control incident",
       "earnings beat","earnings miss","production record","output record",
       "layoff","layoffs","job cuts","workforce cut","downsizing",
       "spill","leak","evacuation","emergency","injured workers","accident","incident",
       "overturned","rollover","struck by","caught in","crushed","pinned","fall from height",
       "regulation","energy policy","permit","moratorium","sanction","ban","freeze"].some(w=>t.includes(w))) return 3;
  // TIER 2 — background monitoring
  if (["wti","brent","crude","oil price","gas price","per barrel","price forecast",
       "completion","fracking","frac","well service","oilfield service",
       "hiring","jobs","oilfield","pipeline","drilling","production","earnings",
       "opec","natural gas","lng","midstream","refinery","wireline","cementing",
       "coiled tubing","oilfield worker","hand","crew","paycheck","wages","safety",
       "contractor","workforce","operator","rig"].some(w=>t.includes(w))) return 2;
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
