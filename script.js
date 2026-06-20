const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const correctPopsDisplay = document.getElementById('correct-pops');
const mistakesDisplay = document.getElementById('mistakes');
const timerDisplay = document.getElementById('timer');
const correctPopsPercentage = document.getElementById('correct-pops-percentage');
const difficultyDisplay = document.getElementById('difficulty');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');
const keyboardLayer = document.getElementById('keyboard-layer');
const fingersLayer = document.getElementById('fingers-layer');
let score = 0;
let correctPops = 0;
let mistakes = 0;
let balloons = [];
let currentLetters = new Set();
let gameActive = false;
let time = 0;
let timer = null;
let correctPopsPercentageValue = 0;
let correctPopsPercentageTimer = null;
let gameLoopHandle = null;

// Read options from URL params
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
const params = new URLSearchParams(window.location.search);
const helperModeParam = params.get('helperMode');
const keyboardVisibleParam = params.get('keyboardVisible');
const helperMode =
    helperModeParam === 'fingers' || helperModeParam === 'keyboard' || helperModeParam === 'none'
        ? helperModeParam
        : keyboardVisibleParam === '0'
            ? 'none'
            : 'keyboard';
const DIFFICULTY_LEVELS = {
  rookie: { multiplier: 0.5, label: 'Rookie' },
  beginner: { multiplier: 0.75, label: 'Beginner' },
  normal: { multiplier: 1, label: 'Normal' },
  advanced: { multiplier: 1.25, label: 'Advanced' },
  pro: { multiplier: 1.5, label: 'Pro' },
};
const opt = {
  lower: true, // lowercase is mandatory
  upper: params.get('upper') === 'true',
  numbers: params.get('numbers') === 'true',
  symbols: params.get('symbols') === 'true',
  min: clamp(parseInt(params.get('min')) || 3, 3, 20),
  max: clamp(parseInt(params.get('max')) || 10, 3, 20),
  difficulty: (params.get('difficulty') || 'normal').toLowerCase(),
};
if (opt.max < opt.min) opt.max = opt.min;
const difficultySetting = DIFFICULTY_LEVELS[opt.difficulty] || DIFFICULTY_LEVELS.normal;

const maxBalloons = opt.max;
const minBalloons = opt.min;
const difficultyMultiplier = difficultySetting.multiplier;

// Character pools
const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: "~`!@#$%^&*()_+-=[]{}|;:',.<>/?\"\\"
};

// Keyboard helper layout with hand mapping for shift guidance
const KEYBOARD_LAYOUT = [
  [
    { main: '`', alt: '~', hand: 'left' }, { main: '1', alt: '!', hand: 'left' }, { main: '2', alt: '@', hand: 'left' }, { main: '3', alt: '#', hand: 'left' }, { main: '4', alt: '$', hand: 'left' },
    { main: '5', alt: '%', hand: 'left' }, { main: '6', alt: '^', hand: 'left' }, { main: '', value: 'spacer-top', className: 'spacer' }, { main: '7', alt: '&', hand: 'right' }, { main: '8', alt: '*', hand: 'right' }, { main: '9', alt: '(', hand: 'right' },
    { main: '0', alt: ')', hand: 'right' }, { main: '-', alt: '_', hand: 'right' }, { main: '=', alt: '+', hand: 'right' }
  ],
  [
    { main: 'Q', hand: 'left' }, { main: 'W', hand: 'left' }, { main: 'E', hand: 'left' }, { main: 'R', hand: 'left' }, { main: 'T', hand: 'left' }, { main: '', value: 'spacer-upper', className: 'spacer' }, { main: 'Y', hand: 'right' }, { main: 'U', hand: 'right' }, { main: 'I', hand: 'right' }, { main: 'O', hand: 'right' }, { main: 'P', hand: 'right' },
    { main: '[', alt: '{', hand: 'right' }, { main: ']', alt: '}', hand: 'right' }, { main: '\\', alt: '|', hand: 'right' }
  ],
  [
    { main: 'A', hand: 'left' }, { main: 'S', hand: 'left' }, { main: 'D', hand: 'left' }, { main: 'F', hand: 'left' }, { main: 'G', hand: 'left' }, { main: '', value: 'spacer-home', className: 'spacer' }, { main: 'H', hand: 'right' }, { main: 'J', hand: 'right' }, { main: 'K', hand: 'right' }, { main: 'L', hand: 'right' },
    { main: ';', alt: ':', hand: 'right' }, { main: '\'', alt: '"', hand: 'right' }
  ],
  [
    { main: 'Shift', value: 'shift-left', className: 'shift shift-left', hand: 'leftShift' },
    { main: 'Z', hand: 'left' }, { main: 'X', hand: 'left' }, { main: 'C', hand: 'left' }, { main: 'V', hand: 'left' }, { main: 'B', hand: 'left' }, { main: '', value: 'spacer-bottom', className: 'spacer' }, { main: 'N', hand: 'right' }, { main: 'M', hand: 'right' },
    { main: ',', alt: '<', hand: 'right' }, { main: '.', alt: '>', hand: 'right' }, { main: '/', alt: '?', hand: 'right' },
    { main: 'Shift', value: 'shift-right', className: 'shift shift-right', hand: 'rightShift' }
  ],
];
const FLAT_KEYS = KEYBOARD_LAYOUT.flat();

