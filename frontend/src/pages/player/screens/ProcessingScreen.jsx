import { Card } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

/**
 * Shown while waiting for the round to finish (post-submit) or while the AI
 * worker pool scores entries after time runs out.
 */
export const ProcessingScreen = ({ submitted, waitingForRound = false }) => (
  <div className="max-w-md mx-auto pt-16 animate-fade-in">
    <Card glow="secondary" className="flex flex-col items-center gap-5 py-12">
      {!waitingForRound && <Spinner className="size-10" />}
      <div className="text-center">
        <h2 className="font-display text-lg tracking-widest mb-2 text-secondary">
          {waitingForRound
            ? "SUBMISSION LOCKED IN"
            : submitted
              ? "SUBMISSION RECEIVED"
              : "TIME'S UP"}
        </h2>
        <p className="font-body text-sm text-text-secondary">
          {waitingForRound
            ? "Waiting for the round to end before results are revealed…"
            : "The AI is analyzing every detective\u2019s image\u2026"}
        </p>
      </div>
      <div className="relative w-48 h-1 bg-border rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-secondary/70 animate-pulse" />
      </div>
    </Card>
  </div>
);
