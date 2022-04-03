import {memo, HTMLProps, useRef} from 'react';

const REPEAT_WHILE_PRESSED = 200;

type Props = Omit<
  HTMLProps<HTMLButtonElement>,
  'type' | 'onClick' | 'onMouseDown' | 'onMouseUp'
> & {
  onClick: () => void;
};

export const PressButton = memo(({onClick, ...props}: Props) => {
  const intervalRef = useRef<number | undefined>();

  function stopRepeating() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }

  return (
    <button
      {...props}
      type="button"
      onMouseDown={() => {
        intervalRef.current = window.setInterval(onClick, REPEAT_WHILE_PRESSED);
        onClick();
      }}
      onMouseLeave={stopRepeating}
      onMouseUp={stopRepeating}
      onClick={(event) => {
        event.preventDefault();
        stopRepeating();
      }}
    />
  );
});
