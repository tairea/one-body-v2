// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { supabase } from "./supabase-client.js";

assert.equal(argv.length, 3, "Expected 1 argument: the recommendations file path");
const recommendationsPath = argv[2];
assert(recommendationsPath, "Expected input file path to be supplied");

const data = fs.readFileSync(recommendationsPath, { encoding: "utf8" });
const recommendations = JSON.parse(data);

assert(
  Array.isArray(recommendations) &&
    recommendations.every(
      (r) =>
        r &&
        typeof r.person1Id === "string" &&
        typeof r.person2Id === "string" &&
        typeof r.ranking === "number" &&
        typeof r.reason === "string" &&
        Array.isArray(r.potential)
    ),
  "Input data is invalid — person1Id and person2Id must be UUID strings"
);

const rows = recommendations.map((r) => ({
  person1_id: r.person1Id,
  person2_id: r.person2Id,
  ranking: r.ranking,
  reason: r.reason,
  potential: r.potential,
}));

const { error } = await supabase.from("recommendations").upsert(rows);
if (error) throw error;

console.log(`Imported ${rows.length} recommendations.`);
