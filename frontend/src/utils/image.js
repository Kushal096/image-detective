/**
 * Client-side image normalization. Resizes and re-encodes any incoming image
 * (file, drop, or clipboard paste) to a bounded JPEG before upload, cutting
 * bandwidth and giving the server a predictable input.
 */
const MAX_DIMENSION = 1024;
const QUALITY = 0.85;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const isAcceptedImage = (file) => file && ACCEPTED_TYPES.includes(file.type);

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });

/**
 * @param {Blob|File} input
 * @returns {Promise<{ blob: Blob, previewUrl: string }>}
 */
export const compressImage = async (input) => {
  if (!isAcceptedImage(input)) {
    throw new Error('Only JPEG, PNG, or WebP images are allowed');
  }

  const objectUrl = URL.createObjectURL(input);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
        'image/jpeg',
        QUALITY,
      ),
    );

    return { blob, previewUrl: canvas.toDataURL('image/jpeg', 0.6) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/** Extracts the first image blob from a clipboard paste event, if any. */
export const imageFromClipboard = (event) => {
  const items = event.clipboardData?.items ?? [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
};
