import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastProvider.jsx';
import { GameProvider } from './contexts/GameProvider.jsx';
import { Landing } from './pages/Landing.jsx';
import { JoinGame } from './pages/player/JoinGame.jsx';
import { HostDashboard } from './pages/host/HostDashboard.jsx';
import { PlayerView } from './pages/player/PlayerView.jsx';

/**
 * Application shell. Providers wrap the router so toasts and the live game
 * session are available to every route.
 */
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/join" element={<JoinGame />} />
            <Route path="/host" element={<HostDashboard />} />
            <Route path="/play" element={<PlayerView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
