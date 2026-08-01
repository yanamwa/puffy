import styles from "./lesson.module.css";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import LoadingState from "../../components/LoadingState.jsx";
import {
  fetchCourseContent,
  getCourseContentModules,
} from "./courseContent.js";

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
  const [searchParams] = useSearchParams();
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

  const modules = useMemo(() => getCourseContentModules(lesson), [lesson]);
  const requestedModuleIndex = Number(searchParams.get("module") || 0);
  const moduleIndex = Math.min(
    Math.max(Number.isInteger(requestedModuleIndex) ? requestedModuleIndex : 0, 0),
    Math.max(modules.length - 1, 0)
  );
  const activeModule = modules[moduleIndex] || null;
  const moduleNumber = moduleIndex + 1;
  const moduleQuery = `?module=${moduleIndex}`;
  const learningObjectives =
    activeModule?.learningObjectives ||
    lesson?.learning_objectives ||
    "No learning objectives yet.";
  const moduleTitle = activeModule?.title || lesson?.title || "Untitled module";

  if (!lesson) {
    return <LoadingState />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.ribbon}></div>

        <div className={styles.tabs}>
          <Link to={`/introduction/${lessonId}${moduleQuery}`}>
            <button className={styles.welcomeactive}>Introduction</button>
          </Link>

          <Link to={`/lesson/${lessonId}${moduleQuery}`}>
            <button className={styles.howitworks}>Lesson</button>
          </Link>

          <Link to={`/review/${lessonId}`}>
            <button className={styles.aboutyou}>Review</button>
          </Link>
        </div>

        <div className={styles.greets}>
          <h1 className={styles.hello}>Hi there, @{username}!</h1>

          <h2>Module {moduleNumber}: {moduleTitle}</h2>

          <h3 className={styles.moduleSectionTitle}>Learning Objectives</h3>
          <ul className={styles.objectivesList}>
            {splitReadableText(learningObjectives).map((objective, index) => (
              <li key={`${objective}-${index}`}>{objective}</li>
            ))}
          </ul>

          <Link to={`/lesson/${lessonId}${moduleQuery}`}>
            <button className={styles.button}>Next</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Introduction;
