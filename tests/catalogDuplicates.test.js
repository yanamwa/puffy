import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCatalogCode,
  findCatalogCodeMatches,
} from "../src/services/catalogDuplicates.js";

test("GNED05 matches spaced, mixed-case and full-width course codes", () => {
  for (const code of [
    "GNED05",
    "GNED 05",
    " gned\t05 ",
    "\uFF27\uFF2E\uFF25\uFF24\uFF10\uFF15",
  ])
    assert.equal(normalizeCatalogCode(code), "GNED05");
  assert.notEqual(normalizeCatalogCode("GNED 50"), "GNED05");
});
test("duplicate lookup includes archived courses and uses the latest normalized code", async () => {
  const existing = {
    catalog_id: 7,
    code: "GNED 05",
    archived_at: "2026-01-01",
  };
  const matches = await findCatalogCodeMatches(" gned05 ", async (path) => {
    const query = new URLSearchParams(path.slice(1));
    assert.equal(query.get("normalizedCode"), "GNED05");
    assert.equal(query.get("includeArchived"), "1");
    return { records: [existing, { catalog_id: 8, code: "GNED 50" }] };
  });
  assert.deepEqual(matches, [existing]);
});
test("editing excludes the current course but still detects another course", async () => {
  const records = [
    { catalog_id: 7, code: "GNED 05" },
    { catalog_id: 8, code: "gned05" },
  ];
  assert.deepEqual(
    await findCatalogCodeMatches("GNED05", async () => ({ records }), "7"),
    [records[1]],
  );
});
test("an unavailable duplicate check rejects instead of allowing a save", async () => {
  await assert.rejects(
    findCatalogCodeMatches("GNED05", async () => {
      throw new Error("Offline");
    }),
    /Offline/,
  );
  assert.deepEqual(
    await findCatalogCodeMatches(" ", () => {
      throw new Error("Should not request");
    }),
    [],
  );
});
