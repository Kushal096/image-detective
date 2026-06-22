import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, ClipboardPaste, ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { compressImage, imageFromClipboard, isAcceptedImage } from '../../utils/image.js';
import { cn } from '../../utils/cn.js';

/**
 * Unified image intake supporting clipboard paste (desktop), drag & drop, and
 * file/gallery picking (mobile). Compresses client-side, shows an immediate
 * preview, and allows replacing before the (single) submission.
 *
 * @param {(blob: Blob) => Promise<void>} onSubmit
 */
export const UploadZone = ({ onSubmit, disabled = false, submitted = false, onError }) => {
  const [preview, setPreview] = useState(null);
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const ingest = useCallback(
    async (file) => {
      if (!file) return;
      if (!isAcceptedImage(file)) {
        onError?.('Only JPEG, PNG, or WebP images are allowed');
        return;
      }
      setBusy(true);
      try {
        const { blob: compressed, previewUrl } = await compressImage(file);
        setBlob(compressed);
        setPreview(previewUrl);
      } catch (err) {
        onError?.(err.message ?? 'Could not process image');
      } finally {
        setBusy(false);
      }
    },
    [onError],
  );

  // Global paste listener so Ctrl+V works without focusing the zone.
  useEffect(() => {
    if (disabled || submitted) return undefined;
    const onPaste = (e) => {
      const file = imageFromClipboard(e);
      if (file) {
        e.preventDefault();
        ingest(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [ingest, disabled, submitted]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || submitted) return;
    ingest(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!blob || busy) return;
    setBusy(true);
    try {
      await onSubmit(blob);
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 animate-fade-in">
        {preview && (
          <img src={preview} alt="Your submission" className="max-h-48 rounded-sm border border-primary/40" />
        )}
        <p className="font-label uppercase tracking-widest text-primary text-sm">Submission locked in</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-md transition-colors duration-150',
          'flex flex-col items-center justify-center text-center gap-3 p-8 min-h-52',
          dragging ? 'border-primary bg-primary/5' : 'border-border bg-bg',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {preview ? (
          <img src={preview} alt="Selected preview" className="max-h-44 rounded-sm border border-border" />
        ) : (
          <>
            <ImageIcon className="size-10 text-text-muted" aria-hidden />
            <div className="font-body text-sm text-text-secondary">
              <p className="hidden md:block">
                <ClipboardPaste className="inline size-4 mr-1 -mt-1 text-secondary" />
                Paste an image, drag &amp; drop, or
              </p>
              <p className="md:hidden">Choose an image from your device</p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => ingest(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          {preview ? <RefreshCw className="size-3.5" /> : <Upload className="size-3.5" />}
          {preview ? 'Replace' : 'Upload File'}
        </Button>
      </div>

      <Button onClick={submit} disabled={!blob || disabled} loading={busy} size="lg" className="w-full">
        Submit Image
      </Button>
    </div>
  );
};
