const numericId = (value) =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

// Keep the server ID across retries, even when the upload or generation fails.
export async function ensureGenerationCourse(course, routeId, holder, save) {
  const existingId = numericId(routeId)
    ? routeId
    : numericId(course.id)
      ? course.id
      : course.course_id;
  if (numericId(existingId)) return { ...course, id: Number(existingId) };
  if (!holder.current) {
    const { id, course_id, ...draft } = course;
    const payload = {
      ...draft,
      title: String(course.title || "").trim() || "Untitled course",
      status: "draft",
      visibility: "private",
    };
    holder.current = {
      pending: save(payload, { fallback: false })
        .then((saved) => {
          const savedId = saved?.id ?? saved?.course_id;
          if (!numericId(savedId))
            throw new Error(
              "Could not create the course draft on the server. Please try again.",
            );
          const metadata = {
            id: Number(savedId),
            code:
              saved.code ||
              saved.courseCode ||
              saved.course_code ||
              course.code,
            title: payload.title,
            status: "draft",
            visibility: "private",
          };
          holder.current = { metadata };
          return metadata;
        })
        .catch((error) => {
          holder.current = null;
          throw error;
        }),
    };
  }
  const metadata = holder.current.metadata || (await holder.current.pending);
  return {
    ...course,
    ...metadata,
    title: String(course.title || "").trim() || metadata.title,
    code: course.code || metadata.code,
    contentModules: course.contentModules,
  };
}