const FINGERS = [
    { id: 'left-pinky', hand: 'left', label: 'Pinky', className: 'pinky' },
    { id: 'left-ring', hand: 'left', label: 'Ring', className: 'ring' },
    { id: 'left-middle', hand: 'left', label: 'Middle', className: 'middle' },
    { id: 'left-index', hand: 'left', label: 'Index', className: 'index' },
    { id: 'left-thumb', hand: 'left', label: 'Thumb', className: 'thumb' },
    { id: 'right-thumb', hand: 'right', label: 'Thumb', className: 'thumb' },
    { id: 'right-index', hand: 'right', label: 'Index', className: 'index' },
    { id: 'right-middle', hand: 'right', label: 'Middle', className: 'middle' },
    { id: 'right-ring', hand: 'right', label: 'Ring', className: 'ring' },
    { id: 'right-pinky', hand: 'right', label: 'Pinky', className: 'pinky' },
];

const FINGER_ORDER = {
    left: ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb'],
    right: ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'],
};

const KEY_TO_FINGER = new Map();

function mapFinger(fingerId, chars) {
    chars.forEach(ch => {
        KEY_TO_FINGER.set(ch, fingerId);
        KEY_TO_FINGER.set(ch.toLowerCase(), fingerId);
    });
}

mapFinger('left-pinky', ['`', '~', '1', '!', 'q', 'a', 'z']);
mapFinger('left-ring', ['2', '@', 'w', 's', 'x']);
mapFinger('left-middle', ['3', '#', 'e', 'd', 'c']);
mapFinger('left-index', ['4', '$', '5', '%', '6', '^', 'r', 't', 'f', 'g', 'v', 'b']);
mapFinger('right-index', ['7', '&', 'y', 'u', 'h', 'j', 'n', 'm']);
mapFinger('right-middle', ['8', '*', 'i', 'k', ',', '<']);
mapFinger('right-ring', ['9', '(', 'o', 'l', '.', '>']);
mapFinger('right-pinky', ['0', ')', '-', '_', '=', '+', 'p', '[', '{', ']', '}', '\\', '|', ';', ':', "'", '"', '/', '?']);

// Weighted selection: lowercase baseline 1.0; others 0.1 each if enabled
function pickWeightedType() {
    const weights = [
        { key: 'lower', w: 1.0, enabled: true },
        { key: 'upper', w: opt.upper ? 0.1 : 0, enabled: opt.upper },
        { key: 'numbers', w: opt.numbers ? 0.1 : 0, enabled: opt.numbers },
        { key: 'symbols', w: opt.symbols ? 0.1 : 0, enabled: opt.symbols },
    ];
    // Filter out types that currently have no available characters (all in use)
    const candidates = weights
        .filter(t => t.enabled && t.w > 0)
        .map(t => {
            const pool = CHARS[t.key];
            const available = [];
            for (let i = 0; i < pool.length; i++) {
                const ch = pool[i];
                if (!currentLetters.has(ch)) available.push(ch);
            }
            return { key: t.key, w: t.w, available };
        })
        .filter(t => t.available.length > 0);

    if (candidates.length === 0) {
        // All characters are taken; clear and fallback to lowercase as mandatory
        currentLetters.clear();
        return { key: 'lower', w: 1.0, available: CHARS.lower.split('') };
    }

    const total = candidates.reduce((s, c) => s + c.w, 0);
    let r = Math.random() * total;
    for (const c of candidates) {
        if ((r -= c.w) <= 0) return c;
    }
    return candidates[candidates.length - 1];
}

function randomUniqueChar() {
    const t = pickWeightedType();
    const arr = t.available;
    const ch = arr[Math.floor(Math.random() * arr.length)];
    currentLetters.add(ch);
    return ch;
}

