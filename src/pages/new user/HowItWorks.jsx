import styles from "./Introduction.module.css";
import { Link } from "react-router-dom";

function HowItWorks() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.ribbon}></div>

        <div className={styles.tabs}>
          <button className={styles.welcome}>welcome</button>
          <button className={styles.howitworksactive}>how-it-works</button>
          <button className={styles.aboutyou}>about-you</button>
        </div>

        <div className={styles.greets}>
          <h1 className={styles.hello}>How it works</h1>

          <p className={styles.greeting1}>
            Simple! You just need to create decks, create flashcards,
            and voila! You can now start your quiz by pressing the
            <strong> Learn </strong> button!
          </p>

          <Link to="/name">
            <button className={styles.button}>Next -&gt;</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
