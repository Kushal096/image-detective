import { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { QRCode } from '../../components/game/QRCode.jsx';

/** Displays the room code, a copyable join link, and a scannable QR code. */
export const RoomInfoCard = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join?code=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — code is still visible on screen */
    }
  };

  return (
    <Card glow="secondary">
      <CardHeader title="Room Access" subtitle="Share to invite players" icon={QrCode} />
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mb-1">
            Room Code
          </p>
          <p className="font-display text-4xl tracking-[0.3em] text-primary drop-shadow-[0_0_10px_#00FF88]">
            {code}
          </p>
        </div>
        <QRCode value={joinUrl} size={150} />
        <Button variant="ghost" size="sm" onClick={copy} className="w-full">
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied link' : 'Copy join link'}
        </Button>
      </div>
    </Card>
  );
};