function buildKeyboardLayer() {
    if (!keyboardLayer) return;
    keyboardLayer.innerHTML = '';
    KEYBOARD_LAYOUT.forEach((row, i) => {
        const rowEl = document.createElement('div');
        rowEl.className = `keyboard-row row-${i + 1}`;
        row.forEach(key => {
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            if (key.className) {
                key.className.split(' ').forEach(cls => keyEl.classList.add(cls));
            }
            const value = key.value !== undefined ? key.value : key.main;
            keyEl.dataset.keyValue = String(value).toLowerCase();
            if (key.alt) keyEl.dataset.altValue = key.alt.toLowerCase();
            if (key.hand) keyEl.dataset.hand = key.hand;
            const mainSpan = document.createElement('span');
            mainSpan.className = 'key-main';
            mainSpan.textContent = key.main;
            keyEl.appendChild(mainSpan);
            if (key.alt) {
                const altSpan = document.createElement('span');
                altSpan.className = 'key-alt';
                altSpan.textContent = key.alt;
                keyEl.appendChild(altSpan);
            }
            rowEl.appendChild(keyEl);
        });
        keyboardLayer.appendChild(rowEl);
    });
}

function buildFingersLayer() {
    if (!fingersLayer) return;
    fingersLayer.innerHTML = '';

    ['left', 'right'].forEach(side => {
        const handEl = document.createElement('div');
        handEl.className = `hand-helper ${side}-hand`;

        const label = document.createElement('div');
        label.className = 'hand-label';
        label.textContent = side === 'left' ? 'Left hand' : 'Right hand';

        const fingerSet = document.createElement('div');
        fingerSet.className = 'finger-set';

        FINGER_ORDER[side].forEach(fingerId => {
            const finger = FINGERS.find(item => item.id === fingerId);
            if (!finger) return;

            const fingerEl = document.createElement('div');
            fingerEl.className = `finger ${finger.className} ${finger.id}`;
            fingerEl.dataset.fingerId = finger.id;

            const fingerName = document.createElement('span');
            fingerName.className = 'finger-name';
            fingerName.textContent = finger.label;

            const fingerKeys = document.createElement('span');
            fingerKeys.className = 'finger-keys';

            fingerEl.appendChild(fingerName);
            fingerEl.appendChild(fingerKeys);
            fingerSet.appendChild(fingerEl);
        });

        const palm = document.createElement('div');
        palm.className = 'palm';

        handEl.appendChild(label);
        handEl.appendChild(fingerSet);
        handEl.appendChild(palm);
        fingersLayer.appendChild(handEl);
    });
}

function isUpperAlpha(ch) {
    return /^[A-Z]$/.test(ch);
}

