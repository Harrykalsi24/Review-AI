import React, { useEffect, useState } from 'react';

export const AI_LOADER_CYCLE_SECONDS = 1.6;

export interface AILoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'dots' | 'bar' | 'grid';
  showElapsed?: boolean;
  label?: string;
  text?: string;
}

/**
 * Quiet loading state: a solid accent square, the label, and an
 * optional elapsed timer in mono. No looping pulse, grid or bar —
 * nothing here is live, so nothing animates.
 */
export default function AILoader({
  showElapsed = false,
  label,
  text,
  className = '',
  ...props
}: AILoaderProps) {
  const displayText = label || text || 'Writing your review';
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!showElapsed) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showElapsed]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={displayText}
      className={`inline-flex items-center gap-2 text-sm font-medium text-accent-deep ${className}`}
      {...props}
    >
      <span aria-hidden className="w-2 h-2 shrink-0 rounded-[2px] bg-accent" />
      <span>{displayText}</span>
      {showElapsed && (
        <span className="font-mono text-xs text-muted tabular-nums">
          {formatTime(seconds)}
        </span>
      )}
    </div>
  );
}
