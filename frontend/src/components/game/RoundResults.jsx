import { ImageIcon, Target } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Round Results — original target shown inline; player submissions beside it.
 * Admin view: name and image only (no scores).
 */
export const RoundResults = ({ round, players, targetImage }) => {
  if (!round) return null;

  const submissionsData = round.submissions || {};
  const submissions = Object.entries(submissionsData).map(
    ([playerId, submission]) => {
      const player = players.find((p) => p.id === playerId);
      return {
        playerId,
        playerName: player?.name || "Unknown",
        ...submission,
      };
    },
  );

  return (
    <Card glow="primary" className="animate-scale-in">
      <CardHeader
        title={round.title ? `${round.title} — Results` : "Round Results"}
        subtitle={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
        icon={ImageIcon}
      />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Original target — visible after round ends only (caller gates this) */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="size-4 text-primary" />
            <p className="font-label text-xs uppercase tracking-widest text-text-muted">
              Original Image
            </p>
          </div>
          <div className="aspect-video rounded-sm border border-primary/30 bg-bg overflow-hidden">
            {targetImage ? (
              <img
                src={targetImage}
                alt="Original target"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="font-body text-xs text-text-muted">
                  Target not available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Player submissions */}
        <div className="lg:col-span-8">
          <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-3">
            Submissions
          </p>
          {submissions.length === 0 ? (
            <p className="font-body text-sm text-text-muted text-center py-8">
              No submissions received for this round
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.playerId}
                  submission={submission}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const SubmissionCard = ({ submission }) => (
  <div className={cn("p-3 rounded-sm border border-border bg-elevated/60")}>
    <div className="aspect-video rounded-xs border border-border bg-bg overflow-hidden mb-3">
      {submission.imageUrl ? (
        <img
          src={submission.imageUrl}
          alt={`${submission.playerName}'s submission`}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <p className="font-body text-xs text-text-muted">No image</p>
        </div>
      )}
    </div>
    <p className="font-body text-sm text-text truncate">
      {submission.playerName}
    </p>
  </div>
);
