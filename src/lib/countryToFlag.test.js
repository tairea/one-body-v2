import { describe, it } from "node:test";
import assert from "node:assert";
import { getCountryFlag } from "./countryToFlag.js";

describe("getCountryFlag", () => {
  it("returns flag for City, Country format", () => {
    assert.strictEqual(getCountryFlag("Berlin, Germany"), "🇩🇪");
    assert.strictEqual(getCountryFlag("Sydney, Australia"), "🇦🇺");
    assert.strictEqual(getCountryFlag("London, United Kingdom"), "🇬🇧");
  });

  it("returns flag for country only", () => {
    assert.strictEqual(getCountryFlag("Germany"), "🇩🇪");
    assert.strictEqual(getCountryFlag("Japan"), "🇯🇵");
    assert.strictEqual(getCountryFlag("USA"), "🇺🇸");
  });

  it("returns flag for 2-letter code", () => {
    assert.strictEqual(getCountryFlag("Berlin, DE"), "🇩🇪");
    assert.strictEqual(getCountryFlag("New York, US"), "🇺🇸");
  });

  it("returns null for unrecognized location", () => {
    assert.strictEqual(getCountryFlag("Mars"), null);
    assert.strictEqual(getCountryFlag(""), null);
    assert.strictEqual(getCountryFlag("   "), null);
  });

  it("returns flag for Cook Islands", () => {
    assert.strictEqual(getCountryFlag("Mauke, Cook Islands"), "🇨🇰");
  });

  it("handles common aliases", () => {
    assert.strictEqual(getCountryFlag("UK"), "🇬🇧");
    assert.strictEqual(getCountryFlag("Ivory Coast"), "🇨🇮");
    assert.strictEqual(getCountryFlag("Czech Republic"), "🇨🇿");
  });
});
