'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Keyboard,
  Clock,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Trophy,
  Activity,
  Flame,
  ShieldCheck,
  ChevronRight,
  Delete,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { createClientSupabaseClient } from '@/lib/supabase/client';

interface TypingStats {
  keyDepressions: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  elapsedSeconds: number;
  backspaceCount: number;
}

interface MistakeDetail {
  wordIndex: number;
  expectedWord: string;
  typedWord: string;
  hasSpaceError: boolean;
  expectedSpace: string;
  typedSpace: string;
  isCompleteMismatch: boolean;
  charMismatches: Array<{
    position: number;
    expectedChar: string;
    typedChar: string;
  }>;
}

const TOTAL_TEST_SECONDS = 15 * 60; // Strict 15 minutes (900 seconds)
const SSC_TARGET_KEY_DEPRESSIONS = 2000;

export default function TypingPracticePage() {
  const [targetText, setTargetText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isLoadingPassage, setIsLoadingPassage] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Test states
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TEST_SECONDS);
  const [totalKeyDepressions, setTotalKeyDepressions] = useState<number>(0);
  const [backspaceCount, setBackspaceCount] = useState<number>(0);

  // Feature: Backspace Allowed Toggle Option
  const [allowBackspace, setAllowBackspace] = useState<boolean>(true);
  const [showBackspaceBlockedToast, setShowBackspaceBlockedToast] = useState<boolean>(false);

  // Filter state for mistake analysis
  const [mistakeFilter, setMistakeFilter] = useState<'all' | 'word' | 'space'>('all');

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submittedSessionId, setSubmittedSessionId] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tokenize targetText into structured words with character indices for guaranteed spacing & natural line wrapping
  const wordTokens = useMemo(() => {
    if (!targetText) return [];

    const tokens: Array<{
      wordIndex: number;
      wordText: string;
      chars: Array<{ char: string; globalIndex: number }>;
      hasTrailingSpace: boolean;
      spaceGlobalIndex?: number;
    }> = [];

    let currentIndex = 0;
    const words = targetText.split(' ');

    words.forEach((w, wIdx) => {
      const charArray: Array<{ char: string; globalIndex: number }> = [];

      for (let i = 0; i < w.length; i++) {
        charArray.push({
          char: w[i],
          globalIndex: currentIndex,
        });
        currentIndex++;
      }

      const hasTrailingSpace = wIdx < words.length - 1;
      let spaceGlobalIndex: number | undefined;

      if (hasTrailingSpace) {
        spaceGlobalIndex = currentIndex;
        currentIndex++; // account for space
      }

      tokens.push({
        wordIndex: wIdx,
        wordText: w,
        chars: charArray,
        hasTrailingSpace,
        spaceGlobalIndex,
      });
    });

    return tokens;
  }, [targetText]);

  // Compute detailed mistake diagnostics
  const mistakesList = useMemo((): MistakeDetail[] => {
    if (!userInput || wordTokens.length === 0) return [];

    const results: MistakeDetail[] = [];

    wordTokens.forEach((word) => {
      const startIdx = word.chars[0]?.globalIndex ?? 0;
      if (userInput.length <= startIdx) return;

      const endIdx = word.chars[word.chars.length - 1]?.globalIndex ?? startIdx;
      const typedWordSlice = userInput.slice(startIdx, Math.min(userInput.length, endIdx + 1));

      const charMismatches: Array<{
        position: number;
        expectedChar: string;
        typedChar: string;
      }> = [];

      word.chars.forEach((c, idx) => {
        if (c.globalIndex < userInput.length) {
          const typedChar = userInput[c.globalIndex];
          if (typedChar !== c.char) {
            charMismatches.push({
              position: idx + 1,
              expectedChar: c.char,
              typedChar: typedChar === ' ' ? '␣ (Space)' : typedChar,
            });
          }
        }
      });

      let hasSpaceError = false;
      let typedSpace = '';
      if (word.hasTrailingSpace && word.spaceGlobalIndex !== undefined) {
        if (userInput.length > word.spaceGlobalIndex) {
          const spaceChar = userInput[word.spaceGlobalIndex];
          if (spaceChar !== ' ') {
            hasSpaceError = true;
            typedSpace = spaceChar;
          }
        }
      }

      if (charMismatches.length > 0 || hasSpaceError) {
        results.push({
          wordIndex: word.wordIndex + 1,
          expectedWord: word.wordText,
          typedWord: typedWordSlice,
          hasSpaceError,
          expectedSpace: '␣ (Space)',
          typedSpace: typedSpace || 'missing',
          isCompleteMismatch: typedWordSlice !== word.wordText,
          charMismatches,
        });
      }
    });

    return results;
  }, [userInput, wordTokens]);

  // Fetch unique passage
  const loadNewPassage = useCallback(async () => {
    setIsLoadingPassage(true);
    setFetchError(null);
    setUserInput('');
    setHasStarted(false);
    setIsCompleted(false);
    setTimeLeft(TOTAL_TEST_SECONDS);
    setTotalKeyDepressions(0);
    setBackspaceCount(0);
    setSubmitSuccess(false);
    setSubmittedSessionId(null);
    setMistakeFilter('all');
    setShowBackspaceBlockedToast(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const res = await fetch(`/api/typing/passage?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch passage from server');
      const data = await res.json();
      if (data.text) {
        setTargetText(data.text);
      } else {
        throw new Error('Empty passage received');
      }
    } catch (err: unknown) {
      console.error(err);
      setFetchError('Could not load dynamic article passage. Loaded standard SSC test text.');
      setTargetText(
        'The Constitution of India is the supreme legal framework that establishes the structure, procedures, powers, and duties of government institutions while setting out fundamental rights, directive principles, and the duties of citizens. It is the longest written constitution of any sovereign state in the world, embodying the democratic values and sovereign aspirations of a diverse nation. Economic governance in modern India has witnessed significant administrative reforms aimed at streamlining service delivery, enhancing transparency, and leveraging digital infrastructure across all state and central ministries.'
      );
    } finally {
      setIsLoadingPassage(false);
    }
  }, []);

  useEffect(() => {
    loadNewPassage();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [loadNewPassage]);

  // Keep active character scrolled into view
  useEffect(() => {
    if (activeCharRef.current && textContainerRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [userInput]);

  // Push final metrics to typing_sessions table
  const submitResults = useCallback(
    async (finalStats: TypingStats) => {
      if (isSubmitting || submitSuccess) return;
      setIsSubmitting(true);

      const payload = {
        net_wpm: Math.max(0, Math.round(finalStats.netWpm)),
        accuracy: Math.min(100, Math.max(0, parseFloat(finalStats.accuracy.toFixed(2)))),
        key_depressions: Math.max(0, Math.round(finalStats.keyDepressions)),
      };

      try {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
          .from('typing_sessions')
          .insert(payload)
          .select('id')
          .single();

        if (!error && data?.id) {
          setSubmitSuccess(true);
          setSubmittedSessionId(data.id);
          return;
        }

        const res = await fetch('/api/typing/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const resData = await res.json();
          setSubmitSuccess(true);
          setSubmittedSessionId(resData.session?.id || 'saved');
        } else {
          console.error('Failed to submit session to API');
        }
      } catch (err) {
        console.error('Error auto-submitting session:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, submitSuccess]
  );

  // Compute live metrics
  const computeStats = useCallback((): TypingStats => {
    const elapsedSeconds = TOTAL_TEST_SECONDS - timeLeft;
    const timeInMinutes = Math.max(elapsedSeconds, 1) / 60;

    let correctChars = 0;
    let errors = 0;

    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === targetText[i]) {
        correctChars++;
      } else {
        errors++;
      }
    }

    // Gross WPM: (Total Keystrokes / 5) / TimeInMinutes
    const grossWpm = Math.round(totalKeyDepressions / 5 / timeInMinutes);

    // SSC CGL Net WPM: [(Total Keystrokes / 5) - Uncorrected Errors] / TimeInMinutes
    const netWords = Math.max(0, totalKeyDepressions / 5 - errors);
    const netWpm = Math.max(0, Math.round(netWords / timeInMinutes));

    // Accuracy: (Correct Characters / Total Characters Typed) * 100
    const totalCharsTyped = userInput.length;
    const accuracy =
      totalCharsTyped > 0
        ? Math.min(100, Math.max(0, (correctChars / totalCharsTyped) * 100))
        : 100;

    return {
      keyDepressions: totalKeyDepressions,
      grossWpm: isNaN(grossWpm) ? 0 : grossWpm,
      netWpm: isNaN(netWpm) ? 0 : netWpm,
      accuracy: isNaN(accuracy) ? 100 : accuracy,
      errors,
      correctChars,
      elapsedSeconds,
      backspaceCount,
    };
  }, [userInput, targetText, totalKeyDepressions, timeLeft, backspaceCount]);

  // Strict 15-minute countdown timer
  useEffect(() => {
    if (!hasStarted || isCompleted) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [hasStarted, isCompleted]);

  // When timer hits 0, auto-submit
  useEffect(() => {
    if (timeLeft === 0 && !isCompleted) {
      setIsCompleted(true);
    }
  }, [timeLeft, isCompleted]);

  // Auto-submit when test completes
  useEffect(() => {
    if (isCompleted && totalKeyDepressions > 0) {
      const currentStats = computeStats();
      submitResults(currentStats);
    }
  }, [isCompleted, totalKeyDepressions, computeStats, submitResults]);

  // Track & intercept backspace key presses based on toggle
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      if (!allowBackspace) {
        e.preventDefault();
        setShowBackspaceBlockedToast(true);
        setTimeout(() => setShowBackspaceBlockedToast(false), 1800);
        return;
      }
      if (!isCompleted) {
        setBackspaceCount((prev) => prev + 1);
      }
    }
  };

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCompleted) return;

    const value = e.target.value;

    // If backspace is disabled and user deleted characters (via selection or delete key)
    if (!allowBackspace && value.length < userInput.length) {
      setShowBackspaceBlockedToast(true);
      setTimeout(() => setShowBackspaceBlockedToast(false), 1800);
      return;
    }

    // Start timer on first keystroke if not already running
    if (!hasStarted && value.length > 0) {
      setHasStarted(true);
    }

    // Key depression count: Exclude Space key strokes as requested
    if (value.length > userInput.length) {
      const addedSlice = value.slice(userInput.length);
      let nonSpaceCount = 0;
      for (let i = 0; i < addedSlice.length; i++) {
        if (addedSlice[i] !== ' ') {
          nonSpaceCount++;
        }
      }
      setTotalKeyDepressions((prev) => prev + nonSpaceCount);
    }

    // Don't allow typing beyond target length
    if (value.length <= targetText.length) {
      setUserInput(value);
      if (value.length === targetText.length && targetText.length > 0) {
        setIsCompleted(true);
      }
    }
  };

  const handleManualSubmit = () => {
    if (!isCompleted) {
      setIsCompleted(true);
    }
  };

  const stats = computeStats();

  // Format time MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Time elapsed in MM:SS
  const elapsedMins = Math.floor(stats.elapsedSeconds / 60);
  const elapsedSecs = stats.elapsedSeconds % 60;
  const formattedElapsed = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecs).padStart(2, '0')}`;

  // SSC DEST Standard: roughly 2000 key depressions in 15 mins (equivalent to ~27 WPM with >93% accuracy)
  const isQualified =
    (stats.keyDepressions >= SSC_TARGET_KEY_DEPRESSIONS ||
      (stats.netWpm >= 27 && stats.elapsedSeconds >= 120)) &&
    stats.accuracy >= 93;

  // Filtered mistakes list
  const filteredMistakes = mistakesList.filter((m) => {
    if (mistakeFilter === 'word') return m.charMismatches.length > 0;
    if (mistakeFilter === 'space') return m.hasSpaceError;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl opacity-60" />
        <div className="absolute top-[500px] -left-40 w-[600px] h-[600px] bg-blue-100/40 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-xs"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 text-white shrink-0">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  SSC CGL DEST Typing Test
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600" /> 2000 Depressions / 15 Min
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Official Data Entry Speed Test simulation with backspace analytics and mistake diagnostics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              href="/typing/analysis"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-xs transition-all"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Analytics Dashboard</span>
            </Link>

            <button
              onClick={loadNewPassage}
              disabled={isLoadingPassage || isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingPassage ? 'animate-spin' : ''}`} />
              <span>New Passage</span>
            </button>
          </div>
        </header>

        {fetchError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Live Metrics Header Bar (6 Responsive Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Timer Card */}
          <div
            className={`rounded-2xl p-4 border transition-all shadow-xs ${
              timeLeft < 120 && timeLeft > 0
                ? 'bg-rose-50/80 border-rose-300 animate-pulse text-rose-900'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Time Left
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                15m
              </span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight font-mono text-slate-900">
              {formattedTime}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {hasStarted ? (isCompleted ? 'Finished' : 'Counting Down') : 'Starts on 1st Key'}
            </div>
          </div>

          {/* 2. Key Depressions (Excluding Spaces) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-indigo-600" /> Depressions
              </span>
              <span className="text-[9px] text-indigo-600 font-bold">Goal: 2000</span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">
              {stats.keyDepressions.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Excludes spaces</div>
          </div>

          {/* 3. Backspaces Counter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Delete className="w-3.5 h-3.5 text-amber-600" /> Backspaces
              </span>
              <span
                className={`text-[9px] font-bold ${
                  !allowBackspace
                    ? 'text-amber-600'
                    : stats.backspaceCount > 20
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {!allowBackspace ? 'Locked' : stats.backspaceCount > 0 ? `${stats.backspaceCount}x` : '0'}
              </span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-amber-700">
              {stats.backspaceCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {!allowBackspace ? 'Disabled in strict' : 'Corrections made'}
            </div>
          </div>

          {/* 4. Net WPM */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-600" /> Net WPM
              </span>
              <span className="text-[9px] text-emerald-600 font-bold">Pass: 27+</span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-emerald-700">
              {stats.netWpm}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gross: {stats.grossWpm} WPM</div>
          </div>

          {/* 5. Accuracy Percentage */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Accuracy
              </span>
              <span
                className={`text-[9px] font-bold ${
                  stats.accuracy >= 95 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {stats.accuracy >= 95 ? 'Good' : 'Check'}
              </span>
            </div>
            <div
              className={`text-2xl font-extrabold tracking-tight ${
                stats.accuracy >= 95 ? 'text-slate-900' : 'text-amber-700'
              }`}
            >
              {stats.accuracy.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Errors: {stats.errors}</div>
          </div>

          {/* 6. Mistakes Count */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Total Errors
              </span>
              <span className="text-[9px] text-rose-600 font-bold">
                {mistakesList.length} words
              </span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight text-rose-600">
              {stats.errors}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Characters mistyped</div>
          </div>
        </div>

        {/* Main Typing Area Card */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="relative bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 cursor-text transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400"
        >
          {/* Floating Toast when Backspace is blocked in strict mode */}
          {showBackspaceBlockedToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 border border-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Backspace is disabled (Strict Mode Active)</span>
            </div>
          )}

          {/* Header Inside Card with Controls & Backspace Toggle */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Official Passage Display
              </span>
              <span className="text-xs text-slate-400">
                ({targetText.length} characters / ~{targetText.split(/\s+/).filter(Boolean).length} words)
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {/* Backspace Allowed Toggle Switch */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAllowBackspace((prev) => !prev);
                }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  allowBackspace
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400/20 font-semibold'
                }`}
                title={
                  allowBackspace
                    ? 'Backspace is allowed. Click to disable (Strict No-Backspace mode).'
                    : 'Backspace is blocked. Click to allow backspace.'
                }
              >
                {allowBackspace ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Backspace: <strong className="text-slate-900">Allowed</strong></span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Backspace: <strong className="text-amber-800">Locked (Strict)</strong></span>
                  </>
                )}

                {/* Sliding Toggle Pill */}
                <div
                  className={`w-7 h-4 rounded-full transition-colors flex items-center p-0.5 ${
                    allowBackspace ? 'bg-blue-600 justify-end' : 'bg-amber-500 justify-start'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                </div>
              </button>

              {!isCompleted && hasStarted && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualSubmit();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Submit Early
                </button>
              )}
              <div className="text-xs font-medium text-slate-500">
                Typed: {userInput.length} / {targetText.length}
              </div>
            </div>
          </div>

          {/* Interactive Character Display Area */}
          <div
            ref={textContainerRef}
            className="max-h-[340px] overflow-y-auto pr-2 font-mono text-base sm:text-lg leading-relaxed select-none tracking-normal scroll-smooth"
            style={{ minHeight: '180px' }}
          >
            {isLoadingPassage ? (
              <div className="py-16 text-center space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-sans">
                  Fetching unique dynamic exam passage from latest news articles...
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center content-start gap-y-2 select-none">
                {wordTokens.map((word) => (
                  <span
                    key={word.wordIndex}
                    className="inline-flex items-center mr-2.5 my-0.5 whitespace-nowrap"
                  >
                    {word.chars.map(({ char, globalIndex }) => {
                      const isTyped = globalIndex < userInput.length;
                      const isCurrent = globalIndex === userInput.length && !isCompleted;
                      const isCorrect = isTyped && userInput[globalIndex] === char;
                      const isIncorrect = isTyped && userInput[globalIndex] !== char;

                      let charClass = 'text-slate-400';
                      if (isCorrect) {
                        charClass = 'text-emerald-700 bg-emerald-100/80 rounded-xs font-semibold';
                      } else if (isIncorrect) {
                        charClass = 'text-rose-700 bg-rose-200 font-semibold rounded-xs underline decoration-rose-500';
                      }

                      return (
                        <span
                          key={globalIndex}
                          ref={isCurrent ? activeCharRef : null}
                          className={`font-mono text-base sm:text-lg tracking-normal transition-colors duration-75 ${charClass} ${
                            isCurrent
                              ? 'bg-blue-600 text-white font-bold rounded-xs shadow-xs animate-pulse ring-2 ring-blue-400/40 px-0.5'
                              : ''
                          }`}
                        >
                          {char}
                        </span>
                      );
                    })}

                    {/* Trailing Space with distinct space bar target indicator */}
                    {word.hasTrailingSpace && word.spaceGlobalIndex !== undefined && (
                      <span
                        ref={
                          userInput.length === word.spaceGlobalIndex && !isCompleted
                            ? activeCharRef
                            : null
                        }
                        className={`font-mono text-base sm:text-lg inline-block px-1 ml-0.5 rounded-xs transition-colors duration-75 ${
                          userInput.length > word.spaceGlobalIndex
                            ? userInput[word.spaceGlobalIndex] === ' '
                              ? 'text-emerald-600'
                              : 'text-rose-700 bg-rose-200 font-bold underline'
                            : 'text-slate-300'
                        } ${
                          userInput.length === word.spaceGlobalIndex && !isCompleted
                            ? 'bg-blue-600 text-white font-bold animate-pulse ring-2 ring-blue-400/40 min-w-[0.6em] text-center'
                            : ''
                        }`}
                      >
                        {userInput.length > word.spaceGlobalIndex &&
                        userInput[word.spaceGlobalIndex] !== ' '
                          ? '␣'
                          : '\u00A0'}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hidden/Synced Textarea for capturing typing, mobile keyboard, and backspace */}
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isCompleted || isLoadingPassage}
            autoFocus
            className="absolute opacity-0 pointer-events-none inset-0 w-full h-full resize-none cursor-default"
            aria-label="Typing test input buffer"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
          />

          {/* Bottom helper prompt */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
              <span>
                {isCompleted
                  ? 'Test completed. Review your evaluation and detailed mistake diagnostic report below.'
                  : hasStarted
                  ? allowBackspace
                    ? 'Typing in progress. Focus on accuracy to maximize Net WPM.'
                    : 'Strict Mode: Backspace is disabled. Type with continuous precision.'
                  : 'Click anywhere here or start typing on your keyboard to begin.'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 inline-block" /> Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-200 inline-block" /> Error
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Cursor
              </span>
            </div>
          </div>
        </div>

        {/* Completion Modal / Scorecard */}
        {isCompleted && (
          <div className="space-y-6">
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isQualified
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    {isQualified ? <Trophy className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {isQualified ? 'DEST Standard Met! (Qualified)' : 'Test Complete — Keep Practicing!'}
                      </h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isQualified
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isQualified ? 'DEST Pass' : 'DEST Standard Pending'}
                      </span>
                      {!allowBackspace && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-500/40">
                          Strict (No-Backspace)
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      {isQualified
                        ? 'Congratulations! Your speed and accuracy comfortably clear the SSC CGL Tier-II DEST benchmark.'
                        : 'Target 2000 key depressions in 15 minutes (~27 Net WPM) with accuracy higher than 93%.'}
                    </p>
                  </div>
                </div>

                {/* Status indicator on saving to DB */}
                <div className="text-right">
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-300 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      Syncing to Supabase...
                    </span>
                  ) : submitSuccess ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" /> Saved to Analytics DB
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Session Recorded</span>
                  )}
                </div>
              </div>

              {/* Scorecard Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-6">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 mb-1">Final Net Speed</div>
                  <div className="text-3xl font-extrabold text-emerald-400">{stats.netWpm} WPM</div>
                  <div className="text-[11px] text-slate-400 mt-1">Gross: {stats.grossWpm} WPM</div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 mb-1">Typing Accuracy</div>
                  <div
                    className={`text-3xl font-extrabold ${
                      stats.accuracy >= 95 ? 'text-white' : 'text-amber-400'
                    }`}
                  >
                    {stats.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{stats.errors} character errors</div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 mb-1">Key Depressions</div>
                  <div className="text-3xl font-extrabold text-indigo-300">
                    {stats.keyDepressions.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Excludes spaces (Goal: 2000)</div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 mb-1">Backspaces Used</div>
                  <div className="text-3xl font-extrabold text-amber-400 font-mono">
                    {stats.backspaceCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {!allowBackspace ? 'Strict mode (Disabled)' : 'Corrections during test'}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <div className="text-xs text-slate-400 mb-1">Time Elapsed</div>
                  <div className="text-3xl font-extrabold text-white font-mono">{formattedElapsed}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Limit: 15:00 minutes</div>
                </div>
              </div>

              {/* Actions CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/60">
                <button
                  onClick={loadNewPassage}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/15"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Practice Another Passage</span>
                </button>

                <Link
                  href="/typing/analysis"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all"
                >
                  <span>View Analytics & Progression</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Detailed Mistake & Error Diagnostic Report */}
            <section className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      Detailed Mistake & Error Diagnostics
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {mistakesList.length} Word Mistake{mistakesList.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your exact typos, missed letters, and spacing errors to avoid them in the official exam.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                  <button
                    onClick={() => setMistakeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      mistakeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    All ({mistakesList.length})
                  </button>
                  <button
                    onClick={() => setMistakeFilter('word')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      mistakeFilter === 'word'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Typos ({mistakesList.filter((m) => m.charMismatches.length > 0).length})
                  </button>
                  <button
                    onClick={() => setMistakeFilter('space')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      mistakeFilter === 'space'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Space Errors ({mistakesList.filter((m) => m.hasSpaceError).length})
                  </button>
                </div>
              </div>

              {mistakesList.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-900">Flawless Typing! 0 Mistakes</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      You typed every single character and space with 100% precision.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Mistake Items Grid / Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredMistakes.map((mistake, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-2.5 transition-all hover:border-rose-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            Word #{mistake.wordIndex}
                          </span>
                          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {mistake.charMismatches.length > 0
                              ? `${mistake.charMismatches.length} typo${
                                  mistake.charMismatches.length === 1 ? '' : 's'
                                }`
                              : 'Space error'}
                          </span>
                        </div>

                        {/* Expected vs Typed Comparison */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                            <div className="text-[10px] text-slate-400 font-sans font-semibold mb-1">
                              Expected Word:
                            </div>
                            <div className="font-bold text-emerald-700 text-sm break-all">
                              {mistake.expectedWord}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-rose-200">
                            <div className="text-[10px] text-rose-400 font-sans font-semibold mb-1">
                              You Typed:
                            </div>
                            <div className="font-bold text-rose-600 text-sm break-all">
                              {mistake.typedWord || '<empty>'}
                            </div>
                          </div>
                        </div>

                        {/* Specific Character Error Callouts */}
                        {mistake.charMismatches.length > 0 && (
                          <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-rose-100/80">
                            {mistake.charMismatches.map((m, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>
                                  Char #{m.position}: expected{' '}
                                  <strong className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.2 rounded">
                                    &apos;{m.expectedChar}&apos;
                                  </strong>
                                  , typed{' '}
                                  <strong className="text-rose-700 font-mono bg-rose-100 px-1 py-0.2 rounded">
                                    &apos;{m.typedChar}&apos;
                                  </strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {mistake.hasSpaceError && (
                          <div className="text-[11px] text-rose-700 flex items-center gap-1.5 pt-1 border-t border-rose-100/80">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Missed trailing space after &ldquo;{mistake.expectedWord}&rdquo; (typed &apos;
                              {mistake.typedSpace}&apos;)
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* SSC CGL DEST Guidelines Reference Card */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>SSC CGL Data Entry Speed Test (DEST) — Official Guidelines</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">1. Key Depression Rules</strong>
              <p>
                Candidates are evaluated on non-space character depressions. Target is <strong>2,000 depressions</strong> in <strong>15 minutes</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">2. Backspace Policy & Modes</strong>
              <p>
                Use the Backspace toggle to practice in <strong>Strict No-Backspace Mode</strong> to build flawless muscle memory, or normal mode to practice correction rhythm.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">3. Penalty Evaluation</strong>
              <p>
                Each uncorrected mistake reduces Net WPM directly. Aim for greater than <strong>95% accuracy</strong> to ensure passing qualification.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
