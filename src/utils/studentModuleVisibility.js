// Preserve original indices: quiz attempts and reading progress use them.
export function studentVisibleModuleIndices(modules) {
  const managed = modules.some(
    (module) => module.studentPublished !== undefined,
  );
  return modules.flatMap((module, index) =>
    !managed || module.studentPublished === true ? [index] : [],
  );
}

export function studentModuleNavigation(modules, requestedIndex) {
  const indices = studentVisibleModuleIndices(modules);
  const moduleIndex = indices.includes(requestedIndex)
    ? requestedIndex
    : (indices[0] ?? null);
  const position = indices.indexOf(moduleIndex);
  return {
    moduleIndex,
    moduleNumber: position + 1,
    moduleCount: indices.length,
    nextModuleIndex: position >= 0 ? (indices[position + 1] ?? null) : null,
  };
}
