import Link from 'next/link';
import { format } from 'date-fns';
import {
  Sparkles,
  ArrowRight,
  BookMarked,
  Clock,
  TrendingUp,
  Layers,
  Search,
  Calendar,
  ExternalLink,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CATEGORY_GROUPS, ALL_CATEGORIES, CATEGORY_MAP, classifyArticleCategory } from '@/lib/categories';
import CategoryIcon from '@/app/components/CategoryIcon';
import SyncNewsButton from '@/app/components/SyncNewsButton';
import AddNewsModal from '@/app/components/AddNewsModal';
import DateRangeFilter from '@/app/components/DateRangeFilter';
import WishlistNavBadge from '@/app/components/WishlistNavBadge';
import WishlistButton from '@/app/components/WishlistButton';
import MetaSearchBar from '@/app/components/MetaSearchBar';
import Pagination from '@/app/components/Pagination';

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    range?: string;
    q?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 12;

export const dynamic = 'force-dynamic';

export default async function HomePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const supabase = createServerSupabaseClient();

  const searchQuery = searchParams.q?.trim() || '';
  const page = parseInt(searchParams.page || '1', 10);
  const rangeType = searchParams.range;
  const todayStr = new Date().toISOString().slice(0, 10);

  // If a meta search query is active, default to all database records unless explicit date filter is set
  const isDefaultToday =
    !searchQuery &&
    !searchParams.startDate &&
    !searchParams.endDate &&
    rangeType !== 'all';

  const effectiveStartDate = searchParams.startDate || (isDefaultToday ? todayStr : undefined);
  const effectiveEndDate = searchParams.endDate || (isDefaultToday ? todayStr : undefined);

  // ----------------------------------------------------
  // META SEARCH EXECUTION (when user searches across DB)
  // ----------------------------------------------------
  let searchResults: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    category?: string;
    summary?: string | null;
    published_at: string;
  }> = [];
  let searchCount = 0;
  const searchCategoryBreakdown: Record<string, number> = {};

  if (searchQuery) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Search across title and source in database
    let dbSearchQuery = supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .or(`title.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`)
      .order('published_at', { ascending: false });

    if (effectiveStartDate) {
      const startIso = new Date(`${effectiveStartDate}T00:00:00.000Z`).toISOString();
      dbSearchQuery = dbSearchQuery.gte('published_at', startIso);
    }

    if (effectiveEndDate) {
      const endIso = new Date(`${effectiveEndDate}T23:59:59.999Z`).toISOString();
      dbSearchQuery = dbSearchQuery.lte('published_at', endIso);
    }

    const { data: foundArticles, count: totalFound } = await dbSearchQuery.range(from, to);
    searchResults = foundArticles || [];
    searchCount = totalFound || 0;

    // Build category breakdown for search results
    searchResults.forEach((art) => {
      const cat = art.category || classifyArticleCategory(art.title);
      searchCategoryBreakdown[cat] = (searchCategoryBreakdown[cat] || 0) + 1;
    });
  }

  // ----------------------------------------------------
  // STANDARD CATEGORY COUNTS & HOME VIEW
  // ----------------------------------------------------
  let query = supabase.from('news_articles').select('*', { count: 'exact' });

  if (effectiveStartDate) {
    const startIso = new Date(`${effectiveStartDate}T00:00:00.000Z`).toISOString();
    query = query.gte('published_at', startIso);
  }

  if (effectiveEndDate) {
    const endIso = new Date(`${effectiveEndDate}T23:59:59.999Z`).toISOString();
    query = query.lte('published_at', endIso);
  }

  const { data: articles, count: totalArticles } = await query;

  const categoryCounts: Record<string, number> = {};
  ALL_CATEGORIES.forEach((cat) => {
    categoryCounts[cat.slug] = 0;
  });

  articles?.forEach((art) => {
    const cat = art.category || classifyArticleCategory(art.title);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Top 6 recent highlights
  let recentQuery = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false });

  if (effectiveStartDate) {
    const startIso = new Date(`${effectiveStartDate}T00:00:00.000Z`).toISOString();
    recentQuery = recentQuery.gte('published_at', startIso);
  }

  if (effectiveEndDate) {
    const endIso = new Date(`${effectiveEndDate}T23:59:59.999Z`).toISOString();
    recentQuery = recentQuery.lte('published_at', endIso);
  }

  const { data: recentArticles } = await recentQuery.limit(6);
  const searchTotalPages = searchCount ? Math.ceil(searchCount / PAGE_SIZE) : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
        <div className="absolute top-[600px] -left-40 w-[600px] h-[600px] bg-blue-100/40 blur-3xl rounded-full" />
        <div className="absolute top-[800px] -right-40 w-[600px] h-[600px] bg-purple-100/40 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-[85%] mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Top Navbar / Header Bar */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 shrink-0">
              <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 truncate">
                  SSC GK & Current Affairs
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> Exam Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2 sm:line-clamp-none">
                Categorized, syllabus-aligned daily news intelligence for competitive exams.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-xs backdrop-blur-sm shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isDefaultToday ? "Today's:" : 'Articles:'}</span>
              <strong className="text-slate-900 text-xs sm:text-sm">{totalArticles || 0}</strong>
            </div>

            <AddNewsModal />
            <WishlistNavBadge />
            <SyncNewsButton />
          </div>
        </header>

        {/* Global Meta Search Bar */}
        <section className="space-y-2">
          <MetaSearchBar />
        </section>

        {/* ---------------------------------------------------- */}
        {/* CONDITIONAL: META SEARCH RESULTS VIEW */}
        {/* ---------------------------------------------------- */}
        {searchQuery ? (
          <section className="space-y-6">
            {/* Meta Search Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/80 border border-blue-200/80 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                    <Search className="w-3.5 h-3.5" /> Global Database Search
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Results for &ldquo;<span className="text-blue-600">{searchQuery}</span>&rdquo;
                  </h2>
                  <p className="text-xs text-slate-600">
                    Found {searchCount} matching current affairs records in database
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
                    Clear Search & Back to Overview
                  </Link>
                </div>
              </div>

              {/* Category Breakdown Tags */}
              {Object.keys(searchCategoryBreakdown).length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-slate-500 font-medium shrink-0">Found in:</span>
                  {Object.entries(searchCategoryBreakdown).map(([catSlug, count]) => {
                    const catMeta = CATEGORY_MAP[catSlug];
                    return (
                      <Link
                        key={catSlug}
                        href={`/category/${catSlug}`}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-400 transition font-medium shadow-xs"
                      >
                        {catMeta?.shortTitle || catSlug}: <strong className="text-slate-900">{count}</strong>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results List */}
            {searchResults.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    No articles found matching &ldquo;{searchQuery}&rdquo;
                  </h3>
                  <p className="text-xs text-slate-500">
                    Try searching for another topic or click &ldquo;Fetch Latest Feeds&rdquo; to pull recent news.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    View All Categories
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResults.map((article) => {
                  const catMeta = CATEGORY_MAP[article.category || classifyArticleCategory(article.title)];
                  let formattedDate = 'Recent';
                  try {
                    formattedDate = format(new Date(article.published_at), 'MMM dd, yyyy • hh:mm a');
                  } catch {
                    formattedDate = article.published_at;
                  }

                  return (
                    <article
                      key={article.id}
                      className="flex flex-col justify-between rounded-2xl bg-white hover:bg-white border border-slate-200 hover:border-blue-400 p-5 transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 group"
                    >
                      <div className="space-y-3">
                        {/* Meta header */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
                              {catMeta?.shortTitle || 'GK'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {article.source}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formattedDate}
                            </span>
                            <WishlistButton article={article} size="sm" />
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {article.title}
                        </h3>

                        {/* Snippet / summary */}
                        {article.summary && (
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {article.summary}
                          </p>
                        )}
                      </div>

                      {/* Footer link */}
                      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <Link
                          href={`/category/${catMeta?.slug || 'national-schemes'}`}
                          className="text-[11px] text-blue-600 hover:underline font-medium"
                        >
                          View in {catMeta?.shortTitle || 'Section'} →
                        </Link>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 hover:underline transition text-xs"
                        >
                          Read Story
                          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination for Search Results */}
            {searchTotalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={page}
                  totalPages={searchTotalPages}
                  searchParams={searchParams}
                />
              </div>
            )}
          </section>
        ) : (
          /* ---------------------------------------------------- */
          /* STANDARD OVERVIEW: CATEGORY CARDS & RECENT FEED */
          /* ---------------------------------------------------- */
          <>
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/80 border border-slate-200/80 p-6 sm:p-8 shadow-xs">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Structured Exam Categories
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                  Select a Knowledge Domain to explore targeted updates
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Displaying today&apos;s live updates by default. Click any category card to view detailed timelines or use the filter below to query specific historical dates.
                </p>
              </div>
            </section>

            {/* Global Date Filter & Time Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <DateRangeFilter />
            </div>

            {/* Category Groups */}
            <div className="space-y-14">
              {CATEGORY_GROUPS.map((group, groupIdx) => (
                <section key={group.id} className="space-y-6">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white text-xs font-bold text-blue-600 border border-slate-200 shadow-xs">
                        0{groupIdx + 1}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {group.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                      {group.subtitle}
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {group.categories.map((cat) => {
                      const count = categoryCounts[cat.slug] || 0;

                      return (
                        <Link
                          key={cat.slug}
                          href={`/category/${cat.slug}${isDefaultToday
                              ? ''
                              : searchParams
                                ? `?${new URLSearchParams(searchParams as Record<string, string>).toString()}`
                                : ''
                            }`}
                          className="group relative flex flex-col justify-between rounded-2xl bg-white hover:bg-white border border-slate-200 hover:border-blue-400 p-5 transition-all duration-300 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
                        >
                          <div className="space-y-4">
                            {/* Card Top: Icon & Count Badge */}
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white border border-blue-100 group-hover:border-blue-600 transition-colors shadow-xs">
                                <CategoryIcon name={cat.icon} className="w-5 h-5" />
                              </div>

                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                                {count} {count === 1 ? 'article' : 'articles'}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                {cat.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                                {cat.description}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer Link */}
                          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                            <span>View Updates</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Recent Updates Stream */}
            {recentArticles && recentArticles.length > 0 && (
              <section className="mt-14 rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />{' '}
                    {isDefaultToday ? "Today's Current Affairs Stream" : 'Current Affairs Stream'}
                  </div>
                  <span className="text-xs text-slate-500">Chronological feed</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentArticles.map((art) => {
                    const assignedCategory = art.category || classifyArticleCategory(art.title);

                    return (
                      <div
                        key={art.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium shrink-0">
                            {art.source}
                          </span>
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-800 hover:text-blue-600 hover:underline transition line-clamp-1"
                          >
                            {art.title}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 sm:self-auto shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(art.published_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <Link
                            href={`/category/${assignedCategory}`}
                            className="text-blue-600 hover:text-blue-700 underline font-medium"
                          >
                            View in Category →
                          </Link>
                          <WishlistButton article={art} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
