// @ts-check
import test from "node:test";
import assert from "node:assert/strict";
import { maybeJsonParse } from "./maybeJsonParse.js";

test("non-strings", () => {
  assert.equal(maybeJsonParse(null), null);
  assert.equal(maybeJsonParse(123), null);
  assert.equal(maybeJsonParse({ hi: 5 }), null);
});

test("invalid JSON strings", () => {
  assert.equal(maybeJsonParse(""), null);
  assert.equal(maybeJsonParse('{"hi":'), null);
});

test("parsing valid JSON", () => {
  assert.equal(maybeJsonParse("null"), null);
  assert.equal(maybeJsonParse("123"), 123);
  assert.deepEqual(maybeJsonParse('{"hi": 5}'), { hi: 5 });
});
