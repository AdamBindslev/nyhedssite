// Vercel Serverless Function: api/news.js
// Aggregerer og cacher RSS feeds fra DR Politik, DR Østjylland og BBC World

const FEEDS = [
  {
    id: 'dr-politik',
    source: 'DR Politik',
    category: 'Politik',
    url: 'https://www.dr.dk/nyheder/service/feeds/politik'
  },
  {
    id: 'dr-ostjylland',
    source: 'DR Østjylland',
    category: 'Regionalt',
    url: 'https://www.dr.dk/nyheder/service/feeds/regionale/oestjylland'
  },
  {
    id: 'bbc-world',
    source: 'BBC World',
    category: 'Udland',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml'
  }
];

function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssXml(xmlString, feedMeta) {
  const items = [];
  const itemMatches = xmlString.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i) || itemXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
    const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);

    const title = cleanText(titleMatch ? titleMatch[1] : '');
    const description = cleanText(descMatch ? descMatch[1] : '');
    const pubDate = dateMatch ? new Date(cleanText(dateMatch[1])).toISOString() : new Date().toISOString();
    const link = cleanText(linkMatch ? linkMatch[1] : '');

    if (title) {
      items.push({
        id: `${feedMeta.id}-${items.length}-${Date.now()}`,
        source: feedMeta.source,
        category: feedMeta.category,
        feedId: feedMeta.id,
        title,
        description,
        pubDate,
        link
      });
    }
  }

  return items;
}

export default async function handler(req, res) {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const feedPromises = FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CelestialKioskBot/1.0)'
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
    const allItems = feedResults.flat();

    // Sorter efter udgivelsesdato (nyeste først)
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Vælg de seneste 30 nyheder samlet
    const curated = allItems.slice(0, 30);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      count: curated.length,
      items: curated
    });
  } catch (error) {
    console.error('Generel fejl i news API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      items: []
    });
  }
}
