const form = document.getElementById("setup-form");
const upperInput = document.getElementById("upper");
const numbersInput = document.getElementById("numbers");
const symbolsInput = document.getElementById("symbols");
const minInput = document.getElementById("min");
const maxInput = document.getElementById("max");
const difficultySelect = document.getElementById("difficulty");
const helperEnabledInput = document.getElementById("helper-enabled");
const helperModeSelect = document.getElementById("helper-mode");
const rangeError = document.getElementById("range-error");
const startButton = document.getElementById("start-game");

const HELPER_ENABLED_STORAGE_KEY = "play-helper-enabled";
const HELPER_MODE_STORAGE_KEY = "play-helper-mode";
const MIN_BALLOONS = 3;
const MAX_BALLOONS = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function numberValue(input, fallback) {
  const parsed = Number.parseInt(input.value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function restoreHelperPreferences() {
  try {
    const enabled = localStorage.getItem(HELPER_ENABLED_STORAGE_KEY);
    if (enabled === "0") helperEnabledInput.checked = false;
    if (enabled === "1") helperEnabledInput.checked = true;

    const mode = localStorage.getItem(HELPER_MODE_STORAGE_KEY);
    if (mode === "keyboard" || mode === "fingers")
      helperModeSelect.value = mode;
  } catch {
    // Ignore storage failures.
  }
}

function storePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures.
  }
}

function validateRange() {
  const min = clamp(
    numberValue(minInput, MIN_BALLOONS),
    MIN_BALLOONS,
    MAX_BALLOONS,
  );
  const max = clamp(numberValue(maxInput, 10), MIN_BALLOONS, MAX_BALLOONS);
  const isValid = min <= max;

  rangeError.style.display = isValid ? "none" : "block";
  startButton.disabled = !isValid;

  return { min, max, isValid };
}

function syncHelperControls() {
  helperModeSelect.disabled = !helperEnabledInput.checked;
}

minInput.addEventListener("blur", () => {
  minInput.value = String(validateRange().min);
});

maxInput.addEventListener("blur", () => {
  maxInput.value = String(validateRange().max);
});

minInput.addEventListener("input", validateRange);
maxInput.addEventListener("input", validateRange);

helperEnabledInput.addEventListener("change", () => {
  syncHelperControls();
  storePreference(
    HELPER_ENABLED_STORAGE_KEY,
    helperEnabledInput.checked ? "1" : "0",
  );
});

helperModeSelect.addEventListener("change", () => {
  storePreference(HELPER_MODE_STORAGE_KEY, helperModeSelect.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const range = validateRange();
  if (!range.isValid) return;

  const helperMode = helperEnabledInput.checked
    ? helperModeSelect.value === "fingers"
      ? "fingers"
      : "keyboard"
    : "none";
  const params = new URLSearchParams({
    upper: String(upperInput.checked),
    numbers: String(numbersInput.checked),
    symbols: String(symbolsInput.checked),
    min: String(range.min),
    max: String(range.max),
    difficulty: difficultySelect.value,
    helperMode,
  });

  window.location.href = `baloons.html?${params.toString()}`;
});

restoreHelperPreferences();
validateRange();
syncHelperControls();
