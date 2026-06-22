import { useEffect, useState } from 'react';
import QR from 'qrcode';

/**
 * Renders a scannable QR code for the join URL. Generated client-side into a
 * data URL with theme-matched colors.
 */
export const QRCode = ({ value, size = 160 }) => {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let active = true;
    QR.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#00FF88', light: '#0A0A0F' },
      errorCorrectionLevel: 'M',
    })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setDataUrl(null));
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="bg-bg border border-border rounded-sm animate-pulse"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      width={size}
      height={size}
      alt={`QR code to join at ${value}`}
      className="rounded-sm border border-border"
    />
  );
};
