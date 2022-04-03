import {useEffect, useMemo, useRef, useState} from 'react';
import {mat4} from 'gl-matrix';
import cn from 'classnames';

import {countries, Country, getRandomCountryExcept} from '../../data/countries';
import {initialize} from '../../utils/init';
import {compareDrawParams, draw, DrawParams} from '../../utils/render';
import {Assets, loadAssets} from '../../utils/loader';
import {makeMemorizedGetSelectedCountry} from '../../utils/debug';
import type {DirectionState, GameState, ViewportSize} from '../../utils/types';
import {GameType, InGameState} from '../../utils/types';
import {bound} from '../../utils/math';
import {formatNumber} from '../../utils/format';
import {useFpsCounter} from '../../hooks/useFpsCounter';
import {useWindowPassiveEvent} from '../../hooks/useWindowPassiveEvent';
import {useHandler} from '../../hooks/useHandler';
import {SplashStyle, useSplash} from '../../hooks/useSplash';
import {useWindowEvent} from '../../hooks/useWindowEvent';
import {useRerender} from '../../hooks/useRerender';
import {createIntroAnimation, IntroAnimation} from '../../utils/animations';
import {StartMenu} from '../StartMenu';
import {CountriesCanvas} from '../CountriesCanvas';
import {getCountryStates} from '../../utils/countryState';
import {wait} from '../../utils/time';
import {getNearestRotation} from '../../utils/rotation';
import {easeInOutQuad} from '../../utils/easing';
import {RightPanel} from '../RightPanel';

import styles from './Game.module.scss';

const SPIN_SPEED = 0.16;
const ROLL_SPEED = 0.14;
const ZOOM_SPEED = 12;
const MENU_SPIN_SPEED = 0.1;

const MINIMAL_DISTANCE = 9;
const MAXIMUM_DISTANCE = 40;

const MOUSE_DRAG_SPIN_SPEED = 0.0014;
const MOUSE_DRAG_ROLL_SPEED = 0.001;

const WARMING_TRIES_COUNT = 3;

declare global {
  interface WebGL2RenderingContext {
    isWebGL2: boolean;
  }
}

function radToDeg(rad: number) {
  return (180 * rad) / Math.PI;
}

function printDirection(directionState: DirectionState): void {
  const {roll, spin} = directionState.direction;

  const outputElement = document.getElementById('output');
  if (outputElement) {
    outputElement.innerText = `Lat: ${formatNumber(radToDeg(-roll))}° ${formatNumber(-roll)}rad
Lng: ${formatNumber(radToDeg(spin))}° ${formatNumber(spin)}rad
Distance: ${formatNumber(directionState.distance, 0)}`;
  }
}

type InnerGameState = {
  selectedCountryId: Country | undefined;
  successCountryIds: Country[];
  failedCountryIds: Country[];
};

type RotationAnimation = {
  startTs: number;
  duration: number;
  onTick: (ratio: number) => void;
  onDone?: () => void;
};

