// @ts-check
import test from "node:test";
import assert from "node:assert/strict";
import { rowToPerson, rowToRecommendation } from "./mappers.js";

const SUPABASE_URL = "https://test.supabase.co";

const sampleRow = {
  id: "uuid-123",
  user_id: "user-uuid-456",
  name: "Alice",
  location_name: "Berlin, Germany",
  location_latitude: 52.52,
  location_longitude: 13.4,
  values_list: ["justice", "creativity"],
  visions_list: ["a fairer world"],
  vehicles_list: [{ title: "Open Source Project", description: "A tool for good" }],
  persons_graph_snapshot: null,
  created_at: "2026-02-19T00:00:00Z",
};

test("rowToPerson maps all fields correctly", () => {
  const person = rowToPerson(sampleRow, SUPABASE_URL);
  assert.equal(person.id, "uuid-123");
  assert.equal(person.userId, "user-uuid-456");
  assert.equal(person.name, "Alice");
  assert.equal(
    person.photoUrl,
    "https://test.supabase.co/storage/v1/object/public/profile-photos/user-uuid-456/avatar"
  );
  assert.equal(person.locationName, "Berlin, Germany");
  assert.equal(person.locationLatitude, 52.52);
  assert.equal(person.locationLongitude, 13.4);
  assert.deepEqual(person.values, ["justice", "creativity"]);
  assert.deepEqual(person.visions, ["a fairer world"]);
  assert.deepEqual(person.vehicles, [
    { title: "Open Source Project", description: "A tool for good" },
  ]);
  assert.equal(person.personsGraphSnapshot, undefined);
});

test("rowToPerson handles null optional fields", () => {
  const row = {
    ...sampleRow,
    location_name: null,
    location_latitude: null,
    location_longitude: null,
    values_list: [],
    visions_list: [],
    vehicles_list: [],
    persons_graph_snapshot: null,
  };
  const person = rowToPerson(row, SUPABASE_URL);
  assert.equal(person.locationName, undefined);
  assert.equal(person.locationLatitude, undefined);
  assert.equal(person.locationLongitude, undefined);
  assert.deepEqual(person.values, []);
});

test("rowToRecommendation maps all fields correctly", () => {
  const row = {
    person1_id: "uuid-a",
    person2_id: "uuid-b",
    ranking: 0.95,
    reason: "Complementary skills",
    potential: ["collaboration", "co-authoring"],
  };
  const rec = rowToRecommendation(row);
  assert.equal(rec.person1Id, "uuid-a");
  assert.equal(rec.person2Id, "uuid-b");
  assert.equal(rec.ranking, 0.95);
  assert.equal(rec.reason, "Complementary skills");
  assert.deepEqual(rec.potential, ["collaboration", "co-authoring"]);
});

test("rowToRecommendation handles null potential", () => {
  const row = {
    person1_id: "uuid-a",
    person2_id: "uuid-b",
    ranking: 0.5,
    reason: "Good match",
    potential: null,
  };
  const rec = rowToRecommendation(/** @type {any} */ (row));
  assert.deepEqual(rec.potential, []);
});
