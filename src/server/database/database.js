// @ts-check
import Database from "better-sqlite3";
import assert from "node:assert/strict";
import timingSafeEqual from "string-timing-safe-equal";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
/** @import { Person, Recommendation } from "../../types.d.ts" */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const createSchemasPath = path.join(__dirname, "createSchemas.sql");

const databasePath =
  process.env.DATABASE_PATH || path.join(__dirname, "database.sqlite3");

const db = new Database(databasePath);

const createSchemasSql = fs.readFileSync(createSchemasPath, "utf8");
db.exec(createSchemasSql);

/**
 * @param {unknown} json
 * @returns {Uint8Array}
 */
const jsonToBlob = (json) => Buffer.from(JSON.stringify(json));

/**
 * @param {Readonly<Buffer>} blob
 * @returns {unknown}
 */
const blobToJson = (blob) => JSON.parse(blob.toString());

/**
 * @param {Omit<Person, "id" | "hasPhoto"> & { photo?: Uint8Array }} person
 * @returns {{ id: number, secretKey: string }}
 */
export function addPerson(person) {
  const addPersonStatement = db.prepare(`
    INSERT INTO people (
      secretKey,
      name,
      photo,
      email,
      locationName,
      locationLatitude,
      locationLongitude,
      valuesList,
      visionsList,
      vehiclesList,
      personsGraphSnapshot
    ) VALUES (
      @secretKey,
      @name,
      @photo,
      @email,
      @locationName,
      @locationLatitude,
      @locationLongitude,
      @valuesList,
      @visionsList,
      @vehiclesList,
      @personsGraphSnapshot
    )
    RETURNING id, secretKey
  `);
  const result = addPersonStatement.get({
    secretKey: crypto.randomBytes(32).toString("base64"),
    name: person.name,
    photo: person.photo,
    email: person.email,
    locationName: person.locationName,
    locationLatitude: person.locationLatitude,
    locationLongitude: person.locationLongitude,
    valuesList: jsonToBlob(person.values || []),
    visionsList: jsonToBlob(person.visions || []),
    vehiclesList: jsonToBlob(person.vehicles || []),
    personsGraphSnapshot: person.personsGraphSnapshot ? jsonToBlob(person.personsGraphSnapshot) : null,
  });
  assert(
    result &&
      typeof result === "object" &&
      "id" in result &&
      typeof result.id === "number" &&
      "secretKey" in result &&
      typeof result.secretKey === "string",
  );
  const { id, secretKey } = result;
  return { id, secretKey };
}

/**
 * @param {Omit<Person, "hasPhoto"> & { photo?: Uint8Array }} person
 * @param {string} secretKey
 * @returns {null | { id: number, secretKey: string }}
 */
export function updatePerson(person, secretKey) {
  const performUpdate = db.transaction(
    /** @returns {null | { id: number, secretKey: string }} */ () => {
      const row = db
        .prepare("SELECT secretKey FROM people WHERE id = ?")
        .get(person.id);
      if (!row) return null;

      assert(
        typeof row === "object" &&
          row !== null &&
          "secretKey" in row &&
          typeof row.secretKey === "string",
      );

      if (!timingSafeEqual(row.secretKey, secretKey)) {
        return null;
      }

      const updatePersonStatement = db.prepare(`
        UPDATE people SET
          name = @name,
          photo = @photo,
          email = @email,
          locationName = @locationName,
          locationLatitude = @locationLatitude,
          locationLongitude = @locationLongitude,
          valuesList = @valuesList,
          visionsList = @visionsList,
          vehiclesList = @vehiclesList,
          personsGraphSnapshot = @personsGraphSnapshot
          WHERE id = @id
      `);

      updatePersonStatement.run({
        id: person.id,
        name: person.name,
        photo: person.photo,
        email: person.email,
        locationName: person.locationName,
        locationLatitude: person.locationLatitude,
        locationLongitude: person.locationLongitude,
        valuesList: jsonToBlob(person.values || []),
        visionsList: jsonToBlob(person.visions || []),
        vehiclesList: jsonToBlob(person.vehicles || []),
        personsGraphSnapshot: person.personsGraphSnapshot ? jsonToBlob(person.personsGraphSnapshot) : null,
      });

      return { id: person.id, secretKey: row.secretKey };
    },
  );
  return performUpdate();
}

/**
 * @returns {Person[]}
 */
export function readPeople() {
  const readPeopleStatement = db.prepare("SELECT * FROM people");
  return readPeopleStatement.all().map(
    // TODO: It'd be nice to have stronger type checking here.
    /** @param {any} databasePerson */ (databasePerson) => ({
      id: databasePerson.id,
      name: databasePerson.name,
      email: databasePerson.email || undefined,
      hasPhoto: Boolean(databasePerson.photo),
      locationName: databasePerson.locationName || undefined,
      locationLatitude: databasePerson.locationLatitude ?? undefined,
      locationLongitude: databasePerson.locationLongitude ?? undefined,
      values: /** @type {any} */ (blobToJson(databasePerson.valuesList)),
      visions: /** @type {any} */ (blobToJson(databasePerson.visionsList)),
      vehicles: /** @type {any} */ (blobToJson(databasePerson.vehiclesList)),
      personsGraphSnapshot: databasePerson.personsGraphSnapshot ? /** @type {any} */ (blobToJson(databasePerson.personsGraphSnapshot)) : undefined,
    }),
  );
}

/**
 * @param {number} personId
 * @returns {null | Uint8Array}
 */
export function readPhotoBytes(personId) {
  if (!Number.isSafeInteger(personId)) {
    return null;
  }
  const result = db
    .prepare("SELECT photo FROM people WHERE id = ?")
    .pluck()
    .get(personId);
  return result instanceof Uint8Array ? result : null;
}

/**
 * @param {Readonly<Recommendation>} recommendation
 * @returns {void}
 */
export function addRecommendation(recommendation) {
  const addRecommendationStatement = db.prepare(`
   INSERT INTO recommendations (
     person1Id,
     person2Id,
     ranking,
     reason,
     potential
   ) VALUES (
     @person1Id,
     @person2Id,
     @ranking,
     @reason,
     @potential
   )
  `);
  addRecommendationStatement.run({
    person1Id: recommendation.person1Id,
    person2Id: recommendation.person2Id,
    ranking: recommendation.ranking,
    reason: recommendation.reason,
    potential: jsonToBlob(recommendation.potential),
  });
}

/**
 * @returns {Recommendation[]}
 */
export function readRecommendations() {
  const readRecommendationsStatement = db.prepare(
    "SELECT * FROM recommendations",
  );
  return readRecommendationsStatement.all().map(
    // TODO: It'd be nice to have stronger type checking here.
    /** @param {any} databaseRecommendation */ (databaseRecommendation) => ({
      person1Id: databaseRecommendation.person1Id,
      person2Id: databaseRecommendation.person2Id,
      ranking: databaseRecommendation.ranking,
      reason: databaseRecommendation.reason,
      potential: /** @type {any} */ (
        blobToJson(databaseRecommendation.potential)
      ),
    }),
  );
}
