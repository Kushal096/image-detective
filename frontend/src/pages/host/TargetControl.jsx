import { useRef, useState } from 'react';
import { Target, Upload, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { apiClient } from '../../services/api/client.js';
import { compressImage } from '../../utils/image.js';
import { useToast } from '../../contexts/toastContext.js';

/**
 * Host control for choosing the round's target image. Uploads over REST (the
 * server computes and stores the CLIP embedding); the preview comes back in the
 * host's room snapshot.
 */
export const TargetControl = ({ code, hostId, targetPreview, hasTarget, locked }) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { blob } = await compressImage(file);
      await apiClient.uploadTarget(code, hostId, blob);
      toast.success('Target image set');
    } catch (err) {
      toast.error(err.message ?? 'Failed to set target');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card glow={hasTarget ? 'primary' : 'none'}>
      <CardHeader
        title="Target Image"
        subtitle="What players must match"
        icon={Target}
        action={
          hasTarget && <CheckCircle2 className="size-4 text-primary" aria-label="target ready" />
        }
      />

      <div className="aspect-video rounded-sm border border-border bg-bg overflow-hidden flex items-center justify-center mb-4">
        {targetPreview ? (
          <img src={targetPreview} alt="Round target" className="w-full h-full object-contain" />
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
        variant={hasTarget ? 'secondary' : 'primary'}
        size="md"
        className="w-full"
        loading={uploading}
        disabled={locked}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {hasTarget ? 'Replace Target' : 'Set Target'}
      </Button>
      {locked && (
        <p className="font-body text-xs text-text-muted mt-2 text-center">
          Target is locked while the round runs
        </p>
      )}
    </Card>
  );
};
