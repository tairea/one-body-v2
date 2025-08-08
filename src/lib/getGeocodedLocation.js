// @ts-check

/**
 * Geocode a location with the OpenCage API. If no result is found, returns `null`.
 *
 * @param {string} location
 * @param {string} opencageApiKey
 * @returns {Promise<null | { locationLatitude: number, locationLongitude: number }>}
 */
export async function getGeocodedLocation(location, opencageApiKey) {
  location = location.trim();
  if (!location) return null;

  const url = new URL("https://api.opencagedata.com/geocode/v1/json");
  url.searchParams.set("key", opencageApiKey);
  url.searchParams.set("no_annotations", "1");
  url.searchParams.set("q", location);

  const response = await fetch(url);
  const { results } = await response.json();
  const [result] = results;
  if (!result) return null;

  const { geometry } = result;

  return { locationLatitude: geometry.lat, locationLongitude: geometry.lng };
}
