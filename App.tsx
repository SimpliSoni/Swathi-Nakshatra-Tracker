import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface NakshatraPeriod {
  start: Date;
  end: Date;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Constants for Nakshatra calculations
const NAKSHATRA_SPAN_DEGREES = 360 / 27;
const SWATHI_START_DEGREES = (15 - 1) * NAKSHATRA_SPAN_DEGREES; // 186.67°
const SWATHI_END_DEGREES = 15 * NAKSHATRA_SPAN_DEGREES; // 200°

// Ayanamsha calculation
const getLahiriAyanamsha = (date: Date): number => {
  const AYANAMSHA_AT_J2000 = 23.85575;
  const J2000 = new Date('2000-01-01T12:00:00Z');
  const PRECESSION_RATE_DEG_PER_YEAR = 50.29 / 3600;
  const yearsSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return AYANAMSHA_AT_J2000 + (yearsSinceJ2000 * PRECESSION_RATE_DEG_PER_YEAR);
};

// Simplified moon position calculation (approximation)
const getMoonSiderealLongitude = (date: Date): number => {
  // This is a simplified lunar longitude calculation
  // Moon completes orbit in ~27.32 days
  const LUNAR_MONTH = 27.321661;
  const EPOCH = new Date('2000-01-01T12:00:00Z');
  
  const daysSinceEpoch = (date.getTime() - EPOCH.getTime()) / (1000 * 60 * 60 * 24);
  const cycles = daysSinceEpoch / LUNAR_MONTH;
  
  // Starting position + motion
  const tropicalLongitude = (218.316 + (360 * (cycles % 1))) % 360;
  const ayanamsha = getLahiriAyanamsha(date);
  
  let siderealLongitude = tropicalLongitude - ayanamsha;
  if (siderealLongitude < 0) siderealLongitude += 360;
  if (siderealLongitude >= 360) siderealLongitude -= 360;
  
  return siderealLongitude;
};

const isSwathi = (longitude: number): boolean => {
  return longitude >= SWATHI_START_DEGREES && longitude < SWATHI_END_DEGREES;
};

// Find Swathi period
const findCurrentOrNextSwathiPeriod = async (startDate: Date): Promise<NakshatraPeriod> => {
  let currentDate = new Date(startDate);
  const coarseStep = 60 * 60 * 1000; // 1 hour
  const fineStep = 60 * 1000; // 1 minute
  
  let longitude = getMoonSiderealLongitude(currentDate);
  
  // If currently in Swathi, find start and end
  if (isSwathi(longitude)) {
    let startFinder = new Date(currentDate);
    
    // Find start by going backwards
    while (isSwathi(getMoonSiderealLongitude(startFinder))) {
      startFinder = new Date(startFinder.getTime() - coarseStep);
    }
    while (!isSwathi(getMoonSiderealLongitude(startFinder))) {
      startFinder = new Date(startFinder.getTime() + fineStep);
    }
    const periodStart = startFinder;
    
    // Find end by going forwards
    let endFinder = new Date(currentDate);
    while (isSwathi(getMoonSiderealLongitude(endFinder))) {
      endFinder = new Date(endFinder.getTime() + coarseStep);
    }
    while (isSwathi(getMoonSiderealLongitude(new Date(endFinder.getTime() - fineStep)))) {
      endFinder = new Date(endFinder.getTime() - fineStep);
    }
    const periodEnd = endFinder;
    
    return { start: periodStart, end: periodEnd };
  }
  
  // Find next Swathi period
  let searchDate = new Date(currentDate);
  while (!isSwathi(getMoonSiderealLongitude(searchDate))) {
    searchDate = new Date(searchDate.getTime() + coarseStep);
  }
  while (!isSwathi(getMoonSiderealLongitude(new Date(searchDate.getTime() - fineStep)))) {
    searchDate = new Date(searchDate.getTime() - fineStep);
  }
  const periodStart = searchDate;
  
  // Find end
  let endFinder = new Date(periodStart);
  while (isSwathi(getMoonSiderealLongitude(endFinder))) {
    endFinder = new Date(endFinder.getTime() + coarseStep);
  }
  while (isSwathi(getMoonSiderealLongitude(new Date(endFinder.getTime() - fineStep)))) {
    endFinder = new Date(endFinder.getTime() - fineStep);
  }
  const periodEnd = endFinder;
  
  return { start: periodStart, end: periodEnd };
};

// Countdown calculation
const calculateCountdown = (targetDate: Date | null): CountdownState => {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const difference = targetDate.getTime() - new Date().getTime();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
};

// Starfield Component
const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars: Array<{x: number; y: number; size: number; speed: number}> = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
      });
    }
    
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 0, 26, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

// Countdown Component
const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-4xl sm:text-6xl font-bold text-white tracking-wider">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-widest mt-1">
      {label}
    </span>
  </div>
);

