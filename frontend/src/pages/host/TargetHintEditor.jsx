import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Eye, X } from "lucide-react";
import { Button } from "../../components/ui/Button.jsx";
import {
  renderHintPreview,
  serializeHintConfig,
} from "../../utils/hintPreview.js";

const MIN_BLUR = 0;
const MAX_BLUR = 30;
const DEFAULT_BLUR = 12;

/**
 * Full-screen editor for the host to crop and blur the player-facing hint.
 * The full original image is uploaded for scoring; only the hint is customized.
 */
export const TargetHintEditor = ({
  imageUrl,
  uploading,
  onConfirm,
  onCancel,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [blur, setBlur] = useState(DEFAULT_BLUR);
  const [preview, setPreview] = useState(null);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    if (!croppedAreaPixels) return undefined;
    let cancelled = false;

    renderHintPreview(imageUrl, croppedAreaPixels, blur)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, croppedAreaPixels, blur]);

  const handleConfirm = () => {
    if (!croppedAreaPixels) return;
    onConfirm(serializeHintConfig(croppedAreaPixels, blur));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hint-editor-title"
    >
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-md border border-border bg-surface shadow-(--shadow-glow-blue)">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2
              id="hint-editor-title"
              className="font-display text-lg tracking-widest"
            >
              PLAYER HINT
            </h2>
            <p className="font-body text-xs text-text-muted mt-1">
              Crop and blur what detectives see. Scoring still uses the full
              image.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="p-2 rounded-sm text-text-muted hover:text-text hover:bg-elevated"
            aria-label="Close editor"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-0 lg:gap-5 p-5">
          <div className="flex flex-col gap-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-text-muted">
              Crop region
            </p>
            <div className="relative aspect-video rounded-sm border border-border bg-bg overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-text-muted">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-label text-[10px] uppercase tracking-widest text-text-muted flex justify-between">
                <span>Blur</span>
                <span className="text-primary">{blur}</span>
              </span>
              <input
                type="range"
                min={MIN_BLUR}
                max={MAX_BLUR}
                step={1}
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 mt-5 lg:mt-0">
            <p className="font-label text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Eye className="size-3.5" />
              Player preview
            </p>
            <div className="aspect-video rounded-sm border border-secondary/40 bg-bg overflow-hidden flex items-center justify-center">
              {preview?.dataUrl ? (
                <img
                  src={preview.dataUrl}
                  alt="Player hint preview"
                  className="w-full h-full object-cover"
                  style={{
                    filter:
                      preview.blurPx > 0
                        ? `blur(${preview.blurPx}px)`
                        : undefined,
                  }}
                  draggable={false}
                />
              ) : (
                <p className="font-body text-xs text-text-muted px-4 text-center">
                  Adjust the crop to generate a preview
                </p>
              )}
            </div>
            <p className="font-body text-xs text-text-muted text-center">
              Detectives only see this cropped, blurred clue — not the full
              target.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={uploading}
            disabled={!croppedAreaPixels}
            onClick={handleConfirm}
          >
            Set Target
          </Button>
        </div>
      </div>
    </div>
  );
};
