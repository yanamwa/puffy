import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <img
          src="/images/404.png"
          alt="404"
          className={styles.image}
        />
        <h2 className={styles.title}>Page Not Found</h2>
        <p className={styles.text}>
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <button
          className={styles.homeBtn}
          onClick={() => navigate("/")}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound;