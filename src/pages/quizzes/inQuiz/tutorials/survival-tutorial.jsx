import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./survival-tutorial.module.css";

export default function SurvivalMode() {
  const navigate = useNavigate();
  const { lessonId, deckId } = useParams();

  const [index, setIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [checkedSlides, setCheckedSlides] = useState(new Set());

  const slides = [
    {
      question: "Which keyword is used to prevent a class from being subclassed?",
      options: ["static", "final", "const", "sealed"],
      correct: "final"
    },
    {
      question: "Which keyword is used to prevent a class from being subclassed?",
      options: ["final", "static", "const", "sealed"],
      correct: "final"
    },
    {
      question: "Which keyword is used to prevent a class from being subclassed?",
      options: ["final", "static", "const", "sealed"],
      wrong: "static"
    }
  ];

  useEffect(() => {

    const interval = setInterval(() => {

      setIndex((prev) => {

        let next = prev + 1;

        if (next >= slides.length) {
          next = 0;
          setLives(3);
          setCheckedSlides(new Set());
        }

        return next;

      });

    }, 3500);

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {

    const slide = slides[index];

    if (
      slide.wrong &&
      !checkedSlides.has(index) &&
      lives > 0
    ) {

      const updated = new Set(checkedSlides);
      updated.add(index);

      setCheckedSlides(updated);
      setLives((prev) => prev - 1);

    }

  }, [index]);

  const handleStart = () => {
    if (deckId) {
      navigate(`/survival/deck/${deckId}`);
      return;
    }

    if (lessonId) {
      navigate(`/survival/lesson/${lessonId}`);
    }
  };

  return (

    <div className={styles.wrapper}>

      {/* HEADER */}

      <div className={styles.headerBox}>

        <div className={styles.headerTop}>
          <h1 className={styles.title}>Survival Mode</h1>
        </div>

        <div className={styles.subtitles}>

          <p className={styles.subtitle}>
            3 lives, 1 mission — don’t lose them!
          </p>

          <p className={styles.subtitle}>
            Each wrong answer costs a life. Stay focused, keep your streak going,
            and see how long you can survive!
          </p>

        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start
        </button>

      </div>

      {/* QUIZ */}

      <div className={styles.slideshowBox}>

        {/* LIVES */}

        <div className={styles.lives}>
          {[0,1,2].map((i) => (
            <img
              key={i}
              src="/images/hearts.png"
              alt="life"
              className={`${styles.heart} ${lives <= i ? styles.lost : ""}`}
            />
          ))}
        </div>

        {/* SLIDES */}

        {slides.map((slide, i) => (

          <div
            key={i}
            className={`${styles.slide} ${i === index ? styles.active : ""}`}
          >

            <p className={styles.question}>
              {slide.question}
            </p>

            <div className={styles.options}>

              {slide.options.map((option, j) => (

                <button
                  key={j}
                  className={
                    option === slide.correct
                      ? styles.correct
                      : option === slide.wrong
                      ? styles.wrong
                      : ""
                  }
                >
                  {option}
                </button>

              ))}

            </div>

          </div>

        ))}

        {/* DOTS */}

        <div className={styles.dots}>

          {slides.map((_, i) => (

            <span
              key={i}
              className={`${styles.dot} ${i === index ? styles.activeDot : ""}`}
            />

          ))}

        </div>

      </div>

    </div>

  );

}
