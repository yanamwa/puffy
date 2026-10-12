export function isMainQuizResult(result = {}) {
  const types = [
    result.assessment_type,
    result.assessmentType,
    result.scopeType,
    result.scope?.scopeType,
    result.source,
  ];
  return types.some((type) =>
    ["main", "main_quiz", "main-quiz"].includes(
      String(type || "")
        .trim()
        .toLowerCase(),
    ),
  );
}
