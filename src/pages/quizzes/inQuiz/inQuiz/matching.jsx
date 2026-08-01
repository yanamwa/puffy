import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../../../config.js";
import { updateDeckCardMemorized } from "../../../../utils/cardMemorization.js";
import LoadingState from "../../../../components/LoadingState.jsx";
import {
  getPracticeBackPath,
  getPracticeResultMetadata,
  getPracticeReviewPath,
  getPracticeTitle,
  getQuizItemAnswer,
  getQuizItemQuestion,
  getStoredPracticeSession,
  toNumericId,
} from "../practiceSession.js";
import styles from "./matching.module.css";

export default function MatchingType() {
  const navigate = useNavigate();
  const { lessonId, deckId } = useParams();

  const isLessonMode = Boolean(lessonId);
  const isDeckMode = Boolean(deckId);
  const practiceSession = useMemo(
    () => getStoredPracticeSession({ lessonId, deckId }),
    [lessonId, deckId]
  );

  const [lesson, setLesson] = useState(null);
  const [firstCard, setFirstCard] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [wrongPair, setWrongPair] = useState([]);
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointStartIndex, setCheckpointStartIndex] = useState(0);
  const [checkpointReviewEndIndex, setCheckpointReviewEndIndex] = useState(0);

  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);

  const cleanQuestionText = (text = "") => {
    return String(text)
      .replace(/\s*A\..*/is, "")
      .trim();
  };

  const cleanAnswerText = (text = "") => {
    const raw = String(text).trim();

    const match = raw.match(/Correct Answer:\s*(.+)$/i);
    if (match) return match[1].trim();

    return raw.replace(/^[A-D]\.\s*/i, "").trim();
  };

  const shuffleArray = (array) => {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  };

  const normalizeLessonData = (data) => {
    if (!data) return null;
    return data.lesson || data.data || data;
  };

  useEffect(() => {
    const loadMatchingData = async () => {
      try {
        if (practiceSession) {
          setLesson({
            title: getPracticeTitle(practiceSession, "Matching Quiz"),
            quiz_contents: practiceSession.items,
            cards: practiceSession.items,
          });
          return;
        }

        if (isLessonMode) {
          const res = await fetch(
            `${API_BASE}/getLessonsById.php?id=${lessonId}`,
            { credentials: "include" }
          );

          const data = normalizeLessonData(await res.json());

          setLesson({
            ...data,
            title: data?.title || "Matching Quiz",
          });

          return;
        }

        if (isDeckMode) {
          const deckRes = await fetch(
            `${API_BASE}/getDeckById.php?deckId=${deckId}`,
            { credentials: "include" }
          );

          const deckData = await deckRes.json();
          console.log("LOADED DECK DATA:", deckData);

          const cardsRes = await fetch(
            `${API_BASE}/getCardsByDeck.php?deckId=${deckId}`,
            { credentials: "include" }
          );

          const cardsData = await cardsRes.json();
          console.log("LOADED DECK CARDS:", cardsData);

          const deckInfo = deckData.success ? deckData.deck || {} : {};
          const cards = cardsData.success ? cardsData.cards || [] : [];

          setLesson({
            ...deckInfo,
            title:
              deckInfo.title ||
              deckInfo.deck_title ||
              deckData.title ||
              deckData.deck_title ||
              "Deck Matching Quiz",
            cards,
          });
        }
      } catch (err) {
        console.error("Error loading matching quiz:", err);
      }
    };

    loadMatchingData();
  }, [lessonId, deckId, isLessonMode, isDeckMode, practiceSession]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakText = (text) => {
    if (!ttsEnabled) return;

    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = voiceSpeed;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const matchingPairs = useMemo(() => {
    if (!lesson) return [];

    let rawQuiz =
      lesson.quiz_contents ||
      lesson.quiz_content ||
      lesson.quiz ||
      lesson.questions ||
      lesson.cards ||
      lesson.flashcards ||
      lesson.deck_cards ||
      lesson.items;

    if (!rawQuiz) return [];

    try {
      const parsed = typeof rawQuiz === "string" ? JSON.parse(rawQuiz) : rawQuiz;

      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item, index) => {
          const question =
            getQuizItemQuestion(item, "") ||
            item.question ||
            item.front ||
            item.term ||
            item.prompt ||
            item.title ||
            "";

          const answer =
            getQuizItemAnswer(item, "") ||
            item.answer ||
            item.back ||
            item.definition ||
            item.correct_answer ||
            item.correctAnswer ||
            item.description ||
            "";

          return {
            id: item.cardId || item.card_id || item.id || index + 1,
            question: cleanQuestionText(question),
            answer: cleanAnswerText(answer),
          };
        })
        .filter((item) => item.question && item.answer);
    } catch (error) {
      console.error("Invalid matching data:", error);
      return [];
    }
  }, [lesson]);

  const leftCards = useMemo(() => {
    return shuffleArray(
      matchingPairs.map((item) => ({
        id: item.id,
        text: item.question,
      }))
    );
  }, [matchingPairs]);

  const rightCards = useMemo(() => {
    return shuffleArray(
      matchingPairs.map((item) => ({
        id: item.id,
        text: item.answer,
      }))
    );
  }, [matchingPairs]);

  const progressCurrent =
    matchingPairs.length > 0
      ? Math.round((matchedIds.length / matchingPairs.length) * 100)
      : 0;

  const isWrongCard = (card, side) =>
    wrongPair.some((item) => item.id === card.id && item.side === side);

  const saveMatchingResult = (finalScore, completedIds = null) => {
    const completedSet = completedIds ? new Set(completedIds) : null;
    const metadata = getPracticeResultMetadata(
      practiceSession,
      isDeckMode ? "deck" : "lesson"
    );

    const answers = matchingPairs
      .filter((item) => !completedSet || completedSet.has(item.id))
      .map((item) => ({
      cardId: item.id,
      question: item.question,
      userAnswer: item.answer,
      correctAnswer: item.answer,
      explanation: item.answer,
      isCorrect: true,
    }));

    const resultPayload = {
      ...metadata,
      quizMode: "matching",
      lessonId: lessonId || null,
      deckId: toNumericId(deckId),
      score: finalScore,
      total: matchingPairs.length,
      answers,
    };

    localStorage.setItem("lessonQuizResults", JSON.stringify(resultPayload));

    if (isDeckMode) {
      localStorage.setItem(
        `deckQuizResults_${deckId}`,
        JSON.stringify(resultPayload)
      );
    }
  };

  const finishMatching = (finalMatchedIds = matchedIds, returnToDeck = false) => {
    saveMatchingResult(finalMatchedIds.length, finalMatchedIds);

    setTimeout(() => {
      navigate(
        returnToDeck && isDeckMode
          ? `/deck/${deckId}`
          : isDeckMode
          ? `/review/deck/${deckId}`
          : getPracticeReviewPath(practiceSession, { lessonId, deckId })
      );
    }, 300);
  };

  const repeatCheckpointPairs = () => {
    setMatchedIds((prev) => prev.slice(0, checkpointStartIndex));
    setFirstCard(null);
    setWrongPair([]);
    setCheckpointOpen(false);
  };

  const continueAfterCheckpoint = () => {
    setCheckpointStartIndex(checkpointReviewEndIndex);
    setFirstCard(null);
    setWrongPair([]);
    setCheckpointOpen(false);
  };

  const handleCardClick = async (card, side) => {
    if (matchedIds.includes(card.id)) return;

    if (!firstCard) {
      setFirstCard({ ...card, side });
      return;
    }

    if (firstCard.side === side) {
      setFirstCard({ ...card, side });
      return;
    }

    if (firstCard.id === card.id) {
      await updateDeckCardMemorized(isDeckMode, card.id, true, {
        question: card.question,
        answer: card.answer,
      });

      setMatchedIds((prev) => {
        const updated = [...prev, card.id];

        if (updated.length % 10 === 0 && updated.length < matchingPairs.length) {
          setCheckpointReviewEndIndex(updated.length);
          setCheckpointOpen(true);
          return updated;
        }

        if (updated.length === matchingPairs.length) {
          finishMatching(updated);
        }

        return updated;
      });

      setFirstCard(null);
    } else {
      setWrongPair([firstCard, { ...card, side }]);

      setTimeout(() => {
        setWrongPair([]);
        setFirstCard(null);
      }, 500);
    }
  };

  if (!lesson) {
    return <LoadingState />;
  }

