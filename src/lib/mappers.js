// @ts-check
/** @import { Person, PersonRow, Recommendation, RecommendationRow } from "../types.d.ts" */

/**
 * Build the Supabase Storage public URL for a person's profile photo.
 * Convention: photos are stored at {user_id}/avatar (no file extension).
 * The MIME type is set via contentType at upload time.
 * @param {string} supabaseUrl
 * @param {string} userId
 * @returns {string}
 */
function photoUrl(supabaseUrl, userId) {
  return `${supabaseUrl}/storage/v1/object/public/profile-photos/${userId}/avatar`;
}

/**
 * @param {PersonRow} row
 * @param {string} supabaseUrl - from import.meta.env.VITE_SUPABASE_URL
 * @returns {Person}
 */
export function rowToPerson(row, supabaseUrl) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    photoUrl: photoUrl(supabaseUrl, row.user_id),
    locationName: row.location_name ?? undefined,
    locationLatitude: row.location_latitude ?? undefined,
    locationLongitude: row.location_longitude ?? undefined,
    values: row.values_list ?? [],
    visions: row.visions_list ?? [],
    vehicles: row.vehicles_list ?? [],
    personsGraphSnapshot: row.persons_graph_snapshot ?? undefined,
  };
}

/**
 * @param {RecommendationRow} row
 * @returns {Recommendation}
 */
export function rowToRecommendation(row) {
  return {
    person1Id: row.person1_id,
    person2Id: row.person2_id,
    ranking: row.ranking,
    reason: row.reason,
    potential: row.potential ?? [],
  };
}
