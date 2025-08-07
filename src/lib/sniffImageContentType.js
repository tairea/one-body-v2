// @ts-check

/**
 * A subset of the [MIME Sniffing standard][0] for the images we use.
 *
 * [0]: https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
 *
 * @param {Readonly<Uint8Array>} bytes
 * @returns {null | string} The content type, such as `image/png`, or `null` if not recognized.
 */
export function sniffImageContentType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50 &&
    bytes[12] === 0x56 &&
    bytes[13] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
