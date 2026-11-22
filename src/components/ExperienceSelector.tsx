import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ExperienceOption } from '../types';

interface Props {
  options: ExperienceOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function ExperienceSelector({ options, selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const enabled = [...options].filter(o => o.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-wrap gap-2">
      {enabled.map(opt => {
        const isSelected = selected.includes(opt.id);
        return (
          <motion.button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
