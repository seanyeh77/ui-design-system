/* Screenshot comparison for ui shots: pure functions on PNG bytes, no browser. */
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface Tolerance {
  /** Per-pixel color distance (0 to 1, pixelmatch's YIQ threshold) under which two pixels count as equal. */
  threshold: number;
  /** Largest share of differing pixels, in percent of the image, that still counts as unchanged. */
  maxDiffPercent: number;
}

/** Anti-aliasing noise passes; a moved border, a changed color or a new line of text does not. */
export const DEFAULT_TOLERANCE: Tolerance = { threshold: 0.1, maxDiffPercent: 0.02 };

export interface Comparison {
  /** True when the screenshot counts as changed: a different size, or more differing pixels than the tolerance allows. */
  changed: boolean;
  /** Pixels that differ beyond the per-pixel threshold (anti-aliased pixels are not counted). */
  diffPixels: number;
  /** diffPixels in percent of the larger image's area. */
  diffPercent: number;
  /** Set when the two images have different sizes: [width, height] of the baseline and of the new shot. */
  sizes?: { expected: [number, number]; actual: [number, number] };
  /** A PNG with the differing pixels in red over a faded copy of the baseline; only when something differs. */
  diff?: Buffer;
}

/** Puts an image on a canvas of width x height; the added area is transparent, so it always differs from an opaque shot. */
function pad(img: PNG, width: number, height: number): Uint8Array {
  if (img.width === width && img.height === height) return img.data;
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < img.height; y++) out.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), y * width * 4);
  return out;
}

/** Compares a new screenshot with its baseline. Both are PNG bytes. */
export function compareShots(expected: Buffer, actual: Buffer, tol: Tolerance = DEFAULT_TOLERANCE): Comparison {
  const a = PNG.sync.read(expected);
  const b = PNG.sync.read(actual);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(pad(a, width, height), pad(b, width, height), diff.data, width, height, {
    threshold: tol.threshold,
    includeAA: false,
    alpha: 0.2,
  });
  const diffPercent = (diffPixels / (width * height)) * 100;
  const resized = a.width !== b.width || a.height !== b.height;
  return {
    changed: resized || diffPercent > tol.maxDiffPercent,
    diffPixels,
    diffPercent,
    ...(resized ? { sizes: { expected: [a.width, a.height] as [number, number], actual: [b.width, b.height] as [number, number] } } : {}),
    ...(diffPixels > 0 || resized ? { diff: PNG.sync.write(diff) } : {}),
  };
}

/** True when two PNGs hold exactly the same pixels, whatever their encoding. */
export function samePixels(x: Buffer, y: Buffer): boolean {
  const a = PNG.sync.read(x);
  const b = PNG.sync.read(y);
  return a.width === b.width && a.height === b.height && Buffer.compare(a.data, b.data) === 0;
}
