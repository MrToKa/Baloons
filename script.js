const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const correctPopsDisplay = document.getElementById("correct-pops");
const mistakesDisplay = document.getElementById("mistakes");
const timerDisplay = document.getElementById("timer");
const correctPopsPercentageDisplay = document.getElementById(
  "correct-pops-percentage",
);
const difficultyDisplay = document.getElementById("difficulty");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");
const keyboardLayer = document.getElementById("keyboard-layer");
const fingersLayer = document.getElementById("fingers-layer");
let score = 0;
let correctPops = 0;
let mistakes = 0;
let balloons = [];
const currentLetters = new Set();
let gameActive = false;
let time = 0;
let timer = null;
let correctPopsPercentageTimer = null;
let gameLoopHandle = null;

const MIN_BALLOONS = 3;
const MAX_BALLOONS = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const params = new URLSearchParams(window.location.search);
const helperModeParam = params.get("helperMode");
const keyboardVisibleParam = params.get("keyboardVisible");
const helperMode =
  helperModeParam === "fingers" ||
  helperModeParam === "keyboard" ||
  helperModeParam === "none"
    ? helperModeParam
    : keyboardVisibleParam === "0"
      ? "none"
      : "keyboard";
const DIFFICULTY_LEVELS = {
  rookie: { multiplier: 0.5, label: "Rookie" },
  beginner: { multiplier: 0.75, label: "Beginner" },
  normal: { multiplier: 1, label: "Normal" },
  advanced: { multiplier: 1.25, label: "Advanced" },
  pro: { multiplier: 1.5, label: "Pro" },
};
const requestedLanguage = params.get("language");
const opt = {
  language:
    requestedLanguage === "bulgarian" || requestedLanguage === "english"
      ? requestedLanguage
      : "english",
  upper: params.get("upper") === "true",
  numbers: params.get("numbers") === "true",
  symbols: params.get("symbols") === "true",
  min: clamp(
    Number.parseInt(params.get("min")) || MIN_BALLOONS,
    MIN_BALLOONS,
    MAX_BALLOONS,
  ),
  max: clamp(
    Number.parseInt(params.get("max")) || 10,
    MIN_BALLOONS,
    MAX_BALLOONS,
  ),
  difficulty: (params.get("difficulty") || "normal").toLowerCase(),
};
if (opt.max < opt.min) opt.max = opt.min;
const difficultySetting =
  DIFFICULTY_LEVELS[opt.difficulty] || DIFFICULTY_LEVELS.normal;

const maxBalloons = opt.max;
const minBalloons = opt.min;
const difficultyMultiplier = difficultySetting.multiplier;

// Character pools
const ALPHABETS = {
  english: {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  },
  bulgarian: {
    lower: "абвгдежзийклмнопрстуфхцчшщъьюя",
    upper: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ",
  },
};
const CHARS = {
  ...ALPHABETS[opt.language],
  numbers: "0123456789",
  symbols: "~`!@#$%^&*()_+-=[]{}|;:',.<>/?\"\\",
};

const CHARACTER_TYPE_WEIGHTS = [
  { key: "lower", weight: 1 },
  ...(opt.upper ? [{ key: "upper", weight: 0.1 }] : []),
  ...(opt.numbers ? [{ key: "numbers", weight: 0.1 }] : []),
  ...(opt.symbols ? [{ key: "symbols", weight: 0.1 }] : []),
];

