import Link from 'next/link';
import { format } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  Trophy,
  ArrowLeft,
  Keyboard,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TypingSession } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TypingAnalysisPage() {
  const supabase = createServerSupabaseClient();

  // Fetch recent typing sessions ordered by newest first
  const { data: rawSessions, error } = await supabase
    .from('typing_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const sessions: TypingSession[] = rawSessions || [];

  // Summary Metrics calculations
  const totalSessions = sessions.length;
  const totalNetWpm = sessions.reduce((acc, s) => acc + (s.net_wpm || 0), 0);
  const totalAccuracy = sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0);
  const totalKeyDepressions = sessions.reduce((acc, s) => acc + (s.key_depressions || 0), 0);

  const avgNetWpm = totalSessions > 0 ? Math.round(totalNetWpm / totalSessions) : 0;
  const avgAccuracy =
    totalSessions > 0 ? (totalAccuracy / totalSessions).toFixed(1) : '0.0';
  const bestNetWpm =
    totalSessions > 0 ? Math.max(...sessions.map((s) => s.net_wpm || 0)) : 0;
  const avgKeyDepressions =
    totalSessions > 0 ? Math.round(totalKeyDepressions / totalSessions) : 0;

  // Last 10 sessions for visual progression (ordered chronologically: oldest to newest)
  const last10Sessions = sessions.slice(0, 10).reverse();

  // Maximum WPM for scaling chart bars (at least 45 for nice proportion)
  const maxChartWpm = Math.max(
    45,
    ...last10Sessions.map((s) => s.net_wpm || 0)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
        <div className="absolute top-[600px] -right-40 w-[600px] h-[600px] bg-purple-100/40 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/typing"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-xs"
              title="Back to Typing Test"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 text-white shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  DEST Typing Analytics & Performance
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-600" /> SSC CGL Evaluation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Detailed progression tracking, speed trends, and accuracy metrics across practice tests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
            >
              <span>Current Affairs</span>
            </Link>
            <Link
              href="/typing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <Keyboard className="w-4 h-4" />
              <span>Start New Test</span>
            </Link>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Could not load typing sessions from Supabase: {error.message}</span>
          </div>
        )}

        {/* 1. Core Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Net WPM */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Average Net WPM
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Target: 27+
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              {avgNetWpm} <span className="text-base font-medium text-slate-500">WPM</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {avgNetWpm >= 27
                ? 'Above SSC DEST qualifying cut-off speed'
                : 'Aim for 27+ Net WPM to clear benchmark'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          </div>

          {/* Average Accuracy */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Average Accuracy
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Min 93%
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              {avgAccuracy}<span className="text-xl font-medium text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {parseFloat(avgAccuracy) >= 95
                ? 'Excellent typographic accuracy maintained'
                : 'Reduce backspacing to optimize speed'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          </div>

          {/* Total Sessions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" /> Total Sessions
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Recorded
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              {totalSessions}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {totalSessions > 0
                ? `${totalKeyDepressions.toLocaleString()} total key depressions logged`
                : 'No sessions recorded yet'}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          </div>

          {/* Best Speed / Peak Record */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" /> Personal Best
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Peak Speed
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              {bestNetWpm} <span className="text-base font-medium text-slate-500">WPM</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Avg depressions: ~{avgKeyDepressions.toLocaleString()} / session
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>
        </section>

        {/* 2. Visual Progression Chart (Last 10 Sessions) */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Progression Over Last 10 Sessions
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  (Chronological Trend)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparing Net Words Per Minute (bars) against Accuracy percentage (badges) and SSC Cut-off Benchmark.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
                <span>Net WPM</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-0.5 bg-rose-500 border-dashed border-b-2 border-rose-500 inline-block" />
                <span>27 WPM Cut-off</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                  98%
                </span>
                <span>Accuracy</span>
              </div>
            </div>
          </div>

          {last10Sessions.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Keyboard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No Typing Sessions Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Take your first 15-minute SSC CGL DEST typing test to start tracking your WPM, accuracy,
                  and key depressions progression here!
                </p>
              </div>
              <Link
                href="/typing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Keyboard className="w-4 h-4" />
                <span>Take First Typing Test</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tailwind CSS / SVG Bar Chart Visualization */}
              <div className="relative pt-8 pb-4">
                {/* 27 WPM Benchmark Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400 z-10 pointer-events-none transition-all"
                  style={{
                    bottom: `${(27 / maxChartWpm) * 200 + 40}px`,
                  }}
                >
                  <span className="absolute right-0 -top-5 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    SSC DEST Benchmark (27 WPM)
                  </span>
                </div>

                {/* Bars Container */}
                <div className="h-[220px] flex items-end justify-around gap-2 sm:gap-4 px-2 sm:px-6 border-b border-slate-200">
                  {last10Sessions.map((session, index) => {
                    const heightPercent = Math.max(10, Math.min(100, (session.net_wpm / maxChartWpm) * 100));
                    const isPassing = session.net_wpm >= 27 && session.accuracy >= 93;

                    return (
                      <div
                        key={session.id || index}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 shadow-lg whitespace-nowrap">
                          <div><strong>Net: {session.net_wpm} WPM</strong></div>
                          <div className="text-slate-300">Accuracy: {session.accuracy}%</div>
                          <div className="text-slate-400 text-[9px]">
                            {session.key_depressions.toLocaleString()} depressions
                          </div>
                        </div>

                        {/* Accuracy Pill on top of bar */}
                        <span
                          className={`mb-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            session.accuracy >= 95
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {session.accuracy}%
                        </span>

                        {/* WPM Bar */}
                        <div
                          className="w-full max-w-[48px] rounded-t-xl transition-all duration-500 relative flex items-center justify-center shadow-xs group-hover:brightness-110"
                          style={{
                            height: `${heightPercent}%`,
                            background: isPassing
                              ? 'linear-gradient(to top, #2563eb, #3b82f6)'
                              : 'linear-gradient(to top, #64748b, #94a3b8)',
                          }}
                        >
                          <span className="text-[11px] font-extrabold text-white mb-1 drop-shadow-xs">
                            {session.net_wpm}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Session Labels */}
                <div className="flex items-center justify-around gap-2 sm:gap-4 px-2 sm:px-6 pt-3 text-[11px] text-slate-500 font-medium">
                  {last10Sessions.map((session, index) => {
                    const dateObj = new Date(session.created_at);
                    const formatted = !isNaN(dateObj.getTime())
                      ? format(dateObj, 'dd MMM')
                      : `#${index + 1}`;

                    return (
                      <div key={session.id || index} className="flex-1 text-center truncate">
                        <span>{formatted}</span>
                        <div className="text-[9px] text-slate-400">
                          {session.key_depressions} kd
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. Recent Sessions History Log Table */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Detailed Session History
            </h2>
            <span className="text-xs text-slate-500">
              Showing last {sessions.length} tests
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No history found. Complete a practice session to see logs here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 font-semibold">Date & Time</th>
                    <th className="py-3 px-3 font-semibold">Net Speed (WPM)</th>
                    <th className="py-3 px-3 font-semibold">Accuracy</th>
                    <th className="py-3 px-3 font-semibold">Key Depressions</th>
                    <th className="py-3 px-3 font-semibold">SSC CGL Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => {
                    const dateObj = new Date(session.created_at);
                    const formattedDate = !isNaN(dateObj.getTime())
                      ? format(dateObj, 'dd MMM yyyy, HH:mm')
                      : 'Recently';

                    const isQualified =
                      (session.key_depressions >= 2000 || session.net_wpm >= 27) &&
                      session.accuracy >= 93;

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md ${
                              session.net_wpm >= 27
                                ? 'bg-emerald-50 text-emerald-700 font-bold'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {session.net_wpm} WPM
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-semibold">
                          <span
                            className={
                              session.accuracy >= 95 ? 'text-purple-700' : 'text-amber-700'
                            }
                          >
                            {session.accuracy}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-mono">
                          {session.key_depressions.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isQualified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isQualified ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Qualified
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Needs Speed
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
