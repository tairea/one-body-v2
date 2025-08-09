// @ts-check

/** @import { JsonValue } from "type-fest" */

/**
 * Attempt to parse a value as JSON. If it succeeds, return the parsed value.
 * If it fails, return `null`.
 *
 * @param {unknown} value
 * @returns {JsonValue}
 */
export function maybeJsonParse(value) {
  if (typeof value !== "string") {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}
