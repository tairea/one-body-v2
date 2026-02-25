// @ts-check

const accentColors = [
  "#ff4f2d", // Bright Red-Orange
  "#e06ef9", // Purple/Violet
  "#bbdf27", // Lime Green
  "#ffc81f", // Bright Yellow-Orange
  "#00d6c6", // Aqua Green
  "#00b3f3", // Sky Blue
];

export { accentColors };

/**
 * Returns a random accent color from the palette
 * @returns {string} A random hex color
 */
export function getAccentColor() {
  return accentColors[Math.floor(Math.random() * accentColors.length)];
}

/**
 * @param {Readonly<{ id: number }>} person
 * @param {string} baseHref
 * @returns {string}
 */
export function getPhotoUrl({ id }, baseHref) {
  return new URL(`/api/photos/${id}`, baseHref).href;
}
