import { describe, expect, it } from "vitest";

import {
  isBoosterAvailable,
  isExpectedInstalTooLarge,
} from "@/lib/api/saving-plans";

describe("isBoosterAvailable", () => {
  it("is false when either booster figure is missing", () => {
    expect(isBoosterAvailable(undefined, 150, false, "100")).toBe(false);
    expect(isBoosterAvailable(100, undefined, false, "100")).toBe(false);
  });

  it("is false once the booster has been applied", () => {
    expect(isBoosterAvailable(100, 150, true, "100")).toBe(false);
  });

  it("is false when the expected installment no longer matches the pre-booster value", () => {
    expect(isBoosterAvailable(100, 150, false, "120")).toBe(false);
  });

  it("is false when the booster would not raise the premium", () => {
    expect(isBoosterAvailable(100, 100, false, "100")).toBe(false);
    expect(isBoosterAvailable(100, 90, false, "100")).toBe(false);
  });

  it("is true for a fresh, raising booster that matches the current value", () => {
    expect(isBoosterAvailable(100, 150, false, "100")).toBe(true);
  });
});

describe("isExpectedInstalTooLarge", () => {
  it("rejects values above 2^32", () => {
    expect(isExpectedInstalTooLarge(String(2 ** 32 + 1))).toBe(true);
  });

  it("accepts values at or below 2^32", () => {
    expect(isExpectedInstalTooLarge(String(2 ** 32))).toBe(false);
    expect(isExpectedInstalTooLarge("5000")).toBe(false);
    // Number("") === 0, so an empty value is not "too large".
    expect(isExpectedInstalTooLarge("")).toBe(false);
  });
});
