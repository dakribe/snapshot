import { Title } from '@solidjs/meta';
import { query } from '@solidjs/router';
import { Errored, For, Loading, Show, createMemo, createSignal } from 'solid-js';
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
      <div class="teams">
        <div class="team-line away">
          <img src={props.game.awayTeam.logo} alt="" width="34" height="34" />
          <span class="team-name">{fullTeamName(props.game.awayTeam)}</span>
          <span class="team-code">{props.game.awayTeam.abbrev}</span>
          <Show when={isStarted()}><strong class="score">{props.game.awayTeam.score ?? 0}</strong></Show>
        </div>
        <div class="match-center">
          <span class="match-separator">vs</span>
          <div class="game-status">
            <Show when={isLive()}><span class="live-dot" aria-hidden="true" /></Show>
            <span class={{ live: isLive() }}>{gameStatus(props.game)}</span>
          </div>
        </div>
        <div class="team-line home">
          <img src={props.game.homeTeam.logo} alt="" width="34" height="34" />
          <span class="team-name">{fullTeamName(props.game.homeTeam)}</span>
          <span class="team-code">{props.game.homeTeam.abbrev}</span>
          <Show when={isStarted()}><strong class="score">{props.game.homeTeam.score ?? 0}</strong></Show>
        </div>
      </div>
    </a>
  );
}

function Schedule() {
  const today = localDateString();
  const [selectedDate, setSelectedDate] = createSignal(today);
  const score = createMemo(() => todayScore(selectedDate()));
  const isToday = createMemo(() => score().currentDate === today);
  const scheduleLabel = createMemo(() => isToday() ? 'Today' : longDate(score().currentDate));

  return (
    <>
      <section class="schedule-day-nav" aria-label="Schedule day">
        <button type="button" onClick={() => setSelectedDate(score().prevDate)} aria-label="Previous day">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13 4-6 6 6 6" /></svg>
        </button>
        <strong>{scheduleLabel()}</strong>
        <button type="button" onClick={() => setSelectedDate(score().nextDate)} aria-label="Next day">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg>
        </button>
      </section>

      <section class="schedule" aria-label="Schedule">
        <Show when={score().games.length} fallback={<div class="empty-state"><strong>No games</strong><span>The NHL schedule is clear for {scheduleLabel().toLowerCase()}.</span></div>}>
          <div class="game-list">
            <div class="league-bar"><span>National Hockey League</span></div>
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
