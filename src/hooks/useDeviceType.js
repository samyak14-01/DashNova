import { useState, useEffect } from 'react';

function getDeviceType() {
  const width = window.innerWidth;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (width < 640) return 'mobile';
  if (width < 1024) return isTouch ? 'tablet' : 'desktop';
  return 'desktop';
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState(getDeviceType);

  useEffect(() => {
    const handler = () => setDeviceType(getDeviceType());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouch: deviceType !== 'desktop',
  };
}