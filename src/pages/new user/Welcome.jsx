import styles from "./Introduction.module.css";
import { Link } from "react-router-dom";

function Welcome() {
  const username = localStorage.getItem("username") || "user";

  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.ribbon}></div>

        <div className={styles.tabs}>
          <button className={styles.welcomeactive}>welcome</button>
          <button className={styles.howitworks}>how-it-works</button>
          <button className={styles.aboutyou}>about-you</button>
        </div>

        <div className={styles.greets}>
          <h1 className={styles.hello}>Welcome, @{username}!</h1>

          <p className={styles.greeting1}>
            Hi there! We are so happy you joined the PuffyBrain family.
            <br />
            PuffyBrain helps you learn, quiz, and remember everything with your own
            cute decks and quizzes.
            <br />
            Ready to see how it works?
          </p>

          <Link to="/how-it-works">
            <button className={styles.button}>Next -&gt;</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
