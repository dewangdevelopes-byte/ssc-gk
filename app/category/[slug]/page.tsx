import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CATEGORY_MAP, ALL_CATEGORIES, CATEGORY_GROUPS, classifyArticleCategory } from '@/lib/categories';
import { NewsArticle } from '@/lib/types';
import CategoryIcon from '@/app/components/CategoryIcon';
import Pagination from '@/app/components/Pagination';
import DateRangeFilter from '@/app/components/DateRangeFilter';
import WishlistButton from '@/app/components/WishlistButton';
import WishlistNavBadge from '@/app/components/WishlistNavBadge';
import AddNewsModal from '@/app/components/AddNewsModal';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    startDate?: string;
    endDate?: string;
    range?: string;
  }>;
}

const PAGE_SIZE = 12;

export const dynamic = 'force-dynamic';

export default async function CategoryPage(props: PageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const category = CATEGORY_MAP[slug];
  if (!category) {
    notFound();
  }

  // Find parent group
  const parentGroup = CATEGORY_GROUPS.find((g) =>
    g.categories.some((c) => c.slug === slug)
  );

  const supabase = createServerSupabaseClient();
  const page = parseInt(searchParams.page || '1', 10);
  const rangeType = searchParams.range;
  const todayStr = new Date().toISOString().slice(0, 10);

  // Default to today's news unless user explicitly specifies dates or selects 'all'
  const isDefaultToday = !searchParams.startDate && !searchParams.endDate && rangeType !== 'all';
  const effectiveStartDate = searchParams.startDate || (isDefaultToday ? todayStr : undefined);
  const effectiveEndDate = searchParams.endDate || (isDefaultToday ? todayStr : undefined);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let articles: NewsArticle[] = [];
  let count = 0;
  let errorMsg: string | null = null;

  try {
    // Attempt 1: Query directly by category column
    let query = supabase
      .from('news_articles')
      .select('*', { count: 'exact' })
      .eq('category', slug)
      .order('published_at', { ascending: false });

    if (effectiveStartDate) {
      const startIso = new Date(`${effectiveStartDate}T00:00:00.000Z`).toISOString();
      query = query.gte('published_at', startIso);
    }

    if (effectiveEndDate) {
      const endIso = new Date(`${effectiveEndDate}T23:59:59.999Z`).toISOString();
      query = query.lte('published_at', endIso);
    }

    const { data, count: exactCount, error } = await query.range(from, to);

    if (error && error.message.includes('category')) {
      // Fallback: Query all and filter in memory
      let fallbackQuery = supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (effectiveStartDate) {
        const startIso = new Date(`${effectiveStartDate}T00:00:00.000Z`).toISOString();
        fallbackQuery = fallbackQuery.gte('published_at', startIso);
      }
      if (effectiveEndDate) {
        const endIso = new Date(`${effectiveEndDate}T23:59:59.999Z`).toISOString();
        fallbackQuery = fallbackQuery.lte('published_at', endIso);
      }

      const { data: allArticles } = await fallbackQuery;
      const matched = (allArticles || []).filter(
        (a) => (a.category || classifyArticleCategory(a.title)) === slug
      );
      count = matched.length;
      articles = matched.slice(from, to + 1);
    } else if (error) {
      errorMsg = error.message;
    } else {
      articles = data || [];
      count = exactCount || 0;
    }
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Back to All Categories</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hidden sm:flex items-center gap-2 shadow-xs">
              <span>Group:</span>
              <span className="text-blue-600 font-bold">{parentGroup?.title || 'Current Affairs'}</span>
            </div>

            <AddNewsModal initialCategory={slug} />
            <WishlistNavBadge />
          </div>
        </div>

        {/* Category Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/80 border border-slate-200/80 p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 border border-blue-400/30 shrink-0">
                <CategoryIcon name={category.icon} className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {category.title}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <div className="text-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-slate-900">{count}</div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {isDefaultToday ? "Today's Articles" : 'Articles'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Category Swapping Bar */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-200/80 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-500 shrink-0 font-medium mr-1">All Sections:</span>
            {ALL_CATEGORIES.map((c) => {
              const isActive = c.slug === slug;
              return (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs'
                  }`}
                >
                  {c.shortTitle}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Date Filters & On-Demand Live Fetch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <DateRangeFilter categorySlug={slug} categoryTitle={category.title} />
        </div>

        {/* Articles List / Grid */}
        <div className="space-y-4">
          {errorMsg ? (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <p className="font-semibold">Notice</p>
              <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {isDefaultToday
                    ? "No updates recorded yet today for this section"
                    : 'No articles found for the selected date range'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isDefaultToday
                    ? 'Use the time filters above to view the past 7 days, or select specific dates to explore historical updates.'
                    : 'Try selecting a wider date range or click "All Dates".'}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href={`/category/${slug}?range=7d`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  View Past 7 Days
                </Link>
                <Link
                  href={`/category/${slug}?range=all`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  View All Dates
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article) => {
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
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {article.source}
                        </span>

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

                    {/* Footer external link */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Verified Source
                      </span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                      >
                        Read Full Story
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                searchParams={searchParams}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
