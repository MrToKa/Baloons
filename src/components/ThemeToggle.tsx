import { ThemePreference, useThemePreference } from '../theme';

const iconFor = (pref: ThemePreference) => {
  switch (pref) {
    case 'light':
      return 'L';
    case 'dark':
      return 'D';
    default:
      return 'A';
  }
};

export function ThemeToggle() {
  const { theme, setTheme } = useThemePreference();

  return (
    <div className="theme-control" aria-label="Theme selector">
      <span className="theme-icon" aria-hidden="true">
        {iconFor(theme)}
      </span>
      <span className="label">Theme</span>
      <label className="sr-only" htmlFor="theme-select">
        Theme
      </label>
      <select
        id="theme-select"
        className="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemePreference)}
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}

export default ThemeToggle;
