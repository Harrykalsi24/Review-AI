import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value);
        return (
          <motion.button
            key={star}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            whileTap={{ scale: 0.85 }}
            className="p-1"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