// Keyboard helper layouts with physical-key hand mapping for modifier guidance.
const ENGLISH_KEYBOARD_LAYOUT = [
  [
    { main: "`", alt: "~", hand: "left" },
    { main: "1", alt: "!", hand: "left" },
    { main: "2", alt: "@", hand: "left" },
    { main: "3", alt: "#", hand: "left" },
    { main: "4", alt: "$", hand: "left" },
    { main: "5", alt: "%", hand: "left" },
    { main: "6", alt: "^", hand: "left" },
    { main: "", value: "spacer-top", className: "spacer" },
    { main: "7", alt: "&", hand: "right" },
    { main: "8", alt: "*", hand: "right" },
    { main: "9", alt: "(", hand: "right" },
    { main: "0", alt: ")", hand: "right" },
    { main: "-", alt: "_", hand: "right" },
    { main: "=", alt: "+", hand: "right" },
  ],
  [
    { main: "Q", hand: "left" },
    { main: "W", hand: "left" },
    { main: "E", hand: "left" },
    { main: "R", hand: "left" },
    { main: "T", hand: "left" },
    { main: "", value: "spacer-upper", className: "spacer" },
    { main: "Y", hand: "right" },
    { main: "U", hand: "right" },
    { main: "I", hand: "right" },
    { main: "O", hand: "right" },
    { main: "P", hand: "right" },
    { main: "[", alt: "{", hand: "right" },
    { main: "]", alt: "}", hand: "right" },
    { main: "\\", alt: "|", hand: "right" },
  ],
  [
    { main: "A", hand: "left" },
    { main: "S", hand: "left" },
    { main: "D", hand: "left" },
    { main: "F", hand: "left" },
    { main: "G", hand: "left" },
    { main: "", value: "spacer-home", className: "spacer" },
    { main: "H", hand: "right" },
    { main: "J", hand: "right" },
    { main: "K", hand: "right" },
    { main: "L", hand: "right" },
    { main: ";", alt: ":", hand: "right" },
    { main: "'", alt: '"', hand: "right" },
  ],
  [
    {
      main: "Shift",
      value: "shift-left",
      className: "shift shift-left",
      hand: "leftShift",
    },
    { main: "Z", hand: "left" },
    { main: "X", hand: "left" },
    { main: "C", hand: "left" },
    { main: "V", hand: "left" },
    { main: "B", hand: "left" },
    { main: "", value: "spacer-bottom", className: "spacer" },
    { main: "N", hand: "right" },
    { main: "M", hand: "right" },
    { main: ",", alt: "<", hand: "right" },
    { main: ".", alt: ">", hand: "right" },
    { main: "/", alt: "?", hand: "right" },
    {
      main: "Shift",
      value: "shift-right",
      className: "shift shift-right",
      hand: "rightShift",
    },
  ],
];
const BULGARIAN_TRADITIONAL_KEYBOARD_LAYOUT = [
  [
    { main: "Ч", hand: "left" },
    { main: "1", alt: "!", hand: "left" },
    { main: "2", alt: "@", hand: "left" },
    { main: "3", alt: "№", hand: "left" },
    { main: "4", alt: "$", hand: "left" },
    { main: "5", alt: "%", hand: "left" },
    { main: "6", alt: "€", hand: "left" },
    { main: "", value: "spacer-top", className: "spacer" },
    { main: "7", alt: "§", hand: "right" },
    { main: "8", alt: "*", hand: "right" },
    { main: "9", alt: "(", hand: "right" },
    { main: "0", alt: ")", hand: "right" },
    { main: "-", alt: "_", hand: "right" },
    { main: "=", alt: "+", hand: "right" },
  ],
  [
    { main: "Я", hand: "left" },
    { main: "В", hand: "left" },
    { main: "Е", hand: "left" },
    { main: "Р", hand: "left" },
    { main: "Т", hand: "left" },
    { main: "", value: "spacer-upper", className: "spacer" },
    { main: "Ъ", hand: "right" },
    { main: "У", hand: "right" },
    { main: "И", hand: "right" },
    { main: "О", hand: "right" },
    { main: "П", hand: "right" },
    { main: "Ш", hand: "right" },
    { main: "Щ", hand: "right" },
    { main: "Ю", hand: "right" },
  ],
  [
    {
      main: "Caps",
      value: "caps-lock",
      className: "caps",
      hand: "left",
    },
    { main: "А", hand: "left" },
    { main: "С", hand: "left" },
    { main: "Д", hand: "left" },
    { main: "Ф", hand: "left" },
    { main: "Г", hand: "left" },
    { main: "", value: "spacer-home", className: "spacer" },
    { main: "Х", hand: "right" },
    { main: "Й", hand: "right" },
    { main: "К", hand: "right" },
    { main: "Л", hand: "right" },
    { main: ";", alt: ":", hand: "right" },
    { main: "'", alt: '"', hand: "right" },
  ],
  [
    {
      main: "Shift",
      value: "shift-left",
      className: "shift shift-left",
      hand: "leftShift",
    },
    { main: "З", hand: "left" },
    {
      main: "Ь",
      hand: "left",
      uppercaseModifier: "caps",
    },
    { main: "Ц", hand: "left" },
    { main: "Ж", hand: "left" },
    { main: "Б", hand: "left" },
    { main: "", value: "spacer-bottom", className: "spacer" },
    { main: "Н", hand: "right" },
    { main: "М", hand: "right" },
    { main: ",", alt: "<", hand: "right" },
    { main: ".", alt: ">", hand: "right" },
    { main: "/", alt: "?", hand: "right" },
    {
      main: "Shift",
      value: "shift-right",
      className: "shift shift-right",
      hand: "rightShift",
    },
  ],
];
const KEYBOARD_LAYOUT =
  opt.language === "bulgarian"
    ? BULGARIAN_TRADITIONAL_KEYBOARD_LAYOUT
    : ENGLISH_KEYBOARD_LAYOUT;
