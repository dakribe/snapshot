import { Title } from '@solidjs/meta';
import { query, type RouteDefinition, type RouteProps } from '@solidjs/router';
import { Errored, For, Loading, Show, createMemo } from 'solid-js';
import {
  fullTeamName,
  gameStatus,
  getGame,
  getStandings,
  longDate,
  periodLabel,
  type Goal,
  type Standing,
  type Team,
} from '../../lib/nhl';

const gamePageQuery = query(async (id: string) => {
  const [game, standings] = await Promise.all([getGame(id), getStandings()]);
  return { game, standings: standings.standings };
}, 'game-page');

export const route = {
  preload: ({ params }) => void gamePageQuery(params.id!),
} satisfies RouteDefinition;

function recordFor(standings: Standing[], abbrev: string) {
  return standings.find((team) => team.teamAbbrev.default === abbrev);
}

function TeamHero(props: { team: Team; standing?: Standing; side: 'away' | 'home' }) {
  return (
    <div class={`hero-team ${props.side}`}>
      <img src={props.team.logo} alt={`${fullTeamName(props.team)} logo`} width="96" height="96" />
      <div>
        <span>{props.side === 'away' ? 'Away' : 'Home'}</span>
        <h2>{fullTeamName(props.team)}</h2>
        <b class="hero-team-code">{props.team.abbrev}</b>
        <p>{props.standing ? `${props.standing.wins}-${props.standing.losses}-${props.standing.otLosses} · ${props.standing.points} PTS` : 'Record unavailable'}</p>
      </div>
    </div>
  );
}

function StatBar(props: { label: string; away: number; home: number }) {
  const total = () => props.away + props.home || 1;
  return (
    <div class="stat-row">
      <div class="stat-values"><strong>{props.away}</strong><span>{props.label}</span><strong>{props.home}</strong></div>
      <div class="stat-track" aria-hidden="true">
        <span style={{ width: `${(props.away / total()) * 100}%` }} />
        <span style={{ width: `${(props.home / total()) * 100}%` }} />
      </div>
    </div>
  );
}

function GoalRow(props: { goal: Goal }) {
  const strength = () => props.goal.strength === 'pp' ? 'PP' : props.goal.strength === 'sh' ? 'SH' : '';
  return (
    <li class="event-row">
      <span class="event-time">{periodLabel(props.goal.periodDescriptor)} {props.goal.timeInPeriod}</span>
      <span class="event-team">{props.goal.teamAbbrev.default}</span>
      <span class="event-copy"><strong>{props.goal.name.default}</strong><small>Goal {props.goal.goalsToDate}{props.goal.assists.length ? ` · ${props.goal.assists.map((assist) => assist.name.default).join(', ')}` : ''}</small></span>
      <Show when={strength()}><em>{strength()}</em></Show>
      <strong class="event-score">{props.goal.awayScore}–{props.goal.homeScore}</strong>
    </li>
  );
}

function GameContent(props: { id: string }) {
  const data = createMemo(() => gamePageQuery(props.id));
  const game = createMemo(() => data().game);
  const awayStanding = createMemo(() => recordFor(data().standings, game().awayTeam.abbrev));
  const homeStanding = createMemo(() => recordFor(data().standings, game().homeTeam.abbrev));
  const goals = createMemo(() => game().summary?.scoring?.flatMap((period) => period.goals) ?? []);
  const penalties = createMemo(() => game().summary?.penalties?.flatMap((period) => period.penalties) ?? []);
  const penaltyCount = (abbrev: string) => penalties().filter((penalty) => penalty.teamAbbrev?.default === abbrev).length;
  const started = createMemo(() => ['LIVE', 'CRIT', 'OFF', 'FINAL'].includes(game().gameState));

  return (
    <>
      <Title>{`${game().awayTeam.abbrev} vs ${game().homeTeam.abbrev} · IceTime`}</Title>
      <a class="back-link" href="/">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13 4-6 6 6 6" /></svg>
        Today’s games
      </a>

      <section class="match-hero" aria-labelledby="match-title">
        <div class="match-meta">
          <span class={{ 'status-pill': true, live: ['LIVE', 'CRIT'].includes(game().gameState) }}>{gameStatus(game())}</span>
          <span>{longDate(game().gameDate)}</span>
          <span>{game().venue.default}</span>
        </div>
        <div class="matchup">
          <TeamHero team={game().awayTeam} standing={awayStanding()} side="away" />
          <div class="match-score" id="match-title">
            <Show when={started()} fallback={<><strong>VS</strong><span>{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(game().startTimeUTC))}</span></>}>
              <strong>{game().awayTeam.score ?? 0}<i>–</i>{game().homeTeam.score ?? 0}</strong>
              <span>{gameStatus(game())}</span>
            </Show>
          </div>
          <TeamHero team={game().homeTeam} standing={homeStanding()} side="home" />
        </div>
        <Show when={game().tvBroadcasts?.length}>
          <div class="broadcast">Watch on {game().tvBroadcasts!.map((item) => item.network).join(' · ')}</div>
        </Show>
      </section>

      <nav class="game-tabs" aria-label="Game sections">
        <a href="#overview" class="active">Overview</a>
        <a href="#events">Events</a>
        <Show when={game().summary?.threeStars?.length}><a href="#stars">Stars</a></Show>
      </nav>

      <div class="game-grid" id="overview">
        <section class="data-panel stats-panel" aria-labelledby="stats-title">
          <h2 id="stats-title">Team stats</h2>
          <div class="stat-team-labels"><span>{game().awayTeam.abbrev}</span><span>{game().homeTeam.abbrev}</span></div>
          <StatBar label="Shots on goal" away={game().awayTeam.sog ?? 0} home={game().homeTeam.sog ?? 0} />
          <StatBar label="Goals" away={game().awayTeam.score ?? 0} home={game().homeTeam.score ?? 0} />
          <StatBar label="Penalties" away={penaltyCount(game().awayTeam.abbrev)} home={penaltyCount(game().homeTeam.abbrev)} />
        </section>

        <Show when={game().summary?.threeStars?.length}>
          <section class="data-panel" id="stars" aria-labelledby="stars-title">
            <h2 id="stars-title">Three stars</h2>
            <ol class="stars-list">
              <For each={game().summary!.threeStars}>{(star) => (
                <li>
                  <span class="star-rank">{star.star}</span>
                  <img src={star.headshot} alt="" width="52" height="52" />
                  <span><strong>{star.name.default}</strong><small>{star.teamAbbrev} · {star.goals} G, {star.assists} A</small></span>
                  <b>{String(star.points)} PT</b>
                </li>
              )}</For>
            </ol>
          </section>
        </Show>

        <section class="data-panel events-panel" id="events" aria-labelledby="events-title">
          <h2 id="events-title">Scoring</h2>
          <Show when={goals().length} fallback={<p class="panel-empty">Scoring events will appear here after puck drop.</p>}>
            <ol class="events-list"><For each={goals()}>{(goal) => <GoalRow goal={goal} />}</For></ol>
          </Show>
        </section>
      </div>
    </>
  );
}

export default function GamePage(props: RouteProps<'/game/:id'>) {
  return (
    <main class="page-shell game-page">
      <Errored fallback={(error, reset) => <div class="error-state"><strong>Couldn’t load this game</strong><span>{String(error())}</span><button onClick={reset}>Try again</button><a href="/">Back to schedule</a></div>}>
        <Loading fallback={<div class="game-loading" aria-label="Loading game"><span /></div>}>
          <GameContent id={props.params.id} />
        </Loading>
      </Errored>
    </main>
  );
}
