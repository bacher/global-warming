import {useEffect, useMemo, useRef, useState} from 'react';
import cn from 'classnames';

import {
  Country,
  CountryInfo,
  getRandomCountryExcept,
} from '../../data/countries';
import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';
import {debugFrame} from '../../utils/debug';
import {GameState} from '../../utils/types';
import {bound} from '../../utils/math';
import {formatNumber} from '../../utils/format';
import {useFpsCounter} from '../../hooks/useFpsCounter';
import {useWindowPassiveEvent} from '../../hooks/useWindowPassiveEvent';
import {useHandler} from '../../hooks/useHandler';
import {SplashType, useSplash} from '../../hooks/useSplash';
import {useWindowEvent} from '../../hooks/useWindowEvent';

import {CountriesCanvas} from '../CountriesCanvas';
import styles from './Game.module.scss';

const WIDTH = 800;
const HEIGHT = 600;

const SPIN_SPEED = 0.16;
const ROLL_SPEED = 0.14;
const ZOOM_SPEED = 12;

const MINIMAL_DISTANCE = 9;
const MAXIMUM_DISTANCE = 40;

const MOUSE_DRAG_SPIN_SPEED = 0.0014;
const MOUSE_DRAG_ROLL_SPEED = 0.001;

type Direction = {
  spin: number;
  roll: number;
};

