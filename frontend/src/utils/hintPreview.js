const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });

/**
 * Renders a client-side approximation of the player hint (crop + blur preview).
 * @param {string} imageUrl object URL or data URL of the upload-ready image
 * @param {{ x: number, y: number, width: number, height: number }} crop
 * @param {number} blur px amount for CSS blur preview
 */
export const renderHintPreview = async (imageUrl, crop, blur = 12) => {
  if (!crop?.width || !crop?.height) return null;

  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const size = 320;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.55),
    blurPx: Math.max(0, Math.min(30, blur)),
  };
};

/** Serializes crop pixels for the server hintConfig field. */
export const serializeHintConfig = (crop, blur) => ({
  crop: {
    x: Math.round(crop.x),
    y: Math.round(crop.y),
    width: Math.round(crop.width),
    height: Math.round(crop.height),
  },
  blur: Math.round(blur),
});
