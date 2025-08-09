// @ts-check
import assert from "node:assert/strict";
import test from "node:test";
import { dataUriToUint8Array } from "./dataUriToUint8Array.js";

const textEncoder = new TextEncoder();
const encodeUtf8 = textEncoder.encode.bind(textEncoder);

test("invalid data URIs", () => {
  const inputs = [
    "",
    "data:",
    "http:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
    " data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
    "DATA:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
  ];
  for (const input of inputs) {
    assert.equal(dataUriToUint8Array(input), null, input);
  }
});

test("empty", () => {
  const expected = new Uint8Array();
  assert.deepEqual(dataUriToUint8Array("data:,"), expected);
  assert.deepEqual(dataUriToUint8Array("data:;base64,"), expected);
});

test("no MIME type, no base64", () => {
  const actual = dataUriToUint8Array("data:,A%20brief%20note");
  const expected = encodeUtf8("A brief note");
  assert.deepEqual(actual, expected);
});

test("MIME type, no base64", () => {
  const actual = dataUriToUint8Array("data:text/plain,A%20brief%20note");
  const expected = encodeUtf8("A brief note");
  assert.deepEqual(actual, expected);
});

test("base64, no MIME type", () => {
  const actual = dataUriToUint8Array("data:;base64,SGVsbG8sIFdvcmxkIQ==");
  const expected = encodeUtf8("Hello, World!");
  assert.deepEqual(actual, expected);
});

test("MIME type + base64", () => {
  const actual = dataUriToUint8Array(
    "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
  );
  const expected = encodeUtf8("Hello, World!");
  assert.deepEqual(actual, expected);
});