function keyInfoForChar(ch) {
    if (!ch) return null;
    const lower = ch.toLowerCase();
    for (const key of FLAT_KEYS) {
        const mainValue = key.value !== undefined ? String(key.value) : key.main;
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
}

function addFingerChar(activeFingers, fingerId, label) {
    if (!fingerId) return;
    if (!activeFingers.has(fingerId)) activeFingers.set(fingerId, new Set());
    activeFingers.get(fingerId).add(label);
}

function fingerForChar(ch) {
    if (!ch) return null;
    return KEY_TO_FINGER.get(ch) || KEY_TO_FINGER.get(ch.toLowerCase()) || null;
}

function collectActiveFingerState() {
    const activeFingers = new Map();

    balloons.forEach(b => {
        const ch = (b.textContent || '').trim();
        if (!ch) return;

        addFingerChar(activeFingers, fingerForChar(ch), ch);

        const info = keyInfoForChar(ch);
        if (info && info.requiresShift) {
            if (info.key.hand === 'right') {
                addFingerChar(activeFingers, 'left-pinky', 'Shift');
            } else if (info.key.hand === 'left') {
                addFingerChar(activeFingers, 'right-pinky', 'Shift');
            }
        }
    });

    return activeFingers;
}

function updateKeyboardHighlights() {
    if (!keyboardLayer) return;
    const active = new Set();
    let leftShiftNeeded = false;
    let rightShiftNeeded = false;
    balloons.forEach(b => {
        const ch = (b.textContent || '').trim();
        if (!ch) return;
        active.add(ch.toLowerCase());
        active.add(ch);
        const info = keyInfoForChar(ch);
        if (info && info.requiresShift) {
            if (info.key.hand === 'right') {
                leftShiftNeeded = true;
            } else if (info.key.hand === 'left') {
                rightShiftNeeded = true;
            }
        }
    });
    const keyEls = keyboardLayer.querySelectorAll('.key');
    keyEls.forEach(el => {
        const keyValue = el.dataset.keyValue;
        const altValue = el.dataset.altValue;
        let isActive = false;
        if (keyValue && (active.has(keyValue) || active.has((keyValue || '').toLowerCase()))) {
            isActive = true;
        }
        if (altValue && (active.has(altValue) || active.has((altValue || '').toLowerCase()))) {
            isActive = true;
        }
        if (keyValue === 'shift-left') {
            isActive = isActive || leftShiftNeeded;
        }
        if (keyValue === 'shift-right') {
            isActive = isActive || rightShiftNeeded;
        }
        el.classList.toggle('active', isActive);
    });
}

function updateFingersHighlights() {
    if (!fingersLayer) return;
    const activeFingers = collectActiveFingerState();
    const fingerEls = fingersLayer.querySelectorAll('.finger');

    fingerEls.forEach(el => {
        const fingerId = el.dataset.fingerId;
        const activeChars = activeFingers.get(fingerId);
        const isActive = Boolean(activeChars && activeChars.size);
        const keysEl = el.querySelector('.finger-keys');

        el.classList.toggle('active', isActive);
        if (keysEl) keysEl.textContent = isActive ? Array.from(activeChars).join(' ') : '';
    });
}

function updateHelperHighlights() {
    updateKeyboardHighlights();
    updateFingersHighlights();
}

function setKeyboardVisibility(show) {
    if (!keyboardLayer) return;
    keyboardLayer.classList.toggle('hidden', !show);
}

function setFingersVisibility(show) {
    if (!fingersLayer) return;
    fingersLayer.classList.toggle('hidden', !show);
}

function setHelperVisibility(mode) {
    setKeyboardVisibility(mode === 'keyboard');
    setFingersVisibility(mode === 'fingers');
}

// Function to create a balloon
function createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.textContent = randomUniqueChar();
    balloon.style.left = `${Math.random() * (gameArea.offsetWidth - 50)}px`;
    balloon.style.bottom = '0px';

    const baseSpeed = Math.random() * 3 + 1;
    const speed = baseSpeed * difficultyMultiplier;
    balloon.dataset.speed = speed;
    setBalloonColor(balloon, speed);

    balloons.push(balloon);
    gameArea.appendChild(balloon);
    animateBalloon(balloon);
    updateHelperHighlights();
}

// Function to set balloon color based on speed
function setBalloonColor(balloon, speed) {
    if (speed <= 1.5) {
        balloon.style.backgroundColor = 'blue';
        balloon.style.color = 'white';
    } else if (speed <= 2) {
        balloon.style.backgroundColor = 'green';
        balloon.style.color = 'white';
    } else if (speed <= 2.5) {
        balloon.style.backgroundColor = 'yellow';
        balloon.style.color = 'black'; // Ensure text is visible on yellow background
    } else if (speed <= 3) {
        balloon.style.backgroundColor = 'orange';
        balloon.style.color = 'white';
    } else {
        balloon.style.backgroundColor = 'red';
        balloon.style.color = 'white';
    }
}

// Function to animate balloons
function animateBalloon(balloon) {
    const speed = parseFloat(balloon.dataset.speed);
    let position = parseInt(balloon.style.bottom);

    function move() {
        if (position > gameArea.offsetHeight) {
            // Balloon reached the top, missed
            gameArea.removeChild(balloon);
            balloons = balloons.filter(b => b !== balloon);
            currentLetters.delete(balloon.textContent);
            score -= 50;  // Deduct points when balloon reaches the top
            mistakes += 1;  // Increment the missed counter
            scoreDisplay.textContent = `Score: ${score}`;
            mistakesDisplay.textContent = `Mistakes/Missed: ${mistakes}`;  // Update mistakes counter
            updateHelperHighlights();
        } else {
            position += speed;
            balloon.style.bottom = `${position}px`;
            requestAnimationFrame(move);
        }
    }

    move();
}

