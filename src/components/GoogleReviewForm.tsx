import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { ReviewLength, AdminSettings } from '../types';

interface Props {
  initialText: string;
  initialStars: number;
  length: ReviewLength;
  settings: AdminSettings;
  loading: boolean;
  onRegenerate: (len: ReviewLength) => void;
  onBack: () => void;
}

const LENGTH_OPTIONS: { value: ReviewLength; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
];

export default function GoogleReviewForm({
  initialText,
  initialStars,
  length,
  settings,
  loading,
  onRegenerate,
  onBack,
}: Props) {
  const [reviewText, setReviewText] = useState(initialText);
  const [stars, setStars] = useState(initialStars || 5);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setReviewText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (initialStars > 0) setStars(initialStars);
  }, [initialStars]);

  const copyToClipboard = async (text: string) => {
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
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    if (!reviewText.trim()) return;
    const ok = await copyToClipboard(reviewText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSubmit = async () => {
    if (!reviewText.trim()) return;
    await copyToClipboard(reviewText);
    setSubmitted(true);
    // If googleReviewUrl configured, offer direct open
    if (settings.googleReviewUrl) {
      setTimeout(() => {
        window.open(settings.googleReviewUrl, '_blank', 'noopener,noreferrer');
      }, 700);
    }
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col"
    >
      {/* Google Review Modal Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:bg-slate-200/60 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-slate-900">{settings.businessName}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                Google Review
              </span>
            </div>
            <p className="text-xs text-slate-500">{settings.businessAddress}</p>
          </div>
        </div>

        {/* Google G logo indicator */}
        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-sm text-blue-600">
          G
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* User preview header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            ME
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-800">Your Google Account</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Globe className="w-3 h-3 text-slate-400" />
              <span>Posting publicly across Google</span>
            </div>
          </div>
        </div>

        {/* Interactive Star Rating */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Selected Star Rating
          </p>
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
                    className={`w-9 h-9 transition-colors ${
                      active
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-xs font-semibold text-blue-600">
            {stars > 0 ? `${starLabels[stars]} (${stars} / 5 Stars)` : 'Select your stars'}
          </p>
        </div>

        {/* Length variation chips & regenerate */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {LENGTH_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRegenerate(opt.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  length === opt.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onRegenerate(length)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            New Variation
          </button>
        </div>

        {/* Text Area with auto-pasted review */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Review Text (Auto-pasted)</label>
            <span className="text-[11px] text-slate-400">Freely editable</span>
          </div>

          <div className="relative">
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share details of your own experience at this place..."
              rows={6}
              className="w-full px-4 py-3.5 text-sm text-slate-800 bg-white border-2 border-blue-400/50 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all leading-relaxed shadow-inner"
            />

            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Writing fresh variation...
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>AI tailored this to your selected items. Feel free to tweak before posting.</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                copied
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Review Text'}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
            >
              <span>Submit / Post</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submission Feedback notification */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Review copied and ready!</span>
                </div>
                <p className="text-green-700 text-[11px] leading-relaxed">
                  Your review has been copied to your clipboard. If the official Google page opened, paste it into the Google review box and confirm your {stars}-star rating!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
