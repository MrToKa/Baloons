import { useMemo } from 'react';
import { Balloon } from '../types';

type KeyDefinition = {
  main: string;
  alt?: string;
  value?: string;
  className?: string;
  hand?: 'left' | 'right' | 'leftShift' | 'rightShift';
};

const KEYBOARD_LAYOUT: KeyDefinition[][] = [
  [
    { main: '`', alt: '~', hand: 'left' },
    { main: '1', alt: '!', hand: 'left' },
    { main: '2', alt: '@', hand: 'left' },
    { main: '3', alt: '#', hand: 'left' },
    { main: '4', alt: '$', hand: 'left' },
    { main: '5', alt: '%', hand: 'left' },
    { main: '6', alt: '^', hand: 'left' },
    { main: '7', alt: '&', hand: 'right' },
    { main: '8', alt: '*', hand: 'right' },
    { main: '9', alt: '(', hand: 'right' },
    { main: '0', alt: ')', hand: 'right' },
    { main: '-', alt: '_', hand: 'right' },
    { main: '=', alt: '+', hand: 'right' },
  ],
  [
    { main: 'Q', hand: 'left' },
    { main: 'W', hand: 'left' },
    { main: 'E', hand: 'left' },
    { main: 'R', hand: 'left' },
    { main: 'T', hand: 'left' },
    { main: 'Y', hand: 'right' },
    { main: 'U', hand: 'right' },
    { main: 'I', hand: 'right' },
    { main: 'O', hand: 'right' },
    { main: 'P', hand: 'right' },
    { main: '[', alt: '{', hand: 'right' },
    { main: ']', alt: '}', hand: 'right' },
    { main: '\\', alt: '|', hand: 'right' },
  ],
  [
    { main: 'A', hand: 'left' },
    { main: 'S', hand: 'left' },
    { main: 'D', hand: 'left' },
    { main: 'F', hand: 'left' },
    { main: 'G', hand: 'left' },
    { main: 'H', hand: 'right' },
    { main: 'J', hand: 'right' },
    { main: 'K', hand: 'right' },
    { main: 'L', hand: 'right' },
    { main: ';', alt: ':', hand: 'right' },
    { main: "'", alt: '"', hand: 'right' },
  ],
  [
    { main: 'Shift', value: 'shift-left', className: 'shift shift-left', hand: 'leftShift' },
    { main: 'Z', hand: 'left' },
    { main: 'X', hand: 'left' },
    { main: 'C', hand: 'left' },
    { main: 'V', hand: 'left' },
    { main: 'B', hand: 'left' },
    { main: 'N', hand: 'right' },
    { main: 'M', hand: 'right' },
    { main: ',', alt: '<', hand: 'right' },
    { main: '.', alt: '>', hand: 'right' },
    { main: '/', alt: '?', hand: 'right' },
    { main: 'Shift', value: 'shift-right', className: 'shift shift-right', hand: 'rightShift' },
  ],
];

const FLAT_KEYS = KEYBOARD_LAYOUT.flat();

const isUpperAlpha = (ch: string) => /^[A-Z]$/.test(ch);

const keyInfoForChar = (ch: string) => {
  const lower = ch.toLowerCase();
  for (const key of FLAT_KEYS) {
    const mainValue = key.value ?? key.main;
    const mainLower = mainValue.toLowerCase();
    const altLower = key.alt ? key.alt.toLowerCase() : null;

    if (mainLower === lower) {
      return { key, requiresShift: isUpperAlpha(ch) };
    }
    if (altLower && altLower === lower) {
      return { key, requiresShift: true };
    }
  }
  return null;
};

type Props = {
  balloons: Balloon[];
  visible: boolean;
};

export function KeyboardHelper({ balloons, visible }: Props) {
  const { activeKeys, highlightLeftShift, highlightRightShift } = useMemo(() => {
    const active = new Set<string>();
    let leftShift = false;
    let rightShift = false;

    balloons.forEach((b) => {
      const ch = b.char;
      if (!ch) return;
      active.add(ch.toLowerCase());
      active.add(ch);
      const info = keyInfoForChar(ch);
      if (info?.requiresShift) {
        if (info.key.hand === 'right') {
          leftShift = true;
        } else if (info.key.hand === 'left') {
          rightShift = true;
        }
      }
    });

    return { activeKeys: active, highlightLeftShift: leftShift, highlightRightShift: rightShift };
  }, [balloons]);

  return (
    <section
      id="keyboard-layer"
      aria-label="Keyboard helper"
      className={!visible ? 'hidden' : undefined}
    >
      {KEYBOARD_LAYOUT.map((row, idx) => (
        <div key={idx} className={`keyboard-row row-${idx + 1}`}>
          {row.map((key) => {
            const value = (key.value ?? key.main).toLowerCase();
            const alt = key.alt?.toLowerCase();
            const isShiftLeft = key.value === 'shift-left';
            const isShiftRight = key.value === 'shift-right';
            const shouldHighlight =
              (value && (activeKeys.has(value) || activeKeys.has((value || '').toLowerCase()))) ||
              (alt && (activeKeys.has(alt) || activeKeys.has(alt.toLowerCase()))) ||
              (isShiftLeft && highlightLeftShift) ||
              (isShiftRight && highlightRightShift);

            return (
              <div
                key={`${key.main}-${key.alt ?? ''}-${key.value ?? ''}`}
                className={`key${key.className ? ` ${key.className}` : ''}${shouldHighlight ? ' active' : ''}`}
              >
                <span className="key-main">{key.main}</span>
                {key.alt ? <span className="key-alt">{key.alt}</span> : null}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

export default KeyboardHelper;
