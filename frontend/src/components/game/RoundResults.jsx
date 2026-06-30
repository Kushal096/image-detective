import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { Card, CardHeader } from "../ui/Card.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Round Results Display - Shows all player submissions after a round ends.
 * Admin view: name and image only (scores hidden for screen-share fairness).
 */
export const RoundResults = ({ round, players, targetImage, onClose }) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);

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
    <>
      <Card glow="primary" className="animate-scale-in">
        <CardHeader
          title={round.title ? `${round.title} — Submissions` : `Round Results`}
          subtitle={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
          icon={ImageIcon}
        />

        {submissions.length === 0 ? (
          <p className="font-body text-sm text-text-muted text-center py-8">
            No submissions received for this round
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.playerId}
                submission={submission}
                onClick={() => setSelectedSubmission(submission)}
              />
            ))}
          </div>
        )}
      </Card>

      {selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          targetImage={targetImage}
          roundTitle={round.title}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  );
};

const SubmissionCard = ({ submission, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative p-3 rounded-sm border transition-all cursor-pointer text-left",
      "bg-elevated hover:bg-elevated/80 hover:scale-[1.02] border-border hover:border-primary/30",
    )}
  >
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

    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/30 rounded-sm transition-colors pointer-events-none" />
  </button>
);

const SubmissionModal = ({ submission, targetImage, roundTitle, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm animate-fade-in"
    onClick={onClose}
  >
    <div
      className="max-w-4xl w-full bg-surface border border-border rounded-sm shadow-2xl animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-display text-lg tracking-wider">
            {submission.playerName}
          </h3>
          {roundTitle && (
            <p className="font-body text-xs text-text-secondary">
              {roundTitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xs text-text-muted hover:text-text hover:bg-elevated transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-4">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-2">
            Target
          </p>
          <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden">
            {targetImage ? (
              <img
                src={targetImage}
                alt="Target"
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

        <div>
          <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-2">
            Submission
          </p>
          <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden">
            {submission.imageUrl ? (
              <img
                src={submission.imageUrl}
                alt="Submission"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="font-body text-xs text-text-muted">
                  Image not available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
