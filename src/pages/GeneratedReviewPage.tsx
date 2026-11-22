import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ExternalLink,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import type { ReviewLength, AdminSettings, QuestionnaireData } from '../types';
import { generateReview } from '../services/aiService';

interface Props {
  data: QuestionnaireData;
  settings: AdminSettings;
  onBack: () => void;
}

const LENGTH_OPTIONS: { value: ReviewLength; label: string; desc: string }[] = [
  { value: 'short', label: 'Short', desc: '~30 words' },
  { value: 'balanced', label: 'Balanced', desc: '~70 words' },
  { value: 'detailed', label: 'Detailed', desc: '~120 words' },
];

export default function GeneratedReviewPage({ data, settings, onBack }: Props) {
  const [reviewLength, setReviewLength] = useState<ReviewLength>('balanced');
  const [reviewText, setReviewText] = useState<string>('');
  const [stars, setStars] = useState<number>(data.starRating || 5);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);

  useEffect(() => {
    fetchReview('balanced');
  }, []);

  const fetchReview = async (len: ReviewLength) => {
    setLoading(true);
    setReviewLength(len);
    try {
      const res = await generateReview({ ...data, starRating: stars }, len, settings, err => {
        console.warn('AI note:', err);
      });
      setReviewText(res.text);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const res = document.execCommand('copy');
      document.body.removeChild(el);
      return res;
    } catch {
      return false;
    }
  };

  const handleManualCopy = async () => {
    const ok = await copyToClipboard(reviewText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const targetUrl = settings.googleReviewUrl && settings.googleReviewUrl.includes('modern+electronics')
    ? settings.googleReviewUrl
    : 'https://www.google.com/search?sca_esv=b0c5f1cb68949abc&sxsrf=AKL5yDjXKyBwRHZI6l5D_Gr7yVJaVaScPQ:1795345389939&q=modern+electronics+mukerian+reviews&si=AE1YtOqiKPb2pdLXAi8quZ9vbH4aVq_aX8-3H9iFBLpRNK95c5QMlqd4pgBonGaW2_OMYweIHovXhYkdILFdz9FV1GYPDeEu_as-jAA8i7uQkfDu5MN5zRRv6hVZL82TK5tD69XxaqgTTnInXERJcBvntLDBqwi0Sw%3D%3D&sa=X&ved=2ahUKEwiLlN3htpuYAxW7DjQIHQEXBnsQyNoBKAB6BAgeEAA&ictx=1&biw=1366&bih=617&dpr=1';

  const handlePostReview = () => {
    // 1. Copy review text to clipboard immediately
    copyToClipboard(reviewText);
    setCopied(true);
    setShowPostModal(true);
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Make Changes</span>
          </button>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60 uppercase tracking-wider">
            Review Ready
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-5">
        {/* Review Card styled like Google Review form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Card Top */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-slate-900">{settings.businessName}</p>
              <p className="text-[11px] text-slate-500">{settings.businessAddress}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-blue-600 shadow-xs">
              G
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* User header banner */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                ME
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Your Google Review</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>Public review on Google Maps</span>
                </div>
              </div>
            </div>

            {/* Selected Star Rating */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                      className="p-1 transition-transform active:scale-90"
                      aria-label={`${s} stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-blue-600">
                {starLabels[stars]} ({stars} / 5 Stars)
              </p>
            </div>

            {/* Length Variation options */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => fetchReview(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      reviewLength === opt.value
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>New Variation</span>
              </button>
            </div>

            {/* Textarea with auto-pasted review */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Review Text (Auto-pasted below):
                </label>
                <span className="text-[11px] text-slate-400">Click text to edit</span>
              </div>

              <div className="relative">
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Review text will appear here..."
                  rows={6}
                  className="w-full px-4 py-3 text-xs leading-relaxed text-slate-800 bg-white border border-blue-400 rounded-2xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner font-normal"
                />

                {loading && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 text-blue-600 font-semibold text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Writing unique review variation...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Tailored to your selected products. You can freely edit any part.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePostReview}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Post Review on Google</span>
              </a>

              <button
                type="button"
                onClick={handleManualCopy}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  copied
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
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
              className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4.5 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Review Copied to Clipboard!</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Google is opening in your browser. Since websites cannot automatically submit Google reviews on your behalf, simply <strong>paste (Ctrl+V / Long-press Paste)</strong> your copied review into the Google review box, check your <strong>{stars}-star rating</strong>, and hit Submit!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Click here if review page didn't open</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg bg-emerald-100/60 hover:bg-emerald-100 transition-colors"
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
