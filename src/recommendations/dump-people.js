// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { supabase } from "./supabase-client.js";

assert.equal(argv.length, 3, "Expected 1 argument: the destination file path");
const outputFile = argv[2];
assert(outputFile, "Expected destination file path to be supplied");

const { data, error } = await supabase.from("people").select("*");
if (error) throw error;

// Map to the shape build.js expects
const people = (data ?? []).map((row) => ({
  id: row.id,
  name: row.name,
  locationName: row.location_name,
  locationLatitude: row.location_latitude,
  locationLongitude: row.location_longitude,
  layer1: row.layer1_list ?? [],
  layer2: row.layer2_list ?? [],
  layer3: row.layer3_list ?? [],
}));

fs.writeFileSync(outputFile, JSON.stringify(people, null, 2), { encoding: "utf8" });
console.log(`Exported ${people.length} people to ${outputFile}`);
