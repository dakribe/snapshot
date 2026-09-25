import { Title } from '@solidjs/meta';
import { query, type RouteDefinition, type RouteProps } from '@solidjs/router';
import { Errored, For, Loading, Show, createMemo } from 'solid-js';
import { getStandings, getTeamRoster, type RosterPlayer } from '../../lib/nhl';

const teamPageQuery = query(async (abbrev: string) => {
  const [roster, standings] = await Promise.all([getTeamRoster(abbrev), getStandings()]);
  return {
    roster,
    team: standings.standings.find((team) => team.teamAbbrev.default === abbrev.toUpperCase()),
    stale: roster.cache.stale || standings.cache.stale,
  };
}, 'team-page');

export const route = {
  preload: ({ params }) => void teamPageQuery(params.abbrev!),
} satisfies RouteDefinition;

function PlayerGroup(props: { title: string; players: RosterPlayer[] }) {
  return (
    <section class="data-panel roster-group" aria-label={props.title}>
      <h2>{props.title} · {props.players.length}</h2>
      <Show when={props.players.length} fallback={<p class="panel-empty">No players listed.</p>}>
        <ul class="roster-list">
          <For each={props.players}>{(player) => (
            <li class="roster-player">
              <Show when={player.headshot} fallback={<span class="player-placeholder" aria-hidden="true">—</span>}>
                <img src={player.headshot} alt="" width="64" height="64" loading="lazy" />
              </Show>
              <div>
                <strong>{player.firstName.default} {player.lastName.default}</strong>
                <p>#{player.sweaterNumber ?? '—'} · {player.positionCode}</p>
                <Show when={player.shootsCatches}><small>{player.positionCode === 'G' ? 'Catches' : 'Shoots'} {player.shootsCatches === 'L' ? 'left' : 'right'}</small></Show>
              </div>
            </li>
          )}</For>
        </ul>
      </Show>
    </section>
  );
}

function TeamContent(props: { abbrev: string }) {
  const data = createMemo(() => teamPageQuery(props.abbrev), { name: 'teamPageData' });
  const name = createMemo(() => data().team?.teamName?.default ?? props.abbrev.toUpperCase(), { name: 'teamPageName' });

  return (
    <>
      <Title>{`${name()} roster · Snapshot`}</Title>
      <header class="team-page-heading">
        <Show when={data().team?.teamLogo}><img src={data().team!.teamLogo} alt="" width="88" height="88" /></Show>
        <div><h1>{name()}</h1><p>NHL · Current roster</p></div>
      </header>
      <Show when={data().stale}><p role="status">NHL updates are temporarily unavailable. Showing saved data; it may be out of date.</p></Show>
      <div class="roster-groups">
        <PlayerGroup title="Forwards" players={data().roster.forwards} />
        <PlayerGroup title="Defensemen" players={data().roster.defensemen} />
        <PlayerGroup title="Goalies" players={data().roster.goalies} />
      </div>
    </>
  );
}

export default function TeamPage(props: RouteProps<'/team/:abbrev'>) {
  return (
    <main class="page-shell team-page">
      <a class="back-link" href="/">← Today’s games</a>
      <Errored fallback={(error, reset) => <div class="error-state"><strong>Couldn’t load this team</strong><span>{String(error())}</span><button onClick={reset}>Try again</button></div>}>
        <Loading fallback={<div class="game-loading" role="status" aria-label="Loading team roster"><span /></div>}>
          <TeamContent abbrev={props.params.abbrev} />
        </Loading>
      </Errored>
    </main>
  );
}
