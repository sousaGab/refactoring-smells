import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isVersionReleased } from "../steps/wait-for-bot-release.js";

describe("isVersionReleased", () => {
  it("returns true for existing version", async () => {
    assert.ok(await isVersionReleased("1.0.0"));
  });
  describe("when the version exists", () => {
    it("returns true", async () => {
      assert.ok(await isVersionReleased("1.0.0"));
    });
  });

  describe("when the version does not exist", () => {
    it("rejects with an appropriate error message", async () => {
      await assert.rejects(() => isVersionReleased("999.0.0"), {
        message: "prettier@999.0.0 doesn't exit.",
      });
    });
  });
});
