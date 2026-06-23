import sharp from "sharp";
import { createLogger } from "../utils/logger.js";

const log = createLogger("image");

/**
 * Normalizes an arbitrary uploaded image buffer into a clean, bounded RGB
 * representation suitable for CLIP. Strips metadata, flattens transparency,
 * and constrains dimensions to keep inference fast and memory bounded.
 *
 * @param {Buffer} buffer raw uploaded bytes
 * @returns {Promise<{ data: Buffer, info: import('sharp').OutputInfo }>}
 */
export const preprocessForClip = async (buffer) => {
  const pipeline = sharp(buffer, { failOn: "truncated" })
    .rotate() // honor EXIF orientation before stripping metadata
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .resize(224, 224, { fit: "cover", position: "centre" })
    .removeAlpha();

  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });

  log.debug("preprocessed image", { width: info.width, height: info.height });
  return { data, info };
};

/**
 * Validates that a buffer is a decodable image of an allowed type.
 * @returns {Promise<{ ok: boolean, format?: string, reason?: string }>}
 */
export const inspectImage = async (
  buffer,
  allowedFormats = ["jpeg", "png", "webp"],
) => {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.format || !allowedFormats.includes(meta.format)) {
      return {
        ok: false,
        reason: `Unsupported format: ${meta.format ?? "unknown"}`,
      };
    }
    if (!meta.width || !meta.height) {
      return { ok: false, reason: "Image has no decodable dimensions" };
    }
    return { ok: true, format: meta.format };
  } catch (err) {
    return { ok: false, reason: "Corrupt or undecodable image" };
  }
};

/**
 * Produces a small, bounded JPEG data URL for host-side target preview.
 * Kept small to avoid bloating socket payloads.
 */
export const makePreviewDataUrl = async (buffer) => {
  const out = await sharp(buffer)
    .rotate()
    .resize(360, 360, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
};

/**
 * Produces a blurred, cropped hint for players. Scoring still uses the full
 * original image embedding; this preview is only a visual clue.
 *
 * @param {Buffer} buffer
 * @param {{ crop?: { left: number, top: number, width: number, height: number }, blur?: number } | null} hintConfig
 */
export const makePlayerHint = async (buffer, hintConfig = null) => {
  const meta = await sharp(buffer).rotate().metadata();
  const w = meta.width ?? 224;
  const h = meta.height ?? 224;

  const blur = hintConfig?.blur ?? 16;
  const extract = hintConfig?.crop
    ? {
        left: hintConfig.crop.left,
        top: hintConfig.crop.top,
        width: hintConfig.crop.width,
        height: hintConfig.crop.height,
      }
    : autoCropRegion(buffer, w, h);

  let pipeline = sharp(buffer)
    .rotate()
    .extract(extract)
    .resize(320, 320, { fit: "cover" });

  if (blur > 0) pipeline = pipeline.blur(blur);

  const out = await pipeline.jpeg({ quality: 50 }).toBuffer();
  return {
    buffer: out,
    dataUrl: `data:image/jpeg;base64,${out.toString("base64")}`,
  };
};

/** @deprecated Use makePlayerHint — kept for compatibility. */
export const makePlayerHintDataUrl = async (buffer, hintConfig = null) => {
  const hint = await makePlayerHint(buffer, hintConfig);
  return hint.dataUrl;
};

/** Fallback crop when the host does not supply a custom region. */
const autoCropRegion = (buffer, w, h) => {
  const cropFrac = 0.42;
  const cropW = Math.max(1, Math.floor(w * cropFrac));
  const cropH = Math.max(1, Math.floor(h * cropFrac));

  let hash = 0;
  for (let i = 0; i < Math.min(buffer.length, 256); i += 1) {
    hash = (hash * 31 + buffer[i]) >>> 0;
  }
  const maxLeft = Math.max(0, w - cropW);
  const maxTop = Math.max(0, h - cropH);
  const left = maxLeft > 0 ? hash % maxLeft : 0;
  const top = maxTop > 0 ? (hash >>> 8) % maxTop : 0;

  return {
    left: Math.floor(left),
    top: Math.floor(top),
    width: cropW,
    height: cropH,
  };
};
