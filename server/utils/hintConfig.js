const MIN_BLUR = 0;
const MAX_BLUR = 30;

/**
 * Parses and validates host-provided hint settings (crop region + blur).
 * Crop coordinates are pixel values on the orientation-corrected image.
 *
 * @param {string|undefined} raw JSON from multipart field
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {{ crop: { left: number, top: number, width: number, height: number }, blur: number } | null}
 */
export const parseHintConfig = (raw, imageWidth, imageHeight) => {
  if (!raw || typeof raw !== "string") return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error("Invalid hint configuration JSON");
    err.status = 400;
    err.name = "BadHintConfig";
    throw err;
  }

  const blur = clampInt(parsed.blur ?? 16, MIN_BLUR, MAX_BLUR);
  const crop = parsed.crop ?? parsed;

  const left = clampInt(crop.x ?? crop.left ?? 0, 0, imageWidth - 1);
  const top = clampInt(crop.y ?? crop.top ?? 0, 0, imageHeight - 1);
  const maxWidth = imageWidth - left;
  const maxHeight = imageHeight - top;
  const width = clampInt(crop.width ?? maxWidth, 1, maxWidth);
  const height = clampInt(crop.height ?? maxHeight, 1, maxHeight);

  return {
    crop: { left, top, width, height },
    blur,
  };
};

const clampInt = (value, min, max) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};
