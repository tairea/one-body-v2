// @ts-check
import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";
/** @import { Person } from "../../types.d.ts" */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, "database.sqlite3");
const createSchemasPath = path.join(__dirname, "createSchemas.sql");

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
 * @returns {void}
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
      visionList,
      vehiclesList
    ) VALUES (
      @secretKey,
      @name,
      @photo,
      @email,
      @locationName,
      @locationLatitude,
      @locationLongitude,
      @valuesList,
      @visionList,
      @vehiclesList
    )
  `);
  addPersonStatement.run({
    secretKey: crypto.randomBytes(32).toString("base64"),
    name: person.name,
    photo: person.photo,
    email: person.email,
    locationName: person.locationName,
    locationLatitude: person.locationLatitude,
    locationLongitude: person.locationLongitude,
    valuesList: jsonToBlob(person.values || []),
    visionList: jsonToBlob(person.vision || []),
    vehiclesList: jsonToBlob(person.vehicles || []),
  });
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
      vision: /** @type {any} */ (blobToJson(databasePerson.visionList)),
      vehicles: /** @type {any} */ (blobToJson(databasePerson.vehiclesList)),
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
