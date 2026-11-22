import { motion } from 'framer-motion';

interface Props { current: number; total: number; }

export default function ProgressIndicator({ current, total }: Props) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500">Step {current} of {total}</span>
        <span className="text-xs font-medium text-blue-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
