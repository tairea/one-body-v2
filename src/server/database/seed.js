// @ts-check
import { addPerson, readPeople } from "./database.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { people } from "../hard-coded/people.js"; // TODO Consider moving this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hardCodedDirPath = path.join(__dirname, "..", "hard-coded");

for (const person of people) {
  const photoPath = path.join(hardCodedDirPath, person.photo);
  addPerson({
    name: person.name,
    photo: fs.readFileSync(photoPath),
    email: null,
    values: person.values,
    vision: person.vision,
    vehicles: person.vehicles,
  });
}

addPerson({
  name: "Foo",
  photo: null,
  email: "foo@example.com",
  locationName: "Colombia",
  locationLatitude: 4.5709,
  locationLongitude: -74.2973,
  values: [],
  vision: [],
  vehicles: [],
});