const Countdown: React.FC<{ countdown: CountdownState }> = ({ countdown }) => (
  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto">
    <CountdownUnit value={countdown.days} label="Days" />
    <CountdownUnit value={countdown.hours} label="Hours" />
    <CountdownUnit value={countdown.minutes} label="Mins" />
    <CountdownUnit value={countdown.seconds} label="Secs" />
  </div>
);

// Notification Manager
const NotificationManager: React.FC<{ isSwathiActive: boolean; nextSwathiStart: Date | null }> = ({ 
  isSwathiActive, 
  nextSwathiStart 
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastNotified, setLastNotified] = useState<number | null>(null);
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    const status = await Notification.requestPermission();
    setPermission(status);
  }, []);
  
  useEffect(() => {
    if (
      isSwathiActive && 
      permission === 'granted' && 
      nextSwathiStart &&
      nextSwathiStart.getTime() !== lastNotified
    ) {
      new Notification('Swathi Nakshatra is Active', {
        body: 'The auspicious period has begun. Embrace the celestial energy.',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gold"><path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z"/></svg>'
      });
      setLastNotified(nextSwathiStart.getTime());
    }
  }, [isSwathiActive, permission, nextSwathiStart, lastNotified]);
  
  if (!('Notification' in window)) return null;
  
  const getButtonConfig = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Notifications Enabled', disabled: true, className: 'bg-green-500/20 text-green-300' };
      case 'denied':
        return { text: 'Notifications Blocked', disabled: true, className: 'bg-red-500/20 text-red-300' };
      default:
        return { text: 'Enable Notifications', disabled: false, className: 'bg-white/10 hover:bg-white/20 text-white' };
    }
  };
  
  const config = getButtonConfig();
  
  return (
    <div className="flex justify-center">
      <button
        onClick={requestPermission}
        disabled={config.disabled}
        className={`w-full max-w-xs flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${config.className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span>{config.text}</span>
      </button>
    </div>
  );
};

// Main App
const App: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<NakshatraPeriod | null>(null);
  const [isSwathiActive, setIsSwathiActive] = useState(false);
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const calculatePeriod = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const period = await findCurrentOrNextSwathiPeriod(date);
      setActivePeriod(period);
    } catch (err) {
      setError('Failed to calculate Swathi period');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    calculatePeriod(new Date());
  }, [calculatePeriod]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      if (activePeriod) {
        const isActive = now >= activePeriod.start && now <= activePeriod.end;
        setIsSwathiActive(isActive);
        
        if (isActive) {
          setCountdown(calculateCountdown(activePeriod.end));
        } else if (now > activePeriod.end) {
          calculatePeriod(now);
        } else {
          setCountdown(calculateCountdown(activePeriod.start));
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activePeriod, calculatePeriod]);
  
  const targetDate = isSwathiActive ? activePeriod?.end : activePeriod?.start;
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a001a] via-[#10002b] to-[#0a001a] text-white">
      <Starfield />
      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/10">
            <div className="p-8 sm:p-10 text-center">
              <header className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-cyan-300">
                  Swathi Nakshatra
                </h1>
                <p className="text-base text-white/60 mt-2">Celestial Guide</p>
              </header>
              
              {!isLoading && !error && (
                <div className="flex justify-center my-8">
                  <div className={`flex items-center space-x-2 rounded-full px-4 py-1.5 text-sm font-medium ${
                    isSwathiActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    <span className="relative flex h-3 w-3">
                      {isSwathiActive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        isSwathiActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}></span>
                    </span>
                    <span>{isSwathiActive ? 'Currently Active' : 'Upcoming'}</span>
                  </div>
                </div>
              )}
              
              <section className="min-h-[150px] flex flex-col justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-white/50 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-white/70">Calculating celestial positions...</p>
                  </div>
                ) : error ? (
                  <div className="text-red-400">
                    <p>{error}</p>
                    <button 
                      onClick={() => calculatePeriod(new Date())}
                      className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg text-white/70 mb-2">
                      {isSwathiActive ? "Time remaining in current period" : "Time until next period"}
                    </h2>
                    {targetDate && (
                      <p className="text-sm text-white/50 mb-4 px-2">
                        {isSwathiActive ? 'Ends on ' : 'Starts on '}
                        {targetDate.toLocaleString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    <Countdown countdown={countdown} />
                  </>
                )}
              </section>
            </div>
            
            <footer className="border-t border-white/10 px-8 py-6">
              {!isLoading && !error && (
                <NotificationManager 
                  isSwathiActive={isSwathiActive} 
                  nextSwathiStart={activePeriod?.start ?? null} 
                />
              )}
              <p className="text-center text-xs text-white/40 mt-4">
                *Calculations are approximate. For devotional use only.
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
