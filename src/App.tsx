import { GameScreen } from './components/GameScreen';
import { MicCheck } from './components/screens/MicCheck';
import { HowToPlay, MainMenu, SettingsScreen, Splash, WordBank } from './components/screens/Menus';
import { NightIntro } from './components/screens/NightIntro';
import { GameOver, NightComplete } from './components/screens/Results';
import { useGame } from './game/store';

export function App() {
  const screen = useGame((s) => s.screen);
  switch (screen) {
    case 'splash':
      return <Splash />;
    case 'menu':
      return <MainMenu />;
    case 'howto':
      return <HowToPlay />;
    case 'settings':
      return <SettingsScreen />;
    case 'words':
      return <WordBank />;
    case 'micCheck':
      return <MicCheck />;
    case 'intro':
      return <NightIntro />;
    case 'playing':
    case 'paused':
    case 'jumpscare':
      return <GameScreen />;
    case 'gameover':
      return <GameOver />;
    case 'complete':
      return <NightComplete />;
  }
}
