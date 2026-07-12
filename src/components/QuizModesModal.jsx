import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchQuizModes } from "../services/quizModeApi.js";
import ModeCard from "./ModeCard.jsx";
import styles from "./QuizModesModal.module.css";

function resolveModeImage(mode) {
  const image = String(mode.image || "").trim();

  if (!image) return "/images/flashcard.png";
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return image;

  return `/images/${image}`;
}

function getModeKind(mode) {
  const text = `${mode.title || ""} ${mode.mode_name || ""} ${mode.route || ""}`.toLowerCase();

  if (text.includes("timed")) return "timed";
  if (text.includes("multiple")) return "multiple";
  if (text.includes("matching")) return "matching";
  if (text.includes("q")) return "qna";
  return "flashcard";
}

export default function QuizModesModal({
  source,
  deckId,
  lessonId,
  cards = [],
  quizzes = [],
  onClose,
}) {
  const navigate = useNavigate();
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDeck = source === "deck";
  const isLesson = source === "lesson";

  useEffect(() => {
    let active = true;

    async function loadModes() {
      try {
        setLoading(true);
        const loadedModes = await fetchQuizModes();

        if (active) {
          setModes(loadedModes);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadModes();

    const refreshModes = () => {
      fetchQuizModes().then((loadedModes) => {
        if (active) setModes(loadedModes);
      });
    };

    window.addEventListener("admin-modes-updated", refreshModes);
    window.addEventListener("storage", refreshModes);

    return () => {
      active = false;
      window.removeEventListener("admin-modes-updated", refreshModes);
      window.removeEventListener("storage", refreshModes);
    };
  }, []);

  const getQuestionCount = () => {
    if (isDeck) return cards.length;
    if (isLesson) return quizzes.length;
    return 0;
  };

  const calculateTimedQuizSeconds = () => {
    const totalSeconds = getQuestionCount() * 90;
    return Math.min(Math.max(totalSeconds, 120), 1800);
  };

  const handleStartPractice = (mode) => {
    const modeKind = getModeKind(mode);
    const selectedMode = {
      ...mode,
      quizMode: modeKind,
    };

    if (modeKind === "timed") {
      localStorage.setItem("timedQuizSeconds", String(calculateTimedQuizSeconds()));
    } else {
      localStorage.removeItem("timedQuizSeconds");
    }

    localStorage.setItem("practiceMode", JSON.stringify(selectedMode));

    if (isDeck) {
      localStorage.setItem("practiceSource", "deck");
      localStorage.setItem("practiceDeckId", deckId || "");
      localStorage.setItem("practiceCards", JSON.stringify(cards));

      if (mode.route) {
        navigate(`${mode.route}/deck/${deckId}`);
      } else {
        onClose?.();
      }
      return;
    }

    if (isLesson) {
      localStorage.setItem("practiceSource", "lesson");
      localStorage.setItem("practiceLessonId", lessonId || "");
      localStorage.setItem("practiceQuizzes", JSON.stringify(quizzes));

      if (mode.route) {
        navigate(`${mode.route}/lesson/${lessonId}`);
      } else {
        onClose?.();
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Choose Quiz Type</h2>
          <button
            className={styles.closeModal}
            type="button"
            onClick={onClose}
            aria-label="Close quiz modes"
          >
            x
          </button>
        </div>

        <div className={styles.cardsScroll}>
          <div className={styles.modeOptions}>
            {loading ? (
              <p className={styles.emptyModes}>Loading quiz modes...</p>
            ) : modes.length === 0 ? (
              <p className={styles.emptyModes}>No quiz modes available.</p>
            ) : (
              modes.map((mode) => (
                <ModeCard
                  key={mode.id}
                  title={mode.title || mode.mode_name}
                  img={resolveModeImage(mode)}
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
