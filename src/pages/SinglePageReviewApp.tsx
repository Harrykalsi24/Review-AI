import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Star,
  Check,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ThumbsUp,
} from 'lucide-react';
import type { QuestionnaireData, Product, ExperienceOption, AdminSettings } from '../types';
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
  const [starRating, setStarRating] = useState<number>(initialData?.starRating || 5);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
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
  const [errorMsg, setErrorMsg] = useState<string>('');

  const enabledProducts = products.filter(p => p.enabled);
  const enabledExperiences = experiences.filter(e => e.enabled);

  const starLabels: Record<number, string> = {
    5: 'Excellent · Best in town',
    4: 'Good · Very satisfied',
    3: 'Average · Fair experience',
    2: 'Below Average · Could improve',
    1: 'Poor · Unsatisfied',
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setErrorMsg('');
  };

  const toggleExperience = (id: string) => {
    setSelectedExperiences(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setErrorMsg('Please select at least one product or appliance');
      return;
    }
    if (selectedProducts.includes('other') && !otherProductText.trim()) {
      setErrorMsg('Please specify what other product you purchased');
      return;
    }
    if (selectedExperiences.includes('other') && !otherExperienceText.trim()) {
      setErrorMsg('Please specify what else stood out in your visit');
      return;
    }

    onGenerate({
      starRating,
      selectedProducts,
      otherProductText: otherProductText.trim(),
      selectedExperiences,
      otherExperienceText: otherExperienceText.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-rule sticky top-0 z-20 shadow-card">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-ink text-white flex items-center justify-center shadow-sm shrink-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-ink text-base leading-tight">
                {settings.businessName}
              </h1>
              <div className="flex items-center gap-1 text-muted text-xs">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span>{settings.businessAddress}</span>
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-accent-deep bg-paper-2 px-3 py-1 rounded-full border border-paper-3 shadow-2xs">
            Review Form
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Top Rating Section: STARS AT TOP */}
          <section className="bg-white rounded-3xl p-6 border border-rule/60 shadow-card flex flex-col items-center gap-3">
            <div className="text-center">
              <span className="text-xs font-bold text-accent-deep bg-paper-2 px-3 py-1 rounded-full border border-paper-3">
                Step 1 of 3
              </span>
              <h2 className="font-bold text-lg text-ink mt-2">Rate your overall experience</h2>
              <p className="text-xs text-muted">Tap the stars to give your rating</p>
            </div>

            {/* Uiverse-inspired tactile star rating row */}
            <div className="flex gap-2.5 justify-center py-2">
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= (hoveredStar || starRating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1.5 rounded-2xl transition-transform active:scale-90 motion-reduce:transition-none hover:-translate-y-1 hover:scale-105"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors motion-reduce:transition-none ${
                        active
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-slate-200 stroke-[1.5]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-ink-2 bg-paper-2 px-3.5 py-1.5 rounded-full border border-rule/50">
              {starLabels[starRating] || 'Select your stars'}
            </span>
          </section>

          {/* Section 2: Products */}
          <section className="bg-white rounded-2xl p-5 border border-rule shadow-card flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-paper-2 text-ink flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">What did you purchase?</h3>
                <p className="text-xs text-muted">Select all checkboxes that apply</p>
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
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-medium tactile-chip ${
                      active
                        ? 'border-accent-deep bg-paper-2 text-ink shadow-sm font-semibold ring-1 ring-accent-soft'
                        : 'border-rule/60 bg-white text-ink-2 hover:bg-paper-2 hover:border-rule'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none ${
                        active ? 'bg-accent-deep border-accent-deep' : 'border-rule bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <ProductIcon
                      iconName={p.icon || p.id}
                      className={`w-4 h-4 shrink-0 ${active ? 'text-accent-deep' : 'text-muted'}`}
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
                  <label className="text-xs font-semibold text-ink">
                    Specify the other product / appliance:
                  </label>
                  <input
                    type="text"
                    value={otherProductText}
                    onChange={e => setOtherProductText(e.target.value)}
                    placeholder="e.g. Inverter battery, Induction cooktop, Mixer grinder..."
                    className="w-full px-3.5 py-2.5 text-xs text-ink bg-paper-2 border border-rule rounded-xl focus:bg-white focus:outline-none transition-colors motion-reduce:transition-none placeholder:text-muted"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Section 3: Experience Highlights */}
          <section className="bg-white rounded-2xl p-5 border border-rule shadow-card flex flex-col gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-paper-2 text-ink flex items-center justify-center">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">What did you like about your visit?</h3>
                <p className="text-xs text-muted">Select any that you experienced</p>
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
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium tactile-chip ${
                      active
                        ? 'border-accent-deep bg-paper-2 text-ink font-semibold shadow-sm ring-1 ring-accent-soft'
                        : 'border-rule/60 bg-white text-ink-2 hover:bg-paper-2 hover:border-rule'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none ${
                        active ? 'bg-accent-deep border-accent-deep' : 'border-rule bg-white'
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
                  <label className="text-xs font-semibold text-ink">
                    Specify what else stood out:
                  </label>
                  <input
                    type="text"
                    value={otherExperienceText}
                    onChange={e => setOtherExperienceText(e.target.value)}
                    placeholder="e.g. Quick billing, ample parking, festive offer..."
                    className="w-full px-3.5 py-2.5 text-xs text-ink bg-paper-2 border border-rule rounded-xl focus:bg-white focus:outline-none transition-colors motion-reduce:transition-none placeholder:text-muted"
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
                className="bg-paper-2 border border-error rounded-xl p-3 flex items-center gap-2 text-xs text-error font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-error" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Generate Button: Uiverse tactile button */}
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 tactile-button"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Review Draft</span>
          </button>
        </form>
      </main>
    </div>
  );
}