type MouseDragState = {
  x: number;
  y: number;
  startTs: number;
  isRealDragging: boolean;
};

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets | undefined>();
  const timeRef = useRef(0);
  const {fpsCounterRef, tick} = useFpsCounter();
  const mousePosRef = useRef<{x: number; y: number} | undefined>();
  const pressedMap = useMemo<Set<string>>(() => new Set(), []);
  const mouseDragRef = useRef<MouseDragState | undefined>();
  const directionState = useMemo<DirectionState>(
    () => ({
      direction: {spin: 0.51, roll: -0.75},
      distance: 1000,
    }),
    [],
  );
  const disableUserRotationRef = useRef(false);
  const rotationAnimationRef = useRef<RotationAnimation | undefined>();
  const lastApplyTsRef = useRef<number | undefined>();
  const alreadyGuessedCountriesRef = useRef<Country[]>([]);
  const [isDragging, setDragging] = useState(false);
  const [showDebugCanvas] = useState(false);
  const viewportSize = useRef({width: 0, height: 0});
  const currentViewportSizeRef = useRef({width: 0, height: 0});
  const rerender = useRerender();
  const introAnimation = useRef<IntroAnimation | undefined>();
  const gameStateRef = useRef<GameState>({type: GameType.MENU, countriesState: []});
  const lastDrawParamsRef = useRef<DrawParams | undefined>();
  const lastEarthMatrixRef = useRef<mat4 | undefined>();
  const getSelectedCountryMemorized = useMemo(makeMemorizedGetSelectedCountry, []);
  const showCrosshair = useMemo(() => window.location.search.includes('crosshair'), []);

  const innerGameStateRef = useRef<InnerGameState>({
    selectedCountryId: undefined,
    successCountryIds: [],
    failedCountryIds: [],
  });

  const lastProcessedInnerGameStateRef = useRef<InnerGameState | undefined>();

  const {splash, showSplashText, showBlockText} = useSplash();

  function isInGame(): boolean {
    return gameStateRef.current.type !== GameType.MENU;
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

  function updateDirection(callback: (state: DirectionState) => DirectionState) {
    const {direction, distance} = callback(directionState);

    const max = Math.PI * 0.44444;
    directionState.direction = {
      roll: bound(direction.roll, -max, max),
      spin: direction.spin,
    };

    if (distance !== directionState.distance) {
      directionState.distance = bound(distance, MINIMAL_DISTANCE, MAXIMUM_DISTANCE);
    }
  }

  function updateGameState(): void {
    const now = Date.now();

    if (rotationAnimationRef.current) {
      const {startTs, duration, onTick, onDone} = rotationAnimationRef.current;
      const ratio = Math.min(1, (now - startTs) / duration);

      onTick(ratio);

      if (ratio >= 1) {
        rotationAnimationRef.current = undefined;
        onDone?.();
      }
    }

    let deltaRoll = 0;
    let deltaSpin = 0;
    let deltaDistance = 0;

    if (isInGame()) {
      if (!disableUserRotationRef.current) {
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

        if (mouseDrag && (mouseDrag.x || mouseDrag.y)) {
          const distanceModifier = directionState.distance / 12;
          deltaRoll -= mouseDrag.y * MOUSE_DRAG_ROLL_SPEED * distanceModifier;
          deltaSpin -= mouseDrag.x * MOUSE_DRAG_SPIN_SPEED * distanceModifier;

          mouseDrag.x = 0;
          mouseDrag.y = 0;
        }
      }
    } else {
      introAnimation.current?.update();

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

    // const gl2 =
    //   Math.random() < 0 ? canvas.getContext('webgl2', {preserveDrawingBuffer: true}) : null;
    const gl2 = canvas.getContext('webgl2', {preserveDrawingBuffer: true});
    let glFallback;

    if (gl2) {
      gl2.isWebGL2 = true;
    } else {
      glFallback = canvas.getContext('webgl', {preserveDrawingBuffer: true});
    }

    const gl = (gl2 ?? glFallback) as WebGL2RenderingContext;

    if (!gl) {
      throw new Error();
    }

    updateCanvasSize();

    const scene = initialize(gl, assets);

    timeRef.current = Date.now() - 20000;

    let requestId: number | undefined;

    function doRender() {
      if (!gl) {
        throw new Error();
      }

      updateGameState();

      const viewportSize = updateCanvasSize();

      if (lastProcessedInnerGameStateRef.current !== innerGameStateRef.current) {
        gameStateRef.current = {
          ...gameStateRef.current,
          countriesState: getCountryStates(innerGameStateRef.current),
        };

        lastProcessedInnerGameStateRef.current = innerGameStateRef.current;
      }

      const drawParams = {
        width: viewportSize.width,
        height: viewportSize.height,
        direction: directionState.direction,
        distance: directionState.distance,
        gameState: gameStateRef.current,
      };

      if (!lastDrawParamsRef.current || !compareDrawParams(drawParams, lastDrawParamsRef.current)) {
        lastDrawParamsRef.current = drawParams;

        const {earthMatrix} = draw(gl, scene, drawParams);
        lastEarthMatrixRef.current = earthMatrix;
        tick();
      }

      const gameState = gameStateRef.current;
      const innerGameState = innerGameStateRef.current;

      if (
        (gameState.type === GameType.GAME &&
          gameState.inGameState !== InGameState.ENDING &&
          gameState.inGameState !== InGameState.SWITCHING) ||
        (gameState.type === GameType.QUIZ && gameState.guessCountry) ||
        gameState.type === GameType.DISCOVERY
      ) {
        let selectedCountryId: Country | undefined;

        if (mousePosRef.current) {
          selectedCountryId = getSelectedCountryMemorized({
            matrix: lastEarthMatrixRef.current!,
            modelData: assets!.models.earth,
            cursor: mousePosRef.current,
          });
        }

        if (innerGameState.selectedCountryId !== selectedCountryId) {
          innerGameStateRef.current = {
            ...innerGameState,
            selectedCountryId,
          };
        }
      }

      requestId = window.requestAnimationFrame(doRender);
    }

    doRender();

    introAnimation.current = createIntroAnimation(directionState, () => {
      introAnimation.current = undefined;
      rerender();
    });

    return () => {
      introAnimation.current = undefined;

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

  const onStartGameClick = useHandler(async () => {
    alreadyGuessedCountriesRef.current = [];

    const country = getRandomCountryExcept([]);

    if (!country) {
      throw new Error();
    }

    gameStateRef.current = {
      type: GameType.GAME,
      inGameState: InGameState.STARTING,
      guessCountry: undefined,
      countriesState: [],
    };
    innerGameStateRef.current = {
      selectedCountryId: undefined,
      successCountryIds: [],
      failedCountryIds: [],
    };
    rerender();

    await wait(1000);
    gameStateRef.current = {
      ...gameStateRef.current,
      inGameState: InGameState.FINDING,
      guessCountry: country,
    };
    rerender();
  });

  const onStartQuizClick = useHandler(() => {
    alreadyGuessedCountriesRef.current = [];

    const country = getRandomCountryExcept([]);

    if (!country) {
      throw new Error();
    }

    gameStateRef.current = {
      type: GameType.QUIZ,
      guessCountry: country,
      countriesState: [],
    };

    innerGameStateRef.current = {
      selectedCountryId: undefined,
      successCountryIds: [],
      failedCountryIds: [],
    };

    rerender();
  });

  const onDiscoverClick = useHandler(() => {
    gameStateRef.current = {
      type: GameType.DISCOVERY,
      countriesState: [],
    };
    innerGameStateRef.current = {
      selectedCountryId: undefined,
      successCountryIds: [],
      failedCountryIds: [],
    };
    rerender();
  });

  const chooseNextCountry = useHandler(() => {
    const gameState = gameStateRef.current;

    if (gameState.type !== GameType.QUIZ && gameState.type !== GameType.GAME) {
      throw new Error();
    }

    const country = getRandomCountryExcept(alreadyGuessedCountriesRef.current);

    if (country) {
      gameStateRef.current = {
        ...gameState,
        guessCountry: country,
      };
      rerender();
    } else {
      gameStateRef.current = {
        ...gameState,
        guessCountry: undefined,
      };

      innerGameStateRef.current = {
        ...innerGameStateRef.current,
        selectedCountryId: undefined,
      };

      showBlockText(
        innerGameStateRef.current.failedCountryIds.length > 0
          ? 'You won!'
          : 'You guessed all countries!',
        {},
        () => {
          gameStateRef.current = {
            type: GameType.MENU,
            countriesState: gameStateRef.current.countriesState,
          };
          rerender();
        },
      );
    }
  });

  const handleCanvasClick = useHandler(async (event) => {
    event.preventDefault();

    if (mouseDragRef.current?.isRealDragging) {
      return;
    }

    const innerGameState = innerGameStateRef.current;
    const selectedCountryId = innerGameState.selectedCountryId;

    switch (gameStateRef.current.type) {
      case GameType.GAME:
        if (gameStateRef.current.inGameState !== InGameState.FINDING) {
          break;
        }

        const originalGuessCountry = gameStateRef.current.guessCountry;

        if (originalGuessCountry && selectedCountryId) {
          if (originalGuessCountry.id === selectedCountryId) {
            innerGameStateRef.current = {
              ...innerGameStateRef.current,
              successCountryIds: [
                ...innerGameStateRef.current.successCountryIds,
                originalGuessCountry.id,
              ],
            };

            gameStateRef.current = {
              ...gameStateRef.current,
              inGameState: InGameState.SWITCHING,
            };

            showSplashText('You are right!');

            await wait(1000);

            gameStateRef.current = {
              ...gameStateRef.current,
              guessCountry: undefined,
            };
            rerender();

            await wait(700);

            alreadyGuessedCountriesRef.current.push(originalGuessCountry.id);
            gameStateRef.current = {
              ...gameStateRef.current,
              inGameState: InGameState.FINDING,
            };
            chooseNextCountry();
          } else if (
            !innerGameState.successCountryIds.includes(selectedCountryId) &&
            !innerGameState.failedCountryIds.includes(selectedCountryId)
          ) {
            gameStateRef.current = {
              ...gameStateRef.current,
              inGameState: InGameState.SWITCHING,
            };
            rerender();

            const from = directionState.direction;
            const to = {
              roll: -originalGuessCountry.center[0],
              spin: originalGuessCountry.center[1],
            };
            const by = getNearestRotation({
              from,
              to,
            });

            const l = Math.sqrt(Math.abs(by.roll) ** 2 + Math.abs(by.spin) ** 2);

            disableUserRotationRef.current = true;
            rotationAnimationRef.current = {
              startTs: Date.now(),
              duration: 1500 * l,
              onTick: (ratio) => {
                const r = easeInOutQuad(ratio);

                updateDirection(({distance}) => ({
                  direction: {
                    spin: from.spin + by.spin * r,
                    roll: from.roll + by.roll * r,
                  },
                  distance,
                }));
              },
              onDone: async () => {
                disableUserRotationRef.current = false;

                if (gameStateRef.current.type !== GameType.GAME) {
                  return;
                }

                innerGameStateRef.current = {
                  ...innerGameStateRef.current,
                  selectedCountryId: undefined,
                  failedCountryIds: [
                    ...innerGameStateRef.current.failedCountryIds,
                    originalGuessCountry.id,
                  ],
                };

                updateDirection(({distance}) => ({
                  direction: to,
                  distance,
                }));

                gameStateRef.current = {
                  ...gameStateRef.current,
                  guessCountry: undefined,
                };
                rerender();

                showSplashText(
                  <p>
                    You get wrong
                    <br />
                    {originalGuessCountry.title} is burned
                  </p>,
                  {
                    type: SplashStyle.SMALL_BAD,
                    timeout: 3000,
                  },
                );

                await wait(1500);

                if (innerGameStateRef.current.failedCountryIds.length >= WARMING_TRIES_COUNT) {
                  showBlockText(
                    <p>
                      It was your last try
                      <br />
                      Game Over
                    </p>,
                    {
                      type: SplashStyle.BAD,
                      timeout: 3000,
                    },
                    () => {
                      gameStateRef.current = {
                        type: GameType.MENU,
                        countriesState: gameStateRef.current.countriesState,
                      };
                      rerender();
                    },
                  );
                } else {
                  alreadyGuessedCountriesRef.current.push(originalGuessCountry.id);

                  gameStateRef.current = {
                    ...gameStateRef.current,
                    inGameState: InGameState.FINDING,
                  };
                  chooseNextCountry();
                }
              },
            };
          }
        }
        break;
      case GameType.QUIZ:
        if (gameStateRef.current.guessCountry && innerGameState.selectedCountryId) {
          if (gameStateRef.current.guessCountry.id === innerGameState.selectedCountryId) {
            showSplashText('You are right!');
            chooseNextCountry();
          } else {
            showSplashText('You missed, try again!', {
              type: SplashStyle.BAD,
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
      startTs: Date.now(),
      isRealDragging: false,
    };
    setDragging(true);
  });

  const onMouseMove = useHandler((event) => {
    const mouseDrag = mouseDragRef.current;

    if (mouseDrag) {
      mouseDrag.x += event.movementX;
      mouseDrag.y += event.movementY;

      if (!mouseDrag.isRealDragging) {
        if (Date.now() - mouseDrag.startTs > 300 || mouseDrag.x ** 2 + mouseDrag.y ** 2 >= 9) {
          mouseDrag.isRealDragging = true;
        }
      }
    }
  });

  useWindowEvent(
    'mouseup',
    (event) => {
      if (mouseDragRef.current?.isRealDragging) {
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
        <div className={styles.viewport} onMouseMove={isDragging ? onMouseMove : undefined}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width="0"
            height="0"
            onMouseDown={onMouseDown}
            onClick={isDragging ? (event) => event.preventDefault() : handleCanvasClick}
          />
          <div className={cn(styles.ui, {[styles.crosshair]: showCrosshair})}>
            {(() => {
              switch (gameStateRef.current.type) {
                case GameType.GAME: {
                  const {inGameState, guessCountry} = gameStateRef.current;

                  return (
                    <>
                      {[InGameState.STARTING, InGameState.SWITCHING, InGameState.FINDING].includes(
                        inGameState,
                      ) && (
                        <div className={styles.column}>
                          <div
                            className={cn(styles.gameText, {
                              [styles.starting]: inGameState === InGameState.STARTING,
                            })}
                          >
                            <p>
                              <span className={styles.warming}>Global warming</span> is coming, you
                              have to <span className={styles.cool}>cool</span> the
                            </p>
                            <p>
                              {guessCountry && inGameState !== InGameState.STARTING ? (
                                <span
                                  className={cn(styles.countryName, {
                                    [styles.animate]: inGameState === InGameState.FINDING,
                                    [styles.animateOut]: inGameState === InGameState.SWITCHING,
                                  })}
                                >
                                  {guessCountry.title}
                                </span>
                              ) : (
                                <span className={styles.countryName}>&nbsp;</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {splash}
                    </>
                  );
                }
                case GameType.QUIZ:
                  return (
                    <>
                      {gameStateRef.current.guessCountry && (
                        <div className={styles.column}>
                          <p className={styles.gameText}>
                            Guess the "{gameStateRef.current.guessCountry.title}"
                          </p>
                        </div>
                      )}
                      {splash}
                    </>
                  );
                case GameType.DISCOVERY: {
                  const {selectedCountryId} = innerGameStateRef.current;

                  if (!selectedCountryId) {
                    return undefined;
                  }
                  const country = countries.get(selectedCountryId);

                  if (!country) {
                    return undefined;
                  }

                  return (
                    <div className={styles.column}>
                      <p className={styles.gameText}>Country: "{country.title}"</p>
                    </div>
                  );
                }
                case GameType.MENU:
                  return (
                    <div className={styles.centered}>
                      <StartMenu
                        disabled={Boolean(introAnimation.current)}
                        onGameStart={onStartGameClick}
                        onQuizStart={onStartQuizClick}
                        onDiscoveryStart={onDiscoverClick}
                      />
                    </div>
                  );
                default:
                  return undefined;
              }
            })()}
            {isInGame() && (
              <RightPanel
                onZoomIn={() => {
                  updateDirection(({distance, ...rest}) => ({...rest, distance: distance - 1}));
                }}
                onZoomOut={() => {
                  updateDirection(({distance, ...rest}) => ({...rest, distance: distance + 1}));
                }}
              />
            )}
          </div>
        </div>
        {showDebugCanvas && (
          <canvas ref={debugCanvasRef} className={styles.debugCanvas} width="0" height="0" />
        )}
        <div className={styles.output}>
          <pre ref={fpsCounterRef}>&nbsp;</pre>
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
