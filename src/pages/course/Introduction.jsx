import styles from "./lesson.module.css";

import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import {
  useState,
  useEffect,
  useMemo,
} from "react";

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

  if (lines.length > 1) {
    return lines;
  }

  return (
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((item) => item.trim()) || [text]
  );
};


const cleanObjective = (value) => {
  return String(value || "")
    .replace(/^[-•]\s*/, "")
    .replace(
      /^Upon completing this module,\s*you will be able to:\s*-?\s*/i,
      ""
    )
    .trim();
};


function Introduction() {

  const { lessonId } = useParams();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);


  /* ========================================
     USERNAME
     ======================================== */

  const username =
    localStorage.getItem("username") ||
    "user";


  /* ========================================
     FETCH COURSE
     ======================================== */

  useEffect(() => {

    let active = true;

    fetchCourseContent(lessonId)

      .then((content) => {

        if (active) {
          setLesson(content);
        }

      })

      .catch((err) => {

        console.error(
          "Introduction content error:",
          err
        );

        if (active) {
          setLesson(null);
        }

      });


    return () => {
      active = false;
    };

  }, [lessonId]);


  /* ========================================
     MODULES
     ======================================== */

  const modules = useMemo(
    () => getCourseContentModules(lesson),
    [lesson]
  );


  const requestedModuleIndex = Number(
    searchParams.get("module") || 0
  );


  const moduleIndex = Math.min(

    Math.max(
      Number.isInteger(requestedModuleIndex)
        ? requestedModuleIndex
        : 0,
      0
    ),

    Math.max(modules.length - 1, 0)

  );


  const activeModule =
    modules[moduleIndex] || null;


  const moduleQuery =
    `?module=${moduleIndex}`;


  /* ========================================
     LEARNING OBJECTIVES
     ======================================== */

  const learningObjectives =

    activeModule?.learningObjectives ||

    lesson?.learning_objectives ||

    "No learning objectives yet.";


  const objectives = useMemo(() => {

    return splitReadableText(learningObjectives)

      .map(cleanObjective)

      .filter(Boolean);

  }, [learningObjectives]);


  /* ========================================
     LOADING
     ======================================== */

  if (!lesson) {
    return <LoadingState />;
  }


  /* ========================================
     PAGE
     ======================================== */

  return (

    <div className={styles.wrapper}>


      {/* BACK BUTTON */}

      <button
        type="button"
        className={styles.backButton}
        onClick={() =>
          navigate(
            `/student/enrolled-courses/${lessonId}`
          )
        }
      >
        ← Back to homepage
      </button>



      {/* FOLDER */}

      <div
        className={`${styles.content} ${styles.introductionPage}`}
      >


        <div className={styles.ribbon}></div>



        {/* =================================
            TABS
            ================================= */}

        <div className={styles.tabs}>


          <Link
            to={`/introduction/${lessonId}${moduleQuery}`}
          >

            <button
              type="button"
              className={styles.welcomeactive}
            >
              Introduction
            </button>

          </Link>



          <Link
            to={`/lesson/${lessonId}${moduleQuery}`}
          >

            <button
              type="button"
              className={styles.howitworks}
            >
              Lesson
            </button>

          </Link>



          <Link
            to={`/review/${lessonId}`}
          >

            <button
              type="button"
              className={styles.aboutyou}
            >
              Overview
            </button>

          </Link>


        </div>



        {/* =================================
            INTRODUCTION CONTENT
            ================================= */}

        <div className={styles.introductionContent}>


          {/* HELLO USER */}

          <h1 className={styles.introGreeting}>
            Hi there, @{username}!
          </h1>



          {/* LEARNING OBJECTIVES */}

          <h2 className={styles.introSectionTitle}>
            Learning Objectives
          </h2>



          <p className={styles.introDescription}>
            Upon completing this module, you will be able to:
          </p>



          <ul className={styles.introObjectivesList}>

            {objectives.map(
              (objective, index) => (

                <li
                  key={`${objective}-${index}`}
                >
                  {objective}
                </li>

              )
            )}

          </ul>



          {/* NEXT BUTTON */}

          <div className={styles.introNavigation}>

            <Link
              to={`/lesson/${lessonId}${moduleQuery}`}
            >

              <button
                type="button"
                className={styles.button}
              >
                Next
              </button>

            </Link>

          </div>


        </div>


      </div>


    </div>

  );

}


export default Introduction;