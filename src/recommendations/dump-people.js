// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { readPeople } from "../server/database/database.js";

assert.equal(argv.length, 3, "Expected 1 argument: the destination file path");
const outputFile = argv[2];
assert(outputFile, "Expected destination file path to be supplied");

const output = JSON.stringify(readPeople(), null, 2);

fs.writeFileSync(outputFile, output, { encoding: "utf8" });
