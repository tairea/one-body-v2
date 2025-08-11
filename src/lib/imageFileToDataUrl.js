// @ts-check

const MAX_DIMENSION = 256;

/**
 * Convert an image file (probably one uploaded from an `<input type="file">`)
 * to a downscaled data URI.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function imageFileToDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const imgMax = Math.max(bitmap.width, bitmap.height);
    const side = Math.min(MAX_DIMENSION, imgMax);
    const scale = Math.min(1, side / imgMax);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available for some reason");

    // Improve downscaling quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Calculate source rectangle for cropping (object-fit: cover behavior)
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    
    // Calculate the crop dimensions to maintain aspect ratio
    const aspectRatio = sourceWidth / sourceHeight;
    let sourceX = 0;
    let sourceY = 0;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    
    if (aspectRatio > 1) {
      // Image is wider than tall - crop the sides
      cropHeight = sourceHeight;
      cropWidth = sourceHeight; // Make it square
      sourceX = (sourceWidth - cropWidth) / 2;
    } else if (aspectRatio < 1) {
      // Image is taller than wide - crop the top/bottom
      cropWidth = sourceWidth;
      cropHeight = sourceWidth; // Make it square
      sourceY = (sourceHeight - cropHeight) / 2;
    }
    // If aspectRatio === 1, no cropping needed

    // Draw the cropped image to fill the entire canvas
    ctx.drawImage(
      bitmap,
      sourceX, sourceY, cropWidth, cropHeight,  // Source rectangle
      0, 0, side, side                          // Destination rectangle
    );

    return canvas.toDataURL("image/jpeg");
  } finally {
    bitmap.close();
  }
}
