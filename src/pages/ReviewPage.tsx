import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Copy, Check, ExternalLink, Loader2, Edit3, AlertCircle } from 'lucide-react';
import StarRating from '../components/StarRating';
import { generateReview } from '../services/aiService';
import type { QuestionnaireData, ReviewLength, AdminSettings } from '../types';

interface Props {
  data: QuestionnaireData;
  settings: AdminSettings;
  onBack: () => void;
}

const LENGTH_OPTIONS: { value: ReviewLength; label: string; desc: string }[] = [
  { value: 'short', label: 'Short', desc: '30–50 words' },
  { value: 'balanced', label: 'Balanced', desc: '60–100 words' },
  { value: 'detailed', label: 'Detailed', desc: '100–150 words' },
];

export default function ReviewPage({ data, settings, onBack }: Props) {
  const [length, setLength] = useState<ReviewLength>('balanced');
  const [review, setReview] = useState('');
  const [starRating, setStarRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [redirected, setRedirected] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    handleGenerate(length);
  }, []);

  const handleGenerate = async (lenToUse: ReviewLength = length) => {
    setLoading(true);
    setError('');
    try {
      const res = await generateReview(data, lenToUse, settings, (msg) => {
        console.warn('AI generation note:', msg);
      });
      setReview(res.text);
      setIsFallback(!!res.isFallback);
      setManualMode(false);
    } catch (e: any) {
      setError(e.message || 'Could not generate draft. Please write your review below.');
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLengthChange = (newLen: ReviewLength) => {
    setLength(newLen);
    handleGenerate(newLen);
  };

  const copyText = async (text: string): Promise<boolean> => {
    if (!text) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('Fallback needed');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const handleCopy = async () => {
    if (!review.trim()) return;
    const ok = await copyText(review);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoToGoogle = async () => {
    const url = settings.googleReviewUrl;
    if (!url) {
      setError('Google review URL is not configured. Please ask the administrator to set it up in Settings.');
      return;
    }
    if (review.trim()) {
      await copyText(review);
    }
    setRedirected(true);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold text-slate-700 pr-7">Your Review</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
        {/* Length selector */}
        {!manualMode && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Review length</p>
            <div className="flex gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleLengthChange(opt.value)}
                  className={`flex-1 py-2 px-1 rounded-xl border-2 text-center transition-all ${
                    length === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`text-xs font-semibold ${length === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</div>
                  <div className="text-xs text-slate-400">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No API key notice */}
        {!settings.aiApiKey && !manualMode && !review && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">AI not configured</p>
                <p className="text-xs text-amber-600 mt-0.5">The AI review generator isn't set up yet. You can write your review manually below.</p>
              </div>
            </div>
            <button
              onClick={() => setManualMode(true)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Write Manually
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => { setManualMode(true); setError(''); }}
                className="flex-1 py-2.5 bg-white border border-red-300 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
              >
                Write Manually
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-blue-50 rounded-2xl p-8 flex flex-col items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Loader2 className="w-8 h-8 text-blue-500" />
            </motion.div>
            <p className="text-sm text-blue-600 font-medium">Putting your experience into words...</p>
          </div>
        )}

        {/* Review text area */}
        {(review || manualMode) && !loading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {manualMode ? 'Your review' : isFallback ? 'Experience-based draft' : 'AI-generated draft'}
                </p>
                {!manualMode && (
                  <button
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-800 py-1 px-2 rounded-lg hover:bg-blue-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                )}
              </div>

              <div className="relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <Edit3 className="absolute top-3 right-3 w-4 h-4 text-slate-300 pointer-events-none" />
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder={manualMode ? "Write your review here in your own words..." : ""}
                  rows={6}
                  className="w-full px-4 py-4 pr-10 text-sm text-slate-700 bg-transparent resize-none focus:outline-none leading-relaxed placeholder-slate-300"
                />
              </div>

              {!manualMode && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  ✏️ Please review and edit this draft to make sure it accurately reflects your experience.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Generate button when manual not chosen yet */}
        {!review && !loading && !error && !manualMode && (
          <button
            onClick={() => handleGenerate()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors shadow-md shadow-blue-200"
          >
            Generate Review
          </button>
        )}

        {/* Star rating */}
        {(review || manualMode) && !loading && (
          <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-slate-700">Choose your Google star rating</p>
            <StarRating value={starRating} onChange={setStarRating} />
            {starRating === 0 && (
              <p className="text-xs text-slate-400">Tap the stars to select your rating</p>
            )}
            {starRating > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                {['', 'Very poor', 'Poor', 'Average', 'Good', 'Excellent'][starRating]} — {starRating} star{starRating > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Copy button */}
        {(review || manualMode) && review.trim() && !loading && (
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all ${
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Review'}
          </button>
        )}

        {/* Redirected success notice */}
        {redirected && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-1">Google Reviews page opened!</p>
            <p className="text-xs text-green-600 leading-relaxed">
              Your review has been copied. Paste it into Google's review box, select your star rating, and submit when you're ready.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {(review || manualMode) && !loading && (
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex flex-col gap-2">
          {!settings.googleReviewUrl && (
            <p className="text-xs text-center text-amber-500">Google review URL not configured by admin</p>
          )}
          <motion.button
            onClick={handleGoToGoogle}
            disabled={!review.trim()}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-sm transition-all ${
              review.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            whileTap={review.trim() ? { scale: 0.98 } : {}}
          >
            <ExternalLink className="w-4 h-4" />
            Continue to Google Reviews
          </motion.button>
          <p className="text-xs text-center text-slate-400">
            You'll paste your review on Google's page and submit it yourself.
          </p>
        </div>
      )}
    </div>
  );
}