const FLAT_KEYS = KEYBOARD_LAYOUT.flat();

const FINGERS = [
  { id: "left-pinky", label: "Pinky", className: "pinky" },
  { id: "left-ring", label: "Ring", className: "ring" },
  { id: "left-middle", label: "Middle", className: "middle" },
  { id: "left-index", label: "Index", className: "index" },
  { id: "left-thumb", label: "Thumb", className: "thumb" },
  { id: "right-thumb", label: "Thumb", className: "thumb" },
  { id: "right-index", label: "Index", className: "index" },
  { id: "right-middle", label: "Middle", className: "middle" },
  { id: "right-ring", label: "Ring", className: "ring" },
  { id: "right-pinky", label: "Pinky", className: "pinky" },
];

const FINGER_ORDER = {
  left: ["left-pinky", "left-ring", "left-middle", "left-index", "left-thumb"],
  right: [
    "right-thumb",
    "right-index",
    "right-middle",
    "right-ring",
    "right-pinky",
  ],
};

const KEY_TO_FINGER = new Map();

function mapFinger(fingerId, chars) {
  chars.forEach((ch) => {
    KEY_TO_FINGER.set(ch.toLowerCase(), fingerId);
  });
}

mapFinger("left-pinky", ["`", "~", "1", "!", "q", "a", "z"]);
mapFinger("left-ring", ["2", "@", "w", "s", "x"]);
mapFinger("left-middle", ["3", "#", "e", "d", "c"]);
mapFinger("left-index", [
  "4",
  "$",
  "5",
  "%",
  "6",
  "^",
  "r",
  "t",
  "f",
  "g",
  "v",
  "b",
]);
mapFinger("right-index", ["7", "&", "y", "u", "h", "j", "n", "m"]);
mapFinger("right-middle", ["8", "*", "i", "k", ",", "<"]);
mapFinger("right-ring", ["9", "(", "o", "l", ".", ">"]);
mapFinger("right-pinky", [
  "0",
  ")",
  "-",
  "_",
  "=",
  "+",
  "p",
  "[",
  "{",
  "]",
  "}",
  "\\",
  "|",
  ";",
  ":",
  "'",
  '"',
  "/",
  "?",
]);

if (opt.language === "bulgarian") {
  mapFinger("left-pinky", ["ч", "я", "а", "з"]);
  mapFinger("left-ring", ["в", "с", "ь"]);
  mapFinger("left-middle", ["е", "д", "ц"]);
  mapFinger("left-index", ["р", "т", "ф", "г", "ж", "б"]);
  mapFinger("right-index", ["ъ", "у", "х", "й", "н", "м"]);
  mapFinger("right-middle", ["и", "к"]);
  mapFinger("right-ring", ["о", "л"]);
  mapFinger("right-pinky", ["п", "ш", "щ", "ю"]);
}

