import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { URLSearchParams } from "node:url";
import { getReleaseUrl } from "../steps/show-instructions-after-npm-publish.js";

const RELEASE_URL_BASE = "https://github.com/prettier/prettier/releases/new?";
const getExpectedReleaseUrl = (parameters) => {
  parameters = new URLSearchParams(parameters);
  return `${RELEASE_URL_BASE}${parameters}`;
};

const getDateParts = () => [
  new Date().getFullYear(),
  String(new Date().getMonth() + 1).padStart(2, "0"),
  String(new Date().getDate()).padStart(2, "0"),
];

describe("publish-to-npm", () => {
  describe("getReleaseUrl", () => {
    // Test for URL generation with correct tag
    it("returns URL with correct tag for patch release", () => {
      const result = getReleaseUrl("2.3.1", "2.3.0");
      assert.equal(
        new URLSearchParams(new URL(result).search).get("tag"),
        "2.3.1"
      );
    });

    // Test for URL generation with correct title 
    it("returns URL with correct title for patch release", () => {
      const result = getReleaseUrl("2.3.1", "2.3.0");
      assert.equal(
        new URLSearchParams(new URL(result).search).get("title"),
        "2.3.1"
      );
    });

    // Test for URL generation with correct changelog body
    it("returns URL with correct changelog link in body for patch release", () => {
      const result = getReleaseUrl("2.3.1", "2.3.0");
      assert.equal(
        new URLSearchParams(new URL(result).search).get("body"),
        "🔗 [Changelog](https://github.com/prettier/prettier/blob/main/CHANGELOG.md#231)"
      );
    });

    it("returns URL for minor releasing", () => {
      const result = getReleaseUrl("2.4.0", "2.3.0");
      assert.equal(
        result,
        getExpectedReleaseUrl({
          tag: "2.4.0",
          title: "2.4.0",
          body: [
            "[diff](https://github.com/prettier/prettier/compare/2.3.0...2.4.0)",
            `🔗 [Release note](https://prettier.io/blog/${getDateParts().join(
              "/",
            )}/2.4.0)`,
          ].join("\n\n"),
        }),
      );
    });

    it("returns URL for major releasing", () => {
      const result = getReleaseUrl("2.3.0", "2.2.0");
      assert.equal(
        result,
        getExpectedReleaseUrl({
          tag: "2.3.0",
          title: "2.3.0",
          body: [
            "[diff](https://github.com/prettier/prettier/compare/2.2.0...2.3.0)",
            `🔗 [Release note](https://prettier.io/blog/${getDateParts().join(
              "/",
            )}/2.3.0)`,
          ].join("\n\n"),
        }),
      );
    });
  });
});
