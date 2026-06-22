import { Link, useNavigate } from 'react-router-dom';
import { ScanSearch, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { cn } from '../../utils/cn.js';

/** Top navigation bar with brand, connection indicator, and quick actions. */
export const NavBar = () => {
  const navigate = useNavigate();
  const { connected } = useGame();

  return (
    <header className="border-b border-border bg-surface/60 backdrop-blur-sm sticky top-0 z-30">
      <nav className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <ScanSearch className="size-5 text-primary group-hover:drop-shadow-[0_0_6px_#00FF88]" aria-hidden />
          <span className="font-display text-sm tracking-widest text-text">
            INTERNET<span className="text-primary">DETECTIVE</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-widest"
            title={connected ? 'Connected to server' : 'Disconnected'}
          >
            {connected ? (
              <Wifi className="size-3.5 text-primary" aria-hidden />
            ) : (
              <WifiOff className="size-3.5 text-danger animate-pulse" aria-hidden />
            )}
            <span className={cn('hidden sm:inline', connected ? 'text-primary' : 'text-danger')}>
              {connected ? 'Online' : 'Offline'}
            </span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/join')}>
            Join
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/host')}>
            Host
          </Button>
        </div>
      </nav>
    </header>
  );
};
