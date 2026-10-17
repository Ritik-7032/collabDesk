import { test, describe } from "node:test";
import assert from "node:assert";
import { LABEL_COLORS, colorFor } from "./labelColors.js";

describe("Frontend Label Colors & Theme Utilities", () => {
  test("colorFor returns expected color object for known key", () => {
    const teal = colorFor("teal");
    assert.strictEqual(teal.key, "teal");
    assert.ok(teal.badge.includes("cyan"));
  });

  test("colorFor returns amber fallback for unknown or undefined key", () => {
    const fallback = colorFor("non_existent_key");
    assert.strictEqual(fallback.key, "amber");

    const fallbackNull = colorFor(null);
    assert.strictEqual(fallbackNull.key, "amber");
  });

  test("all LABEL_COLORS have required badge, dot, and key attributes", () => {
    for (const c of LABEL_COLORS) {
      assert.ok(c.key);
      assert.ok(c.badge);
      assert.ok(c.dot);
    }
  });
});
