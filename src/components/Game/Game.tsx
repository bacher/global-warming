import {useEffect, useMemo, useRef, useState} from 'react';
import cn from 'classnames';

import {countries, Country, getRandomCountryExcept} from '../../data/countries';
import {initialize} from '../../utils/init';
import {draw} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';
import {debugFrame} from '../../utils/debug';
import type {GameState, ViewportSize} from '../../utils/types';
import {GameType} from '../../utils/types';
import {bound} from '../../utils/math';
import {formatNumber} from '../../utils/format';
import {useFpsCounter} from '../../hooks/useFpsCounter';
import {useWindowPassiveEvent} from '../../hooks/useWindowPassiveEvent';
import {useHandler} from '../../hooks/useHandler';
import {SplashType, useSplash} from '../../hooks/useSplash';
import {useWindowEvent} from '../../hooks/useWindowEvent';
import {useRerender} from '../../hooks/useRerender';

import {StartMenu} from '../StartMenu';
import {CountriesCanvas} from '../CountriesCanvas';
import styles from './Game.module.scss';

const SPIN_SPEED = 0.16;
const ROLL_SPEED = 0.14;
const ZOOM_SPEED = 12;
const MENU_SPIN_SPEED = 0.1;

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

function printDirection(directionState: DirectionState): void {
  const outputElement = document.getElementById('output');
  if (outputElement) {
    outputElement.innerText = `Roll: ${formatNumber(
      directionState.direction.roll,
    )}rad
Spin: ${formatNumber(directionState.direction.spin)}rad
Distance: ${formatNumber(directionState.distance, 0)}`;
  }
}

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
  const alreadyGuessedCountriesRef = useRef<Country[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [showDebugCanvas] = useState(false);
  const viewportSize = useRef({width: 0, height: 0});
  const currentViewportSizeRef = useRef({width: 0, height: 0});
  const rerender = useRerender();

  const gameStateRef = useRef<GameState>({type: GameType.MENU});

  const {splashText, showSplashText} = useSplash();

  function isInGame(): boolean {
    return (
      gameStateRef.current.type === GameType.FIND ||
      gameStateRef.current.type === GameType.DISCOVERY
    );
  }

  useEffect(() => {
    setDragging(false);
  }, [gameStateRef.current.type]);

  useEffect(() => {
    viewportSize.current.width = window.innerWidth;
    viewportSize.current.height = window.innerHeight;

    loadAssets().then(setAssets);

    printDirection(directionState);
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

  function updateGameState(): void {
    const now = Date.now();

    let deltaRoll = 0;
    let deltaSpin = 0;
    let deltaDistance = 0;

    if (isInGame()) {
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

      const mouseDrag = mouseDragRef.current;

      if (mouseDrag.x || mouseDrag.y) {
        const distanceModifier = directionState.distance / 12;
        deltaRoll -= mouseDrag.y * MOUSE_DRAG_ROLL_SPEED * distanceModifier;
        deltaSpin -= mouseDrag.x * MOUSE_DRAG_SPIN_SPEED * distanceModifier;

        mouseDrag.x = 0;
        mouseDrag.y = 0;
      }
    } else {
      if (lastApplyTsRef.current) {
        const passed = (now - lastApplyTsRef.current) / 1000;
        deltaSpin = MENU_SPIN_SPEED * passed * 2 * Math.PI * SPIN_SPEED;
      }
    }

    if (deltaRoll || deltaSpin || deltaDistance) {
      updateDirection(({direction: {spin, roll}, distance}) => ({
        direction: {
          spin: spin + deltaSpin,
          roll: roll + deltaRoll,
        },
        distance: distance + deltaDistance,
      }));

      printDirection(directionState);
    }

    lastApplyTsRef.current = now;
  }

  function updateCanvasSize(): ViewportSize {
    const vp = viewportSize.current;
    const currentVp = currentViewportSizeRef.current;

    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error();
    }

    if (vp.width !== currentVp.width || vp.height !== currentVp.height) {
      currentVp.width = vp.width;
      currentVp.height = vp.height;

      canvas.width = currentVp.width;
      canvas.height = currentVp.height;

      if (debugCanvasRef.current) {
        debugCanvasRef.current.width = currentVp.width;
        debugCanvasRef.current.height = currentVp.height;
      }
    }

    return currentVp;
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

    updateCanvasSize();

    const scene = initialize(gl, assets);

    timeRef.current = Date.now() - 20000;

    let requestId: number | undefined;

    function doRender() {
      if (!canvas || !gl) {
        throw new Error();
      }

      updateGameState();

      const viewportSize = updateCanvasSize();

      draw(gl, scene, gameStateRef.current, {
        width: viewportSize.width,
        height: viewportSize.height,
        time: Date.now() - timeRef.current,
        // time: 0,
        pointer: mousePosRef.current,
        direction: directionState.direction,
        distance: directionState.distance,
        debugOnFrame: ({matrix}) => {
          const ctx = debugCanvasRef.current?.getContext('2d') ?? undefined;
          const modelData = assets!.models.earth;

          debugFrame({
            ctx,
            matrix,
            modelData,
            cursor: mousePosRef.current
              ? [mousePosRef.current.x, mousePosRef.current.y, 0]
              : undefined,
            viewport: viewportSize,
            gameState: gameStateRef.current,
            onSelectedCountryChange: (selectedCountry) => {
              const state = gameStateRef.current;

              if (
                (state.type === GameType.FIND ||
                  state.type === GameType.DISCOVERY) &&
                state.selectedCountry !== selectedCountry
              ) {
                state.selectedCountry = selectedCountry;
                rerender();
              }
            },
          });
        },
      });

      tick();
      requestId = window.requestAnimationFrame(doRender);
    }

    doRender();

    return () => {
      if (requestId) {
        window.cancelAnimationFrame(requestId);
      }
    };
  }, [assets]);

  useWindowPassiveEvent<MouseEvent>('mousemove', (event) => {
    const x = event.pageX;
    const y = event.pageY;

    const {width, height} = viewportSize.current;

    if (x < 0 || x >= width || y < 0 || y >= height) {
      mousePosRef.current = undefined;
    } else {
      mousePosRef.current = {
        x: x / (width / 2) - 1,
        y: (y / (height / 2) - 1) * -1,
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

    if (country) {
      const gameState = gameStateRef.current;

      gameStateRef.current = {
        type: GameType.FIND,
        guessCountry: country,
        selectedCountry:
          gameState.type === GameType.FIND
            ? gameState.selectedCountry
            : undefined,
      };
    } else {
      gameStateRef.current = {
        type: GameType.MENU,
      };
    }
    rerender();
  });

  const onDiscoverClick = useHandler(() => {
    gameStateRef.current = {
      type: GameType.DISCOVERY,
      selectedCountry: undefined,
    };
    rerender();
  });

  const nextCountry = useHandler(() => {
    if (gameStateRef.current.type !== GameType.FIND) {
      return;
    }

    const {guessCountry} = gameStateRef.current;

    alreadyGuessedCountriesRef.current.push(guessCountry.id);

    const country = getRandomCountryExcept(alreadyGuessedCountriesRef.current);

    if (!country) {
      showSplashText('You guessed all countries!');

      gameStateRef.current = {
        type: GameType.MENU,
      };
      rerender();
      return;
    }

    gameStateRef.current.guessCountry = country;
    rerender();
  });

  const handleCanvasClick = useHandler((event) => {
    event.preventDefault();

    if (mouseDragRef.current.isRealDragging) {
      return;
    }

    const gameState = gameStateRef.current;

    switch (gameState.type) {
      case GameType.FIND:
        if (gameState.guessCountry && gameState.selectedCountry) {
          if (gameState.guessCountry.id === gameState.selectedCountry) {
            showSplashText('You are right!');
            nextCountry();
          } else {
            showSplashText('You missed, try again!', {
              type: SplashType.BAD,
              timeout: 3000,
            });
          }
        }
        break;
      default:
      // do nothing
    }
  });

  const onMouseDown = useHandler(() => {
    if (!isInGame()) {
      return;
    }

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

  useWindowPassiveEvent('resize', () => {
    viewportSize.current = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

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
            width="0"
            height="0"
            onMouseDown={onMouseDown}
            onClick={
              isDragging ? (event) => event.preventDefault() : handleCanvasClick
            }
          />
          <div className={styles.ui}>
            {(() => {
              switch (gameStateRef.current.type) {
                case GameType.FIND:
                  return (
                    <>
                      <div className={styles.column}>
                        <p className={styles.gameText}>
                          Guess the "{gameStateRef.current.guessCountry.title}"
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
                  );
                case GameType.DISCOVERY: {
                  const {selectedCountry} = gameStateRef.current;

                  if (!selectedCountry) {
                    return undefined;
                  }
                  const country = countries.get(selectedCountry);

                  if (!country) {
                    return undefined;
                  }

                  return (
                    <div className={styles.column}>
                      <p className={styles.gameText}>
                        Country: "{country.title}"
                      </p>
                    </div>
                  );
                }
                case GameType.MENU:
                  return (
                    <div className={styles.centered}>
                      <StartMenu
                        onGameStart={startGame}
                        onDiscoveryStart={onDiscoverClick}
                      />
                    </div>
                  );
                default:
                  return undefined;
              }
            })()}
          </div>
        </div>
        {showDebugCanvas && (
          <canvas
            ref={debugCanvasRef}
            className={styles.debugCanvas}
            width="0"
            height="0"
          />
        )}
        <div className={styles.output}>
          <pre ref={fpsCounterRef}>0</pre>
          <pre>
            Controls:
            <br />
            Spin globe by mouse drag or &lt;WSAD&gt;
            <br />
            Zoom in/out by &lt;Q&gt; and &lt;E&gt;
          </pre>
          <pre id="output">&nbsp;</pre>
          <pre id="debugOutput">&nbsp;</pre>
        </div>
      </div>
      {assets && <CountriesCanvas image={assets.textures.area} />}
    </>
  );
}
