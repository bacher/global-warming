import {useEffect, useState} from 'react';

export function useTabActive(): boolean {
  const [isActive, setActive] = useState(
    document.visibilityState === 'visible',
  );

  useEffect(() => {
    function handler() {
      setActive(document.visibilityState === 'visible');
    }

    document.addEventListener('visibilitychange', handler, {passive: true});

    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  return isActive;
}