type DirectionState = {
  direction: Direction;
  distance: number;
};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);
  const {fpsCounterRef, tick} = useFpsCounter();
  const mousePosRef = useRef<{x: number; y: number} | undefined>();
  const pressedMap = useMemo<Set<string>>(() => new Set(), []);
  const mouseDragRef = useRef({x: 0, y: 0, isRealDragging: false});
  const directionState = useMemo<DirectionState>(
    () => ({
      direction: {spin: -2.63, roll: -0.75},
      distance: 12,
    }),
    [],
  );
  const lastApplyTsRef = useRef<number | undefined>();
  const [guessCountry, setGuessCountry] = useState<CountryInfo | undefined>();
  const alreadyGuessedCountriesRef = useRef<Country[]>([]);
  const [isDragging, setDragging] = useState(false);

  const gameStateRef = useRef<GameState>({selectedCountry: undefined});

  const {splashText, showSplashText} = useSplash();

  useEffect(() => {
    loadAssets().then(setAssets);
  }, []);

  function updateDirection(
    callback: (state: DirectionState) => DirectionState,
  ) {
    const {direction, distance} = callback(directionState);

    directionState.direction = {
      roll: bound(direction.roll, -Math.PI * 0.45, Math.PI * 0.45),
      spin: direction.spin,
    };

    directionState.distance = bound(
      distance,
      MINIMAL_DISTANCE,
      MAXIMUM_DISTANCE,
    );
  }

  function applyInput(): void {
    const now = Date.now();

    let deltaRoll = 0;
    let deltaSpin = 0;
    let deltaDistance = 0;

    if (lastApplyTsRef.current) {
      const passed = (now - lastApplyTsRef.current) / 1000;

      let x = 0;
      let y = 0;
      let distanceUpdate = 0;

      if (pressedMap.has('KeyA')) {
        x -= 1;
      }

      if (pressedMap.has('KeyD')) {
        x += 1;
      }

      if (pressedMap.has('KeyW')) {
        y -= 1;
      }

      if (pressedMap.has('KeyS')) {
        y += 1;
      }

      if (pressedMap.has('KeyE')) {
        distanceUpdate -= 1;
      }

      if (pressedMap.has('KeyQ')) {
        distanceUpdate += 1;
      }

      if (x !== 0 && y !== 0) {
        x *= 0.71;
        y *= 0.71;
      }

      deltaRoll = y * passed * 2 * Math.PI * ROLL_SPEED;
      deltaSpin = x * passed * 2 * Math.PI * SPIN_SPEED;
      deltaDistance = distanceUpdate * passed * ZOOM_SPEED;
    }

    if (mouseDragRef.current.x || mouseDragRef.current.y) {
      deltaRoll -= mouseDragRef.current.y * MOUSE_DRAG_ROLL_SPEED;
      deltaSpin -= mouseDragRef.current.x * MOUSE_DRAG_SPIN_SPEED;

      mouseDragRef.current.x = 0;
      mouseDragRef.current.y = 0;
    }

    if (deltaRoll || deltaSpin || deltaDistance) {
      updateDirection(({direction: {spin, roll}, distance}) => ({
        direction: {
          spin: spin + deltaSpin,
          roll: roll + deltaRoll,
        },
        distance: distance + deltaDistance,
      }));

      const outputElement = document.getElementById('output');
      if (outputElement) {
        outputElement.innerText = `Roll: ${formatNumber(
          directionState.direction.roll,
        )}rad
Spin: ${formatNumber(directionState.direction.spin)}rad
Distance: ${formatNumber(directionState.distance, 0)}`;
      }
    }

    lastApplyTsRef.current = now;
  }

  useEffect(() => {
    if (!assets) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error();
    }

    const gl = canvas.getContext('webgl2');

    if (!gl) {
      throw new Error();
    }

    const scene = initialize(gl, assets);

    timeRef.current = Date.now() - 20000;

    function doRender() {
      applyInput();

      draw(gl!, scene, gameStateRef.current, {
        width: WIDTH,
        height: HEIGHT,
        time: Date.now() - timeRef.current,
        // time: 0,
        pointer: mousePosRef.current,
        direction: directionState.direction,
        distance: directionState.distance,
        debugOnFrame: ({matrix}) => {
          const ctx = debugCanvasRef.current!.getContext('2d')!;
          const modelData = assets!.modelData;

          debugFrame({
            ctx,
            matrix,
            modelData,
            cursor: mousePosRef.current
              ? [mousePosRef.current.x, mousePosRef.current.y, 0]
              : undefined,
            gameState: gameStateRef.current,
          });
        },
      });
      tick();
      requestAnimationFrame(doRender);
    }

    doRender();
  }, [assets]);

  useWindowPassiveEvent<MouseEvent>('mousemove', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      mousePosRef.current = undefined;
    } else {
      mousePosRef.current = {
        x: x / (WIDTH / 2) - 1,
        y: (y / (HEIGHT / 2) - 1) * -1,
      };
    }
  });

  function toggleKey(keyCode: string, isPressed: boolean) {
    if (isPressed) {
      pressedMap.add(keyCode);
    } else {
      pressedMap.delete(keyCode);
    }
  }

  useWindowPassiveEvent<KeyboardEvent>('keydown', (event) => {
    toggleKey(event.code, true);
  });

  useWindowPassiveEvent<KeyboardEvent>('keyup', (event) => {
    toggleKey(event.code, false);
  });

  const startGame = useHandler(() => {
    alreadyGuessedCountriesRef.current = [];
    const country = getRandomCountryExcept(alreadyGuessedCountriesRef.current);
    setGuessCountry(country);
  });

  const nextCountry = useHandler(() => {
    if (guessCountry) {
      alreadyGuessedCountriesRef.current.push(guessCountry.id);
    }

    const country = getRandomCountryExcept(alreadyGuessedCountriesRef.current);

    if (!country) {
      showSplashText('You guessed all countries!');
      setGuessCountry(undefined);
      return;
    }

    setGuessCountry(country);
  });

  const onStartGameClick = useHandler((event) => {
    event.preventDefault();
    startGame();
  });

  const handleCanvasClick = useHandler((event) => {
    event.preventDefault();

    if (mouseDragRef.current.isRealDragging) {
      return;
    }

    const {selectedCountry} = gameStateRef.current;

    if (guessCountry && selectedCountry) {
      if (guessCountry.id === selectedCountry) {
        showSplashText('You are right!');
        nextCountry();
      } else {
        showSplashText('You missed, try again!', {
          type: SplashType.BAD,
          timeout: 3000,
        });
      }
    }
  });

  const onMouseDown = useHandler(() => {
    mouseDragRef.current = {
      x: 0,
      y: 0,
      isRealDragging: false,
    };
    setDragging(true);
  });

  const onMouseMove = useHandler((event) => {
    mouseDragRef.current.x += event.movementX;
    mouseDragRef.current.y += event.movementY;

    if (
      !mouseDragRef.current.isRealDragging &&
      (Math.abs(mouseDragRef.current.x) > 2 ||
        Math.abs(mouseDragRef.current.y) > 2)
    ) {
      mouseDragRef.current.isRealDragging = true;
    }
  });

  useWindowEvent(
    'mouseup',
    (event) => {
      if (mouseDragRef.current.isRealDragging) {
        event.preventDefault();
      }
      setDragging(false);
    },
    {capture: true},
  );

  return (
    <>
      <div className={styles.root}>
        <div
          className={styles.viewport}
          onMouseMove={isDragging ? onMouseMove : undefined}
        >
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={WIDTH}
            height={HEIGHT}
            onMouseDown={onMouseDown}
            onClick={
              isDragging ? (event) => event.preventDefault() : handleCanvasClick
            }
          />
          <div className={styles.ui}>
            {guessCountry ? (
              <>
                <div className={styles.column}>
                  <p className={styles.gameText}>
                    Guess the "{guessCountry.title}"
                  </p>
                </div>
                {splashText && (
                  <div className={styles.upper}>
                    <p
                      className={cn(styles.splashText, {
                        [styles.splashTextBad]:
                          splashText.type === SplashType.BAD,
                      })}
                    >
                      {splashText.text}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.centered}>
                <button
                  type="button"
                  className={styles.startButton}
                  onClick={onStartGameClick}
                >
                  Start the Game
                </button>
              </div>
            )}
          </div>
        </div>
        <canvas
          ref={debugCanvasRef}
          className={styles.debugCanvas}
          width={WIDTH}
          height={HEIGHT}
        />
        <span ref={fpsCounterRef} className={styles.fpsCounter} />
        <div className={styles.output}>
          <pre>
            Controls:
            <br />
            Spin globe by mouse drag or &lt;WSAD&gt;
            <br />
            Zoom in/out by &lt;Q&gt; and &lt;E&gt;
          </pre>
          <pre id="output" />
          <pre id="debugOutput" />
        </div>
      </div>
      {assets && <CountriesCanvas image={assets.textures.area} />}
    </>
  );
}
