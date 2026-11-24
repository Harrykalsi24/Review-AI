import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Star,
  RefreshCw,
  Check,
  Sparkles,
  ClipboardCheck,
  Globe,
} from 'lucide-react';
import type { QuestionnaireData, AdminSettings, ReviewLength } from '../types';
import { generateReview, generateLocalFallbackReview } from '../services/aiService';
import AILoader from '../components/smoothui/components/ai-loader';

interface Props {
  data: QuestionnaireData;
  settings: AdminSettings;
  onBack: () => void;
}

const LENGTH_OPTIONS: { label: string; value: ReviewLength }[] = [
  { label: 'Short', value: 'short' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Detailed', value: 'detailed' },
];

export default function GeneratedReviewPage({ data, settings, onBack }: Props) {
  const [stars, setStars] = useState<number>(data.starRating);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [reviewLength, setReviewLength] = useState<ReviewLength>('balanced');
  const [reviewText, setReviewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);

  const starLabels: Record<number, string> = {
    5: 'Excellent experience',
    4: 'Very good experience',
    3: 'Average experience',
    2: 'Needs improvement',
    1: 'Poor experience',
  };

  const fetchReview = async (len: ReviewLength) => {
    setLoading(true);
    setReviewLength(len);
    try {
      const generated = await generateReview(
        { ...data, starRating: stars },
        len,
        settings
      );
      setReviewText(generated.text);
    } catch {
      const fallbackText = generateLocalFallbackReview(
        { ...data, starRating: stars },
        len,
        settings.businessName
      );
      setReviewText(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview(reviewLength);
  }, []);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
    <div className="min-h-screen bg-paper pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-rule sticky top-0 z-20 shadow-card">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink px-2.5 py-1.5 rounded-xl bg-paper-2 transition-colors motion-reduce:transition-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Make Changes</span>
          </button>
          <span className="text-xs font-bold text-accent-deep bg-paper-2 px-3 py-1 rounded-full border border-paper-3 shadow-2xs">
            Review Ready
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Review Card styled like Google Review form */}
        <div className="bg-white rounded-2xl border border-rule shadow-card overflow-hidden flex flex-col">
          {/* Card Top */}
          <div className="bg-paper-2 border-b border-rule px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-rule flex items-center justify-center shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs text-ink">ME</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-ink">{settings.businessName}</p>
                <p className="text-xs text-muted">{settings.businessAddress}</p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* User header banner */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent-deep text-white font-bold flex items-center justify-center text-xs shadow-xs">
                ME
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Your Google Review</p>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Globe className="w-3.5 h-3.5 text-muted" />
                  <span>Public review on Google Maps</span>
                </div>
              </div>
            </div>

            {/* Selected Star Rating */}
            <div className="bg-paper-2 rounded-xl p-3 border border-rule flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-muted">
                Your Rating
              </span>
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
                      className="p-1 rounded-lg transition-transform active:scale-90 motion-reduce:transition-none hover:-translate-y-0.5"
                      aria-label={`${s} stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors motion-reduce:transition-none ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-rule stroke-[1.5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-ink">
                {starLabels[stars]} ({stars} / 5 Stars)
              </p>
            </div>

            {/* Length Variation options */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-paper-2 p-1 rounded-xl border border-rule">
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => fetchReview(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors motion-reduce:transition-none ${
                      reviewLength === opt.value
                        ? 'bg-white text-ink shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchReview(reviewLength)}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-ink bg-paper-2 hover:bg-paper-3 rounded-xl border border-rule transition-colors motion-reduce:transition-none disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>New Variation</span>
              </button>
            </div>

            {/* Textarea with auto-pasted review */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink">
                  Review Text:
                </label>
                <span className="text-xs text-muted">Click text to edit</span>
              </div>

              <div className="relative">
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Review text will appear here…"
                  rows={6}
                  className="w-full px-4 py-3 text-xs leading-relaxed text-ink bg-white border border-rule rounded-xl focus:border-ink focus:outline-none transition-colors motion-reduce:transition-none shadow-inner font-normal"
                />

                {loading && (
                  <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center p-4">
                    <AILoader
                      variant="grid"
                      label="Writing review variation..."
                      showElapsed
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Tailored to your selected products. You can freely edit any part.</span>
              </div>
            </div>

            {/* Action Buttons: Uiverse tactile styled buttons */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-rule">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePostReview}
                className="w-full py-4 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 tactile-button"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>Post Review on Google</span>
              </a>

              <button
                type="button"
                onClick={handleManualCopy}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border tactile-btn-secondary ${
                  copied
                    ? 'bg-paper-2 text-success border-success'
                    : 'bg-white text-ink-2 border-rule hover:bg-paper-2'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Review Text Manually'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Helpful instructions modal / banner */}
        <AnimatePresence>
          {showPostModal && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-paper-2 border border-rule rounded-2xl p-4.5 flex flex-col gap-3 shadow-card"
            >
              <div className="flex items-center gap-2 font-bold text-ink text-sm">
                <ClipboardCheck className="w-5 h-5 text-success shrink-0" />
                <span>Review Copied to Clipboard!</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                Google is opening in your browser. Since websites cannot automatically submit Google reviews on your behalf, simply <strong>paste (Ctrl+V / Long-press Paste)</strong> your copied review into the Google review box, check your <strong>{stars}-star rating</strong>, and hit Submit!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-rule">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-xs font-bold text-ink hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted" />
                  <span>Click here if review page didn’t open</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="text-xs font-bold text-muted hover:text-ink px-3 py-1 rounded-lg bg-paper border border-rule transition-colors motion-reduce:transition-none"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
