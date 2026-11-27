import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Star,
  Check,
  AlertCircle,
  ShoppingBag,
  ThumbsUp,
  Settings,
} from 'lucide-react';
import type { QuestionnaireData, Product, ExperienceOption, AdminSettings } from '../types';
import ProductIcon from '../components/ProductIcon';

interface Props {
  products: Product[];
  experiences: ExperienceOption[];
  settings: AdminSettings;
  initialData?: QuestionnaireData | null;
  onGenerate: (data: QuestionnaireData) => void;
  onAdminTap?: () => void;
}

export default function SinglePageReviewApp({
  products,
  experiences,
  settings,
  initialData,
  onGenerate,
  onAdminTap,
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
    5: 'Excellent',
    4: 'Good',
    3: 'Average',
    2: 'Below average',
    1: 'Poor',
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
    <div className="min-h-screen pb-16 pt-24">
      {/* Floating glass toolbar: the only glass on this screen besides
          the primary action. Content below is opaque. */}
      <header className="glass-toolbar glass-toolbar--fixed glass-sheen" data-refract>
        <div className="glass-toolbar__content">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-ink text-white flex items-center justify-center shrink-0">
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
                <Building2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <span className="glass-toolbar__brand block text-base leading-tight truncate">
                {settings.businessName}
              </span>
              <span className="flex items-center gap-1 text-xs leading-tight" style={{ color: 'var(--glass-text-secondary)' }}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{settings.businessAddress}</span>
              </span>
            </div>
          </div>
          <div className="glass-toolbar__actions">
            <span className="text-xs whitespace-nowrap hidden sm:inline" style={{ color: 'var(--glass-text-secondary)', fontFamily: 'var(--glass-font-mono)' }}>Review form</span>
            {onAdminTap && (
              <button
                type="button"
                onClick={onAdminTap}
                className="glass-toolbar__btn"
                aria-label="Admin settings"
                title="Tap 5 times to open admin settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Rating */}
          <section className="content-card p-6 flex flex-col items-center gap-4">
            <div className="text-center flex flex-col gap-1">
              <span className="font-mono text-xs text-muted">Step 1 of 3</span>
              <h2 className="font-medium text-lg text-ink">How was your visit</h2>
              <p className="text-sm text-muted">Tap a star to rate it</p>
            </div>

            <div className="flex gap-2 justify-center" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= (hoveredStar || starRating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setStarRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 rounded-lg transition-transform active:scale-95"
                    aria-label={`${star} star`}
                    aria-checked={star === starRating}
                    role="radio"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        active
                          ? 'text-amber-600 fill-amber-600'
                          : 'text-rule-2 stroke-[1.5]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-sm text-ink-2 tabular-nums">
              {starLabels[starRating] || 'Select your stars'}
            </span>
          </section>

          <div className="grid gap-6 lg:grid-cols-2 items-start">
            {/* Products */}
            <section className="content-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="content-card-inner w-8 h-8 rounded-xl text-muted flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-medium text-sm text-ink">What did you buy</h3>
                  <p className="text-xs text-muted">Choose all that apply</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {enabledProducts.map(p => {
                  const active = selectedProducts.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      aria-pressed={active}
                      className={`chip flex items-center gap-2 p-3 text-left text-sm font-medium min-h-12 ${
                        active ? 'text-ink' : 'text-ink-2'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          active ? 'bg-accent-deep border-accent-deep' : 'border-rule-2 bg-white/70'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <ProductIcon
                        iconName={p.icon || p.id}
                        className={`w-4 h-4 shrink-0 ${active ? 'text-accent-deep' : 'text-muted'}`}
                      />
                      <span className="leading-snug">{p.name}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedProducts.includes('other') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-xs font-medium text-ink">
                      Specify the other product
                    </label>
                    <input
                      type="text"
                      value={otherProductText}
                      onChange={e => setOtherProductText(e.target.value)}
                      placeholder="e.g. Inverter battery, induction cooktop"
                      className="field w-full px-3 py-2.5 text-sm text-ink placeholder:text-muted"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Experience */}
            <section className="content-card p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="content-card-inner w-8 h-8 rounded-xl text-muted flex items-center justify-center shrink-0">
                  <ThumbsUp className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-medium text-sm text-ink">What stood out</h3>
                  <p className="text-xs text-muted">Choose anything that applied</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {enabledExperiences.map(e => {
                  const active = selectedExperiences.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleExperience(e.id)}
                      aria-pressed={active}
                      className={`chip inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${
                        active ? 'text-ink' : 'text-ink-2'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          active ? 'bg-accent-deep border-accent-deep' : 'border-rule-2 bg-white/70'
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      <span>{e.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedExperiences.includes('other') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-xs font-medium text-ink">
                      Specify what else stood out
                    </label>
                    <input
                      type="text"
                      value={otherExperienceText}
                      onChange={e => setOtherExperienceText(e.target.value)}
                      placeholder="e.g. Quick billing, ample parking"
                      className="field w-full px-3 py-2.5 text-sm text-ink placeholder:text-muted"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="content-card content-card--error p-3 flex items-center gap-2 text-sm text-error font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-error" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            data-refract
            className="glass-btn glass-btn--prominent cta w-full"
          >
            Generate review draft
          </button>
        </form>
      </main>
    </div>
  );
}
