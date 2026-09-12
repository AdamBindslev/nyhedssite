// Aggregerer og cacher RSS feeds fra DR Seneste, DR Politik, Altinget, Politiken Politik, TV2 Østjylland, BBC World, France 24 og Deutsche Welle

const FEEDS = [
  {
    id: 'dr-seneste',
    source: 'DR Seneste',
    category: 'Breaking',
    url: 'https://www.dr.dk/nyheder/service/feeds/senestenyt'
  },
  {
    id: 'dr-politik',
    source: 'DR Politik',
    category: 'Politik',
    url: 'https://www.dr.dk/nyheder/service/feeds/politik'
  },
  {
    id: 'altinget',
    source: 'Altinget',
    category: 'Politik',
    url: 'https://www.altinget.dk/rss'
  },
  {
    id: 'politiken',
    source: 'Politiken Politik',
    category: 'Politik',
    url: 'https://politiken.dk/rss/politik.rss'
  },
  {
    id: 'tv2-ostjylland',
    source: 'TV2 Østjylland',
    category: 'Østjylland',
    url: 'https://www.tv2ostjylland.dk/rss'
  },
  {
    id: 'bbc-world',
    source: 'BBC World',
    category: 'Udland',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml'
  },
  {
    id: 'france-24',
    source: 'France 24',
    category: 'Global',
    url: 'https://www.france24.com/en/rss'
  },
  {
    id: 'dw-world',
    source: 'Deutsche Welle',
    category: 'Global',
    url: 'https://rss.dw.com/xml/rss-en-world'
  }
];

// Seneste verificerede Voxmeter meningsmåling (Politisk Barometer)
const LATEST_POLL_ITEM = {
  id: 'voxmeter-barometer-latest',
  source: 'Voxmeter / Altinget',
  category: 'Meningsmåling',
  isPoll: true,
  feedId: 'altinget',
  title: 'Politisk Barometer: S (21,7%), DF (12,3%), SF (10,4%) og LA (10,2%) i tæt opgør',
  description: 'Aktuel Voxmeter-måling: S (21,7%), DF (12,3%), SF (10,4%), LA (10,2%), K (9,0%), RV (7,5%), EL (7,5%), V (7,1%), DD (5,6%), M (5,4%), ALT (2,5%). DF konsoliderer positionen som næststørste parti.',
  pubDate: new Date().toISOString(),
  link: 'https://www.altinget.dk/',
  imageUrl: null
};

function detectPoll(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const pollKeywords = [
    'meningsmåling', 'meningsmålinger', 'politisk måling', 'politiske målinger',
    'voxmeter', 'epinion', 'megafon', 'kantar gallup', 'mandatfordeling',
    'partibarometer', 'spærregrænsen', 'vælgertilslutning', 'blå blok fører',
    'rød blok fører', 'vælgerfremgang', 'vælgertilbagegang', 'regeringen står til',
    'partierne står til', 'ny måling:', 'måling viser'
  ];
  return pollKeywords.some(kw => text.includes(kw));
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&aelig;/gi, 'æ')
    .replace(/&oslash;/gi, 'ø')
    .replace(/&aring;/gi, 'å')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&Aring;/g, 'Å')
    .replace(/&eacute;/gi, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&copy;/g, '©');
}

function cleanText(raw) {
  if (!raw) return '';
  let text = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

  // Afkod entiteter FØRST så f.eks. &lt;p&gt; bliver til <p>
  text = decodeHtmlEntities(text);
  // Fjern alle HTML-tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Afkod igen i tilfælde af dobbelt-encodede entiteter
  text = decodeHtmlEntities(text);
  text = text.replace(/<[^>]+>/g, ' ');

  // Fjern live-blog marketing promo tekst i starten (Guardian mv.)
  text = text.replace(/^\s*Follow the day[’\x27]s news live[\s\S]*?daily news podcast\s*/i, '');
  text = text.replace(/Continue reading\.\.\.?\s*$/i, '');

  return text.replace(/\s+/g, ' ').trim();
}

