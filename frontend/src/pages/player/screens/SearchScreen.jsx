import { Card } from '../../../components/ui/Card.jsx';
import { Timer } from '../../../components/game/Timer.jsx';
import { UploadZone } from '../../../components/game/UploadZone.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';

/**
 * The core player gameplay screen: countdown + image intake. Submitting is a
 * one-shot action per round; the zone locks itself once submitted.
 */
export const SearchScreen = ({ room, remaining, submitted, onSubmit, onError }) => (
  <div className="max-w-lg mx-auto pt-6 flex flex-col gap-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <Badge tone="primary">Round {room.currentRound}</Badge>
      <Badge tone="secondary">Find the match</Badge>
    </div>

    <Card glow="primary" className="flex justify-center py-6">
      <Timer remaining={remaining} total={room.roundSeconds} />
    </Card>

    <Card>
      <p className="font-body text-sm text-text-secondary text-center mb-4">
        Find an image online that best matches the host&apos;s target, then submit it.
      </p>
      <UploadZone onSubmit={onSubmit} submitted={submitted} onError={onError} />
    </Card>
  </div>
);
