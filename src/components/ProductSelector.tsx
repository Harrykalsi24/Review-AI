import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Product } from '../types';
import ProductIcon from './ProductIcon';

interface Props {
  products: Product[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function ProductSelector({ products, selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  const enabled = [...products].filter(p => p.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-2 gap-3">
      {enabled.map(product => {
        const isSelected = selected.includes(product.id);
        return (
          <motion.button
            key={product.id}
            onClick={() => toggle(product.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-sm shadow-blue-100'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
            }`}
            whileTap={{ scale: 0.96 }}
          >
            {isSelected && (
              <motion.div
                className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
            <ProductIcon
              iconName={product.icon || product.id}
              className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}
            />
            <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
              {product.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
