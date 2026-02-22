// @ts-check

/**
 * Geocode a location string to coordinates using Nominatim (OpenStreetMap).
 * Free, no API key required.
 *
 * @param {string} location
 * @returns {Promise<null | { locationLatitude: number, locationLongitude: number }>}
 */
export async function getGeocodedLocation(location) {
  location = location.trim();
  if (!location) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: { "User-Agent": "one-body-community-app" },
  });
  if (!response.ok) return null;

  const results = await response.json();
  if (!results.length) return null;

  return {
    locationLatitude: Number(results[0].lat),
    locationLongitude: Number(results[0].lon),
  };
}
