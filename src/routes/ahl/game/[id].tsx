import { Title } from '@solidjs/meta';
import { query, type RouteDefinition, type RouteProps } from '@solidjs/router';
import { Errored, Loading, Show, createMemo } from 'solid-js';
import { fullTeamName, gameStatus } from '../../../lib/nhl';
import { getAhlGame } from '../../../lib/ahl';

const ahlGameQuery = query(getAhlGame, 'ahl-game');

export const route = {
  preload: ({ params }) => void ahlGameQuery(params.id!),
} satisfies RouteDefinition;

function AhlGameContent(props: { id: string }) {
  const game = createMemo(() => ahlGameQuery(props.id));
  const started = createMemo(() => ['LIVE', 'CRIT', 'OFF', 'FINAL'].includes(game().gameState));

  return (
    <>
      <Title>{`${game().awayTeam.abbrev} vs ${game().homeTeam.abbrev} · Snapshot`}</Title>
      <a class="back-link" href="/">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13 4-6 6 6 6" /></svg>
        Today’s games
      </a>
      <section class="match-hero" aria-labelledby="ahl-match-title">
        <div class="match-meta">
          <span class={{ 'status-pill': true, live: ['LIVE', 'CRIT'].includes(game().gameState) }}>{gameStatus(game())}</span>
          <span>{game().gameDate}</span>
          <span>{game().venue.default}</span>
        </div>
        <div class="matchup">
          <div class="hero-team away">
            <img src={game().awayTeam.logo} alt={`${fullTeamName(game().awayTeam)} logo`} width="96" height="96" />
            <div><span>Away</span><h2>{fullTeamName(game().awayTeam)}</h2><b class="hero-team-code">{game().awayTeam.abbrev}</b></div>
          </div>
          <div class="match-score" id="ahl-match-title">
            <Show when={started()} fallback={<><strong>VS</strong><span>{gameStatus(game())}</span></>}>
              <strong>{game().awayTeam.score ?? 0}<i>–</i>{game().homeTeam.score ?? 0}</strong>
              <span>{gameStatus(game())}</span>
            </Show>
          </div>
          <div class="hero-team home">
            <img src={game().homeTeam.logo} alt={`${fullTeamName(game().homeTeam)} logo`} width="96" height="96" />
            <div><span>Home</span><h2>{fullTeamName(game().homeTeam)}</h2><b class="hero-team-code">{game().homeTeam.abbrev}</b></div>
          </div>
        </div>
      </section>
      <section class="data-panel ahl-note"><h2>Game information</h2><p class="panel-empty">AHL scores and game information. Detailed game events are not available.</p></section>
    </>
  );
}

export default function AhlGamePage(props: RouteProps<'/ahl/game/:id'>) {
  return (
    <main class="page-shell game-page">
      <Errored fallback={(error, reset) => <div class="error-state"><strong>Couldn’t load this game</strong><span>{String(error())}</span><button onClick={reset}>Try again</button><a href="/">Back to schedule</a></div>}>
        <Loading fallback={<div class="game-loading" aria-label="Loading game"><span /></div>}>
          <AhlGameContent id={props.params.id} />
        </Loading>
      </Errored>
    </main>
  );
}
