import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
import { paths, Router } from './router';
import './App.css';
import ThemeSwitcher from './components/ThemeSwitcher';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>Snapshot · NHL scores</Title>
          <header class="site-header">
            <div class="header-inner">
              <a class="brand" href={paths()} aria-label="Snapshot home">
                <span>Snapshot</span>
              </a>
              <nav class="primary-nav" aria-label="Main navigation">
                <a class="active" href={paths()}>Scores</a>
                <span aria-disabled="true">Standings</span>
                <span aria-disabled="true">Teams</span>
              </nav>
              <ThemeSwitcher />
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
