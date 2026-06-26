import { useState, useRef } from 'react';
import { Plus, GripVertical, Trash2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useGame } from '../../contexts/gameContext.js';
import { useToast } from '../../contexts/toastContext.js';
import { apiClient } from '../../services/api/client.js';
import { compressImage } from '../../utils/image.js';
import { TargetHintEditor } from './TargetHintEditor.jsx';
import { cn } from '../../utils/cn.js';

/**
 * Round Setup page - Pre-game configuration where host prepares all rounds.
 * Supports drag-and-drop reordering, image uploads, and validation.
 */
export const RoundSetup = ({ onStartGame }) => {
  const { room, identity, addRound, removeRound, updateRound, reorderRounds, startGame } = useGame();
  const toast = useToast();
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [draftImage, setDraftImage] = useState(null);

  const rounds = room?.rounds || [];
  const allRoundsReady = room?.allRoundsReady || false;
  const configuredCount = rounds.filter((r) => r.hasTarget).length;
  const missingCount = rounds.length - configuredCount;

  const handleAddRound = async () => {
    const result = await addRound(`Round ${rounds.length + 1}`);
    if (!result?.ok) {
      toast.error(result?.message || 'Failed to add round');
    }
  };

  const handleRemoveRound = async (index) => {
    const result = await removeRound(index);
    if (!result?.ok) {
      toast.error(result?.message || 'Failed to remove round');
    }
  };

  const handleStartGame = async () => {
    if (!allRoundsReady) {
      toast.error('All rounds must have target images');
      return;
    }
    const result = await startGame();
    if (result?.ok) {
      onStartGame?.();
    } else {
      toast.error(result?.message || 'Failed to start game');
    }
  };

  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex) => {
    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      return;
    }

    const newOrder = [...Array(rounds.length).keys()];
    const [removed] = newOrder.splice(draggingIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    setDraggingIndex(null);
    const result = await reorderRounds(newOrder);
    if (!result?.ok) {
      toast.error(result?.message || 'Failed to reorder rounds');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl tracking-widest mb-2">TOURNAMENT SETUP</h1>
          <p className="font-body text-sm text-text-secondary">
            Configure all rounds before starting the game. Upload target images and reorder rounds as needed.
          </p>
        </div>

        <Card glow="primary" className="mb-6">
          <CardHeader title="Tournament Status" />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Total Rounds</p>
              <p className="font-display text-3xl text-primary">{rounds.length}</p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Configured</p>
              <p className="font-display text-3xl text-primary">{configuredCount}</p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">Missing</p>
              <p className={cn('font-display text-3xl', missingCount > 0 ? 'text-warning' : 'text-primary')}>
                {missingCount}
              </p>
            </div>
          </div>

          {allRoundsReady ? (
            <div className="flex items-center gap-2 p-3 rounded-sm bg-primary/10 border border-primary/30 mb-4">
              <CheckCircle2 className="size-5 text-primary shrink-0" />
              <p className="font-body text-sm text-text">All rounds are ready! You can start the game.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-sm bg-warning/10 border border-warning/30 mb-4">
              <AlertCircle className="size-5 text-warning shrink-0" />
              <p className="font-body text-sm text-text">
                {missingCount} round{missingCount !== 1 ? 's' : ''} still need target images.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!allRoundsReady}
            onClick={handleStartGame}
          >
            Start Game
          </Button>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-widest">ROUNDS</h2>
          <Button variant="secondary" size="sm" onClick={handleAddRound}>
            <Plus className="size-4" /> Add Round
          </Button>
        </div>

        <div className="space-y-3">
          {rounds.length === 0 ? (
            <Card>
              <p className="font-body text-sm text-text-muted text-center py-8">
                No rounds configured yet. Click "Add Round" to begin.
              </p>
            </Card>
          ) : (
            rounds.map((round, index) => (
              <RoundCard
                key={round.index}
                round={round}
                index={index}
                isDragging={draggingIndex === index}
                isUploading={uploadingIndex === index}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onRemove={() => handleRemoveRound(index)}
                onUploadStart={(draft) => {
                  setDraftImage({ ...draft, roundIndex: index });
                }}
                code={room.code}
                hostId={identity.hostId}
              />
            ))
          )}
        </div>

        {draftImage && (
          <TargetHintEditor
            imageUrl={draftImage.imageUrl}
            uploading={uploadingIndex !== null}
            onConfirm={async (hintConfig) => {
              if (!draftImage) {
                toast.error('No image selected');
                return;
              }
              
              // Set uploading state ONLY when upload actually starts
              setUploadingIndex(draftImage.roundIndex);
              
              try {
                await apiClient.uploadTarget(
                  room.code,
                  identity.hostId,
                  draftImage.blob,
                  hintConfig,
                  draftImage.roundIndex
                );
                toast.success('Target image set');
              } catch (err) {
                console.error('Upload error:', err);
                toast.error(err.message ?? 'Failed to set target');
              } finally {
                setDraftImage(null);
                setUploadingIndex(null);
              }
            }}
            onCancel={() => {
              setDraftImage(null);
              setUploadingIndex(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

/**
 * Individual round card with drag-and-drop, image preview, and actions.
 */
const RoundCard = ({
  round,
  index,
  isDragging,
  isUploading,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  onUploadStart,
  code,
  hostId,
}) => {
  const toast = useToast();
  const inputRef = useRef(null);

  const handleImagePick = async (file) => {
    if (!file) return;
    if (isUploading) return; // Prevent multiple uploads
    
    try {
      const { blob, previewUrl } = await compressImage(file);
      onUploadStart({ blob, imageUrl: previewUrl });
    } catch (err) {
      toast.error(err.message ?? 'Could not load image');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Card
      glow={round.hasTarget ? 'primary' : 'none'}
      className={cn(
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-95',
        isUploading && 'pointer-events-none opacity-60'
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          className="p-2 text-text-muted hover:text-text cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base tracking-wider">
                {round.title || `Round ${index + 1}`}
              </h3>
              {round.hasTarget && <CheckCircle2 className="size-4 text-primary" />}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-xs text-danger hover:bg-danger/10 transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden flex items-center justify-center">
              {round.targetPreview ? (
                <img src={round.targetPreview} alt="Target" className="w-full h-full object-contain" />
              ) : (
                <p className="font-body text-xs text-text-muted">No target image</p>
              )}
            </div>

            <div className="flex flex-col justify-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => handleImagePick(e.target.files?.[0])}
              />
              <Button
                variant={round.hasTarget ? 'secondary' : 'primary'}
                size="md"
                className="w-full"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {round.hasTarget ? 'Replace Image' : 'Upload Image'}
              </Button>
              {!round.hasTarget && (
                <p className="font-body text-xs text-text-muted text-center">
                  Upload a target image for this round
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
