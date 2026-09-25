export default function ThemeSwitcher() {
  function toggleTheme() {
    const root = document.documentElement;
    const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#07101e');
    try {
      localStorage.setItem('icetime-theme', theme);
    } catch {
      // Switching still works when browser storage is unavailable.
    }
  }

  return (
    <button class="theme-switcher" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
      <span class="theme-to-light">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
        Light
      </span>
      <span class="theme-to-dark">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" /></svg>
        Dark
      </span>
    </button>
  );
}
