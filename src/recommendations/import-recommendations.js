// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { addRecommendation } from "../server/database/database.js";

assert.equal(
  argv.length,
  3,
  "Expected 1 argument: the recommendations file path",
);
const recommendationsPath = argv[2];
assert(recommendationsPath, "Expected input file path to be supplied");

const recommendationsData = fs.readFileSync(recommendationsPath, {
  encoding: "utf8",
});
const recommendations = JSON.parse(recommendationsData);

assert(
  Array.isArray(recommendations) &&
    recommendations.every(
      (recommendation) =>
        recommendation &&
        typeof recommendation.person1Id === "number" &&
        typeof recommendation.person2Id === "number" &&
        typeof recommendation.ranking === "number" &&
        typeof recommendation.reason === "string" &&
        Array.isArray(recommendation.potential) &&
        recommendation.potential.every(
          (potential) => typeof potential === "string",
        ),
    ),
  "Input data is invalid",
);

// TODO: We might want to run this inside a transaction.
for (const recommendation of recommendations) {
  addRecommendation(recommendation);
}