if (matchingPairs.length === 0) {
  return (
    <div className={styles.emptyWrapper}>
      <div className={styles.emptyCard}>
        <img
          src="/images/404.png"
          alt="No matching"
          className={styles.emptyImage}
        />

        <h2 className={styles.emptyTitle}>No Matching Quiz Yet</h2>

        <p className={styles.emptyText}>
          No matching quiz questions are available for this lesson.
        </p>

        <button
          type="button"
          className={styles.emptyBtn}
          onClick={() =>
            navigate(
              isDeckMode
                ? `/review/deck/${deckId}`
                : getPracticeBackPath(practiceSession, { lessonId, deckId })
            )
          }
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
  const checkpointEndIndex = checkpointOpen
    ? checkpointReviewEndIndex
    : Math.min(matchedIds.length, matchingPairs.length);
  const checkpointIds = matchedIds.slice(checkpointStartIndex, checkpointEndIndex);
  const checkpointCards = checkpointIds
    .map((id) => matchingPairs.find((item) => item.id === id))
    .filter(Boolean);
  const checkpointProgress = matchingPairs.length
    ? (checkpointEndIndex / matchingPairs.length) * 100
    : 0;

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.settingsBtn}
        onClick={() => setSettingsOpen(true)}
      >
        <i className="bx bx-cog"></i>
        <span>settings</span>
      </button>

      {settingsOpen && (
        <div className={styles.settingsOverlay}>
          <div className={styles.settingsModal}>
            <div className={styles.settingsHeader}>
              <h2>Accessibility Settings</h2>

              <button
                type="button"
                className={styles.closeSettings}
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.settingsBody}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <div className={styles.settingIcon}>🔊</div>

                  <div className={styles.settingText}>
                    <strong>Text to Speech</strong>
                    <span>Read cards aloud</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`${styles.switchBtn} ${
                    ttsEnabled ? styles.switchOn : ""
                  }`}
                  onClick={() => {
                    setTtsEnabled((prev) => !prev);
                    window.speechSynthesis?.cancel();
                  }}
                >
                  {ttsEnabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className={styles.speedBox}>
                <div className={styles.speedHeader}>
                  <label>Voice Speed</label>
                  <span className={styles.speedValue}>
                    {voiceSpeed.toFixed(1)}x
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => {
                    setVoiceSpeed(Number(e.target.value));
                    window.speechSynthesis?.cancel();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {checkpointOpen ? (
        <div className={styles.checkpointWrapper}>
          <div className={styles.checkpointHeader}>
            <span className={styles.checkpointEyebrow}>The previous cards</span>
            <h2>Review Complete</h2>

            <div className={styles.checkpointProgressBar}>
              <div
                className={styles.checkpointProgressFill}
                style={{ width: `${checkpointProgress}%` }}
              />
            </div>

            <p className={styles.checkpointQuestionCount}>
              {checkpointEndIndex} of {matchingPairs.length} cards reviewed
            </p>
          </div>

          <div className={styles.checkpointCards}>
            {checkpointCards.map((item, index) => (
              <div
                className={styles.checkpointCard}
                key={`${item.id}-${checkpointStartIndex + index}`}
              >
                <span>Card {checkpointStartIndex + index + 1}</span>
                <p>{item.question}</p>
              </div>
            ))}
          </div>

          <div className={styles.checkpointActions}>
            <button
              type="button"
              className={styles.repeatCardsBtn}
              onClick={repeatCheckpointPairs}
            >
              Repeat Cards
            </button>

            <button
              type="button"
              className={styles.nextCardsBtn}
              onClick={continueAfterCheckpoint}
            >
              Next Cards
            </button>

            <button
              type="button"
              className={styles.doneCardsBtn}
              onClick={() => finishMatching(matchedIds, true)}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
      <div className={styles.paperBackground}>
        <header className={styles.siteHeader}>
          <h1 className={styles.courseTitle}>
            {lesson.title || "Matching Quiz"}
          </h1>


        </header>

        <main className={styles.quizAppContainer}>
          <div className={styles.matchingWrapper}>
            <table>
              <tbody>
                {leftCards.map((card) => (
                  <tr key={`left-${card.id}`}>
                    <td>
                      <div
                        className={`${styles.card} ${
                          matchedIds.includes(card.id) ? styles.matched : ""
                        } ${
                          firstCard?.id === card.id &&
                          firstCard?.side === "left"
                            ? styles.selected
                            : ""
                        } ${
                          isWrongCard(card, "left") ? styles.wrongShake : ""
                        }`}
                        onClick={() => handleCardClick(card, "left")}
                      >
                        {ttsEnabled && (
                          <button
                            type="button"
                            className={styles.cardAudioBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(card.text);
                            }}
                          >
                            <i className="bx bx-volume-full"></i>
                          </button>
                        )}

                        <span>{card.text}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table>
              <tbody>
                {rightCards.map((card) => (
                  <tr key={`right-${card.id}`}>
                    <td>
                      <div
                        className={`${styles.card} ${
                          matchedIds.includes(card.id) ? styles.matched : ""
                        } ${
                          firstCard?.id === card.id &&
                          firstCard?.side === "right"
                            ? styles.selected
                            : ""
                        } ${
                          isWrongCard(card, "right") ? styles.wrongShake : ""
                        }`}
                        onClick={() => handleCardClick(card, "right")}
                      >
                        {ttsEnabled && (
                          <button
                            type="button"
                            className={styles.cardAudioBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(card.text);
                            }}
                          >
                            <i className="bx bx-volume-full"></i>
                          </button>
                        )}

                        <span>{card.text}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
        </>
      )}
    </div>
  );
}
