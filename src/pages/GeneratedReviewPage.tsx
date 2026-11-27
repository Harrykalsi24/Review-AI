import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Star,
  RefreshCw,
  Check,
  ClipboardCheck,
  Settings,
} from 'lucide-react';
import type { QuestionnaireData, AdminSettings, ReviewLength } from '../types';
import { generateReview, generateLocalFallbackReview } from '../services/aiService';
import AILoader from '../components/smoothui/components/ai-loader';

interface Props {
  data: QuestionnaireData;
  settings: AdminSettings;
  onBack: () => void;
  onAdminTap?: () => void;
}

const LENGTH_OPTIONS: { label: string; value: ReviewLength }[] = [
  { label: 'Short', value: 'short' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Detailed', value: 'detailed' },
];

export default function GeneratedReviewPage({ data, settings, onBack, onAdminTap }: Props) {
  const [stars, setStars] = useState<number>(data.starRating);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [reviewLength, setReviewLength] = useState<ReviewLength>('balanced');
  const [reviewText, setReviewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);

  const starLabels: Record<number, string> = {
    5: 'Excellent',
    4: 'Very good',
    3: 'Average',
    2: 'Needs improvement',
    1: 'Poor',
  };

  // Stale-response guard: tapping Short then Balanced quickly must not let
  // the slower Short response overwrite the Balanced draft.
  const fetchIdRef = useRef(0);

  const fetchReview = useCallback(async (len: ReviewLength) => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setReviewLength(len);
    try {
      const generated = await generateReview(
        { ...data, starRating: stars },
        len,
        settings
      );
      if (fetchIdRef.current !== fetchId) return;
      setReviewText(generated.text);
    } catch {
      if (fetchIdRef.current !== fetchId) return;
      const fallbackText = generateLocalFallbackReview(
        { ...data, starRating: stars },
        len,
        settings.businessName
      );
      setReviewText(fallbackText);
    } finally {
      if (fetchIdRef.current === fetchId) setLoading(false);
    }
  }, [data, settings, stars]);

  // Fetch once on mount. The ref guard keeps StrictMode's dev double-effect
  // (and a later star-rating change) from firing a second AI request.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchReview('balanced');
  }, [fetchReview]);

  // Keep the engine's sliding indicator in sync: React owns the selection,
  // so after each render ask it to re-place the indicator.
  const segmentedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const index = LENGTH_OPTIONS.findIndex(o => o.value === reviewLength);
    if (segmentedRef.current && index >= 0) {
      window.LiquidGlass?.select(segmentedRef.current, index);
    }
  }, [reviewLength]);

  // Toast auto-hide.
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const showToast = () => {
    setCopied(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setCopied(false), 2500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast();
      return true;
    } catch {
      return false;
    }
  };

  const handlePostReview = async () => {
    await copyToClipboard(reviewText);
    setShowPostModal(true);
  };

  const handleManualCopy = async () => {
    await copyToClipboard(reviewText);
  };

  const targetUrl = settings.googleReviewUrl || 'https://search.google.com/local/writereview';

  return (
    <div className="min-h-screen pb-20 pt-24">
      {/* Floating glass toolbar: back, title, admin gear. */}
      <header className="glass-toolbar glass-toolbar--fixed glass-sheen" data-refract>
        <div className="glass-toolbar__content">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="glass-toolbar__btn"
              aria-label="Make changes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="glass-toolbar__brand text-base truncate">Your review</span>
          </div>
          {onAdminTap && (
            <div className="glass-toolbar__actions">
              <button
                type="button"
                onClick={onAdminTap}
                className="glass-toolbar__btn"
                aria-label="Admin settings"
                title="Tap 5 times to open admin settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Review receipt: opaque content card. */}
        <div className="content-card overflow-hidden flex flex-col">
          <div className="bg-[#f5f5f7] border-b border-rule px-5 sm:px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-rule flex items-center justify-center shrink-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-medium text-xs text-ink">ME</span>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-ink">{settings.businessName}</p>
              <p className="text-xs text-muted">{settings.businessAddress}</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-4">
            {/* Rating */}
            <div className="content-card-inner p-4 flex flex-col items-center gap-2">
              <span className="font-mono text-xs text-muted">Your rating</span>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(s => {
                  const active = s <= (hoveredStars || stars);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      onMouseEnter={() => setHoveredStars(s)}
                      onMouseLeave={() => setHoveredStars(0)}
                      className="p-1 rounded-lg transition-transform active:scale-95"
                      aria-label={`${s} stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'text-amber-600 fill-amber-600'
                            : 'text-rule-2 stroke-[1.5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-ink tabular-nums">
                {starLabels[stars]} · {stars} of 5
              </p>
            </div>

            {/* Length + new variation */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                ref={segmentedRef}
                className="glass-segmented"
                role="radiogroup"
                aria-label="Review length"
                data-refract
              >
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={reviewLength === opt.value}
                    onClick={() => fetchReview(opt.value)}
                    className="glass-segmented__option"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchReview(reviewLength)}
                disabled={loading}
                className="glass-btn glass-btn--sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>New variation</span>
              </button>
            </div>

            {/* Review text — the receipt moment */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <span className="font-mono text-xs text-muted tabular-nums">
                  {settings.businessName} · Mukerian · {stars} stars
                </span>
                <span className="text-xs text-muted">Tap to edit</span>
              </div>

              <div className="relative">
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Review text will appear here"
                  rows={2}
                  className="field w-full px-4 py-3 text-sm leading-relaxed text-ink field-sizing-content min-h-16 resize-none"
                />

                {loading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-xl flex items-center justify-center p-4">
                    <AILoader
                      label="Writing review"
                      showElapsed
                    />
                  </div>
                )}
              </div>
              <div className="receipt-rule pt-3">
                <p className="text-xs text-muted">
                  Written for your visit. Edit anything before you post it.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-rule">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePostReview}
                data-refract
                className="glass-btn glass-btn--prominent cta flex-1"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Post review on Google</span>
              </a>

              <button
                type="button"
                onClick={handleManualCopy}
                className="glass-btn cta"
              >
                <Copy className="w-4 h-4" />
                <span>Copy review text</span>
              </button>
            </div>
          </div>
        </div>

        {/* Post instructions */}
        <AnimatePresence>
          {showPostModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="content-card p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 font-medium text-ink text-sm">
                <ClipboardCheck className="w-4 h-4 text-success shrink-0" />
                <span>Review copied to clipboard</span>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Google is opening in your browser. Websites cannot submit Google reviews for you, so paste (Ctrl+V or long-press paste) your copied review into the Google review box, check your {stars}-star rating, and submit.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-rule">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-sm font-medium text-ink hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4 text-muted" />
                  <span>Open the review page again</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="glass-btn glass-btn--sm"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Copy confirmation toast: glass, bottom edge. */}
      <div
        className="glass-toast"
        role="status"
        aria-live="polite"
        data-state={copied ? 'visible' : 'hidden'}
        data-refract
        data-refract-bezel="16"
      >
        <span className="glass-toast__icon" aria-hidden="true">
          <Check className="w-4 h-4" />
        </span>
        <div className="glass-toast__content">
          <strong className="glass-toast__title">Review copied</strong>
          <span className="glass-toast__message">Paste it into the Google review box.</span>
        </div>
        <button className="glass-toast__dismiss" type="button" aria-label="Dismiss" onClick={() => setCopied(false)}>×</button>
      </div>
    </div>
  );
}
