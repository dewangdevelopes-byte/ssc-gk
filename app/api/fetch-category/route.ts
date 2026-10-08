import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { CATEGORY_MAP, ALL_CATEGORIES, classifyArticleCategory } from '@/lib/categories';

interface CustomFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  summary?: string;
}

const parser = new Parser<Record<string, unknown>, CustomFeedItem>({
  customFields: {
    item: ['summary', 'contentSnippet'],
  },
});

// Category to dedicated Multi-Source Topic Feeds & Widened Search Queries
const CATEGORY_FEED_CONFIG: Record<
  string,
  {
    topicFeeds?: Array<{ source: string; url: string }>;
    searchQueries: string[];
  }
> = {
  'national-schemes': {
    topicFeeds: [
      { source: 'Google News - National', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - National', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
      { source: 'LiveMint - Politics & Policy', url: 'https://www.livemint.com/rss/politics' },
      { source: 'Hindustan Times - India', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml' },
    ],
    searchQueries: [
      'India government scheme yojana cabinet approval bill parliament national policy',
      'PIB India welfare initiative portal ministry launched Pradhan Mantri',
    ],
  },
  'international-affairs': {
    topicFeeds: [
      { source: 'Google News - World', url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - International', url: 'https://www.thehindu.com/news/international/feeder/default.rss' },
      { source: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { source: 'Al Jazeera - World', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { source: 'Hindustan Times - World', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml' },
    ],
    searchQueries: [
      'international summit bilateral treaty G20 BRICS SCO UN declaration foreign diplomacy',
      'India bilateral agreement MoU foreign minister global geopolitics treaty',
    ],
  },
  'economy-banking': {
    topicFeeds: [
      { source: 'Google News - Business', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - Business & Economy', url: 'https://www.thehindu.com/business/Economy/feeder/default.rss' },
      { source: 'LiveMint - Economy', url: 'https://www.livemint.com/rss/economy' },
      { source: 'Business Standard - Economy', url: 'https://www.business-standard.com/rss/economy-policy-102.rss' },
    ],
    searchQueries: [
      'India economy RBI monetary policy repo rate inflation GDP budget fiscal deficit SEBI',
      'banking reform GST revenue direct tax financial markets Sensex Nifty forex',
    ],
  },
  'state-news': {
    topicFeeds: [
      { source: 'Google News - National Regional', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - States', url: 'https://www.thehindu.com/news/states/feeder/default.rss' },
    ],
    searchQueries: [
      'state government scheme chief minister governor regional initiative panchayat welfare',
      'state festival cultural heritage GI tag state assembly governance Maharashtra Karnataka UP TN',
    ],
  },
  'awards-honours': {
    topicFeeds: [
      { source: 'Google News - Entertainment & Culture', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - Entertainment & Culture', url: 'https://www.thehindu.com/entertainment/feeder/default.rss' },
    ],
    searchQueries: [
      'Padma Awards Nobel Prize Bharat Ratna Khel Ratna Arjuna Award Oscar Saraswati Samman',
      'prestigious accolade recipient award winner felicitated Dadasaheb Phalke medal Sahitya Akademi',
    ],
  },
  'appointments': {
    topicFeeds: [
      { source: 'Google News - National Appointments', url: 'https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    searchQueries: [
      '"appointed as" OR "appointed new" OR "takes charge as" OR "sworn in as" Chief Justice Chairman DG CEO',
      'Election Commissioner CAG Attorney General Governor elevation designated leadership change',
    ],
  },
  'obituaries': {
    searchQueries: [
      '"passes away" OR "passed away" OR "demise of" obituary former minister veteran artist',
      'eminent personality passed away tribute condoled condolences',
    ],
  },
  'books-authors': {
    topicFeeds: [
      { source: 'The Hindu - Books', url: 'https://www.thehindu.com/books/feeder/default.rss' },
    ],
    searchQueries: [
      'book launch author autobiography memoir novel literary prize written by penned by',
      'new book titled released by biography Sahitya Akademi Booker Prize winner',
    ],
  },
  'sports': {
    topicFeeds: [
      { source: 'Google News - Sports', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - Sport', url: 'https://www.thehindu.com/sport/feeder/default.rss' },
      { source: 'Hindustan Times - Sports', url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml' },
      { source: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' },
    ],
    searchQueries: [
      'sports tournament championship gold medal match cricket hockey Asian Games Olympics chess grandmaster',
      'badminton tennis world cup winner trophy athlete achievement record venue',
    ],
  },
  'science-defense': {
    topicFeeds: [
      { source: 'Google News - Science', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'Google News - Technology', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en' },
      { source: 'The Hindu - Sci-Tech', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss' },
      { source: 'Space.com', url: 'https://www.space.com/feeds/all' },
    ],
    searchQueries: [
      'ISRO space mission DRDO missile test satellite launch military exercise Indian Navy Army Air Force',
      'defense indigenization AI artificial intelligence quantum biotech technology innovation',
    ],
  },
  'indices-rankings': {
    searchQueries: [
      'India index ranking global report survey benchmark NITI Aayog rank HDI position',
      'Global Innovation Index Press Freedom Hunger Index Ease of Doing Business score',
    ],
  },
  'important-days': {
    searchQueries: [
      '"observed on" OR "celebrated on" OR "International Day" OR "National Day" anniversary theme declared',
      'World Day 2026 theme celebrated across India UN observance national awareness day',
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, startDate, endDate } = body;

    const feedsToFetch: Array<{ source: string; url: string; targetCat: string }> = [];

    // Target specific category or all categories
    const targetCategories = category
      ? [category]
      : ALL_CATEGORIES.map((c) => c.slug);

    for (const catSlug of targetCategories) {
      const config = CATEGORY_FEED_CONFIG[catSlug] || {
        searchQueries: [`${catSlug} India current affairs`],
      };
      const catMeta = CATEGORY_MAP[catSlug];

      // 1. Add direct topic / RSS feeds if defined
      if (config.topicFeeds) {
        config.topicFeeds.forEach((tf) => {
          feedsToFetch.push({
            source: tf.source,
            url: tf.url,
            targetCat: catSlug,
          });
        });
      }

      // 2. Add multiple targeted keyword search queries to Google News
      config.searchQueries.forEach((q) => {
        let queryStr = q;
        if (startDate) {
          queryStr += ` after:${startDate}`;
        }
        if (endDate) {
          queryStr += ` before:${endDate}`;
        }

        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
          queryStr
        )}&hl=en-IN&gl=IN&ceid=IN:en`;

        feedsToFetch.push({
          source: `News Intelligence - ${catMeta?.shortTitle || catSlug}`,
          url: searchUrl,
          targetCat: catSlug,
        });
      });
    }

    const articlesToUpsert: Array<{
      title: string;
      url: string;
      source: string;
      category?: string;
      published_at: string;
    }> = [];

    // Fetch and process feeds with concurrency limit
    await Promise.all(
      feedsToFetch.map(async (feedConfig) => {
        try {
          const response = await fetch(feedConfig.url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'application/rss+xml, application/xml, text/xml, */*',
            },
            next: { revalidate: 0 },
          });

          if (!response.ok) return;

          let xml = await response.text();
          xml = xml.replace(
            /&(?!(amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi,
            '&amp;'
          );

          const feed = await parser.parseString(xml);

          feed.items.forEach((item) => {
            if (item.title && item.link) {
              const dateVal =
                item.isoDate || item.pubDate || new Date().toISOString();
              const parsedDate = new Date(dateVal);

              // Date range filtering
              let inRange = true;
              if (startDate) {
                const start = new Date(`${startDate}T00:00:00.000Z`);
                if (parsedDate < start) inRange = false;
              }
              if (endDate) {
                const end = new Date(`${endDate}T23:59:59.999Z`);
                if (parsedDate > end) inRange = false;
              }

              if (inRange) {
                const autoCategory =
                  feedConfig.targetCat ||
                  classifyArticleCategory(item.title);

                articlesToUpsert.push({
                  title: item.title.trim(),
                  url: item.link.trim(),
                  source: feedConfig.source,
                  category: autoCategory,
                  published_at: parsedDate.toISOString(),
                });
              }
            }
          });
        } catch (err) {
          // Keep resilient across varying feed endpoints
        }
      })
    );

    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(articlesToUpsert.map((a) => [a.url, a])).values()
    );

    // Calculate how many of these articles are truly new in the database
    const existingUrlSet = new Set<string>();
    const CHECK_CHUNK_SIZE = 100;
    for (let i = 0; i < uniqueArticles.length; i += CHECK_CHUNK_SIZE) {
      const urlChunk = uniqueArticles.slice(i, i + CHECK_CHUNK_SIZE).map((a) => a.url);
      const { data: existingRows } = await supabaseAdmin
        .from('news_articles')
        .select('url')
        .in('url', urlChunk);

      if (existingRows) {
        existingRows.forEach((r) => existingUrlSet.add(r.url));
      }
    }

    const trulyNewCount = uniqueArticles.filter((a) => !existingUrlSet.has(a.url)).length;

    let insertedCount = 0;
    if (uniqueArticles.length > 0) {
      // Chunk upsert
      const CHUNK_SIZE = 50;
      for (let i = 0; i < uniqueArticles.length; i += CHUNK_SIZE) {
        const chunk = uniqueArticles.slice(i, i + CHUNK_SIZE);
        const { error } = await supabaseAdmin
          .from('news_articles')
          .upsert(chunk, {
            onConflict: 'url',
            ignoreDuplicates: false,
          });

        if (error && error.message.includes('category')) {
          const fallbackChunk = chunk.map(
            ({ title, url, source, published_at }) => ({
              title,
              url,
              source,
              published_at,
            })
          );
          await supabaseAdmin.from('news_articles').upsert(fallbackChunk, {
            onConflict: 'url',
            ignoreDuplicates: false,
          });
        }
        insertedCount += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      category: category || 'all',
      fetchedAndSaved: trulyNewCount,
      totalFeedsPolled: feedsToFetch.length,
      totalFound: uniqueArticles.length,
      alreadyExisted: existingUrlSet.size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
