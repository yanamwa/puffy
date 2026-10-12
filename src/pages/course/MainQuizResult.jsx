import styles from "./lessonresult.module.css";

export default function MainQuizResult({
  score,
  total,
  percentage,
  onBack,
  onHome,
}) {
  return (
    <main className={styles.wrapper} aria-label="Main quiz result">
      <div className={styles.scoreSection}>
        <div className={styles.feedbackBox}>
          <div className={styles.scoreHeader}>
            <h1>Main Quiz Result</h1>
          </div>
          <h2>
            You Scored {score}/{total}
          </h2>
          <p className={styles.percentage}>Score Percentage: {percentage}%</p>
          <p>Your main quiz has been submitted.</p>
        </div>
        <div className={styles.resultButtons}>
          <button className={styles.lesson} onClick={onBack}>
            Back to Course
          </button>
          <button className={styles.home} onClick={onHome}>
            Go Home
          </button>
        </div>
      </div>
    </main>
  );
}
