import { useEffect, useState } from 'react';
import Game from './components/Game';
import SetupForm from './components/SetupForm';
import ThemeToggle from './components/ThemeToggle';
import { GameOptions } from './types';

const baselineOptions: GameOptions = {
  upper: false,
  numbers: false,
  symbols: false,
  min: 3,
  max: 10,
  difficulty: 'normal',
  keyboardVisible: true,
};

function App() {
  const [view, setView] = useState<'setup' | 'game'>('setup');
  const [options, setOptions] = useState<GameOptions | null>(null);

  useEffect(() => {
    document.body.classList.toggle('game-page', view === 'game');
  }, [view]);

  const startGame = (opts: GameOptions) => {
    setOptions(opts);
    setView('game');
  };

  const backToSetup = () => {
    setView('setup');
  };

  return (
    <div className="app">
      <ThemeToggle />
      {view === 'game' && options ? (
        <main className="page page-game">
          <Game options={options} onExit={backToSetup} />
        </main>
      ) : (
        <main className="page page-setup">
          <SetupForm onStart={startGame} initialOptions={options ?? baselineOptions} />
        </main>
      )}
    </div>
  );
}

export default App;
