import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isVersionReleased } from "../steps/wait-for-bot-release.js";

describe("isVersionReleased", () => {
  it("returns true for existing version", async () => {
    assert.ok(await isVersionReleased("1.0.0"));
  });
  it("rejects with correct error message for non-existing version", async () => {
    await assert.rejects(() => isVersionReleased("999.0.0"), {
      message: "prettier@999.0.0 doesn't exit.",
    });
  });

  it("rejects when attempting to check non-existing version number", async () => {
    await assert.rejects(() => isVersionReleased("999.0.0"));
  });
});
