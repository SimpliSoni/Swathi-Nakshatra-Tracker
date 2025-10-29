import React from 'react';
import type { CountdownState } from '../types';

interface CountdownProps {
  countdown: CountdownState;
}

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-4xl sm:text-6xl font-bold text-white tracking-wider" aria-hidden="true">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-widest mt-1" aria-hidden="true">
      {label}
    </span>
  </div>
);

const Countdown: React.FC<CountdownProps> = ({ countdown }) => {
  // Announce every 5 minutes, or every second for the last minute
  const shouldAnnounce = (countdown.minutes % 5 === 0 && countdown.seconds === 0) || (countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0);
  const fullLabel = `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining.`;
  
  return (
    <div 
      className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto"
      role="timer"
      aria-live={shouldAnnounce ? "polite" : "off"}
      aria-atomic="true"
    >
      <span className="sr-only" aria-live="polite">{fullLabel}</span>
      <CountdownUnit value={countdown.days} label="Days" />
      <CountdownUnit value={countdown.hours} label="Hours" />
      <CountdownUnit value={countdown.minutes} label="Mins" />
      <CountdownUnit value={countdown.seconds} label="Secs" />
    </div>
  );
};

export default Countdown;