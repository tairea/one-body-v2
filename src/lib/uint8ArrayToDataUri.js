// @ts-check
import { uint8ArrayToBase64 } from "uint8array-extras";

/**
 * @param {Readonly<Uint8Array>} uint8array
 * @returns {string}
 */
export const uint8ArrayToDataUri = (uint8array) =>
  "data:;base64," + uint8ArrayToBase64(uint8array);
