import {useEffect} from 'react';

import {useHandler} from './useHandler';

export function useWindowEvent<EventType extends Event = Event>(
  eventName: string,
  callback: (event: EventType) => void,
  options: {capture?: boolean; passive?: boolean} = {},
) {
  const handler = useHandler(callback);

  const capture = Boolean(options.capture);
  const passive = Boolean(options.passive);

  const actualOptions = {
    capture,
    passive,
  };

  useEffect(() => {
    // @ts-ignore
    window.addEventListener(eventName, handler, actualOptions);

    return () => {
      // @ts-ignore
      window.removeEventListener(eventName, handler, actualOptions);
    };
  }, [capture, passive]);
}
