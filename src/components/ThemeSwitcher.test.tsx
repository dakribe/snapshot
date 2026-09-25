import { render, fireEvent } from '@solidjs/testing-library';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ThemeSwitcher from './ThemeSwitcher';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('<ThemeSwitcher />', () => {
  test('switches both ways and saves the preference', () => {
    document.documentElement.dataset.theme = 'dark';
    const { getByRole } = render(() => <ThemeSwitcher />);
    const button = getByRole('button', { name: 'Toggle color theme' });
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('icetime-theme')).toBe('light');
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('icetime-theme')).toBe('dark');
  });

  test('works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    const { getByRole } = render(() => <ThemeSwitcher />);
    fireEvent.click(getByRole('button', { name: 'Toggle color theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
