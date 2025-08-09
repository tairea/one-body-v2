/**
 * @param {unknown} value
 * @returns {value is string}
 */
export const string = (value) => typeof value === "string";

/**
 * @param {unknown} value
 * @returns {value is undefined}
 */
export const undefined = (value) => typeof value === "undefined";

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export const record = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * @param {unknown} value
 * @returns {value is Array<unknown>}
 */
export const array = (value) => Array.isArray(value);
