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

    // Fill background to avoid transparent areas when exporting to JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, side, side);

    const dx = Math.round((side - width) / 2);
    const dy = Math.round((side - height) / 2);
    ctx.drawImage(bitmap, dx, dy, width, height);

    return canvas.toDataURL("image/jpeg");
  } finally {
    bitmap.close();
  }
}
