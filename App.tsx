import React from 'react';
import { useNakshatra } from './hooks/useNakshatra';
import Starfield from './components/Starfield';
import Countdown from './components/Countdown';
import NotificationManager from './components/NotificationManager';

const App: React.FC = () => {
  const { countdown, isSwathiActive, nextSwathiStart, currentSwathiEnd, isLoading } = useNakshatra();

  const targetDate = isSwathiActive ? currentSwathiEnd : nextSwathiStart;

  const StatusIndicator: React.FC = () => {
    if (isSwathiActive) {
      return (
        <div className="flex items-center space-x-2 bg-green-500/20 text-green-300 rounded-full px-4 py-1.5 text-sm font-medium">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span>Currently Active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 bg-gray-500/20 text-gray-300 rounded-full px-4 py-1.5 text-sm font-medium">
        <span className="relative flex h-3 w-3">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
        </span>
        <span>Upcoming</span>
      </div>
    );
  };
  
  const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center">
        <svg className="animate-spin h-8 w-8 text-white/50 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg text-white/70">
            Calculating celestial positions...
        </p>
    </div>
    );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a001a] via-[#10002b] to-[#0a001a] text-white">
      <Starfield />
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:shadow-purple-500/20">
            <div className="p-8 sm:p-10 text-center">
              <header className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-cyan-300">
                  Swathi Nakshatra
                </h1>
                <p className="text-base text-white/60 mt-2">Celestial Guide</p>
              </header>

              <div className="flex justify-center my-8">
                {!isLoading && <StatusIndicator />}
              </div>
              
              <section className="min-h-[150px] flex flex-col justify-center">
                {isLoading ? (
                   <LoadingState />
                ) : (
                  <>
                    <h2 className="text-lg text-white/70 mb-2">
                      {isSwathiActive ? "Time remaining in current period" : "Time until next period"}
                    </h2>
                     {targetDate && (
                      <p className="text-sm text-white/50 mb-4 px-2">
                        {isSwathiActive ? 'Ends on ' : 'Starts on '}
                        {targetDate.toLocaleString(undefined, {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                    <Countdown countdown={countdown} />
                  </>
                )}
              </section>
            </div>
            
            <footer className="border-t border-white/10 px-8 py-6">
              <NotificationManager isSwathiActive={isSwathiActive} nextSwathiStart={nextSwathiStart} />
              <p className="text-center text-xs text-white/40 mt-4">
                *All dates and times are approximate and based on your device's clock. For devotional use only.
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;