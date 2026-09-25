import { createSignal, onSettled } from 'solid-js';

export function createClientTimeZone() {
  const [timeZone, setTimeZone] = createSignal<string>();

  onSettled(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  return timeZone;
}
