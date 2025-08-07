// @ts-check
import { SERVER_BASE_URL } from "../constants.js";

const dWebColors = [
  "#ff4f2d", // Bright Red-Orange (large and medium dots)
  "#e06ef9", // Purple/Violet (medium dots)
  "#bbdf27", // Lime Green (small and medium dots)
  "#ffc81f", // Bright Yellow-Orange (medium and small dots)
  "#00d6c6", // Aqua Green (large dot)
  "#00b3f3", // Sky Blue (medium dots)
  //"#FFFFFF", // White (text and rectangle border)
  //"#000000", // Black (background)
];

export { dWebColors };

/**
 * Returns a random color from the DWeb color palette
 * @returns {string} A random hex color from the DWeb palette
 */
export function getDwebColor() {
  return dWebColors[Math.floor(Math.random() * dWebColors.length)];
}

/**
 * @param {Readonly<{ id: number }>} person
 * @returns {string}
 */
export function getPhotoUrl({ id }) {
  return new URL(`/photos/${id}`, SERVER_BASE_URL).href;
}
