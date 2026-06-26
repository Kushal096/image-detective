import { useState } from 'react';
import { Trophy, Clock, Target, X } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.jsx';
import { cn } from '../../utils/cn.js';

/**
 * Round Results Display - Shows all player submissions after a round ends.
 * Each player card displays their submitted image, score, and rank.
 * Clicking a submission opens a modal with detailed comparison.
 */
export const RoundResults = ({ round, players, targetImage, onClose }) => {
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  if (!round) return null;

  // Handle submissions as either Map or object (depending on source)
  const submissionsData = round.submissions || {};
  const submissions = Object.entries(submissionsData).map(([playerId, submission]) => {
    const player = players.find((p) => p.id === playerId);
    return {
      playerId,
      playerName: player?.name || 'Unknown',
      ...submission,
    };
  });

  const sortedSubmissions = submissions.sort(
    (a, b) => b.score - a.score || a.submittedAt - b.submittedAt
  );

  return (
    <>
      <Card glow="primary" className="animate-scale-in">
        <CardHeader
          title={`Round ${round.index + 1} Results`}
          subtitle={`${sortedSubmissions.length} submission${sortedSubmissions.length !== 1 ? 's' : ''}`}
          icon={Trophy}
        />

        {sortedSubmissions.length === 0 ? (
          <p className="font-body text-sm text-text-muted text-center py-8">
            No submissions received for this round
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSubmissions.map((submission, idx) => (
              <SubmissionCard
                key={submission.playerId}
                submission={submission}
                rank={idx + 1}
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
          roundIndex={round.index}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  );
};

/**
 * Individual submission card showing player's result
 */
const SubmissionCard = ({ submission, rank, onClick }) => {
  const isWinner = rank === 1;
  const medalColor = rank === 1 ? 'text-primary' : rank === 2 ? 'text-secondary' : rank === 3 ? 'text-warning' : 'text-text-muted';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative p-3 rounded-sm border transition-all cursor-pointer text-left',
        'bg-elevated hover:bg-elevated/80 hover:scale-[1.02]',
        isWinner ? 'border-primary/50 shadow-[var(--shadow-glow)]' : 'border-border hover:border-primary/30'
      )}
    >
      {/* Rank badge */}
      <div
        className={cn(
          'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center',
          'font-display text-sm border-2',
          isWinner ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-secondary'
        )}
      >
        {rank}
      </div>

      {/* Submitted image preview */}
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

      {/* Player info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-text truncate flex-1">{submission.playerName}</p>
          {isWinner && <Trophy className="size-4 text-primary ml-2 shrink-0" />}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-label text-text-muted">Score</span>
          <span className={cn('font-display text-lg', medalColor)}>{submission.score}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-label text-text-muted">Similarity</span>
          <span className="font-body text-text-secondary">{(submission.similarity * 100).toFixed(1)}%</span>
        </div>

        {submission.submittedAt && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="size-3" />
            <span className="font-body">{new Date(submission.submittedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/30 rounded-sm transition-colors pointer-events-none" />
    </button>
  );
};

/**
 * Modal showing detailed submission comparison with target
 */
const SubmissionModal = ({ submission, targetImage, roundIndex, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full bg-surface border border-border rounded-sm shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display text-lg tracking-wider">{submission.playerName}'s Submission</h3>
            <p className="font-body text-xs text-text-secondary">Round {roundIndex + 1}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xs text-text-muted hover:text-text hover:bg-elevated transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score summary */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-sm bg-elevated border border-border">
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Score</p>
              <p className="font-display text-3xl text-primary">{submission.score}</p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Similarity</p>
              <p className="font-display text-3xl text-secondary">{(submission.similarity * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Submitted</p>
              <p className="font-body text-sm text-text">
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Image comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-4 text-primary" />
                <p className="font-label text-xs uppercase tracking-widest text-text-muted">Target Image</p>
              </div>
              <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden">
                {targetImage ? (
                  <img src={targetImage} alt="Target" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-body text-xs text-text-muted">Target not available</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="size-4 text-secondary" />
                <p className="font-label text-xs uppercase tracking-widest text-text-muted">Submitted Image</p>
              </div>
              <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden">
                {submission.imageUrl ? (
                  <img src={submission.imageUrl} alt="Submission" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="font-body text-xs text-text-muted">Image not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
