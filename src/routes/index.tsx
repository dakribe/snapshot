import { Title } from '@solidjs/meta';
import { query } from '@solidjs/router';
import { Errored, For, Loading, Show, createMemo } from 'solid-js';
import { fullTeamName, gameStatus, getTodayScore, longDate, type Game } from '../lib/nhl';

const todayScore = query(getTodayScore, 'today-score');

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const route = {
  preload: () => void todayScore(localDateString()),
};

function GameRow(props: { game: Game }) {
  const isStarted = () => ['LIVE', 'CRIT', 'OFF', 'FINAL'].includes(props.game.gameState);
  const isLive = () => ['LIVE', 'CRIT'].includes(props.game.gameState);

  return (
    <a class="game-row" href={`/game/${props.game.id}`} aria-label={`${fullTeamName(props.game.awayTeam)} at ${fullTeamName(props.game.homeTeam)}`}>
      <div class="game-status">
        <Show when={isLive()}><span class="live-dot" aria-hidden="true" /></Show>
        <span class={{ live: isLive() }}>{gameStatus(props.game)}</span>
        <span class="game-network">{props.game.tvBroadcasts?.[0]?.network ?? 'NHL'}</span>
      </div>
      <div class="teams">
        <div class="team-line">
          <img src={props.game.awayTeam.logo} alt="" width="34" height="34" />
          <span class="team-name">{fullTeamName(props.game.awayTeam)}</span>
          <span class="team-code">{props.game.awayTeam.abbrev}</span>
          <Show when={isStarted()}><strong class="score">{props.game.awayTeam.score ?? 0}</strong></Show>
        </div>
        <div class="team-line">
          <img src={props.game.homeTeam.logo} alt="" width="34" height="34" />
          <span class="team-name">{fullTeamName(props.game.homeTeam)}</span>
          <span class="team-code">{props.game.homeTeam.abbrev}</span>
          <Show when={isStarted()}><strong class="score">{props.game.homeTeam.score ?? 0}</strong></Show>
        </div>
      </div>
      <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
    </a>
  );
}

function Schedule() {
  const date = localDateString();
  const score = createMemo(() => todayScore(date));
  return (
    <>
      <section class="date-strip" aria-label="Schedule dates">
        <For each={score().gameWeek}>{(day) => (
          <div class={{ 'date-chip': true, selected: day.date === score().currentDate }}>
            <span>{day.dayAbbrev}</span>
            <strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong>
            <small>{day.numberOfGames || '—'}</small>
          </div>
        )}</For>
      </section>

      <section class="schedule" aria-labelledby="schedule-title">
        <div class="section-heading">
          <div>
            <h1 id="schedule-title">Today’s games</h1>
            <p>{longDate(score().currentDate)} · {score().games.length} {score().games.length === 1 ? 'game' : 'games'}</p>
          </div>
          <span class="live-data"><i /> Live NHL data</span>
        </div>
        <Show when={score().games.length} fallback={<div class="empty-state"><strong>No games today</strong><span>The NHL schedule is clear. Check back tomorrow.</span></div>}>
          <div class="game-list">
            <For each={score().games}>{(game) => <GameRow game={game} />}</For>
          </div>
        </Show>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <main class="page-shell">
      <Title>Today’s NHL games · IceTime</Title>
      <Errored fallback={(error, reset) => <div class="error-state"><strong>Couldn’t load today’s games</strong><span>{String(error())}</span><button onClick={reset}>Try again</button></div>}>
        <Loading fallback={<div class="schedule-loading" aria-label="Loading today’s games"><span /><span /><span /></div>}>
          <Schedule />
        </Loading>
      </Errored>
    </main>
  );
}
