import { Badge } from '../ui/Badge.jsx';
import { GameState } from '../../services/socket/events.js';

/** Maps a game state to a human label + tone for the status pill. */
const STATE_META = {
  [GameState.WAITING_ROOM]: { label: 'Lobby', tone: 'secondary' },
  [GameState.ROUND_STARTING]: { label: 'Starting', tone: 'warning' },
  [GameState.SEARCHING]: { label: 'Searching', tone: 'primary' },
  [GameState.SUBMISSIONS_CLOSED]: { label: 'Closed', tone: 'warning' },
  [GameState.AI_PROCESSING]: { label: 'Analyzing', tone: 'secondary' },
  [GameState.RESULTS]: { label: 'Results', tone: 'primary' },
  [GameState.NEXT_ROUND]: { label: 'Next Round', tone: 'secondary' },
  [GameState.GAME_FINISHED]: { label: 'Finished', tone: 'danger' },
};

export const StateBadge = ({ state }) => {
  const meta = STATE_META[state] ?? { label: state ?? 'Unknown', tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
};
