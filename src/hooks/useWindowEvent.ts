import {useEffect} from 'react';

import {useHandler} from './useHandler';

export function useWindowEvent<EventType extends Event = Event>(
  eventName: string,
  callback: (event: EventType) => void,
) {
  const handler = useHandler(callback);

  useEffect(() => {
    // @ts-ignore
    window.addEventListener(eventName, handler, {passive: true});

    return () => {
      // @ts-ignore
      window.removeEventListener(eventName, handler);
    };
  }, []);
}
