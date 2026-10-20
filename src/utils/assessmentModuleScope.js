export function assessmentModules(course) {
  const value =
    course?.contentModules ??
    course?.content_modules ??
    course?.learningModules ??
    course?.learning_modules ??
    [];
  try {
    const modules = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(modules) ? modules : [];
  } catch {
    return [];
  }
}

export function filterModuleAttempts(
  attempts,
  moduleIndex = "all",
  modules = [],
) {
  if (moduleIndex === "all") return attempts;
  const selected = Number(moduleIndex);
  const module = modules[selected];
  if (!module || !Number.isInteger(selected)) return [];
  return attempts.filter((attempt) => {
    const index = attempt.module_index ?? attempt.moduleIndex;
    if (index !== null && index !== undefined && index !== "")
      return Number(index) === selected;
    // Older lesson-linked attempts can be scoped only by a known lesson ID.
    const lesson = attempt.lesson_id ?? attempt.lessonId;
    const moduleLesson = module.lesson_id ?? module.lessonId;
    return (
      lesson != null &&
      moduleLesson != null &&
      String(lesson) === String(moduleLesson)
    );
  });
}
