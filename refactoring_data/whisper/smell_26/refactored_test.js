import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isVersionReleased } from "../steps/wait-for-bot-release.js";

describe("isVersionReleased", () => {
  it("returns true when checking if version 1.0.0 exists in npm registry", async () => {
    // Explicitly test version existence check functionality
    const version = "1.0.0";
    const isReleased = await isVersionReleased(version);
    assert.strictEqual(isReleased, true, `Version ${version} should exist in npm registry`);
  });
  it("rejects for non-existing version", async () => {
    await assert.rejects(() => isVersionReleased("999.0.0"), {
      message: "prettier@999.0.0 doesn't exit.",
    });
  });
});
