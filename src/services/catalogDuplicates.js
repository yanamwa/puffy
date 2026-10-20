export const normalizeCatalogCode = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .toUpperCase();

export async function findCatalogCodeMatches(code, request, excludeId) {
  const normalizedCode = normalizeCatalogCode(code);
  if (!normalizedCode) return [];
  const data = await request(
    "?" +
      new URLSearchParams({
        normalizedCode,
        includeArchived: "1",
      }),
  );
  return (data.records || []).filter(
    (course) =>
      normalizeCatalogCode(course.code) === normalizedCode &&
      (excludeId == null || String(course.catalog_id) !== String(excludeId)),
  );
}
