import {useRef, useState} from 'react';

export function useRerender() {
  const [, setValue] = useState(0);
  const stateRef = useRef(0);

  return () => {
    setValue(++stateRef.current);
  };
}
