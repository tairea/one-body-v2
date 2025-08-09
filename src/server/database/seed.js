// @ts-check
import { people } from "../hard-coded/people.js"; // TODO Consider moving this
import { addPerson } from "./database.js";

for (const person of people) {
  addPerson(person);
}

addPerson({
  name: "Foo",
  email: "foo@example.com",
  locationName: "Colombia",
  locationLatitude: 4.5709,
  locationLongitude: -74.2973,
  values: [],
  visions: [],
  vehicles: [],
});
