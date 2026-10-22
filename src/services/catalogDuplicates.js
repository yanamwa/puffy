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
      }),
  );
  return (data.records || []).filter(
    (course) =>
      !course.archived_at &&
      normalizeCatalogCode(course.code) === normalizedCode &&
      (excludeId == null || String(course.catalog_id) !== String(excludeId)),
  );
}

export async function findArchivedCatalogCodeMatches(code, request) {
  const normalizedCode = normalizeCatalogCode(code);
  if (!normalizedCode) return [];
  const data = await request("?" + new URLSearchParams({ normalizedCode, archived: "1", pageSize: "100" }));
  return (data.records || []).filter(course => course.archived_at && normalizeCatalogCode(course.code) === normalizedCode)
    .sort((a, b) => String(b.archived_at).localeCompare(String(a.archived_at)) || Number(b.catalog_id) - Number(a.catalog_id));
}
