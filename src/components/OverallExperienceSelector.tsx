import { motion } from 'framer-motion';
import { OVERALL_OPTIONS } from '../types';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function OverallExperienceSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {OVERALL_OPTIONS.map(opt => {
        const isSelected = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => onChange(isSelected ? '' : opt.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
