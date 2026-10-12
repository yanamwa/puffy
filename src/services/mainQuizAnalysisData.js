export function mainQuizKey(attempt) {
  return String(attempt.module_index ?? attempt.moduleIndex ?? 0);
}

export function mainQuizQuestionCount(attempts) {
  return Math.max(
    0,
    ...attempts.map((attempt) => {
      const total = Number(
        attempt.total ?? attempt.total_items ?? attempt.question_count,
      );
      return Number.isInteger(total) && total > 0
        ? total
        : attempt.answers?.length || 0;
    }),
  );
}

export function mainQuizQuestions(attempts) {
  const count = mainQuizQuestionCount(attempts);
  return Array.from({ length: count }, (_, index) => {
    const answer =
      attempts.find((attempt) => attempt.answers?.[index])?.answers[index] ||
      {};
    return {
      ...answer,
      question: answer.question || answer.prompt || `Question ${index + 1}`,
      attemptIndex: index,
      cognitiveLevel: answer.cognitive_level,
      thinkingSkill: answer.thinking_skill,
      cognitiveCategory: answer.thinking_skill,
    };
  });
}
