import { motion } from 'framer-motion';
import { Star, MessageSquareQuote, ArrowRight } from 'lucide-react';
import type { AdminSettings } from '../types';

interface Props {
  settings: AdminSettings;
  onStart: () => void;
}

export default function WelcomeScreen({ settings, onStart }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* Logo / Brand */}
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="logo" className="w-24 h-24 rounded-2xl object-cover shadow-md" />
        ) : (
          <motion.div
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <MessageSquareQuote className="w-12 h-12 text-white" />
          </motion.div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{settings.businessName}</h1>
          <p className="text-sm text-slate-500 mt-1">{settings.businessAddress}</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 w-full">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Share Your Experience</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Tell us about your shopping experience.<br />
            We'll help you put it into words.
          </p>
          <div className="flex justify-center gap-1 mt-4">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        </div>

        <motion.button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-2xl transition-colors shadow-md shadow-blue-200"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
          Your review will help other customers and reflects your honest experience. 
          You'll always have a chance to review and edit before posting.
        </p>
      </div>
    </motion.div>
  );
}
