// A fresh Add Course entry never inherits the shared "new" draft.
// Explicit navigation state preserves edits when returning from a module editor.
export function selectCourseBuilderDraft(courseId, navigationDraft, readDraft) {
  if (navigationDraft) return navigationDraft;
  return courseId ? readDraft(courseId) : null;
}
