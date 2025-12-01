import { useEffect, useMemo, useRef, useState } from 'react';
import KeyboardHelper from './KeyboardHelper';
import { Balloon, DifficultyKey, GameOptions } from '../types';
import { clamp } from '../utils';

type DifficultySetting = { multiplier: number; label: string };

const DIFFICULTY_LEVELS: Record<DifficultyKey, DifficultySetting> = {
  rookie: { multiplier: 0.5, label: 'Rookie' },
  beginner: { multiplier: 0.75, label: 'Beginner' },
  normal: { multiplier: 1, label: 'Normal' },
  advanced: { multiplier: 1.25, label: 'Advanced' },
  pro: { multiplier: 1.5, label: 'Pro' },
};

const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: "~`!@#$%^&*()_+-=[]{}|;:',.<>/?\"\\",
};

type Props = {
  options: GameOptions;
  onExit: () => void;
};

const colorForSpeed = (speed: number) => {
  if (speed <= 1.5) return { background: 'blue', text: 'white' };
  if (speed <= 2) return { background: 'green', text: 'white' };
  if (speed <= 2.5) return { background: 'yellow', text: 'black' };
  if (speed <= 3) return { background: 'orange', text: 'white' };
  return { background: 'red', text: 'white' };
};

const pickWeightedType = (opts: GameOptions, currentLetters: Set<string>) => {
  const weights = [
    { key: 'lower', w: 1.0, enabled: true },
    { key: 'upper', w: opts.upper ? 0.1 : 0, enabled: opts.upper },
    { key: 'numbers', w: opts.numbers ? 0.1 : 0, enabled: opts.numbers },
    { key: 'symbols', w: opts.symbols ? 0.1 : 0, enabled: opts.symbols },
  ];

  const candidates = weights
    .filter((t) => t.enabled && t.w > 0)
    .map((t) => {
      const pool = CHARS[t.key as keyof typeof CHARS];
      const available: string[] = [];
      for (let i = 0; i < pool.length; i += 1) {
        const ch = pool[i];
        if (!currentLetters.has(ch)) available.push(ch);
      }
      return { key: t.key as keyof typeof CHARS, w: t.w, available };
    })
    .filter((t) => t.available.length > 0);

  if (candidates.length === 0) {
    currentLetters.clear();
    return { key: 'lower' as const, available: CHARS.lower.split('') };
  }

  const total = candidates.reduce((sum, c) => sum + c.w, 0);
  let r = Math.random() * total;
  for (const candidate of candidates) {
    r -= candidate.w;
    if (r <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
};

export function Game({ options, onExit }: Props) {
  const difficultySetting = DIFFICULTY_LEVELS[options.difficulty] ?? DIFFICULTY_LEVELS.normal;
  const difficultyMultiplier = difficultySetting.multiplier;
  const minBalloons = clamp(options.min, 3, 20);
  const maxBalloons = clamp(options.max, 3, 20);

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const balloonIdRef = useRef<number>(0);
  const currentLetters = useRef<Set<string>>(new Set());
  const balloonsRef = useRef<Balloon[]>([]);

  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [correctPops, setCorrectPops] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [countdown, setCountdown] = useState<number | 'Go' | null>(3);
  const [countdownVisible, setCountdownVisible] = useState(true);

  const correctPercentage = useMemo(() => {
    const total = correctPops + mistakes;
    if (total === 0) return 0;
    return Math.round((correctPops / total) * 100);
  }, [correctPops, mistakes]);

  const resetGameState = () => {
    setScore(0);
    setCorrectPops(0);
    setMistakes(0);
    setTime(0);
    setGameActive(false);
    setBalloons([]);
    balloonsRef.current = [];
    currentLetters.current.clear();
    setCountdown(3);
    setCountdownVisible(true);
    lastSpawnRef.current = 0;
  };

  const createBalloon = (playfieldWidth: number) => {
    const type = pickWeightedType(options, currentLetters.current);
    const char = type.available[Math.floor(Math.random() * type.available.length)];
    currentLetters.current.add(char);
    const left = Math.max(0, Math.random() * Math.max(0, playfieldWidth - 50));
    const baseSpeed = Math.random() * 3 + 1;
    const speed = baseSpeed * difficultyMultiplier;
    const color = colorForSpeed(speed);
    balloonIdRef.current += 1;
    return {
      id: balloonIdRef.current,
      char,
      left,
      bottom: 0,
      speed,
      color: color.background,
      textColor: color.text,
    } as Balloon;
  };

  const stopLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    resetGameState();
    let cancelled = false;
    let current = 3;
    let goTimeout: number | null = null;
    setCountdown(current);

    const interval = window.setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
        return;
      }
      window.clearInterval(interval);
      setCountdown('Go');
      goTimeout = window.setTimeout(() => {
        if (cancelled) return;
        setCountdownVisible(false);
        setCountdown(null);
        setGameActive(true);
      }, 600);
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (goTimeout !== null) window.clearTimeout(goTimeout);
      stopLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    if (!gameActive) return undefined;
    const timerId = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => window.clearInterval(timerId);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return undefined;
    const step = (timestamp: number) => {
      const height = Math.max(gameAreaRef.current?.clientHeight ?? 0, 1);
      const width = Math.max(gameAreaRef.current?.clientWidth ?? 0, 1);
      let missed = 0;

      const nextBalloons = balloonsRef.current
        .map((b) => ({ ...b, bottom: b.bottom + b.speed }))
        .filter((b) => {
          if (b.bottom > height) {
            missed += 1;
            currentLetters.current.delete(b.char);
            return false;
          }
          return true;
        });

      while (nextBalloons.length < minBalloons) {
        nextBalloons.push(createBalloon(width));
      }

      if (nextBalloons.length < maxBalloons && timestamp - lastSpawnRef.current >= 1000) {
        nextBalloons.push(createBalloon(width));
        lastSpawnRef.current = timestamp;
      }

      if (missed > 0) {
        setScore((s) => s - missed * 50);
        setMistakes((m) => m + missed);
      }

      balloonsRef.current = nextBalloons;
      setBalloons(nextBalloons);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      stopLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive, minBalloons, maxBalloons, difficultyMultiplier]);

  useEffect(() => {
    if (!gameActive) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameActive) return;
      const key = event.key;
      if (!key || key.length !== 1) return;

      setBalloons((prev) => {
        let popped = 0;
        const remaining = prev.filter((b) => {
          if (b.char === key) {
            popped += 1;
            currentLetters.current.delete(b.char);
            return false;
          }
          return true;
        });

        balloonsRef.current = remaining;

        if (popped > 0) {
          setScore((s) => s + popped * 100);
          setCorrectPops((c) => c + popped);
        } else {
          setScore((s) => s - 25);
          setMistakes((m) => m + 1);
        }
        return remaining;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive]);

  useEffect(
    () => () => {
      stopLoop();
    },
    [],
  );

  const handleExit = () => {
    setGameActive(false);
    stopLoop();
    onExit();
  };

  return (
    <div className="game-shell">
      <nav id="game-info" aria-label="Game stats">
        <div id="difficulty">Difficulty: {difficultySetting.label}</div>
        <div id="correct-pops">Correct Pops: {correctPops}</div>
        <div id="mistakes">Mistakes/Missed: {mistakes}</div>
        <div id="timer">
          Time: {Math.floor(time / 60)}:{`${time % 60 < 10 ? `0${time % 60}` : time % 60}`}
        </div>
        <div id="correct-pops-percentage">Correct Pops Percentage: {correctPercentage}%</div>
        <div id="score">Score: {score}</div>
        <div>
          <button id="new-game-btn" className="btn btn-outline" type="button" onClick={handleExit}>
            New Game
          </button>
        </div>
      </nav>

      <div className="game-main">
        <div id="game-area" ref={gameAreaRef}>
          {balloons.map((balloon) => (
            <div
              key={balloon.id}
              className="balloon"
              style={{
                left: `${balloon.left}px`,
                bottom: `${balloon.bottom}px`,
                backgroundColor: balloon.color,
                color: balloon.textColor,
              }}
            >
              {balloon.char}
            </div>
          ))}
        </div>
        <KeyboardHelper balloons={balloons} visible={options.keyboardVisible} />
      </div>

      {countdownVisible ? (
        <div id="countdown-overlay" role="status" aria-live="assertive" className={countdownVisible ? '' : 'hidden'}>
          <div id="countdown-text">{countdown}</div>
        </div>
      ) : null}
    </div>
  );
}

export default Game;
