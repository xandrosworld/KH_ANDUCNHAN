/**
 * Canvas-based watermark utility for image upload previews.
 * Draws semi-transparent "So Do Van Phuc" text diagonally across the image.
 * NOTE: This is a frontend-only watermark for preview display.
 * Server-side watermarking requires a backend implementation.
 */

export function applyWatermark(
  imageSrc: string,
  text = 'So Do Van Phuc',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageSrc); return; }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw watermark on canvas
        drawWatermarkText(ctx, canvas.width, canvas.height, text);

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for watermark'));
    img.src = imageSrc;
  });
}

/**
 * Resize image to a max width and apply canvas watermark in one pass.
 * Returns a compressed JPEG data URL suitable for localStorage storage.
 * Used when uploading images in PostPropertyPage to reduce storage size
 * while baking in the watermark.
 */
export function resizeAndWatermark(
  imageSrc: string,
  maxWidth = 1600,
  quality = 0.75,
  text = 'So Do Van Phuc',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Calculate new dimensions
        let newW = origW;
        let newH = origH;
        if (origW > maxWidth) {
          newW = maxWidth;
          newH = Math.round((origH / origW) * maxWidth);
        }

        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageSrc); return; }

        // Draw resized image
        ctx.drawImage(img, 0, 0, newW, newH);

        // Draw watermark on canvas
        drawWatermarkText(ctx, newW, newH, text);

        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for watermark'));
    img.src = imageSrc;
  });
}

/** Shared helper: draws repeating diagonal watermark text on a canvas context */
function drawWatermarkText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  const fontSize = Math.max(14, Math.min(width, height) * 0.06);
  ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
  ctx.fillStyle = 'rgba(246, 211, 122, 0.25)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);

  const stepX = fontSize * 8;
  const stepY = fontSize * 4;
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}
