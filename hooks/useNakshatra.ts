import { useState, useEffect, useCallback } from 'react';
import type { NakshatraPeriod, CountdownState } from '../types';
import { findCurrentOrNextSwathiPeriod } from '../utils/nakshatra-calculator';

const calculateCountdown = (targetDate: Date | null): CountdownState => {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return { days, hours, minutes, seconds };
};

export const useNakshatra = () => {
  const [activePeriod, setActivePeriod] = useState<NakshatraPeriod | null>(null);
  const [isSwathiActive, setIsSwathiActive] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const calculateAndSetPeriod = useCallback(async (currentDate: Date) => {
    setIsLoading(true);
    try {
      const period = await findCurrentOrNextSwathiPeriod(currentDate);
      setActivePeriod(period);
    } catch (error) {
      console.error("Failed to calculate Swathi Nakshatra period:", error);
      // Let the app continue without data instead of getting stuck.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateAndSetPeriod(new Date());
  }, [calculateAndSetPeriod]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      if (activePeriod) {
        const isActive = now >= activePeriod.start && now <= activePeriod.end;
        setIsSwathiActive(isActive);

        if (isActive) {
          setCountdown(calculateCountdown(activePeriod.end));
        } else if (now > activePeriod.end) {
          // Current period is over, find the next one
          calculateAndSetPeriod(now);
        } else {
          setCountdown(calculateCountdown(activePeriod.start));
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activePeriod, calculateAndSetPeriod]);

  return { 
    countdown, 
    isSwathiActive, 
    nextSwathiStart: activePeriod ? activePeriod.start : null, 
    currentSwathiEnd: activePeriod ? activePeriod.end : null,
    isLoading,
  };
};
