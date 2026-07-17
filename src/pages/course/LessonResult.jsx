import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../config.js";
import { syncDeckCardMemorizationFromAnswers } from "../../utils/cardMemorization.js";
import styles from "./lessonresult.module.css";
import QuizModesModal from "../../components/QuizModesModal";
import { fetchCourseContent } from "./courseContent.js";

function Sparkles(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

function Zap(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
    </svg>
  );
}

const isAnswerCorrect = (item) => {
  if (typeof item.isCorrect === "boolean") return item.isCorrect;

  const userAnswer = item.userAnswer || item.selectedAnswer || "";
  const correctAnswer = item.correctAnswer || item.answer || "";

  return (
    String(userAnswer).trim().toLowerCase() ===
    String(correctAnswer).trim().toLowerCase()
  );
};

const getUnderstanding = (confidence) => {
  if (confidence >= 80) return "Good Understanding";
  if (confidence >= 60) return "Developing Understanding";
  return "Needs More Practice";
};

const getQuizTypeLabel = (quizMode) => {
  const labels = {
    flashcard: "Flashcards",
    multiple: "Multiple Choice",
    qna: "Question and Answer",
    matching: "Matching",
    timed: "Timed Quiz",
    lesson: "Lesson Quick Check",
  };

  return labels[quizMode] || "Quiz";
};

const getQuizTypeIcon = (quizMode) => {
  const icons = {
    flashcard: "/images/flashcard.png",
    multiple: "/images/multiplechoice.png",
    qna: "/images/qna.png",
    matching: "/images/matching.png",
    timed: "/images/timedquiz.png",
    lesson: "/images/qna.png",
  };

  return icons[quizMode] || "/images/qna.png";
};

const getAdaptiveRecommendation = (
  topic,
  confidence,
  quizMode,
  missedConcepts = []
) => {
  const focusText =
    missedConcepts.length > 0
      ? ` Focus on: ${missedConcepts.slice(0, 3).join("; ")}.`
      : "";

  if (confidence < 60) {
    const practiceActions = {
      flashcard: "review the difficult cards",
      multiple: "review the choices you missed",
      qna: "practice recalling the answers without hints",
      matching: "review the related terms and definitions",
      timed: "review the concepts before another timed attempt",
      lesson: "review the lesson concepts",
    };

    const action = practiceActions[quizMode] || "review the concepts";
    return `Review ${topic}, ${action}, and answer more practice questions.${focusText}`;
  }

  if (confidence < 80) {
    return `Review your mistakes in ${topic} and practice again using ${getQuizTypeLabel(
      quizMode
    )}.${focusText}`;
  }

  return `Continue practicing with ${getQuizTypeLabel(
    quizMode
  )} to improve mastery.`;
};

const getFocusedConcept = (answer) => {
  const explicitConcept = String(
    answer.concept ||
      answer.subtopic ||
      answer.category ||
      answer.subject ||
      answer.topic ||
      ""
  ).trim();

  if (explicitConcept) return explicitConcept;

  const question = String(answer.question || "")
    .replace(/\s+/g, " ")
    .trim();

  const questionLower = question.toLowerCase();

  if (
    questionLower.includes("national heroes") &&
    questionLower.includes("criteria")
  ) {
    return "Criteria for identifying national heroes";
  }

  if (
    questionLower.includes("aguinaldo") &&
    (questionLower.includes("decree") ||
      questionLower.includes("proclamation"))
  ) {
    return "Significance of Aguinaldo's decree";
  }

  if (
    questionLower.includes("national symbols") &&
    (questionLower.includes("law") ||
      questionLower.includes("enacted") ||
      questionLower.includes("official"))
  ) {
    return "Laws that officially designate national symbols";
  }

  if (
    questionLower.includes("national heroes committee") &&
    (questionLower.includes("role") ||
      questionLower.includes("function") ||
      questionLower.includes("purpose"))
  ) {
    return "Role of the National Heroes Committee";
  }

  if (
    questionLower.includes("executive order") ||
    questionLower.includes("republic act")
  ) {
    return "Historical context of executive orders and republic acts";
  }

  if (questionLower.includes("national symbols")) {
    return "Official national symbols of the Philippines";
  }

  if (questionLower.includes("national heroes")) {
    return "Historical context of national heroes";
  }

  const cleanedQuestion = question
    .replace(/^according to (?:the )?lesson,\s*/i, "")
    .replace(/^what (?:is|are|was|were|did|does)\s+/i, "")
    .replace(/^which (?:of the following )?/i, "")
    .replace(/^who\s+/i, "")
    .replace(/\?$/, "")
    .trim();

  if (!cleanedQuestion) return "Core lesson concept";
  return cleanedQuestion.length > 70
    ? `${cleanedQuestion.slice(0, 67)}...`
    : cleanedQuestion;
};

