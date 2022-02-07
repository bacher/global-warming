import {useCallback, useRef} from 'react';

export function useHandler<Func extends (...args: any[]) => any>(
  handler: Func,
): Func {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // @ts-ignore
  return useCallback((...args) => handlerRef.current(...args), []);
}
