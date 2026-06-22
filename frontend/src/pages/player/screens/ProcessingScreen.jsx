import { Card } from '../../../components/ui/Card.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';

/**
 * Shown after submissions close while the AI worker pool scores entries.
 * Pure feedback — the server drives the transition to results.
 */
export const ProcessingScreen = ({ submitted }) => (
  <div className="max-w-md mx-auto pt-16 animate-fade-in">
    <Card glow="secondary" className="flex flex-col items-center gap-5 py-12">
      <Spinner className="size-10" />
      <div className="text-center">
        <h2 className="font-display text-lg tracking-widest mb-2 text-secondary">
          {submitted ? 'SUBMISSION RECEIVED' : "TIME'S UP"}
        </h2>
        <p className="font-body text-sm text-text-secondary">
          The AI is analyzing every detective&apos;s image…
        </p>
      </div>
      <div className="relative w-48 h-1 bg-border rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-secondary/70 animate-pulse" />
      </div>
    </Card>
  </div>
);