const getStrengthStatement = (answer) => {
  const concept = getFocusedConcept(answer);

  if (/significance|importance|historical context/i.test(concept)) {
    return `Understood the ${concept.charAt(0).toLowerCase()}${concept.slice(1)}`;
  }

  return `Correctly identified the ${concept
    .charAt(0)
    .toLowerCase()}${concept.slice(1)}`;
};

const getAdaptivePlan = (topic, confidence, attempts) => {
  const attemptContext =
    attempts > 1 ? ` Based on your ${attempts} recorded attempts,` : "";

  if (confidence < 50) {
    return {
      difficulty: "Foundation",
      recommendation: `Based on your ${confidence}% confidence score, PuffyBrain will prioritize foundational questions on ${topic} before progressing to more advanced concepts.${attemptContext} repeated weak areas will receive extra practice.`,
      nextGoal: "Reach 50% confidence to achieve the Developing Level.",
    };
  }

  if (confidence < 80) {
    return {
      difficulty: "Intermediate",
      recommendation: `Based on your ${confidence}% confidence score, PuffyBrain will provide intermediate questions on ${topic} while revisiting concepts you missed.${attemptContext} future practice will balance review and new challenges.`,
      nextGoal: "Reach 80% confidence to achieve Good Understanding.",
    };
  }

  return {
    difficulty: "Advanced",
    recommendation:
      confidence === 100
        ? `You achieved full confidence in ${topic}. PuffyBrain will preserve this mastery with occasional advanced review questions.`
        : `Based on your ${confidence}% confidence score, PuffyBrain will introduce advanced questions on ${topic} to strengthen mastery and application.${attemptContext} future practice will focus on maintaining consistency.`,
    nextGoal:
      confidence === 100
        ? "Mastery achieved. Maintain 100% confidence on your next attempt."
        : "Reach 100% confidence to achieve full mastery.",
  };
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("puffy-user") || "null");
    return user?.userId || user?.id || user?.user_id || null;
  } catch {
    return null;
  }
};

