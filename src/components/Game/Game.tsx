import {useEffect, useMemo, useRef, useState} from 'react';

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

import {CountriesCanvas} from '../CountriesCanvas';
import styles from './Game.module.scss';

const WIDTH = 800;
const HEIGHT = 600;

const SPIN_SPEED = 0.16;
const ROLL_SPEED = 0.14;
const ZOOM_SPEED = 12;

const MINIMAL_DISTANCE = 9;
const MAXIMUM_DISTANCE = 40;

type Direction = {
  spin: number;
  roll: number;
};

type DirectionState = {
  direction: Direction;
  distance: number;
  lastApplyTs: number | undefined;
};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);
  const {fpsCounterRef, tick} = useFpsCounter();
  const mousePosRef = useRef<{x: number; y: number} | undefined>();
  const pressedMap = useMemo<Set<string>>(() => new Set(), []);
  const directionState = useMemo<DirectionState>(
    () => ({
      direction: {spin: -2.63, roll: -0.75},
      distance: 12,
      lastApplyTs: undefined,
    }),
    [],
  );
  const [guessCountry, setGuessCountry] = useState<CountryInfo | undefined>();
  const alreadyGuessedCountriesRef = useRef<Country[]>([]);

  const gameStateRef = useRef<GameState>({selectedCountry: undefined});

  useEffect(() => {
    loadAssets().then(setAssets);
  }, []);

  function applyInput(): void {
    const now = Date.now();

    if (directionState.lastApplyTs) {
      const passed = (now - directionState.lastApplyTs) / 1000;

      let x = 0;
      let y = 0;
      let distance = 0;

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
        distance -= 1;
      }

      if (pressedMap.has('KeyQ')) {
        distance += 1;
      }

      if (x !== 0 && y !== 0) {
        x *= 0.71;
        y *= 0.71;
      }

      directionState.direction.spin += x * passed * 2 * Math.PI * SPIN_SPEED;
      directionState.direction.roll += y * passed * 2 * Math.PI * ROLL_SPEED;

      directionState.direction.roll = bound(
        directionState.direction.roll,
        -Math.PI * 0.45,
        Math.PI * 0.45,
      );

      directionState.distance += distance * passed * ZOOM_SPEED;

      directionState.distance = bound(
        directionState.distance,
        MINIMAL_DISTANCE,
        MAXIMUM_DISTANCE,
      );

      const outputElement = document.getElementById('output');
      if (outputElement) {
        outputElement.innerText = `Roll: ${formatNumber(
          directionState.direction.roll,
        )}rad
Spin: ${formatNumber(directionState.direction.spin)}rad
Distance: ${formatNumber(directionState.distance, 0)}`;
      }
    }

    directionState.lastApplyTs = now;
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
      window.alert('You guessed all countries!');
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

    const {selectedCountry} = gameStateRef.current;

    if (guessCountry && selectedCountry) {
      if (guessCountry.id === selectedCountry) {
        window.alert('You are right!');
        nextCountry();
      } else {
        window.alert('You missed, try again!');
      }
    }
  });

  return (
    <>
      <div className={styles.root}>
        <div className={styles.viewport}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={WIDTH}
            height={HEIGHT}
            onClick={handleCanvasClick}
          />
          <div className={styles.ui}>
            {guessCountry ? (
              <p className={styles.gameText}>
                Guess the "{guessCountry.title}"
              </p>
            ) : (
              <button
                type="button"
                className={styles.startButton}
                onClick={onStartGameClick}
              >
                Start the Game
              </button>
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
            Rotate globe by &lt;WSAD&gt;
            <br />
            Zoom in/out by by &lt;Q&gt; and &lt;E&gt;
          </pre>
          <pre id="output" />
          <pre id="debugOutput" />
        </div>
      </div>
      {assets && <CountriesCanvas image={assets.textures.area} />}
    </>
  );
}
