import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProgressIndicator from '../components/ProgressIndicator';
import ProductSelector from '../components/ProductSelector';
import ExperienceSelector from '../components/ExperienceSelector';
import OverallExperienceSelector from '../components/OverallExperienceSelector';
import type { QuestionnaireData, Product, ExperienceOption } from '../types';

interface Props {
  initialData?: QuestionnaireData | null;
  products: Product[];
  experiences: ExperienceOption[];
  onComplete: (data: QuestionnaireData) => void;
  onBack: () => void;
}

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
};

export default function QuestionnairePage({ initialData, products, experiences, onComplete, onBack }: Props) {
  const [step, setStep] = useState(initialData?.selectedProducts?.length ? 4 : 1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<QuestionnaireData>(() => initialData || {
    selectedProducts: [],
    selectedExperiences: [],
    purchasedProduct: '',
    appreciated: '',
    improvement: '',
    additionalComments: '',
    overallExperience: '',
    starRating: 5,
  });

  const goNext = () => {
    if (step < TOTAL_STEPS) { setDirection(1); setStep(s => s + 1); }
    else onComplete(data);
  };

  const goBack = () => {
    if (step > 1) { setDirection(-1); setStep(s => s - 1); }
    else onBack();
  };

  const canContinue = () => {
    if (step === 1) return data.selectedProducts.length > 0;
    return true;
  };

  const stepTitles = ['What did you purchase?', 'What did you like?', 'Tell us more', 'Overall experience'];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={goBack} className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-sm font-semibold text-slate-700 pr-7">
            Your Experience
          </h1>
        </div>
        <ProgressIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 overflow-y-auto px-4 py-6"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-1">{stepTitles[step - 1]}</h2>

            {step === 1 && (
              <>
                <p className="text-sm text-slate-500 mb-4">Select all that apply</p>
                <ProductSelector
                  products={products}
                  selected={data.selectedProducts}
                  onChange={v => setData(d => ({ ...d, selectedProducts: v }))}
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-slate-500 mb-4">Select all that apply</p>
                <ExperienceSelector
                  options={experiences}
                  selected={data.selectedExperiences}
                  onChange={v => setData(d => ({ ...d, selectedExperiences: v }))}
                />
              </>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-500 -mt-1">All fields are optional</p>
                {[
                  { key: 'purchasedProduct', label: 'What specific product did you buy?', placeholder: 'e.g. Samsung Galaxy S24, LG Refrigerator...' },
                  { key: 'appreciated', label: 'What did you particularly appreciate?', placeholder: 'Share what stood out for you...' },
                  { key: 'improvement', label: 'Anything we could improve?', placeholder: 'Your honest feedback helps us...' },
                  { key: 'additionalComments', label: 'Any additional comments?', placeholder: 'Anything else you\'d like to share...' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                    <textarea
                      value={data[field.key as keyof QuestionnaireData] as string}
                      onChange={e => setData(d => ({ ...d, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-slate-300 text-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}

            {step === 4 && (
              <>
                <p className="text-sm text-slate-500 mb-4">How would you describe your visit?</p>
                <OverallExperienceSelector
                  value={data.overallExperience || ''}
                  onChange={v => setData(d => ({ ...d, overallExperience: v }))}
                />
              </>
            )}

            <div className="h-24" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
        <motion.button
          onClick={goNext}
          disabled={!canContinue()}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-sm transition-all ${
            canContinue()
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          whileTap={canContinue() ? { scale: 0.98 } : {}}
        >
          {step === TOTAL_STEPS ? 'Generate My Review' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
