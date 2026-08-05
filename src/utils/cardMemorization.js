const MEMORIZED_CARDS_KEY = "deck-card-memorization";

function readMemorizedCards() {
  try {
    const saved = window.localStorage.getItem(MEMORIZED_CARDS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function saveMemorizedCards(cards) {
  try {
    window.localStorage.setItem(MEMORIZED_CARDS_KEY, JSON.stringify(cards));
  } catch {
    // Local storage is a convenience cache; failing to write should not stop a quiz.
  }
}

export async function updateDeckCardMemorized(isDeckMode, cardId, isCorrect, card = {}) {
  if (!isDeckMode || !cardId) return null;

  const memorizedCards = readMemorizedCards();
  memorizedCards[String(cardId)] = {
    ...card,
    cardId,
    isMemorized: Boolean(isCorrect),
    updatedAt: new Date().toISOString(),
  };

  saveMemorizedCards(memorizedCards);
  return memorizedCards[String(cardId)];
}

export function syncDeckCardMemorizationFromAnswers(isDeckMode, answers = []) {
  if (!isDeckMode || !Array.isArray(answers)) return null;

  answers.forEach((answer) => {
    updateDeckCardMemorized(
      true,
      answer.cardId || answer.card_id,
      Boolean(answer.isCorrect),
      {
        question: answer.question,
        answer: answer.correctAnswer || answer.answer,
      }
    );
  });

  return readMemorizedCards();
}
