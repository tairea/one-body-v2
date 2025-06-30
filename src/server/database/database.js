import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.join(__dirname, "database.sqlite3");
const createSchemasPath = path.join(__dirname, "createSchemas.sql");

const db = new Database(databasePath);

const createSchemasSql = fs.readFileSync(createSchemasPath, "utf8");
db.exec(createSchemasSql);

const jsonToBlob = (json) => Buffer.from(JSON.stringify(json));
const blobToJson = (blob) => JSON.parse(blob.toString());

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

export function readPeople() {
  const readPeopleStatement = db.prepare("SELECT * FROM people");
  return readPeopleStatement.all().map((databasePerson) => ({
    id: databasePerson.id,
    name: databasePerson.name,
    photo: databasePerson.photo,
    email: databasePerson.email,
    locationName: databasePerson.locationName,
    locationLatitude: databasePerson.locationLatitude,
    locationLongitude: databasePerson.locationLongitude,
    values: blobToJson(databasePerson.valuesList),
    vision: blobToJson(databasePerson.visionList),
    vehicle: blobToJson(databasePerson.vehiclesList),
  }));
}