function pickWeightedType() {
  const candidates = CHARACTER_TYPE_WEIGHTS.map((type) => {
    const pool = CHARS[type.key];
    const available = [];
    for (let i = 0; i < pool.length; i++) {
      const ch = pool[i];
      if (!currentLetters.has(ch)) available.push(ch);
    }
    return { weight: type.weight, available };
  }).filter((type) => type.available.length > 0);

  if (candidates.length === 0) {
    currentLetters.clear();
    return { weight: 1, available: [...CHARS.lower] };
  }

  const totalWeight = candidates.reduce(
    (total, candidate) => total + candidate.weight,
    0,
  );
  let randomWeight = Math.random() * totalWeight;
  for (const candidate of candidates) {
    randomWeight -= candidate.weight;
    if (randomWeight <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function randomUniqueChar() {
  const { available } = pickWeightedType();
  const ch = available[Math.floor(Math.random() * available.length)];
  currentLetters.add(ch);
  return ch;
}

function buildKeyboardLayer() {
  if (!keyboardLayer) return;
  keyboardLayer.innerHTML = "";
  KEYBOARD_LAYOUT.forEach((row, i) => {
    const rowEl = document.createElement("div");
    rowEl.className = `keyboard-row row-${i + 1}`;
    row.forEach((key) => {
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      if (key.className) {
        key.className.split(" ").forEach((cls) => keyEl.classList.add(cls));
      }
      const value = key.value !== undefined ? key.value : key.main;
      keyEl.dataset.keyValue = String(value).toLowerCase();
      if (key.alt) keyEl.dataset.altValue = key.alt.toLowerCase();
      if (key.hand) keyEl.dataset.hand = key.hand;
      const mainSpan = document.createElement("span");
      mainSpan.className = "key-main";
      mainSpan.textContent = key.main;
      keyEl.appendChild(mainSpan);
      if (key.alt) {
        const altSpan = document.createElement("span");
        altSpan.className = "key-alt";
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
  fingersLayer.innerHTML = "";

  ["left", "right"].forEach((side) => {
    const handEl = document.createElement("div");
    handEl.className = `hand-helper ${side}-hand`;

    const label = document.createElement("div");
    label.className = "hand-label";
    label.textContent = side === "left" ? "Left hand" : "Right hand";

    const fingerSet = document.createElement("div");
    fingerSet.className = "finger-set";

    FINGER_ORDER[side].forEach((fingerId) => {
      const finger = FINGERS.find((item) => item.id === fingerId);
      if (!finger) return;

      const fingerEl = document.createElement("div");
      fingerEl.className = `finger ${finger.className} ${finger.id}`;
      fingerEl.dataset.fingerId = finger.id;

      const fingerName = document.createElement("span");
      fingerName.className = "finger-name";
      fingerName.textContent = finger.label;

      const fingerKeys = document.createElement("span");
      fingerKeys.className = "finger-keys";

      fingerEl.appendChild(fingerName);
      fingerEl.appendChild(fingerKeys);
      fingerSet.appendChild(fingerEl);
    });

    const palm = document.createElement("div");
    palm.className = "palm";

    handEl.appendChild(label);
    handEl.appendChild(fingerSet);
    handEl.appendChild(palm);
    fingersLayer.appendChild(handEl);
  });
}

function isUpperAlpha(ch) {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase();
}

function keyInfoForChar(ch) {
  if (!ch) return null;
  const lower = ch.toLowerCase();
  for (const key of FLAT_KEYS) {
    const mainValue = key.value !== undefined ? String(key.value) : key.main;
    const mainLower = mainValue.toLowerCase();
    const altLower = key.alt ? key.alt.toLowerCase() : null;

    if (mainLower === lower) {
      const modifier = isUpperAlpha(ch)
        ? key.uppercaseModifier || "shift"
        : "none";
      return {
        key,
        requiresShift: modifier === "shift",
        requiresCapsLock: modifier === "caps",
      };
    }
    if (altLower && altLower === lower) {
      return { key, requiresShift: true, requiresCapsLock: false };
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
  return KEY_TO_FINGER.get(ch.toLowerCase()) || null;
}

function collectActiveFingerState() {
  const activeFingers = new Map();

  balloons.forEach((b) => {
    const ch = (b.textContent || "").trim();
    if (!ch) return;

    addFingerChar(activeFingers, fingerForChar(ch), ch);

    const info = keyInfoForChar(ch);
    if (info && info.requiresShift) {
      if (info.key.hand === "right") {
        addFingerChar(activeFingers, "left-pinky", "Shift");
      } else if (info.key.hand === "left") {
        addFingerChar(activeFingers, "right-pinky", "Shift");
      }
    } else if (info && info.requiresCapsLock) {
      addFingerChar(activeFingers, "left-pinky", "Caps");
    }
  });

  return activeFingers;
}

function updateKeyboardHighlights() {
  if (!keyboardLayer) return;
  const active = new Set();
  let leftShiftNeeded = false;
  let rightShiftNeeded = false;
  let capsLockNeeded = false;
  balloons.forEach((b) => {
    const ch = (b.textContent || "").trim();
    if (!ch) return;
    active.add(ch.toLowerCase());
    const info = keyInfoForChar(ch);
    if (info && info.requiresShift) {
      if (info.key.hand === "right") {
        leftShiftNeeded = true;
      } else if (info.key.hand === "left") {
        rightShiftNeeded = true;
      }
    } else if (info && info.requiresCapsLock) {
      capsLockNeeded = true;
    }
  });
  const keyEls = keyboardLayer.querySelectorAll(".key");
  keyEls.forEach((el) => {
    const keyValue = el.dataset.keyValue;
    const altValue = el.dataset.altValue;
    let isActive = false;
    if (keyValue && active.has(keyValue)) {
      isActive = true;
    }
    if (altValue && active.has(altValue)) {
      isActive = true;
    }
    if (keyValue === "shift-left") {
      isActive = isActive || leftShiftNeeded;
    }
    if (keyValue === "shift-right") {
      isActive = isActive || rightShiftNeeded;
    }
    if (keyValue === "caps-lock") {
      isActive = isActive || capsLockNeeded;
    }
    el.classList.toggle("active", isActive);
  });
}

function updateFingersHighlights() {
  if (!fingersLayer) return;
  const activeFingers = collectActiveFingerState();
  const fingerEls = fingersLayer.querySelectorAll(".finger");

  fingerEls.forEach((el) => {
    const fingerId = el.dataset.fingerId;
    const activeChars = activeFingers.get(fingerId);
    const isActive = Boolean(activeChars && activeChars.size);
    const keysEl = el.querySelector(".finger-keys");

    el.classList.toggle("active", isActive);
    if (keysEl)
      keysEl.textContent = isActive ? Array.from(activeChars).join(" ") : "";
  });
}

function updateHelperHighlights() {
  updateKeyboardHighlights();
  updateFingersHighlights();
}

function setHelperVisibility(mode) {
  keyboardLayer?.classList.toggle("hidden", mode !== "keyboard");
  fingersLayer?.classList.toggle("hidden", mode !== "fingers");
}

function createBalloon() {
  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.textContent = randomUniqueChar();
  balloon.style.left = `${Math.random() * (gameArea.offsetWidth - 50)}px`;
  balloon.style.bottom = "0px";

  const baseSpeed = Math.random() * 3 + 1;
  const speed = baseSpeed * difficultyMultiplier;
  balloon.dataset.speed = speed;
  setBalloonColor(balloon, speed);

  balloons.push(balloon);
  gameArea.appendChild(balloon);
  animateBalloon(balloon);
  updateHelperHighlights();
}

function setBalloonColor(balloon, speed) {
  if (speed <= 1.5) {
    balloon.style.backgroundColor = "blue";
    balloon.style.color = "white";
  } else if (speed <= 2) {
    balloon.style.backgroundColor = "green";
    balloon.style.color = "white";
  } else if (speed <= 2.5) {
    balloon.style.backgroundColor = "yellow";
    balloon.style.color = "black";
  } else if (speed <= 3) {
    balloon.style.backgroundColor = "orange";
    balloon.style.color = "white";
  } else {
    balloon.style.backgroundColor = "red";
    balloon.style.color = "white";
  }
}

function animateBalloon(balloon) {
  const speed = parseFloat(balloon.dataset.speed);
  let position = parseInt(balloon.style.bottom);

  function move() {
    if (!balloon.isConnected) return;

    if (position > gameArea.offsetHeight) {
      gameArea.removeChild(balloon);
      balloons = balloons.filter((b) => b !== balloon);
      currentLetters.delete(balloon.textContent);
      score -= 50;
      mistakes += 1;
      updateScoreStats();
      updateHelperHighlights();
    } else {
      position += speed;
      balloon.style.bottom = `${position}px`;
      requestAnimationFrame(move);
    }
  }

  move();
}

function handleKeyPress(event) {
  if (!gameActive) return;
  const key = event.key;
  if (!key || key.length !== 1) return;

  let popped = false;

  balloons.forEach((balloon) => {
    if (balloon.textContent === key) {
      gameArea.removeChild(balloon);
      balloons = balloons.filter((b) => b !== balloon);
      currentLetters.delete(balloon.textContent);
      score += 100;
      correctPops += 1;
      popped = true;
    }
  });

  if (!popped) {
    score -= 25;
    mistakes += 1;
  }

  updateScoreStats();
  updateHelperHighlights();
}

function startElapsedTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    time += 1;
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    if (timerDisplay)
      timerDisplay.textContent = `Time: ${minutes}:${paddedSeconds}`;
  }, 1000);
}

function startCorrectPopsPercentageTimer() {
  if (correctPopsPercentageTimer) clearInterval(correctPopsPercentageTimer);
  correctPopsPercentageTimer = setInterval(() => {
    const totalAttempts = correctPops + mistakes;
    const percentage =
      totalAttempts > 0 ? Math.round((correctPops / totalAttempts) * 100) : 0;
    if (correctPopsPercentageDisplay) {
      correctPopsPercentageDisplay.textContent = `Correct Pops Percentage: ${percentage}%`;
    }
  }, 1000);
}

function updateScoreStats() {
  scoreDisplay.textContent = `Score: ${score}`;
  correctPopsDisplay.textContent = `Correct Pops: ${correctPops}`;
  mistakesDisplay.textContent = `Mistakes/Missed: ${mistakes}`;
}

function startGame() {
  if (gameActive) return;
  gameActive = true;
  time = 0;
  if (difficultyDisplay)
    difficultyDisplay.textContent = `Difficulty: ${difficultySetting.label}`;
  if (timerDisplay) timerDisplay.textContent = "Time: 0:00";
  if (correctPopsPercentageDisplay) {
    correctPopsPercentageDisplay.textContent = "Correct Pops Percentage: 0%";
  }
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
  countdownOverlay.classList.remove("hidden");
  countdownText.textContent = String(current);

  const countdownInterval = setInterval(() => {
    current -= 1;
    if (current > 0) {
      countdownText.textContent = String(current);
      return;
    }

    clearInterval(countdownInterval);
    countdownText.textContent = "Go!";

    setTimeout(() => {
      countdownOverlay.classList.add("hidden");
      countdownText.textContent = String(start);
      startGame();
    }, 600);
  }, 1000);
}

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

document.addEventListener("keydown", handleKeyPress);
runCountdown();

function resetGame() {
  gameActive = false;
  if (gameLoopHandle) {
    clearTimeout(gameLoopHandle);
    gameLoopHandle = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (correctPopsPercentageTimer) {
    clearInterval(correctPopsPercentageTimer);
    correctPopsPercentageTimer = null;
  }

  balloons.forEach((b) => {
    if (b.parentNode) b.parentNode.removeChild(b);
  });
  balloons = [];
  currentLetters.clear();
  updateHelperHighlights();

  score = 0;
  correctPops = 0;
  mistakes = 0;
  time = 0;
  updateScoreStats();
  if (timerDisplay) timerDisplay.textContent = "Time: 0:00";
  if (correctPopsPercentageDisplay) {
    correctPopsPercentageDisplay.textContent = "Correct Pops Percentage: 0%";
  }

  document.removeEventListener("keydown", handleKeyPress);
}

const newGameBtn = document.getElementById("new-game-btn");
if (newGameBtn) {
  newGameBtn.addEventListener("click", () => {
    resetGame();
    window.location.href = "index.html";
  });
}

buildKeyboardLayer();
buildFingersLayer();
setHelperVisibility(helperMode);
updateHelperHighlights();