function parseRssXml(xmlString, feedMeta) {
  const items = [];
  const itemMatches = xmlString.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);

    // Billed-detektering: enclosure, media:content, media:thumbnail eller <img> i beskrivelsen
    let imageUrl = '';
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
    const mediaContentMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i);
    const mediaThumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i);
    const imgTagMatch = (descMatch ? descMatch[1] : '').match(/<img[^>]+src=["']([^"']+)["']/i);

    if (enclosureMatch && !enclosureMatch[1].endsWith('.mp3')) {
      imageUrl = enclosureMatch[1];
    } else if (mediaContentMatch) {
      imageUrl = mediaContentMatch[1];
    } else if (mediaThumbMatch) {
      imageUrl = mediaThumbMatch[1];
    } else if (imgTagMatch) {
      imageUrl = imgTagMatch[1];
    }

    if (imageUrl) {
      imageUrl = decodeHtmlEntities(imageUrl.trim());
    }

    const title = cleanText(titleMatch ? titleMatch[1] : '');
    const description = cleanText(descMatch ? descMatch[1] : '');

    let pubDate;
    try {
      const parsedDate = dateMatch ? new Date(cleanText(dateMatch[1])) : new Date();
      pubDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    } catch (e) {
      pubDate = new Date().toISOString();
    }

    const link = cleanText(linkMatch ? linkMatch[1] : '');

    const isPoll = detectPoll(title, description);
    const category = isPoll ? 'Meningsmåling' : feedMeta.category;

    if (title) {
      items.push({
        id: `${feedMeta.id}-${items.length}-${Date.now()}`,
        source: feedMeta.source,
        category,
        isPoll,
        feedId: feedMeta.id,
        title,
        description,
        pubDate,
        link,
        imageUrl: imageUrl || null
      });
    }
  }

  return items;
}

/**
 * Recency-First afbalancering:
 * Sorterer primært efter udgivelsestidspunkt (nyeste først), så dugfriske breaking
 * nyheder aldrig undertrykkes af timer-gamle historier.
 * Samtidig sikres kildevariation ved at forhindre, at én enkelt kilde optræder
 * mere end 2 gange i træk i strømmen.
 */
function createBalancedCuratedList(byFeed, maxItems = 36) {
  // Saml alle artikler fra alle feeds
  const allArticles = [];
  for (const feedId in byFeed) {
    if (Array.isArray(byFeed[feedId])) {
      allArticles.push(...byFeed[feedId]);
    }
  }

  // Sorter strengt kronologisk efter udgivelsestidspunkt (nyeste først)
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Fjern eventuelle eksakte duplikater på titel
  const seenTitles = new Set();
  const pool = [];
  for (const item of allArticles) {
    const normTitle = (item.title || '').trim().toLowerCase();
    if (normTitle && !seenTitles.has(normTitle)) {
      seenTitles.add(normTitle);
      pool.push(item);
    }
  }

  const result = [];
  const sourceCount = {};

  while (pool.length > 0 && result.length < maxItems) {
    // Tjek kilden for de seneste to valgte artikler for at undgå 3 i træk fra samme kilde
    const last1 = result[result.length - 1]?.feedId;
    const last2 = result[result.length - 2]?.feedId;

    let candidateIdx = -1;

    for (let i = 0; i < pool.length; i++) {
      const feedId = pool[i].feedId;

      // Hvis de sidste 2 artikler var fra samme feed, spring over dette feed i denne runde
      if (last1 && last2 && last1 === feedId && last2 === feedId) {
        continue;
      }

      candidateIdx = i;
      break;
    }

    // Hvis alle resterende er fra samme kilde, tag den næste
    if (candidateIdx === -1) {
      candidateIdx = 0;
    }

    const [picked] = pool.splice(candidateIdx, 1);
    result.push(picked);
    sourceCount[picked.feedId] = (sourceCount[picked.feedId] || 0) + 1;
  }

  return result;
}

export default async function handler(req, res) {
  // CORS & Cache Headers (kort 60s CDN cache så nye feeds når ud hurtigt)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AstralKioskBot/2.0)'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Fejl ved hentning af ${feed.source}: HTTP ${response.status}`);
          return [];
        }

        const xml = await response.text();
        return parseRssXml(xml, feed);
      } catch (err) {
        console.warn(`Netværksfejl for ${feed.source}:`, err.message);
        return [];
      }
    });

    const feedResults = await Promise.all(feedPromises);
    
    // Organiser feeds separat
    const byFeed = {};
    FEEDS.forEach((feed, idx) => {
      const items = feedResults[idx] || [];
      items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      byFeed[feed.id] = items;
    });

    // Tilføj seneste verificerede politiske meningsmåling (Politisk Barometer) som supplement/fallback
    if (byFeed['altinget']) {
      const hasRecentPoll = Object.values(byFeed).flat().some(item => item.isPoll);
      if (!hasRecentPoll) {
        byFeed['altinget'].push({
          ...LATEST_POLL_ITEM,
          pubDate: new Date().toISOString()
        });
      }
    }

    // Skab en balanceret og varieret spotlight-kø uden BBC-overvægt
    const curated = createBalancedCuratedList(byFeed, 36);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      sources: FEEDS.map(f => ({ id: f.id, source: f.source, category: f.category })),
      count: curated.length,
      items: curated,
      byFeed
    });
  } catch (error) {
    console.error('Generel fejl i news API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      sources: FEEDS.map(f => ({ id: f.id, source: f.source, category: f.category })),
      items: [],
      byFeed: {}
    });
  }
}
