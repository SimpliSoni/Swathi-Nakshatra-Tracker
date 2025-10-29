
import React, { useState, useEffect, useCallback } from 'react';

interface NotificationManagerProps {
  isSwathiActive: boolean;
  nextSwathiStart: Date | null;
}

const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);


const NotificationManager: React.FC<NotificationManagerProps> = ({ isSwathiActive, nextSwathiStart }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [lastNotifiedTime, setLastNotifiedTime] = useState<number | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
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
      nextSwathiStart.getTime() !== lastNotifiedTime
    ) {
      const starIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2l2.35 6.53h6.91l-5.59 4.08 2.15 6.58-5.82-4.25-5.82 4.25 2.15-6.58-5.59-4.08h6.91z"/></svg>';
      const iconUrl = 'data:image/svg+xml;base64,' + window.btoa(starIconSvg);

      new Notification('Swathi Nakshatra is Active', {
        body: 'The auspicious period has begun. Embrace the celestial energy.',
        icon: iconUrl,
      });
      setLastNotifiedTime(nextSwathiStart.getTime());
    }
  }, [isSwathiActive, permission, nextSwathiStart, lastNotifiedTime]);

  const getButtonContent = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Notifications Enabled', disabled: true, className: 'bg-green-500/20 text-green-300 cursor-default' };
      case 'denied':
        return { text: 'Notifications Blocked', disabled: true, className: 'bg-red-500/20 text-red-300 cursor-not-allowed' };
      default:
        return { text: 'Enable Notifications', disabled: false, className: 'bg-white/10 hover:bg-white/20 text-white' };
    }
  };

  const buttonContent = getButtonContent();

  if (!('Notification' in window)) {
      return null;
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={requestPermission}
        disabled={buttonContent.disabled}
        className={`w-full max-w-xs flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-400 ${buttonContent.className}`}
      >
        <BellIcon className="w-5 h-5" />
        <span>{buttonContent.text}</span>
      </button>
    </div>
  );
};

export default NotificationManager;
