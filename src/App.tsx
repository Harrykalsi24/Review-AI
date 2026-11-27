import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SinglePageReviewApp from './pages/SinglePageReviewApp';
import GeneratedReviewPage from './pages/GeneratedReviewPage';
import AdminPage from './pages/AdminPage';
import { useSettings } from './hooks/useSettings';
import type { QuestionnaireData } from './types';
import { X } from 'lucide-react';

type Screen = 'questionnaire' | 'review' | 'admin';

// Changeable at build time via VITE_ADMIN_PIN. Default stays 1234 so existing
// kiosks keep working; this is a kiosk deterrent, not real authentication —
// the API key is already client-side, so never treat the PIN as security.
const ADMIN_PIN =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_ADMIN_PIN as string | undefined)) ||
  '1234';

export default function App() {
  const [screen, setScreen] = useState<Screen>('questionnaire');
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const { settings, products, experiences, saveSettings, saveProducts, saveExperiences } = useSettings();
  const tapResetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(tapResetTimer.current), []);

  // Native <dialog> for the PIN modal: open/close it imperatively.
  const pinDialogRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const dialog = pinDialogRef.current;
    if (!dialog) return;
    if (showPinModal && !dialog.open) dialog.showModal();
    if (!showPinModal && dialog.open) dialog.close();
  }, [showPinModal]);

  // The engine only sees markup that exists when it runs. React swaps
  // screens, so re-scan after every screen change; init() skips elements
  // it already enhanced.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.LiquidGlass?.init());
    return () => cancelAnimationFrame(id);
  }, [screen]);

  const handleAdminTap = () => {
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (next >= 5) {
      setShowPinModal(true);
      setAdminTapCount(0);
      setPinInput('');
      setPinError('');
      window.clearTimeout(tapResetTimer.current);
      return;
    }
    window.clearTimeout(tapResetTimer.current);
    tapResetTimer.current = window.setTimeout(() => setAdminTapCount(0), 3000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setShowPinModal(false);
      setScreen('admin');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  };

  return (
    <div className="font-sans antialiased text-ink min-h-screen relative">
      {/* Admin PIN modal: native <dialog>, Liquid Glass panel. */}
      <dialog
        ref={pinDialogRef}
        className="glass-modal"
        aria-labelledby="pin-title"
        onClose={() => setShowPinModal(false)}
        onClick={e => {
          if (e.target === e.currentTarget) setShowPinModal(false);
        }}
      >
        <div className="glass-modal__panel" data-refract data-refract-bezel="28">
          <header className="glass-modal__header">
            <h2 className="glass-modal__title" id="pin-title">
              Admin access
            </h2>
            <button
              type="button"
              onClick={() => setShowPinModal(false)}
              className="glass-btn glass-btn--plain glass-btn--icon glass-btn--sm"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="glass-modal__body">
            Enter the admin PIN to change store and AI settings.
          </div>

          <form onSubmit={handlePinSubmit} className="flex flex-col gap-3 mt-4">
            <input
              type="password"
              autoFocus
              maxLength={6}
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              placeholder="Enter PIN"
              className="field w-full text-center font-mono text-base py-2.5 px-3"
            />

            {pinError && (
              <p className="text-xs font-medium text-error text-center">
                {pinError}
              </p>
            )}

            <div className="glass-modal__actions">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="glass-btn glass-btn--plain"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glass-btn glass-btn--plain glass-btn--prominent"
              >
                Open settings
              </button>
            </div>
          </form>
        </div>
      </dialog>

      <AnimatePresence mode="wait">
        {screen === 'questionnaire' && (
          <SinglePageReviewApp
            key="questionnaire-page"
            products={products}
            experiences={experiences}
            settings={settings}
            initialData={questionnaireData}
            onGenerate={(data: QuestionnaireData) => {
              setQuestionnaireData(data);
              setScreen('review');
            }}
            onAdminTap={handleAdminTap}
          />
        )}

        {screen === 'review' && questionnaireData && (
          <GeneratedReviewPage
            key="review-page"
            data={questionnaireData}
            settings={settings}
            onBack={() => setScreen('questionnaire')}
            onAdminTap={handleAdminTap}
          />
        )}

        {screen === 'admin' && (
          <AdminPage
            key="admin-page"
            settings={settings}
            products={products}
            experiences={experiences}
            onSaveSettings={saveSettings}
            onSaveProducts={saveProducts}
            onSaveExperiences={saveExperiences}
            onBack={() => setScreen('questionnaire')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
