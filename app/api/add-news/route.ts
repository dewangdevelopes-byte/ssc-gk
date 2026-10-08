import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { classifyArticleCategory, ALL_CATEGORIES } from '@/lib/categories';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, published_at, url, category, source, summary } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'News title is required.' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const trimmedSource = source?.trim() || 'Manual Entry';
    const trimmedSummary = summary?.trim() || null;

    // Validate or default category
    const validCategorySlugs = ALL_CATEGORIES.map((c) => c.slug);
    const assignedCategory =
      category && validCategorySlugs.includes(category)
        ? category
        : classifyArticleCategory(trimmedTitle, trimmedSummary || '');

    // Normalize published_at date
    let normalizedDate = new Date().toISOString();
    if (published_at) {
      try {
        const parsed = new Date(published_at);
        if (!isNaN(parsed.getTime())) {
          normalizedDate = parsed.toISOString();
        }
      } catch {
        normalizedDate = new Date().toISOString();
      }
    }

    // Generate unique URL if not provided
    let finalUrl = url?.trim();
    if (!finalUrl) {
      const slugifiedTitle = trimmedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60);
      finalUrl = `https://ssc-gk.local/manual-news/${slugifiedTitle || 'note'}-${Date.now()}`;
    }

    // Insert into Supabase
    const payload = {
      title: trimmedTitle,
      url: finalUrl,
      source: trimmedSource,
      category: assignedCategory,
      summary: trimmedSummary,
      published_at: normalizedDate,
    };

    const { data, error } = await supabaseAdmin
      .from('news_articles')
      .upsert([payload], { onConflict: 'url' })
      .select()
      .single();

    if (error && error.message.includes('category')) {
      // Fallback if category column is missing
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('news_articles')
        .upsert(
          [
            {
              title: trimmedTitle,
              url: finalUrl,
              source: trimmedSource,
              published_at: normalizedDate,
            },
          ],
          { onConflict: 'url' }
        )
        .select()
        .single();

      if (fallbackError) {
        return NextResponse.json(
          { success: false, error: fallbackError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        article: { ...fallbackData, category: assignedCategory, summary: trimmedSummary },
      });
    }

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      article: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
