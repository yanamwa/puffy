import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../../../config.js";
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
import styles from "./survival.module.css";

function normalizeLessonData(data) {
  return data?.lesson || data?.data || data || {};
}

function getLessonQuizData(lessonData) {
  return (
    lessonData?.quiz_contents ||
    lessonData?.quiz_content ||
    lessonData?.quiz ||
    lessonData?.questions ||
    lessonData?.cards ||
    lessonData?.flashcards ||
    lessonData?.items ||
    []
  );
}

function cleanAnswer(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/^[a-d]\.\s*/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanQuestionText(text = "") {
  return String(text).replace(/\s*A\..*/is, "").trim();
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function parseJsonOptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractOptionsFromQuestion(questionText = "") {
  const optionMatches = [
    ...String(questionText).matchAll(/([A-D])\.\s*(.*?)(?=\s+[A-D]\.\s+|$)/gi),
  ];

  return optionMatches.map((match) => match[2].trim()).filter(Boolean);
}

function getSavedOptions(item) {
  return [
    ...parseJsonOptions(item.mc_wrong_options),
    ...(Array.isArray(item.options) ? item.options : []),
    ...(Array.isArray(item.choices) ? item.choices : []),
    item.option_a,
    item.option_b,
    item.option_c,
    item.option_d,
    item.choice_a,
    item.choice_b,
    item.choice_c,
    item.choice_d,
    item.wrong_option_1,
    item.wrong_option_2,
    item.wrong_option_3,
  ].filter(Boolean);
}

function getUniqueOptions(options) {
  const seen = new Set();

  return options.filter((option) => {
    const key = cleanAnswer(option);
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function normalizeSurvivalQuestion(item, index) {
  const rawQuestion = getQuizItemQuestion(item);
  const question = cleanQuestionText(rawQuestion);
  const answer = String(getQuizItemAnswer(item)).trim();
  const extractedOptions = extractOptionsFromQuestion(rawQuestion);
  const rawOptions =
    extractedOptions.length > 0
      ? extractedOptions
      : [...getSavedOptions(item), answer].filter(Boolean);
  const answerKey = cleanAnswer(answer);
  const isTrueFalse =
    answerKey === "true" ||
    answerKey === "false" ||
    question.toLowerCase().includes("true or false");
  const options = isTrueFalse
    ? ["True", "False"]
    : getUniqueOptions([answer, ...rawOptions]).slice(0, 4);

  if (options.length >= 2) {
    const shuffledOptions = shuffleArray(options.map(String));

    return {
      id: item.cardId || item.card_id || item.id || index + 1,
      type: "mcq",
      q: question,
      options: shuffledOptions,
      answer,
      correct: shuffledOptions.findIndex(
        (option) => cleanAnswer(option) === answerKey
      ),
      explanation: item.explanation || answer,
    };
  }

  return {
    id: item.cardId || item.card_id || item.id || index + 1,
    type: "typing",
    q: question,
    answer,
    explanation: item.explanation || answer,
  };
}

export default function Survival() {
  const navigate = useNavigate();
  const { lessonId, deckId } = useParams();
  const isLessonMode = Boolean(lessonId);
  const isDeckMode = Boolean(deckId);
  const practiceSession = useMemo(
    () => getStoredPracticeSession({ lessonId, deckId }),
    [lessonId, deckId]
  );

  const [title, setTitle] = useState("Survival Mode");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);

      try {
        if (practiceSession) {
          setTitle(getPracticeTitle(practiceSession, "Survival Mode"));
          setQuestions(
            shuffleArray(
              practiceSession.items.map(normalizeSurvivalQuestion).filter(Boolean)
            )
          );
          return;
        }

        if (isLessonMode) {
          const response = await fetch(
            `${API_BASE}/getLessonsById.php?id=${lessonId}`,
            { credentials: "include" }
          );
          const lessonData = normalizeLessonData(await response.json());
          const rawQuiz = getLessonQuizData(lessonData);
          const parsed = Array.isArray(rawQuiz)
            ? rawQuiz
            : JSON.parse(String(rawQuiz || "[]"));

          setTitle(lessonData?.title || "Lesson Survival Mode");
          setQuestions(shuffleArray(parsed.map(normalizeSurvivalQuestion)));
        }

        if (isDeckMode) {
          const [deckResponse, cardsResponse] = await Promise.all([
            fetch(`${API_BASE}/getDeckById.php?deckId=${deckId}`, {
              credentials: "include",
            }),
            fetch(`${API_BASE}/getCardsByDeck.php?deckId=${deckId}`, {
              credentials: "include",
            }),
          ]);
          const deckData = await deckResponse.json();
          const cardsData = await cardsResponse.json();
          const cards = cardsData.success ? cardsData.cards || [] : [];

          setTitle(
            deckData?.deck?.title ||
              deckData?.deck?.deck_title ||
              deckData?.title ||
              "Deck Survival Mode"
          );
          setQuestions(shuffleArray(cards.map(normalizeSurvivalQuestion)));
        }
      } catch (error) {
        console.error("Error loading survival mode:", error);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [lessonId, deckId, isLessonMode, isDeckMode, practiceSession]);

  async function saveQuizAttempt(finalScore, finalAnswers, outOfLives) {
    const metadata = getPracticeResultMetadata(
      practiceSession,
      isDeckMode ? "deck" : "lesson"
    );

    try {
      await fetch(`${API_BASE}/saveQuizAttempt.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          source: metadata.source,
          lessonId: toNumericId(lessonId),
          deckId: toNumericId(deckId),
          courseId: metadata.courseId,
          quizMode: "survival",
          score: finalScore,
          total: questions.length,
          isTimedOut: false,
          outOfLives,
        }),
      });
    } catch (error) {
      console.error("Save survival attempt error:", error);
    }

    return finalAnswers;
  }

  async function finishQuiz(finalScore, finalAnswers, outOfLives = false) {
    await saveQuizAttempt(finalScore, finalAnswers, outOfLives);

    const resultPayload = {
      ...getPracticeResultMetadata(practiceSession, isDeckMode ? "deck" : "lesson"),
      quizMode: "survival",
      deckId: toNumericId(deckId),
      lessonId: lessonId || null,
      score: finalScore,
      total: questions.length,
      outOfLives,
      answers: finalAnswers,
    };

    localStorage.setItem("lessonQuizResults", JSON.stringify(resultPayload));

    if (isDeckMode) {
      localStorage.setItem(`deckQuizResults_${deckId}`, JSON.stringify(resultPayload));
    }

    navigate(
      isDeckMode
        ? `/review/deck/${deckId}`
        : getPracticeReviewPath(practiceSession, { lessonId, deckId })
    );
  }

  function nextQuestion() {
    if (current + 1 < questions.length) {
      setCurrent((value) => value + 1);
      setTypingAnswer("");
      setLocked(false);
      return;
    }

    finishQuiz(score, answers);
  }

  function recordAnswer(userAnswer, isCorrect) {
    if (locked) return;

    setLocked(true);

    const question = questions[current];
    const nextScore = score + (isCorrect ? 1 : 0);
    const nextLives = isCorrect ? lives : lives - 1;
    const nextAnswers = [
      ...answers,
      {
        cardId: question.id || null,
        question: question.q,
        userAnswer,
        correctAnswer: question.answer,
        explanation: question.explanation || question.answer,
        isCorrect,
      },
    ];

    setScore(nextScore);
    setAnswers(nextAnswers);
    setLives(nextLives);

    setTimeout(() => {
      if (nextLives <= 0) {
        finishQuiz(nextScore, nextAnswers, true);
        return;
      }

      if (current + 1 < questions.length) {
        setCurrent((value) => value + 1);
        setTypingAnswer("");
        setLocked(false);
        return;
      }

      finishQuiz(nextScore, nextAnswers);
    }, 650);
  }

  function handleMCQ(index) {
    const question = questions[current];
    recordAnswer(question.options[index], index === question.correct);
  }

  function handleTyping() {
    const question = questions[current];
    const isCorrect = cleanAnswer(typingAnswer) === cleanAnswer(question.answer);
    recordAnswer(typingAnswer, isCorrect);
  }

  if (loading) {
    return <LoadingState />;
  }

  if (questions.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.questionBox}>
          <p className={styles.question}>No survival questions are available.</p>
          <button
            type="button"
            className={styles.submitTyping}
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

  const question = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.subtitle}>
          Question {current + 1} of {questions.length}
        </p>
      </div>

      <div className={styles.questionBox}>
        <div className={styles.lives}>
          {[1, 2, 3].map((life) => (
            <img
              key={life}
              src="/images/hearts.png"
              className={`${styles.heart} ${lives < life ? styles.lost : ""}`}
              alt="life"
            />
          ))}
        </div>

        <p className={styles.question}>{question.q}</p>

        {question.type === "mcq" && (
          <div className={styles.options}>
            {question.options.map((option, index) => (
              <button
                key={`${option}-${index}`}
                className={styles.option}
                onClick={() => handleMCQ(index)}
                disabled={locked}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.type === "typing" && (
          <div className={styles.typingContainer}>
            <input
              className={styles.typingAnswer}
              type="text"
              placeholder="Type your answer"
              value={typingAnswer}
              onChange={(event) => setTypingAnswer(event.target.value)}
              disabled={locked}
              onKeyDown={(event) => {
                if (event.key === "Enter" && typingAnswer.trim()) {
                  handleTyping();
                }
              }}
            />

            <button
              className={styles.submitTyping}
              onClick={handleTyping}
              disabled={locked || !typingAnswer.trim()}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
