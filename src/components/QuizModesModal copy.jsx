import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.js";
import ModeCard from "./ModeCard";
import styles from "./QuizModesModal.module.css";
import LoadingState from "./LoadingState.jsx";

export default function QuizModesModal({
  source,
  deckId,
  lessonId,
  cards = [],
  quizzes = [],
  onClose,
}) {
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const isDeck = source === "deck";
  const isLesson = source === "lesson";

  useEffect(() => {
    fetchModes();
  }, []);

  const fetchModes = async () => {
    try {
      const res = await fetch(`${API_BASE}/getModes.php`);

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      if (data.success && Array.isArray(data.modes)) {
        setModes(data.modes);
      } else {
        setModes([]);
      }
    } catch (error) {
      console.error("Error loading modes:", error);
      setModes([]);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionCount = () => {
    if (isDeck) return cards.length;
    if (isLesson) return quizzes.length;
    return 0;
  };

  const calculateTimedQuizSeconds = () => {
    const questionCount = getQuestionCount();
    const difficulty = "medium";

    const secondsPerQuestion =
      difficulty === "easy" ? 60 : difficulty === "hard" ? 120 : 90;

    const totalSeconds = questionCount * secondsPerQuestion;

    // minimum 2 minutes, maximum 30 minutes
    const minSeconds = 120;
    const maxSeconds = 1800;

    return Math.min(Math.max(totalSeconds, minSeconds), maxSeconds);
  };

  const handleStartPractice = (mode) => {
    if (!mode.route) {
      console.error("Mode route is missing:", mode);
      return;
    }

    const isTimedQuiz =
      mode.title?.toLowerCase().includes("timed") ||
      mode.route?.toLowerCase().includes("timedquiz");

    if (isTimedQuiz) {
      const timedQuizSeconds = calculateTimedQuizSeconds();
      localStorage.setItem("timedQuizSeconds", String(timedQuizSeconds));
    } else {
      localStorage.removeItem("timedQuizSeconds");
    }

    if (isDeck) {
      localStorage.setItem("practiceSource", "deck");
      localStorage.setItem("practiceDeckId", deckId);
      localStorage.setItem("practiceCards", JSON.stringify(cards));

      navigate(`${mode.route}/deck/${deckId}`);
      return;
    }

    if (isLesson) {
      localStorage.setItem("practiceSource", "lesson");
      localStorage.setItem("practiceLessonId", lessonId);
      localStorage.setItem("practiceQuizzes", JSON.stringify(quizzes));

      navigate(`${mode.route}/lesson/${lessonId}`);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Choose Quiz Type</h2>
          <button className={styles.closeModal} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.cardsScroll}>
          <div className={styles.modeOptions}>
            {loading ? (
              <LoadingState fullPage={false} />
            ) : modes.length === 0 ? (
              <p>No quiz modes available.</p>
            ) : (
              modes.map((mode) => (
                <ModeCard
                  key={mode.id}
                  title={mode.title}
                  img={`${API_BASE}/images/${mode.image}`}
                  desc={mode.description}
                  onClick={() => handleStartPractice(mode)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
