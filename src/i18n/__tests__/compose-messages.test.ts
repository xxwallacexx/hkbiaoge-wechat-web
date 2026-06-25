import { describe, expect, it } from "vitest";

import enMessages from "../../messages/en.json";
import zhCNMessages from "../../messages/zh-CN.json";
import zhHKMessages from "../../messages/zh-HK.json";
import { composeMessages } from "../compose-messages";

type Dict = Record<string, string>;
type Messages = Record<string, Dict>;

const LOCALES: Record<string, Messages> = {
  en: enMessages as Messages,
  "zh-CN": zhCNMessages as Messages,
  "zh-HK": zhHKMessages as Messages,
};

// Mirrors the spread map in composeMessages. If the two drift apart (e.g. a
// group is added to the helper but not here, or vice versa) the key-set
// assertions below fail.
const PLAN_GROUPS: Record<string, string[]> = {
  SavingPlan: ["_planCommon", "_withdrawal"],
  CouponPlan: ["_planCommon", "_basicInfo", "_withdrawal"],
  CiPlan: ["_planCommon", "_basicInfo", "_healthArea"],
  WholelifePlan: ["_planCommon", "_basicInfo", "_healthArea", "_withdrawal"],
  UnitLinkedPlan: ["_planCommon", "_basicInfo", "_healthArea", "_withdrawal"],
  AnnuityPlan: ["_planCommon", "_basicInfo", "_withdrawal"],
};

const PLANS = Object.keys(PLAN_GROUPS);
const PASSTHROUGH = ["App", "Error", "Plans", "Brochures", "Unauthorized"];

describe("composeMessages", () => {
  for (const [locale, raw] of Object.entries(LOCALES)) {
    describe(locale, () => {
      const composed = composeMessages(raw);

      it("drops the _-prefixed groups and keeps every public namespace", () => {
        const keys = Object.keys(composed);
        expect(keys.filter((k) => k.startsWith("_"))).toEqual([]);
        for (const ns of [...PASSTHROUGH, ...PLANS]) {
          expect(keys).toContain(ns);
        }
      });

      for (const ns of PASSTHROUGH) {
        it(`passes ${ns} through untouched`, () => {
          expect(composed[ns]).toEqual(raw[ns]);
        });
      }

      for (const plan of PLANS) {
        it(`${plan} = its groups + plan-specific keys, no collisions, all non-empty`, () => {
          const groupKeys = PLAN_GROUPS[plan].flatMap((g) =>
            Object.keys(raw[g]),
          );
          const specificKeys = Object.keys(raw[plan]);

          // A plan-specific key must never shadow a shared one (silent divergence).
          expect(specificKeys.filter((k) => groupKeys.includes(k))).toEqual([]);

          // Exact resulting key set = shared group keys + plan-specific keys.
          expect(new Set(Object.keys(composed[plan]))).toEqual(
            new Set([...groupKeys, ...specificKeys]),
          );

          // Shared keys resolve to the group value; specifics to their own value.
          for (const g of PLAN_GROUPS[plan]) {
            for (const [k, v] of Object.entries(raw[g])) {
              expect(composed[plan][k]).toBe(v);
            }
          }
          for (const [k, v] of Object.entries(raw[plan])) {
            expect(composed[plan][k]).toBe(v);
          }

          // Every value is a non-empty string (catches an undefined slipping in
          // from a mistyped group reference).
          for (const v of Object.values(composed[plan])) {
            expect(typeof v).toBe("string");
            expect(v.length).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});
