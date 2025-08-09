// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as process from "node:process";
import ollama from "ollama";
import * as z from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
/** @import { Person, Recommendation } from "../types.d.ts" */

/**
 * @internal
 * @typedef {Person["vehicles"][number]} Vehicle
 */

/**
 * @internal
 * @typedef {object} Ranking
 * @property {Person} person1
 * @property {Person} person2
 * @property {number} ranking
 */

/**
 * @param {ReadonlyArray<string>} argv
 * @returns {{ people: ReadonlyArray<Person>, outputPath: string }}
 */
function readArguments(argv) {
  assert.equal(
    argv.length,
    4,
    "Expected 2 arguments: the people JSON path and the destination file path",
  );
  const peoplePath = argv[2];
  const outputPath = argv[3];
  assert(peoplePath, "Expected input file path to be supplied");
  assert(outputPath, "Expected destination file path to be supplied");

  const peopleData = fs.readFileSync(peoplePath, { encoding: "utf8" });
  const people = JSON.parse(peopleData);

  // This is very basic validation. It might be nice to do more thorough checks.
  assert(
    Array.isArray(people) &&
      people.every(
        (person) =>
          person.name &&
          Array.isArray(person.values) &&
          Array.isArray(person.visions) &&
          Array.isArray(person.vehicles),
      ),
    "People data doesn't look right",
  );

  return { people, outputPath };
}

/**
 * @template {z.Schema} T
 * @param {Readonly<{systemPrompt: string, input: string, schema?: T}>} params
 * @returns {Promise<z.input<T>>}
 */
async function askOllama({ systemPrompt, input, schema }) {
  const response = await ollama.chat({
    model: "llama3.2",
    messages: [
      { role: "system", content: systemPrompt.trim() },
      { role: "user", content: input },
    ],
    ...(schema ? { format: zodToJsonSchema(schema) } : {}),
  });
  return schema
    ? schema.parse(JSON.parse(response.message.content))
    : response.message.content;
}

/**
 * @param {Vehicle} vehicle
 * @returns {string}
 */
function formatVehicle(vehicle) {
  const { title, description } = vehicle;
  return description ? `- ${title}: ${description}` : `- ${title}`;
}

/**
 * @param {Readonly<Pick<Person, "name" | "values" | "visions" | "vehicles">>} person
 * @returns {string}
 */
function formatPerson(person) {
  return [
    "NAME:",
    person.name,
    "VALUES:",
    person.values.join(", "),
    "VISIONS:",
    person.visions.join(", "),
    "VEHICLES:",
    person.vehicles.map((v) => formatVehicle(v)).join("\n"),
  ].join("\n");
}

/**
 * @param {Person} person1
 * @param {Person} person2
 * @returns {Promise<Ranking>}
 */
async function getRanking(person1, person2) {
  const systemPrompt = `
Given two people, return a "ranking", which is the compatibility of these two people. The ranking should be one of the following: "low", "medium", or "high". Do not output any other information, just one of those values.

For example, if given the following input:

---
PERSON 1:

${formatPerson({
  name: "Alice",
  values: ["cake", "candy", "respect"],
  visions: ["The world is beautiful", "The world has lots of sweets"],
  vehicles: [{ title: "Owns a candy company" }],
})}

PERSON 2:

${formatPerson({
  name: "Bob",
  values: ["beauty", "headphones"],
  visions: ["The world sounds great", "The world looks incredible"],
  vehicles: [{ title: "Is a musician" }],
})}
---

You would output something like the following:

medium

Do NOT output any other text, as it will not be helpful.
`.trim();

  const input = `PERSON 1:

${formatPerson(person1)}

PERSON 2:

${formatPerson(person2)}`;

  const rawRanking = (await askOllama({ systemPrompt, input })).toLowerCase();

  let ranking = 0;
  if (/\blow\b/mu.test(rawRanking)) {
    ranking = 0;
  } else if (/\bmedium\b/mu.test(rawRanking)) {
    ranking = 0.5;
  } else if (/\bhigh\b/mu.test(rawRanking)) {
    ranking = 1;
  } else {
    throw new Error(`unexpected ranking ${JSON.stringify(rawRanking)}`);
  }

  return { person1, person2, ranking };
}

/**
 * @param {ReadonlyArray<Person>} people
 * @returns {Promise<Array<Ranking>>}
 */
async function getRankings(people) {
  /** @type {Ranking[]} */ const result = [];
  for (let i = 0; i < people.length; i++) {
    const person1 = people[i];
    for (let j = i + 1; j < people.length; j++) {
      console.assert(i < j);
      const person2 = people[j];
      result.push(await getRanking(person1, person2));
    }
  }
  return result;
}

/**
 * @param {ReadonlyArray<Ranking>} rankings
 * @param {number} count
 * @returns {Ranking[]}
 */
function getBestRankingsPerPerson(rankings, count) {
  /** @type {Map<number, Ranking[]>} */
  const rankingsByPerson = new Map();
  for (const ranking of rankings) {
    for (const person of [ranking.person1, ranking.person2]) {
      rankingsByPerson.set(person.id, [
        ...(rankingsByPerson.get(person.id) ?? []),
        ranking,
      ]);
    }
  }

  /** @type {Set<Ranking>} */
  const result = new Set();

  for (const personRankings of rankingsByPerson.values()) {
    personRankings
      .toSorted((a, b) => b.ranking - a.ranking)
      .slice(0, count)
      .forEach((ranking) => result.add(ranking));
  }

  return [...result];
}

const recommendationFromRankingSchema = z.object({
  reason: z.string(),
  potential: z.array(z.string()),
});

/**
 * @param {Ranking} ranking
 * @returns {Promise<Recommendation>}
 */
async function getRecommendationFromRanking({ person1, person2, ranking }) {
  const systemPrompt = `
Given two people and a previously-determined ranking, return a JSON object with:

- "reason", a reason for this ranking.
- "potential", an array of things these two people could talk about given their compatibility.
`.trim();

  const input = `PERSON 1:

${formatPerson(person1)}

PERSON 2:

${formatPerson(person2)}

RANKING: ${ranking}`;

  const { reason, potential } = await askOllama({
    systemPrompt,
    input,
    schema: recommendationFromRankingSchema,
  });

  return {
    person1Id: person1.id,
    person2Id: person2.id,
    ranking,
    reason,
    potential,
  };
}

/**
 * @param {ReadonlyArray<Ranking>} rankings
 * @returns {Promise<Array<Recommendation>>}
 */
async function getRecommendationsFromRankings(rankings) {
  /** @type {Recommendation[]} */ const result = [];
  for (const ranking of rankings) {
    result.push(await getRecommendationFromRanking(ranking));
  }
  return result;
}

async function main() {
  const { people, outputPath } = readArguments(process.argv);

  // Start by computing a ranking for each pair of people.
  // We could compute the whole recommendation at once, but it's faster to do
  // it this way.
  const allRankings = await getRankings(people);

  // Then, get the best rankings for each person to cull the list.
  const bestRankings = getBestRankingsPerPerson(allRankings, 2);

  // Now turn those rankings into full recommendations and output them.
  const recommendations = await getRecommendationsFromRankings(bestRankings);
  const output = JSON.stringify(recommendations, null, 2);
  fs.writeFileSync(outputPath, output, { encoding: "utf8" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
