import { createSignal, onSettled } from 'solid-js';

function browserTimeZone() {
  return typeof window === 'undefined' ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function createClientTimeZone() {
  const [timeZone, setTimeZone] = createSignal<string | undefined>();

  onSettled(() => {
    setTimeZone(browserTimeZone());
  });

  return timeZone;
}