export default function LessonResult() {
  const navigate = useNavigate();
  const { lessonId, deckId } = useParams();

  const [results, setResults] = useState({
    score: 0,
    total: 0,
    answers: [],
  });

  const [attempts, setAttempts] = useState(0);
  const [source, setSource] = useState(deckId ? "deck" : "lesson");
  const [resultDeckId, setResultDeckId] = useState(deckId || null);

  const [quizMode, setQuizMode] = useState("");
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [showScrollUp, setShowScrollUp] = useState(false);

  useEffect(() => {
    const updateScrollButton = () => {
      const pageIsLong =
        document.documentElement.scrollHeight > window.innerHeight + 120;

      setShowScrollUp(pageIsLong && window.scrollY > 360);
    };

    updateScrollButton();
    window.addEventListener("scroll", updateScrollButton, { passive: true });
    window.addEventListener("resize", updateScrollButton);

    return () => {
      window.removeEventListener("scroll", updateScrollButton);
      window.removeEventListener("resize", updateScrollButton);
    };
  }, []);

  const fetchAttempts = async (savedResults) => {
    try {
      const query = new URLSearchParams({
        source: savedResults.source || (deckId ? "deck" : "lesson"),
        lessonId: savedResults.lessonId || savedResults.lesson_id || lessonId || "",
        deckId: savedResults.deckId || savedResults.deck_id || deckId || "",
        quizMode: savedResults.quizMode || savedResults.mode || "",
      });

      const res = await fetch(
        `${API_BASE}/getQuizAttempts.php?${query.toString()}`,
        { credentials: "include" }
      );

      const data = await res.json();

      setAttempts(data.success ? data.attempts || 0 : 0);
    } catch (error) {
      console.error("Fetch attempts error:", error);
      setAttempts(0);
    }
  };

  useEffect(() => {
    let ignore = false;

    const parseStorage = (key) => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    };

    const resultKeys = [
      `lessonQuizResults_${lessonId}`,
      "lessonQuizResults",
      `lessonQuizResult_${lessonId}`,
      `quizResults_${lessonId}`,
      `deckQuizResults_${deckId}`,
      "quizResults",
    ];
    const storedResult = resultKeys
      .map((key) => ({ key, data: parseStorage(key) }))
      .find(({ data }) => data);
    const savedResults = storedResult?.data;

    if (savedResults) {
      const savedAnswers = Array.isArray(savedResults.answers)
        ? savedResults.answers
        : [];
      const detectedSource = savedResults.source || (deckId ? "deck" : "lesson");
      const detectedQuizMode =
        savedResults.quizMode || savedResults.mode || "quiz";
      const detectedLessonId =
        savedResults.lessonId ||
        savedResults.lesson_id ||
        lessonId ||
        null;
      const detectedDeckId =
        savedResults.deckId ||
        savedResults.deck_id ||
        deckId ||
        null;

      setResults({
        score: savedResults.score || 0,
        total: savedResults.total || 0,
        answers: savedAnswers,
      });

      setSource(detectedSource);
      setResultDeckId(savedResults.deckId || savedResults.deck_id || deckId || null);
      setQuizMode(detectedQuizMode);
      setIsTimedOut(Boolean(savedResults.isTimedOut || savedResults.timedOut));

      const persistQuizAttempt = async () => {
        if (savedResults.savedAttemptId || savedResults.attemptId) return;

        try {
          const attemptTotal = Number(savedResults.total || savedAnswers.length || 0);

          if (attemptTotal <= 0) return;

          const response = await fetch(`${API_BASE}/saveQuizAttempt.php`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: getStoredUserId(),
              source: detectedSource,
              lesson_id: detectedLessonId,
              deck_id: detectedDeckId,
              course_id: savedResults.courseId || savedResults.course_id || null,
              quiz_mode: detectedQuizMode,
              score: Number(savedResults.score || 0),
              total: attemptTotal,
              time_spent: Number(
                savedResults.timeSpent || savedResults.time_spent || 0
              ),
            }),
          });
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to save quiz attempt.");
          }

          if (data.attemptId && storedResult?.key) {
            localStorage.setItem(
              storedResult.key,
              JSON.stringify({
                ...savedResults,
                savedAttemptId: data.attemptId,
              })
            );
          }
        } catch (error) {
          console.error("Save quiz attempt error:", error);
        }
      };

      persistQuizAttempt().finally(() => fetchAttempts(savedResults));
      syncDeckCardMemorizationFromAnswers(
        detectedSource === "deck",
        savedAnswers
      );

      if (savedAnswers.length > 0) {
        setIsFeedbackLoading(true);
        setAiFeedback(null);

        const generateFeedback = async () => {
          try {
            let resolvedTitle = String(
              savedResults.contentTitle ||
                savedResults.lessonTitle ||
                savedResults.deckTitle ||
                savedResults.title ||
                ""
            ).trim();

            if (!resolvedTitle && detectedSource === "deck" && detectedDeckId) {
              const titleResponse = await fetch(
                `${API_BASE}/getDeckById.php?deckId=${detectedDeckId}`,
                { credentials: "include" }
              );
              const titleData = await titleResponse.json();
              resolvedTitle = String(
                titleData?.deck?.title ||
                  titleData?.deck?.deck_title ||
                  titleData?.deck?.name ||
                  titleData?.title ||
                  ""
              ).trim();
            }

            if (
              !resolvedTitle &&
              detectedSource === "lesson" &&
              detectedLessonId
            ) {
              const titleData = await fetchCourseContent(detectedLessonId);
              resolvedTitle = String(
                titleData?.title || titleData?.courseName || titleData?.course_name || ""
              ).trim();
            }

            if (!resolvedTitle) {
              resolvedTitle =
                detectedSource === "deck" ? "This deck" : "This lesson";
            }

            const titledAnswers = savedAnswers.map((answer) => {
              const savedTopic = String(answer.topic || "").trim();
              const isGenericTopic =
                !savedTopic ||
                savedTopic.toLowerCase() === resolvedTitle.toLowerCase() ||
                ["this lesson", "this deck", "general", "quiz"].includes(
                  savedTopic.toLowerCase()
                );

              return {
                ...answer,
                topic: isGenericTopic ? "" : savedTopic,
                lessonTitle:
                  detectedSource === "lesson" ? resolvedTitle : undefined,
                deckTitle:
                  detectedSource === "deck" ? resolvedTitle : undefined,
              };
            });

            if (!ignore) {
              setContentTitle(resolvedTitle);
              setResults({
                score: savedResults.score || 0,
                total: savedResults.total || 0,
                answers: titledAnswers,
              });
            }

            const response = await fetch(
              `${API_BASE}/generateAdaptiveFeedback.php`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  user_id: getStoredUserId(),
                  source: detectedSource,
                  contentTitle: resolvedTitle,
                  lessonId: detectedLessonId,
                  deckId: detectedDeckId,
                  quizMode: detectedQuizMode,
                  answers: titledAnswers,
                }),
              }
            );

            const responseText = await response.text();
            let data;

            try {
              data = JSON.parse(responseText);
            } catch {
              throw new Error(
                `Adaptive feedback returned invalid JSON (${response.status}): ${responseText.slice(
                  0,
                  200
                )}`
              );
            }

            if (!response.ok || !data.success) {
              throw new Error(
                data.message || "Unable to generate adaptive feedback."
              );
            }

            if (!ignore && Array.isArray(data.feedback)) {
              setAiFeedback(
                data.feedback
                  .map((feedback) => ({
                    topic: String(feedback.topic || "").trim(),
                    quizType: feedback.quizType || detectedQuizMode,
                    understanding:
                      feedback.understanding ||
                      getUnderstanding(Number(feedback.confidence) || 0),
                    confidence: Number(feedback.confidence) || 0,
                    questionIndexes: Array.isArray(feedback.questionIndexes)
                      ? feedback.questionIndexes
                      : Array.isArray(feedback.question_indexes)
                        ? feedback.question_indexes
                        : [],
                    recommendation: String(
                      feedback.recommendation || ""
                    ).trim(),
                    strengths: Array.isArray(feedback.strengths)
                      ? feedback.strengths
                      : [],
                    areasForImprovement: Array.isArray(
                      feedback.areasForImprovement
                    )
                      ? feedback.areasForImprovement
                      : [],
                    suggestedReviewTopics: Array.isArray(
                      feedback.suggestedReviewTopics
                    )
                      ? feedback.suggestedReviewTopics
                      : [],
                    adaptiveRecommendation: String(
                      feedback.adaptiveRecommendation || ""
                    ).trim(),
                    nextGoal: String(feedback.nextGoal || "").trim(),
                  }))
                  .filter(
                    (feedback) =>
                      feedback.topic && feedback.recommendation
                  )
              );
            }
          } catch (error) {
            if (!ignore) {
              console.error("AI adaptive feedback error:", error);
              setAiFeedback(null);
            }
          } finally {
            if (!ignore) {
              setIsFeedbackLoading(false);
            }
          }
        };

        generateFeedback();
      }
    }

    return () => {
      ignore = true;
    };
  }, [lessonId, deckId]);

  useEffect(() => {
    const blockKeys = (e) => {
      const key = e.key.toLowerCase();

      if (
        (e.ctrlKey && ["c", "v", "x", "u", "s", "p"].includes(key)) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        alert("Copying or capturing this content is disabled.");
      }
    };

    const blockCopy = (e) => e.preventDefault();
    const blockContextMenu = (e) => e.preventDefault();

    document.addEventListener("keydown", blockKeys);
    document.addEventListener("copy", blockCopy);
    document.addEventListener("cut", blockCopy);
    document.addEventListener("paste", blockCopy);
    document.addEventListener("contextmenu", blockContextMenu);

    return () => {
      document.removeEventListener("keydown", blockKeys);
      document.removeEventListener("copy", blockCopy);
      document.removeEventListener("cut", blockCopy);
      document.removeEventListener("paste", blockCopy);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  const percentage =
    results.total > 0 ? Math.round((results.score / results.total) * 100) : 0;

  const correctAnswers = results.answers.filter((item) => item.isCorrect);
  const wrongAnswers = results.answers.filter((item) => !item.isCorrect);

  const correctCount = results.answers.filter(isAnswerCorrect).length;
  const fallbackConfidence =
    results.answers.length > 0
      ? Math.round((correctCount / results.answers.length) * 100)
      : 0;
  const fallbackTopic =
    results.answers.find((item) => {
      const topic = String(item.topic || "").trim();
      return topic && topic !== contentTitle;
    })?.topic || "Concepts Requiring Review";
  const missedConcepts = results.answers
    .filter((item) => !isAnswerCorrect(item))
    .map((item) => String(item.question || "").trim())
    .filter(Boolean);
  const topicFeedback =
    results.answers.length > 0
      ? [
          {
            topic: fallbackTopic,
            confidence: fallbackConfidence,
            understanding: getUnderstanding(fallbackConfidence),
            recommendation: getAdaptiveRecommendation(
              fallbackTopic,
              fallbackConfidence,
              quizMode,
              missedConcepts
            ),
          },
        ]
      : [];

  const displayedFeedback =
    Array.isArray(aiFeedback) && aiFeedback.length > 0
      ? aiFeedback
      : topicFeedback;
  const activeFeedbackIndex = Math.min(
    feedbackIndex,
    Math.max(displayedFeedback.length - 1, 0)
  );
  const activeFeedback = displayedFeedback[activeFeedbackIndex];
  const activeQuizMode = activeFeedback?.quizType || quizMode;
  const activeConfidence = Math.max(
    0,
    Math.min(100, Number(activeFeedback?.confidence) || 0)
  );
  const topicAnswers =
    activeFeedback?.questionIndexes?.length > 0
      ? activeFeedback.questionIndexes
          .map((index) => results.answers[Number(index)])
          .filter(Boolean)
      : results.answers;
  const fallbackStrengths = topicAnswers
    .filter(isAnswerCorrect)
    .map(getStrengthStatement)
    .filter(Boolean)
    .slice(0, 2);
  const fallbackImprovements = topicAnswers
    .filter((answer) => !isAnswerCorrect(answer))
    .map(getFocusedConcept)
    .filter(Boolean)
    .slice(0, 3);
  const aiStrengths = activeFeedback?.strengths?.filter(Boolean).slice(0, 2);
  const aiImprovements = activeFeedback?.areasForImprovement
    ?.filter(Boolean)
    .slice(0, 3);
  const aiReviewTopics = activeFeedback?.suggestedReviewTopics
    ?.filter(Boolean)
    .slice(0, 3);
  const strengths =
    activeConfidence === 100
      ? fallbackStrengths
      : aiStrengths?.length > 0
        ? aiStrengths
        : fallbackStrengths;
  const areasForImprovement =
    activeConfidence === 100
      ? []
      : aiImprovements?.length > 0
        ? aiImprovements
        : fallbackImprovements;
  const suggestedReviewTopics =
    activeConfidence === 100
      ? [activeFeedback?.topic].filter(Boolean)
      : aiReviewTopics?.length > 0
        ? aiReviewTopics
        : [activeFeedback?.topic, ...fallbackImprovements]
            .filter(Boolean)
            .slice(0, 3);
  const adaptivePlan = getAdaptivePlan(
    activeFeedback?.topic || "this topic",
    activeConfidence,
    attempts
  );

  let feedbackTitle = "";
  let feedbackMessage = "";
  let masteryLevel = "";
  let recommendation = "";

  if (percentage >= 90) {
    feedbackTitle = "Excellent Performance!";
    feedbackMessage =
      "You mastered this activity and showed strong understanding of the topic.";
    masteryLevel = "Outstanding (A)";
    recommendation =
      "You can continue to the next activity or try a more challenging quiz.";
  } else if (percentage >= 80) {
    feedbackTitle = "Very Good!";
    feedbackMessage =
      "You understood the topic very well with only minor mistakes.";
    masteryLevel = "Very Satisfactory (B+)";
    recommendation = "Review small mistakes and try another quiz mode.";
  } else if (percentage >= 70) {
    feedbackTitle = "Good Job!";
    feedbackMessage =
      "You understood most of the topic, but there are still areas to improve.";
    masteryLevel = "Satisfactory (B)";
    recommendation = "Review the missed questions before moving on.";
  } else if (percentage >= 60) {
    feedbackTitle = "Fair";
    feedbackMessage = "You have a basic understanding, but need more practice.";
    masteryLevel = "Developing (C)";
    recommendation = "Study again and retake the quiz.";
  } else if (percentage >= 50) {
    feedbackTitle = "Needs Improvement";
    feedbackMessage =
      "You are starting to understand, but more effort is needed.";
    masteryLevel = "Beginning (D)";
    recommendation = "Review carefully before retrying.";
  } else {
    feedbackTitle = "Needs Review";
    feedbackMessage =
      "You need to revisit the topic and build your understanding.";
    masteryLevel = "Below Basic (F)";
    recommendation = "Go back and focus on the key concepts.";
  }

  if (quizMode === "timed" && isTimedOut) {
    feedbackTitle = "Time Ran Out";
    feedbackMessage =
      "The timer ended before you finished the quiz. Your score is based only on the questions you answered before time ran out.";
    masteryLevel = "Incomplete";
    recommendation =
      "Try again and manage your time better, or review before retrying.";
  }

  const retryQuiz = () => {
    setShowQuizModal(true);
  };

  const goHome = () => {
    navigate("/student");
  };

  const goBack = () => {
    if (source === "deck") {
      navigate(`/deck/${resultDeckId || deckId}`);
    } else {
      navigate(`/introduction/${lessonId}`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreSection}>
        <div className={styles.feedbackBox}>
          <div className={styles.scoreHeader}>
            <h1>
              You Scored <span>{results.score}</span>/
              <span>{results.total}</span>
            </h1>
          </div>

          {quizMode !== "timed" && (
            <p className={styles.percentage}>Score Percentage: {percentage}%</p>
          )}

          <h2>{feedbackTitle}</h2>
          <p>{feedbackMessage}</p>
        </div>

        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <h3>Your Status:</h3>
            <p>{masteryLevel}</p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Recommended Action</h3>
            <p>{recommendation}</p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Attempts</h3>
            <p>{attempts}</p>
          </div>
        </div>

        <div className={styles.resultButtons}>
          <button className={styles.retry} onClick={retryQuiz}>
            Practice Again
          </button>

          <button className={styles.lesson} onClick={goBack}>
            {source === "deck" ? "Back to Deck" : "Review Lesson"}
          </button>

          <button className={styles.home} onClick={goHome}>
            Go Home
          </button>
        </div>
      </div>

      <div className={styles.reviewWrapper}>
        <div className={styles.reviewHeader}>Adaptive Feedback</div>

        <div className={styles.adaptiveFeedbackPanel}>
          {isFeedbackLoading ? (
            <p className={styles.feedbackLoading}>
              Analyzing your answers and generating personalized feedback...
            </p>
          ) : displayedFeedback.length === 0 ? (
            <p className={styles.noAnswers}>
              Complete some questions to generate adaptive feedback.
            </p>
          ) : (
            <div className={styles.adaptiveFeedbackCard}>
              <div className={styles.adaptiveTopRow}>
                <div className={styles.understandingBadge}>
                  {String(activeFeedback.understanding)
                    .toLowerCase()
                    .includes("good") ? (
                    <Sparkles
                      className={styles.understandingIcon}
                      aria-hidden="true"
                    />
                  ) : (
                    <Zap
                      className={styles.understandingIcon}
                      aria-hidden="true"
                    />
                  )}
                  {activeFeedback.understanding}
                </div>

                <div
                  className={styles.masteryRing}
                  style={{
                    "--mastery": `${activeConfidence * 3.6}deg`,
                  }}
                  aria-label={`${activeConfidence}% topic mastery`}
                >
                  <div className={styles.masteryRingCenter}>
                    {activeConfidence}%
                  </div>
                </div>
              </div>

              <div className={styles.adaptiveDivider} />

              <div className={styles.topicHeading}>
                <div className={styles.quizTypeIcon}>
                  <img
                    src={getQuizTypeIcon(activeQuizMode)}
                    alt={getQuizTypeLabel(activeQuizMode)}
                  />
                </div>

                <div>
                  <span className={styles.quizTypeName}>
                    {getQuizTypeLabel(activeQuizMode)}
                  </span>
                  <h3>{activeFeedback.topic}</h3>
                </div>
              </div>

              <div className={styles.confidenceHeader}>
                <span>Confidence:</span>
                <strong>{activeConfidence}%</strong>
              </div>

              <div className={styles.learningInsights}>
                <div className={styles.insightCard}>
                  <h4>Strengths</h4>
                  {strengths.length > 0 ? (
                  <ul className={styles.strengthList}>
                      {strengths.map((strength, index) => (
                        <li key={`${strength}-${index}`}>{strength}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Keep practicing to build a confirmed strength.</p>
                  )}
                </div>

                <div className={styles.insightCard}>
                  <h4>Areas for Improvement</h4>
                  {areasForImprovement.length > 0 ? (
                  <ul className={styles.improvementList}>
                      {areasForImprovement.map((area, index) => (
                        <li key={`${area}-${index}`}>{area}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No areas for improvement were detected for this topic.
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.adaptivePlanCard}>
                <div>
                  <span className={styles.planLabel}>
                    Adaptive Recommendation
                  </span>
                  <strong>{adaptivePlan.difficulty} Questions</strong>
                </div>
                <p>
                  {activeConfidence === 100
                    ? adaptivePlan.recommendation
                    : activeFeedback.adaptiveRecommendation ||
                      adaptivePlan.recommendation}
                </p>
              </div>

              <p className={styles.adaptiveRecommendation}>
                {activeConfidence === 100
                  ? `You demonstrated full understanding of ${activeFeedback.topic} in this attempt. Continue with advanced practice to maintain mastery.`
                  : activeFeedback.recommendation}
              </p>

              <div className={styles.reviewAndGoal}>
                <div>
                  <h4>Suggested Review Topics</h4>
                  <div className={styles.reviewTopics}>
                    {suggestedReviewTopics.map((topic, index) => (
                      <span key={`${topic}-${index}`}>{topic}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.nextGoal}>
                  <h4>Next Goal</h4>
                  <p>
                    {activeConfidence === 100
                      ? adaptivePlan.nextGoal
                      : activeFeedback.nextGoal || adaptivePlan.nextGoal}
                  </p>
                </div>
              </div>

              <div className={styles.adaptiveFooter}>
                <span className={styles.feedbackCounter}>
                  {activeFeedbackIndex + 1} of {displayedFeedback.length}
                </span>

                <div className={styles.feedbackNavigation}>
                  {activeFeedbackIndex > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFeedbackIndex((current) => Math.max(0, current - 1))
                      }
                    >
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      activeFeedbackIndex >= displayedFeedback.length - 1
                    }
                    onClick={() =>
                      setFeedbackIndex((current) =>
                        Math.min(displayedFeedback.length - 1, current + 1)
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.legacyFeedback}>
          <div className={styles.reviewItem}>
            <div className={styles.reviewQuestion}>Strengths</div>
            <hr className={styles.reviewDivider} />

            <div className={styles.reviewAnswer}>
              {correctAnswers.length === 0 ? (
                <p>No strong areas detected yet.</p>
              ) : (
                correctAnswers.map((item, index) => (
                  <p key={index}>✅ {item.question || "Question not available"}</p>
                ))
              )}
            </div>
          </div>

          <div className={styles.reviewItem}>
            <div className={styles.reviewQuestion}>Weaknesses</div>
            <hr className={styles.reviewDivider} />

            <div className={styles.reviewAnswer}>
              {wrongAnswers.length === 0 ? (
                <p>No weak areas detected. Great job!</p>
              ) : (
                wrongAnswers.map((item, index) => {
                  const correctAnswer =
                    item.correctAnswer ||
                    item.answer ||
                    "Correct answer not available";

                  const explanation =
                    item.explanation || "No explanation available.";

                  return (
                    <div key={index} className={styles.weaknessItem}>
                      <p>❌ {item.question || "Question not available"}</p>

                      <p>
                        Correct Answer:{" "}
                        <span className={styles.correctText}>
                          {correctAnswer}
                        </span>
                      </p>

                      <p className={styles.explanationText}>
                        Explanation: {explanation}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.reviewWrapper}>
        <div className={styles.reviewHeader}>Review the Answers</div>

        <div className={styles.reviewList}>
          {results.answers.length === 0 ? (
            <p className={styles.noAnswers}>No answers recorded.</p>
          ) : (
            results.answers.map((item, index) => {
              const question = item.question || "Question not available";
              const userAnswer =
                item.userAnswer || item.selectedAnswer || "No answer";
              const correctAnswer =
                item.correctAnswer ||
                item.answer ||
                "Correct answer not available";

              const isCorrect = isAnswerCorrect(item);

              return (
                <div key={index} className={styles.reviewItem}>
                  <div className={styles.reviewQuestion}>
                    {index + 1}. {question}
                  </div>

                  <hr className={styles.reviewDivider} />

                  <div className={styles.reviewAnswer}>
                    <p
                      className={
                        isCorrect ? styles.correctText : styles.wrongText
                      }
                    >
                      Your Answer: {userAnswer}
                    </p>

                    <p>
                      Correct Answer:{" "}
                      <span className={styles.correctAnswer}>
                        {correctAnswer}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showQuizModal && (
        <QuizModesModal
          source={source}
          lessonId={source === "lesson" ? lessonId : undefined}
          deckId={source === "deck" ? resultDeckId || deckId : undefined}
          quizzes={results.answers}
          cards={results.answers}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {showScrollUp && (
        <button
          type="button"
          className={styles.scrollTopButton}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
