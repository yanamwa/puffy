import styles from "./lesson.module.css";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import LoadingState from "../../components/LoadingState.jsx";
import { fetchCourseContent } from "./courseContent.js";

const splitReadableText = (value) => {
  const text = String(value || "").trim();
  if (!text) return [];

  const lines = text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()) || [text];
};

function Introduction() {
  const { lessonId } = useParams();
  const username = localStorage.getItem("username") || "user";
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    let active = true;

    fetchCourseContent(lessonId)
      .then((content) => {
        if (active) setLesson(content);
      })
      .catch((err) => {
        console.error("Introduction content error:", err);
        if (active) setLesson(null);
      });

    return () => {
      active = false;
    };
  }, [lessonId]);

  if (!lesson) {
    return <LoadingState />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.ribbon}></div>

        <div className={styles.tabs}>
          <Link to={`/introduction/${lessonId}`}>
            <button className={styles.welcomeactive}>Introduction</button>
          </Link>

          <Link to={`/lesson/${lessonId}`}>
            <button className={styles.howitworks}>Lesson</button>
          </Link>

          <Link to={`/review/${lessonId}`}>
            <button className={styles.aboutyou}>Review</button>
          </Link>
        </div>

        <div className={styles.greets}>
          <h1 className={styles.hello}>Hi there, @{username}!</h1>

          <h2>{lesson.title}</h2>
          <ul className={styles.objectivesList}>
            {splitReadableText(
              lesson.learning_objectives || "No learning objectives yet."
            ).map((objective, index) => (
              <li key={`${objective}-${index}`}>{objective}</li>
            ))}
          </ul>

          <Link to={`/lesson/${lessonId}`}>
            <button className={styles.button}>Start Lesson</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Introduction;
