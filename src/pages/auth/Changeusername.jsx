import styles from "./login.module.css";
import { Link } from "react-router-dom";

function ChangeUsername() {
  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>

        {/* NAVBAR */}
        <div className={styles.navbar}>
          <div className={styles.logo}>
            <img src="/images/logo1.png" alt="Logo" />
          </div>

          <ul className={styles.navLinks}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/Landing/FAQ">FAQ</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
          </ul>

          <div className={styles.navActions}>
            <Link to="/signup" className={styles.startBtn}>
              Start Learning
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.signupContainer}>
          <div style={{ display: "flex", gap: "40px" }}>
            {/* FORGOT USERNAME */}
            <Link
              to="/forgot-username"
              style={{ textDecoration: "none" }}
            >
              <div
                className={styles.signupCard}
                style={{
                  width: "280px",
                  textAlign: "center",
                }}
              >
                <img
                  src="/images/user-icon.png"
                  alt="Forgot Username"
                  style={{
                    width: "80px",
                    marginBottom: "10px",
                  }}
                />

                <h3>Forgot username?</h3>

                <p
                  style={{
                    color: "#666",
                  }}
                >
                  Need help remembering? You can request a reminder be sent
                  to your linked email here.
                </p>
              </div>
            </Link>

            {/* FORGOT PASSWORD */}
            <Link
              to="/forgot"
              style={{ textDecoration: "none" }}
            >
              <div
                className={styles.signupCard}
                style={{
                  width: "280px",
                  textAlign: "center",
                }}
              >
                <img
                  src="/images/lock-icon.png"
                  alt="Forgot Password"
                  style={{
                    width: "80px",
                    marginBottom: "10px",
                  }}
                />

                <h3>Forgot password?</h3>

                <p
                  style={{
                    color: "#666",
                  }}
                >
                  If you have forgotten your password, you can reset it here.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ChangeUsername;