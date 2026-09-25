import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
import { paths, Router } from './router';
import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>IceTime · NHL scores</Title>
          <header class="site-header">
            <div class="header-inner">
              <a class="brand" href={paths()} aria-label="IceTime home">
                <svg viewBox="0 0 36 36" aria-hidden="true">
                  <path d="M8 25.5 15.2 7h5.6L28 25.5l-5.2 3.2-4.8-4.1-4.8 4.1L8 25.5Z" />
                  <path d="m12.2 23.3 5.8-5.1 5.8 5.1" />
                </svg>
                <span>IceTime</span>
              </a>
              <nav class="primary-nav" aria-label="Main navigation">
                <a class="active" href={paths()}>Scores</a>
                <span aria-disabled="true">Standings</span>
                <span aria-disabled="true">Teams</span>
              </nav>
              <div class="header-league"><span>NHL</span><small>LIVE</small></div>
            </div>
          </header>
          <Loading fallback={<main class="page-shell"><div class="schedule-loading"><span /><span /><span /></div></main>}>
            {props.children}
          </Loading>
          <footer><span>Times shown in your local timezone</span></footer>
        </>
      )}
    </Router>
  );
}
