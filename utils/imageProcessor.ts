import { BlendMode } from '../types';

/**
 * Loads an image from a base64 string and returns an HTMLImageElement.
 * @param base64 The base64 encoded string of the image.
 * @returns A promise that resolves to an HTMLImageElement.
 */
function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = base64;
  });
}

/**
 * Merges two images using a specified blend mode and opacity, returning a base64 encoded PNG.
 * @param baseImageBase64 The base64 string of the bottom image.
 * @param baseImageMimeType The MIME type of the base image.
 * @param overlayImageBase64 The base64 string of the top (overlay) image.
 * @param overlayImageMimeType The MIME type of the overlay image.
 * @param blendMode The blend mode to apply (e.g., 'normal', 'overlay').
 * @param opacity The opacity of the overlay image (0-1).
 * @returns A promise that resolves to the base64 encoded string of the merged image (PNG format).
 */
export async function mergeImagesWithBlendMode(
  baseImageBase64: string,
  baseImageMimeType: string,
  overlayImageBase64: string,
  overlayImageMimeType: string,
  blendMode: BlendMode,
  opacity: number,
): Promise<string> {
  const [baseImg, overlayImg] = await Promise.all([
    loadImage(`data:${baseImageMimeType};base64,${baseImageBase64}`),
    loadImage(`data:${overlayImageMimeType};base64,${overlayImageBase64}`),
  ]);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法获取 Canvas 2D 上下文。');
  }

  // Set canvas dimensions to match the base image
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;

  // Draw the base image
  ctx.drawImage(baseImg, 0, 0);

  // Apply blend mode and opacity for the overlay image
  ctx.globalAlpha = opacity;

  // For 'normal' blend mode, just draw it.
  // For 'overlay', we need to check if we can use globalCompositeOperation.
  // Note: 'overlay' for globalCompositeOperation might not always perfectly match Photoshop's 'overlay'.
  if (blendMode === BlendMode.OVERLAY) {
    // Attempt to use 'overlay' composite operation if supported, otherwise fallback
    if (ctx.globalCompositeOperation !== 'overlay') { // Check if it's already set or available
      ctx.globalCompositeOperation = 'overlay';
    } else {
      // Fallback or warning if 'overlay' is not behaving as expected
      console.warn("Canvas 'overlay' globalCompositeOperation might not be fully supported or may vary.");
    }
  } else { // BlendMode.NORMAL
    ctx.globalCompositeOperation = 'source-over'; // Default normal blend
  }

  // Draw the overlay image, scaled to fit the base image dimensions
  ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);

  // Reset to default for subsequent operations if any
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Return the merged image as a base64 encoded PNG
  return canvas.toDataURL('image/png').split(',')[1];
}