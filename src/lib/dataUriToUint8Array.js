// @ts-check

/**
 * Convert a data URI to a `Uint8Array`, or return `null` if the string cannot be converted.
 *
 * @param {string} dataUri
 * @returns {null | Uint8Array}
 */
export function dataUriToUint8Array(dataUri) {
  if (!dataUri.startsWith("data:")) return null;

  // We don't use `split` because we only want to split on the first comma,
  // which JavaScript doesn't make easy.
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return null;

  const beforeComma = dataUri.substring(0, commaIndex);
  const afterComma = dataUri.substring(commaIndex + 1);
  const isBase64 = beforeComma.endsWith(";base64");

  if (isBase64) {
    return new Uint8Array(Buffer.from(afterComma, "base64"));
  } else {
    const decoded = decodeURIComponent(afterComma);
    return new TextEncoder().encode(decoded);
  }
}