// Function to handle key press
function handleKeyPress(event) {
    if (!gameActive) return;
    const key = event.key;
    if (!key || key.length !== 1) return; // ignore control keys

    let popped = false;

    balloons.forEach(balloon => {
        if (balloon.textContent === key) {
            gameArea.removeChild(balloon);
            balloons = balloons.filter(b => b !== balloon);
            currentLetters.delete(balloon.textContent);
            score += 100;
            correctPops += 1;  // Increment the correct pops counter
            popped = true;
        }
    });

    if (!popped) {
        score -= 25;  // Deduct points for wrong key press
        mistakes += 1;  // Increment the mistakes counter
    }

    scoreDisplay.textContent = `Score: ${score}`;
    correctPopsDisplay.textContent = `Correct Pops: ${correctPops}`;  // Update correct pops counter
    mistakesDisplay.textContent = `Mistakes/Missed: ${mistakes}`;  // Update mistakes counter
    updateHelperHighlights();
}

// Set up the game timer that counts elapsed time in mm:ss format
function startElapsedTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        time += 1;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        if (timerDisplay) timerDisplay.textContent = `Time: ${minutes}:${paddedSeconds}`;
    }, 1000);
}

// Calculate percentage of correct pops
function startCorrectPopsPercentageTimer() {
    if (correctPopsPercentageTimer) clearInterval(correctPopsPercentageTimer);
    correctPopsPercentageTimer = setInterval(() => {
        if (correctPops + mistakes > 0) {
            correctPopsPercentageValue = Math.round((correctPops / (correctPops + mistakes)) * 100);
        } else {
            correctPopsPercentageValue = 0;
        }
        if (correctPopsPercentage) correctPopsPercentage.textContent = `Correct Pops Percentage: ${correctPopsPercentageValue}%`;
    }, 1000);
}

function startGame() {
    if (gameActive) return;
    gameActive = true;
    time = 0;
    correctPopsPercentageValue = 0;
    if (difficultyDisplay) difficultyDisplay.textContent = `Difficulty: ${difficultySetting.label}`;
    if (timerDisplay) timerDisplay.textContent = 'Time: 0:00';
    if (correctPopsPercentage) correctPopsPercentage.textContent = 'Correct Pops Percentage: 0%';
    startElapsedTimer();
    startCorrectPopsPercentageTimer();
    gameLoop();
}

function runCountdown(start = 3) {
    if (!countdownOverlay || !countdownText) {
        startGame();
        return;
    }

    let current = start;
    countdownOverlay.classList.remove('hidden');
    countdownText.textContent = String(current);

    const countdownInterval = setInterval(() => {
        current -= 1;
        if (current > 0) {
            countdownText.textContent = String(current);
            return;
        }

        clearInterval(countdownInterval);
        countdownText.textContent = 'Go!';

        setTimeout(() => {
            countdownOverlay.classList.add('hidden');
            countdownText.textContent = String(start);
            startGame();
        }, 600);
    }, 1000);
}


// Set up the game loop
function gameLoop() {
    if (!gameActive) return;
    while (balloons.length < minBalloons) {
        createBalloon();
    }
    if (balloons.length < maxBalloons) {
        createBalloon();
    }

    gameLoopHandle = setTimeout(gameLoop, 1000);
}

document.addEventListener('keydown', handleKeyPress);
runCountdown();

// Support New Game action: reset stats, stop timers, and go back to setup
function resetGame() {
    gameActive = false;
    if (gameLoopHandle) {
        clearTimeout(gameLoopHandle);
        gameLoopHandle = null;
    }
    // Stop timers
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    if (correctPopsPercentageTimer) {
        clearInterval(correctPopsPercentageTimer);
        correctPopsPercentageTimer = null;
    }

    // Remove balloons from DOM
    balloons.forEach(b => { if (b.parentNode) b.parentNode.removeChild(b); });
    balloons = [];
    currentLetters.clear();
    updateHelperHighlights();

    // Reset counters
    score = 0;
    correctPops = 0;
    mistakes = 0;
    time = 0;
    correctPopsPercentageValue = 0;

    // Update UI
    if (scoreDisplay) scoreDisplay.textContent = 'Score: 0';
    if (correctPopsDisplay) correctPopsDisplay.textContent = 'Correct Pops: 0';
   if (mistakesDisplay) mistakesDisplay.textContent = 'Mistakes/Missed: 0';
   if (timerDisplay) timerDisplay.textContent = 'Time: 0:00';
    if (correctPopsPercentage) correctPopsPercentage.textContent = 'Correct Pops Percentage: 0%';

    // Detach handlers just in case
    document.removeEventListener('keydown', handleKeyPress);
}

const newGameBtn = document.getElementById('new-game-btn');
if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
        resetGame();
        window.location.href = 'index.html';
    });
}

buildKeyboardLayer();
buildFingersLayer();
setHelperVisibility(helperMode);
updateHelperHighlights();
