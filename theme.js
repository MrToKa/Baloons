const THEME_STORAGE_KEY = "theme-preference";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const colorScheme = window.matchMedia(COLOR_SCHEME_QUERY);

function getThemePreference() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "auto";
}

function applyTheme(preference) {
  const resolvedTheme =
    preference === "light" || preference === "dark"
      ? preference
      : colorScheme.matches
        ? "dark"
        : "light";

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
}

function bindThemeSelector() {
  const select = document.getElementById("theme-select");
  const icon = document.getElementById("theme-icon");

  if (!select) return;

  const usesEmoji = icon?.textContent.trim() === "🌓";
  const iconFor = usesEmoji
    ? (preference) =>
        preference === "light" ? "☀️" : preference === "dark" ? "🌙" : "🌓"
    : (preference) =>
        preference === "light" ? "L" : preference === "dark" ? "D" : "A";
  const preference = getThemePreference();

  select.value = preference;
  if (icon) icon.textContent = iconFor(preference);

  select.addEventListener("change", () => {
    localStorage.setItem(THEME_STORAGE_KEY, select.value);
    applyTheme(select.value);
    if (icon) icon.textContent = iconFor(select.value);
  });
}

applyTheme(getThemePreference());
colorScheme.addEventListener
  ? colorScheme.addEventListener("change", () => {
      if (getThemePreference() === "auto") applyTheme("auto");
    })
  : colorScheme.addListener(() => {
      if (getThemePreference() === "auto") applyTheme("auto");
    });

bindThemeSelector();
