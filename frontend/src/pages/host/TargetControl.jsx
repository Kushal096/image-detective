import { useRef, useState } from "react";
import { Target, Upload, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { apiClient } from "../../services/api/client.js";
import { compressImage } from "../../utils/image.js";
import { useToast } from "../../contexts/toastContext.js";
import { TargetHintEditor } from "./TargetHintEditor.jsx";

/**
 * Host control for choosing the round's target image. Opens a crop/blur editor
 * for the player hint, then uploads the full image for scoring over REST.
 */
export const TargetControl = ({
  code,
  hostId,
  targetPreview,
  hasTarget,
  locked,
}) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState(null);

  const onPick = async (file) => {
    if (!file) return;
    try {
      const { blob, previewUrl } = await compressImage(file);
      setDraft({ blob, imageUrl: previewUrl });
    } catch (err) {
      toast.error(err.message ?? "Could not load image");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onConfirmHint = async (hintConfig) => {
    if (!draft) return;
    setUploading(true);
    try {
      await apiClient.uploadTarget(code, hostId, draft.blob, hintConfig);
      toast.success("Target image set");
      setDraft(null);
    } catch (err) {
      toast.error(err.message ?? "Failed to set target");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card glow={hasTarget ? "primary" : "none"}>
        <CardHeader
          title="Target Image"
          subtitle="What players must match"
          icon={Target}
          action={
            hasTarget && (
              <CheckCircle2
                className="size-4 text-primary"
                aria-label="target ready"
              />
            )
          }
        />

        <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden flex items-center justify-center mb-4">
          {targetPreview ? (
            <img
              src={targetPreview}
              alt="Round target"
              className="w-full h-full object-contain"
            />
          ) : (
            <p className="font-body text-xs text-text-muted text-center px-4">
              No target selected yet
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <Button
          variant={hasTarget ? "secondary" : "primary"}
          size="md"
          className="w-full"
          loading={uploading}
          disabled={locked || Boolean(draft)}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3.5" />
          {hasTarget ? "Replace Target" : "Set Target"}
        </Button>
        {locked && (
          <p className="font-body text-xs text-text-muted mt-2 text-center">
            Target is locked while the round runs
          </p>
        )}
        {!locked && (
          <p className="font-body text-xs text-text-muted mt-2 text-center">
            You&apos;ll crop and blur the clue players see before confirming.
          </p>
        )}
      </Card>

      {draft && (
        <TargetHintEditor
          imageUrl={draft.imageUrl}
          uploading={uploading}
          onConfirm={onConfirmHint}
          onCancel={() => !uploading && setDraft(null)}
        />
      )}
    </>
  );
};
