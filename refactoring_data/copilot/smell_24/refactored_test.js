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
    it("returns URL for patch releasing", () => {
      const result = getReleaseUrl("2.3.1", "2.3.0");
      assert.equal(
        result,
        getExpectedReleaseUrl({
          tag: "2.3.1",
          title: "2.3.1",
          body: "🔗 [Changelog](https://github.com/prettier/prettier/blob/main/CHANGELOG.md#231)",
        }),
      );
    });

    describe("minor release URL generation", () => {
      it("includes the correct tag and title", () => {
      const result = getReleaseUrl("2.4.0", "2.3.0");
      const expectedUrl = getExpectedReleaseUrl({
        tag: "2.4.0",
        title: "2.4.0",
        body: [
        "[diff](https://github.com/prettier/prettier/compare/2.3.0...2.4.0)",
        `🔗 [Release note](https://prettier.io/blog/${getDateParts().join(
          "/",
        )}/2.4.0)`,
        ].join("\n\n"),
      });
      assert.equal(result, expectedUrl);
      });

      it("includes the correct diff link in the body", () => {
      const result = getReleaseUrl("2.4.0", "2.3.0");
      const expectedBody = [
        "[diff](https://github.com/prettier/prettier/compare/2.3.0...2.4.0)",
        `🔗 [Release note](https://prettier.io/blog/${getDateParts().join(
        "/",
        )}/2.4.0)`,
      ].join("\n\n");
      const parameters = new URLSearchParams(new URL(result).search);
      assert.equal(parameters.get("body"), expectedBody);
      });

      it("includes the correct release note link in the body", () => {
      const result = getReleaseUrl("2.4.0", "2.3.0");
      const expectedReleaseNoteLink = `🔗 [Release note](https://prettier.io/blog/${getDateParts().join(
        "/",
      )}/2.4.0)`;
      const parameters = new URLSearchParams(new URL(result).search);
      assert.ok(parameters.get("body").includes(expectedReleaseNoteLink));
      });
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
