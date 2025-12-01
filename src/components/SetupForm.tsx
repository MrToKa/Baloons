import { useEffect, useMemo, useState } from 'react';
import { clamp } from '../utils';
import { DifficultyKey, GameOptions } from '../types';

type Props = {
  onStart: (options: GameOptions) => void;
  initialOptions?: Partial<GameOptions>;
};

const KEYBOARD_VISIBILITY_KEY = 'keyboard-layout-visible';

const difficultyOptions: { value: DifficultyKey; label: string; speed: string }[] = [
  { value: 'rookie', label: 'Rookie', speed: '0.5x' },
  { value: 'beginner', label: 'Beginner', speed: '0.75x' },
  { value: 'normal', label: 'Normal', speed: '1x' },
  { value: 'advanced', label: 'Advanced', speed: '1.25x' },
  { value: 'pro', label: 'Pro', speed: '1.5x' },
];

const readKeyboardVisibilityPreference = () => {
  try {
    const stored = localStorage.getItem(KEYBOARD_VISIBILITY_KEY);
    if (stored === '0') return false;
    if (stored === '1') return true;
  } catch {
    // Ignore storage failures.
  }
  return true;
};

const defaultOptions: GameOptions = {
  upper: false,
  numbers: false,
  symbols: false,
  min: 3,
  max: 10,
  difficulty: 'normal',
  keyboardVisible: readKeyboardVisibilityPreference(),
};

export function SetupForm({ onStart, initialOptions }: Props) {
  const mergedDefaults = useMemo(
    () => ({ ...defaultOptions, ...initialOptions }),
    [initialOptions],
  );

  const [upper, setUpper] = useState<boolean>(mergedDefaults.upper);
  const [numbers, setNumbers] = useState<boolean>(mergedDefaults.numbers);
  const [symbols, setSymbols] = useState<boolean>(mergedDefaults.symbols);
  const [min, setMin] = useState<number>(mergedDefaults.min);
  const [max, setMax] = useState<number>(mergedDefaults.max);
  const [difficulty, setDifficulty] = useState<DifficultyKey>(mergedDefaults.difficulty);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(mergedDefaults.keyboardVisible);

  useEffect(() => {
    try {
      localStorage.setItem(KEYBOARD_VISIBILITY_KEY, keyboardVisible ? '1' : '0');
    } catch {
      // Ignore storage failures.
    }
  }, [keyboardVisible]);

  const validation = useMemo(() => {
    const safeMin = clamp(Number.isNaN(min) ? defaultOptions.min : min, 3, 20);
    const safeMax = clamp(Number.isNaN(max) ? defaultOptions.max : max, 3, 20);
    return { min: safeMin, max: safeMax, ok: safeMin <= safeMax };
  }, [min, max]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: GameOptions = {
      upper,
      numbers,
      symbols,
      min: validation.min,
      max: validation.max,
      difficulty,
      keyboardVisible,
    };
    if (!validation.ok) return;
    onStart(payload);
  };

  const clampMin = () => setMin(validation.min);
  const clampMax = () => setMax(validation.max);

  return (
    <form className="container" onSubmit={onSubmit}>
      <h1 style={{ margin: '0 0 12px', textAlign: 'center' }}>Balloon Game — Setup</h1>

      <fieldset>
        <legend>Characters</legend>
        <div>
          <label>
            <input type="checkbox" checked disabled /> Lowercase letters (a–z) — mandatory
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={upper}
              onChange={(e) => setUpper(e.target.checked)}
            />{' '}
            Uppercase letters (A–Z)
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
            />{' '}
            Numbers (0–9)
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
            />{' '}
            Symbols (~ ! @ # $ % ...)
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Balloon Count</legend>
        <div className="row">
          <div>
            <label htmlFor="min">Min on screen (3–20)</label>
            <input
              id="min"
              type="number"
              min={3}
              max={20}
              value={min}
              onBlur={clampMin}
              onChange={(e) => setMin(parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label htmlFor="max">Max on screen (3–20)</label>
            <input
              id="max"
              type="number"
              min={3}
              max={20}
              value={max}
              onBlur={clampMax}
              onChange={(e) => setMax(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
        <div className="error" aria-live="polite" style={{ display: validation.ok ? 'none' : 'block' }}>
          Ensure Min ≤ Max within 3–20.
        </div>
      </fieldset>

      <fieldset>
        <legend>Difficulty</legend>
        <div>
          <label htmlFor="difficulty">Balloon speed</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyKey)}
          >
            {difficultyOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} ({d.speed})
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>Keyboard helper</legend>
        <div className="keyboard-toggle">
          <label htmlFor="keyboard-visibility-toggle">
            <input
              id="keyboard-visibility-toggle"
              type="checkbox"
              checked={keyboardVisible}
              onChange={(e) => setKeyboardVisible(e.target.checked)}
            />
            Show keyboard helper during play
          </label>
        </div>
      </fieldset>

      <div className="actions">
        <button className="btn btn-primary" type="submit" disabled={!validation.ok}>
          Start Game
        </button>
      </div>
    </form>
  );
}

export default SetupForm;
