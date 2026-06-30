import { useState, useRef } from "react";
import {
  Plus,
  GripVertical,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AppLayout } from "../../layouts/AppLayout.jsx";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useGame } from "../../contexts/gameContext.js";
import { useToast } from "../../contexts/toastContext.js";
import { apiClient } from "../../services/api/client.js";
import { compressImage } from "../../utils/image.js";
import { TargetHintEditor } from "./TargetHintEditor.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Round Setup — configure round groups, each with named sub-rounds and target images.
 */
export const RoundSetup = ({ onStartGame }) => {
  const {
    room,
    identity,
    addRound,
    removeRound,
    updateRound,
    reorderRounds,
    addSubRound,
    removeSubRound,
    updateSubRound,
    startGame,
  } = useGame();
  const toast = useToast();
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [draftImage, setDraftImage] = useState(null);

  const rounds = room?.rounds || [];
  const allSubRounds = rounds.flatMap((g) => g.subRounds || []);
  const configuredCount = allSubRounds.filter((sr) => sr.hasTarget).length;
  const missingCount = allSubRounds.length - configuredCount;
  const allRoundsReady = room?.allRoundsReady || false;

  const handleAddRound = async () => {
    const result = await addRound(`Round ${rounds.length + 1}`);
    if (!result?.ok) toast.error(result?.message || "Failed to add round");
  };

  const handleStartGame = async () => {
    if (!allRoundsReady) {
      toast.error("All sub-rounds must have target images");
      return;
    }
    const result = await startGame();
    if (result?.ok) onStartGame?.();
    else toast.error(result?.message || "Failed to start game");
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
    if (!result?.ok) toast.error(result?.message || "Failed to reorder rounds");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl tracking-widest mb-2">
            TOURNAMENT SETUP
          </h1>
          <p className="font-body text-sm text-text-secondary">
            Create round groups with named sub-rounds (e.g. Cartoon,
            Actor/Actress). Upload a target image for each sub-round.
          </p>
        </div>

        <Card glow="primary" className="mb-6">
          <CardHeader title="Tournament Status" />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">
                Sub-rounds
              </p>
              <p className="font-display text-3xl text-primary">
                {allSubRounds.length}
              </p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">
                Configured
              </p>
              <p className="font-display text-3xl text-primary">
                {configuredCount}
              </p>
            </div>
            <div className="text-center">
              <p className="font-label text-xs uppercase tracking-widest text-text-muted mb-1">
                Missing
              </p>
              <p
                className={cn(
                  "font-display text-3xl",
                  missingCount > 0 ? "text-warning" : "text-primary",
                )}
              >
                {missingCount}
              </p>
            </div>
          </div>

          {allRoundsReady ? (
            <div className="flex items-center gap-2 p-3 rounded-sm bg-primary/10 border border-primary/30 mb-4">
              <CheckCircle2 className="size-5 text-primary shrink-0" />
              <p className="font-body text-sm text-text">
                All sub-rounds are ready! You can start the game.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-sm bg-warning/10 border border-warning/30 mb-4">
              <AlertCircle className="size-5 text-warning shrink-0" />
              <p className="font-body text-sm text-text">
                {missingCount} sub-round{missingCount !== 1 ? "s" : ""} still
                need target images.
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
            <Plus className="size-4" /> Add Round Group
          </Button>
        </div>

        <div className="space-y-3">
          {rounds.length === 0 ? (
            <Card>
              <p className="font-body text-sm text-text-muted text-center py-8">
                No rounds configured yet. Click "Add Round Group" to begin.
              </p>
            </Card>
          ) : (
            rounds.map((group, groupIndex) => (
              <RoundGroupCard
                key={group.index}
                group={group}
                groupIndex={groupIndex}
                isDragging={draggingIndex === groupIndex}
                uploadingKey={uploadingKey}
                onDragStart={() => setDraggingIndex(groupIndex)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(groupIndex)}
                onRemove={() =>
                  removeRound(groupIndex).then(
                    (r) => !r?.ok && toast.error(r?.message),
                  )
                }
                onUpdateTitle={(title) =>
                  updateRound(groupIndex, title).then(
                    (r) => !r?.ok && toast.error(r?.message),
                  )
                }
                onAddSubRound={(title) =>
                  addSubRound(groupIndex, title).then(
                    (r) => !r?.ok && toast.error(r?.message),
                  )
                }
                onRemoveSubRound={(subIdx) =>
                  removeSubRound(groupIndex, subIdx).then(
                    (r) => !r?.ok && toast.error(r?.message),
                  )
                }
                onUpdateSubRoundTitle={(subIdx, title) =>
                  updateSubRound(groupIndex, subIdx, title).then(
                    (r) => !r?.ok && toast.error(r?.message),
                  )
                }
                onUploadStart={(draft) =>
                  setDraftImage({ ...draft, groupIndex })
                }
              />
            ))
          )}
        </div>

        {draftImage && (
          <TargetHintEditor
            imageUrl={draftImage.imageUrl}
            uploading={uploadingKey !== null}
            onConfirm={async (hintConfig) => {
              if (!draftImage) return;
              const key = `${draftImage.groupIndex}-${draftImage.subRoundIndex}`;
              setUploadingKey(key);
              try {
                await apiClient.uploadTarget(
                  room.code,
                  identity.hostId,
                  draftImage.blob,
                  hintConfig,
                  draftImage.groupIndex,
                  draftImage.subRoundIndex,
                );
                toast.success("Target image set");
              } catch (err) {
                toast.error(err.message ?? "Failed to set target");
              } finally {
                setDraftImage(null);
                setUploadingKey(null);
              }
            }}
            onCancel={() => {
              setDraftImage(null);
              setUploadingKey(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

const RoundGroupCard = ({
  group,
  groupIndex,
  isDragging,
  uploadingKey,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  onUpdateTitle,
  onAddSubRound,
  onRemoveSubRound,
  onUpdateSubRoundTitle,
  onUploadStart,
}) => {
  const [groupTitle, setGroupTitle] = useState(group.title || "");
  const subRounds = group.subRounds || [];

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50 scale-95",
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start gap-3 mb-4">
        <button
          type="button"
          className="p-2 text-text-muted hover:text-text cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            onBlur={() =>
              groupTitle !== group.title && onUpdateTitle(groupTitle || null)
            }
            placeholder={`Round group ${groupIndex + 1}`}
            className="font-display text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-xs text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="space-y-3 pl-2">
        {subRounds.map((subRound, subIdx) => (
          <SubRoundRow
            key={subIdx}
            subRound={subRound}
            groupIndex={groupIndex}
            subRoundIndex={subIdx}
            canRemove={subRounds.length > 1}
            isUploading={uploadingKey === `${groupIndex}-${subIdx}`}
            onRemove={() => onRemoveSubRound(subIdx)}
            onUpdateTitle={(title) => onUpdateSubRoundTitle(subIdx, title)}
            onUploadStart={onUploadStart}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-3 w-full"
        onClick={() => onAddSubRound(`Sub-round ${subRounds.length + 1}`)}
      >
        <Plus className="size-3.5" /> Add Sub-round
      </Button>
    </Card>
  );
};

const SubRoundRow = ({
  subRound,
  groupIndex,
  subRoundIndex,
  canRemove,
  isUploading,
  onRemove,
  onUpdateTitle,
  onUploadStart,
}) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [title, setTitle] = useState(subRound.title || "");

  const handleImagePick = async (file) => {
    if (!file || isUploading) return;
    try {
      const { blob, previewUrl } = await compressImage(file);
      onUploadStart({ blob, imageUrl: previewUrl, subRoundIndex });
    } catch (err) {
      toast.error(err.message ?? "Could not load image");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "grid md:grid-cols-[1fr_auto_auto] gap-3 items-center p-3 rounded-sm border border-border bg-elevated/40",
        isUploading && "opacity-60 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() =>
            title !== subRound.title && onUpdateTitle(title || null)
          }
          placeholder="e.g. Cartoon, Actor/Actress"
          className="text-sm"
        />
        {subRound.hasTarget && (
          <CheckCircle2 className="size-4 text-primary shrink-0" />
        )}
      </div>

      <div className="w-24 aspect-video rounded-xs border border-border bg-bg overflow-hidden">
        {subRound.targetPreview ? (
          <img
            src={subRound.targetPreview}
            alt="Target"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="font-body text-[10px] text-text-muted">No image</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => handleImagePick(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3.5" />
        </Button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-xs text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
};
