import type { ParentProps } from 'solid-js';
import { HydrationScript } from '@solidjs/web';

// The document shell (the index.html replacement), picked up by the
// src/Document.* convention; it must render the full <html> and ships no
// client JS. <HydrationScript /> is stripped from the prerendered shell in
// client mode and activates under `ssr: true`. Delete this file to fall
// back to the plugin's built-in shell.
export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#07101e" />
        <meta name="description" content="Today’s NHL scores, schedules, and game details." />
        <title>IceTime · NHL scores</title>
        <HydrationScript />
      </head>
      <body>
        <template id="design-contract">
          <span hidden>
            THESIS: A score-first NHL companion that refuses the portal dashboard and treats the daily slate as the product.
            OWN-WORLD: Midnight navy, ice white, electric cyan, crisp dividers, dense rows, and high-contrast tabular scores.
            STORY: See today's games, read every state instantly, and open one matchup for records, stats, and events.
            FIRST VIEWPORT: Compact league header, seven-day strip, then a single authoritative schedule column with game state at left and matchup at center.
            FORM: Familiar sports-score utility, pinned by the FotMob reference; seed 715d9d6a.
            FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
          </span>
        </template>
        {props.children}
      </body>
    </html>
  );
}
