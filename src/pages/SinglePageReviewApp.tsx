import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShoppingBag,
  ThumbsUp,
  Star,
  Check,
  AlertCircle,
  Building2,
  MapPin,
} from 'lucide-react';
import type { Product, ExperienceOption, AdminSettings, QuestionnaireData } from '../types';
import ProductIcon from '../components/ProductIcon';

interface Props {
  products: Product[];
  experiences: ExperienceOption[];
  settings: AdminSettings;
  initialData?: QuestionnaireData | null;
  onGenerate: (data: QuestionnaireData) => void;
}

export default function SinglePageReviewApp({
  products,
  experiences,
  settings,
  initialData,
  onGenerate,
}: Props) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    initialData?.selectedProducts || []
  );
  const [otherProductText, setOtherProductText] = useState<string>(
    initialData?.otherProductText || ''
  );
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>(
    initialData?.selectedExperiences || []
  );
  const [otherExperienceText, setOtherExperienceText] = useState<string>(
    initialData?.otherExperienceText || ''
  );
  const [starRating, setStarRating] = useState<number>(initialData?.starRating || 5);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!next.includes('other')) {
        setOtherProductText('');
      }
      return next;
    });
  };

  const toggleExperience = (id: string) => {
    setSelectedExperiences(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!next.includes('other')) {
        setOtherExperienceText('');
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setErrorMsg('Please select at least one product category.');
      return;
    }
    if (selectedProducts.includes('other') && !otherProductText.trim()) {
      setErrorMsg('Please enter what you purchased under "Other".');
      return;
    }
    setErrorMsg('');

    onGenerate({
      selectedProducts,
      selectedExperiences,
      otherProductText: otherProductText.trim(),
      otherExperienceText: otherExperienceText.trim(),
      starRating,
    });
  };

  const enabledProducts = [...products].filter(p => p.enabled).sort((a, b) => a.order - b.order);
  const enabledExperiences = [...experiences].filter(e => e.enabled).sort((a, b) => a.order - b.order);

  const starLabels = ['', 'Poor (1 Star)', 'Fair (2 Stars)', 'Good (3 Stars)', 'Very Good (4 Stars)', 'Excellent (5 Stars)'];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Business Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                {settings.businessName}
              </h1>
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{settings.businessAddress}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200/60 uppercase tracking-wider">
            Review Form
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Top Rating Section: STARS AT TOP */}
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center gap-3">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Step 1 of 3
              </span>
              <h2 className="font-bold text-base text-slate-900 mt-1">Rate your overall experience</h2>
              <p className="text-xs text-slate-500">Tap the stars to give your rating</p>
            </div>

            <div className="flex gap-2.5 justify-center py-1">
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= (hoveredStar || starRating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform active:scale-90"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        active
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {starLabels[starRating] || 'Select your stars'}
            </span>
          </section>

          {/* Section 2: Products */}
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">What did you purchase?</h3>
                <p className="text-[11px] text-slate-400">Select all checkboxes that apply</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {enabledProducts.map(p => {
                const active = selectedProducts.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-medium ${
                      active
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        active ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <ProductIcon
                      iconName={p.icon || p.id}
                      className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-500'}`}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Other text field if other product selected */}
            <AnimatePresence>
              {selectedProducts.includes('other') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 flex flex-col gap-1.5"
                >
                  <label className="text-xs font-semibold text-slate-700">
                    Specify the other product / appliance:
                  </label>
                  <input
                    type="text"
                    value={otherProductText}
                    onChange={e => setOtherProductText(e.target.value)}
                    placeholder="e.g. Inverter battery, Induction cooktop, Mixer grinder..."
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Section 3: Experience Highlights */}
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">What did you like about your visit?</h3>
                <p className="text-[11px] text-slate-400">Select any that you experienced</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {enabledExperiences.map(e => {
                const active = selectedExperiences.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleExperience(e.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        active ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <span>{e.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Other text field if other experience selected */}
            <AnimatePresence>
              {selectedExperiences.includes('other') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 flex flex-col gap-1.5"
                >
                  <label className="text-xs font-semibold text-slate-700">
                    Specify what else stood out:
                  </label>
                  <input
                    type="text"
                    value={otherExperienceText}
                    onChange={e => setOtherExperienceText(e.target.value)}
                    placeholder="e.g. Quick billing, ample parking, festive offer..."
                    className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-red-700 font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Generate Button */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Review Draft</span>
          </motion.button>
        </form>
      </main>
    </div>
  );
}
