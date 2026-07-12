import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState.jsx";
import styles from "./lesson.module.css";
import { fetchCourseContent, getCourseLessonPages } from "./courseContent.js";

function Tutorial() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    if (!lessonId) return;

    let active = true;

    fetchCourseContent(lessonId)
      .then((content) => {
        if (active) setLesson(content);
      })
      .catch((err) => {
        console.error("Course context error:", err);
        if (active) setLesson(null);
      });

    return () => {
      active = false;
    };
  }, [lessonId]);

  const lessonPages = useMemo(() => getCourseLessonPages(lesson), [lesson]);
  const firstPage = lessonPages[0];

  if (lessonId && !lesson) {
    return <LoadingState />;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.ribbon}></div>

        <div className={styles.tabs}>
          <button className={styles.welcome} type="button" disabled>
            Introduction
          </button>
          <button className={styles.howitworksactive} type="button" disabled>
            Lesson
          </button>
          <button className={styles.aboutyou} type="button" disabled>
            Review
          </button>
        </div>

        <div className={styles.greets}>
          <h1 className={styles.hello}>
            {firstPage?.title || lesson?.title || "Lesson"}
          </h1>

          <p className={styles.greeting1}>
            {firstPage?.content || lesson?.description || "No lesson content yet."}
          </p>

          <Link to={lessonId ? `/lesson/${lessonId}` : "/lesson"}>
            <button className={styles.button} type="button">
              Next
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
