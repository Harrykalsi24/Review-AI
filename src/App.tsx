import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SinglePageReviewApp from './pages/SinglePageReviewApp';
import GeneratedReviewPage from './pages/GeneratedReviewPage';
import AdminPage from './pages/AdminPage';
import { useSettings } from './hooks/useSettings';
import type { QuestionnaireData } from './types';
import { Settings, Lock, X } from 'lucide-react';

type Screen = 'questionnaire' | 'review' | 'admin';

const ADMIN_PIN = '1234';

export default function App() {
  const [screen, setScreen] = useState<Screen>('questionnaire');
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const { settings, products, experiences, saveSettings, saveProducts, saveExperiences } = useSettings();

  const handleAdminTap = () => {
    const next = adminTapCount + 1;
    setAdminTapCount(next);
    if (next >= 5) {
      setShowPinModal(true);
      setAdminTapCount(0);
      setPinInput('');
      setPinError('');
    }
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setShowPinModal(false);
      setScreen('admin');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN code');
    }
  };

  return (
    <div className="font-sans antialiased bg-slate-50 min-h-screen relative">
      {/* Discreet 5-tap admin trigger */}
      {screen !== 'admin' && (
        <button
          onClick={handleAdminTap}
          className="fixed bottom-3 right-3 z-50 w-9 h-9 rounded-full flex items-center justify-center opacity-20 hover:opacity-70 transition-opacity bg-white shadow-sm border border-slate-200"
          aria-label="Admin Settings"
          title="Tap 5 times to open Admin Settings"
        >
          <Settings className="w-4 h-4 text-slate-500" />
        </button>
      )}

      {/* Admin PIN Authentication Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-xs w-full border border-slate-200 flex flex-col gap-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span>Admin Access</span>
                </div>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your Admin PIN to manage store configuration and AI settings.
              </p>

              <form onSubmit={handlePinSubmit} className="flex flex-col gap-3">
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Enter PIN (Default: 1234)"
                  className="w-full text-center tracking-widest text-base font-bold py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-none"
                />

                {pinError && (
                  <p className="text-[11px] font-semibold text-red-600 text-center">
                    {pinError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Open Settings
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          />
        )}

        {screen === 'review' && questionnaireData && (
          <GeneratedReviewPage
            key="review-page"
            data={questionnaireData}
            settings={settings}
            onBack={() => setScreen('questionnaire')}
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
