import styles from "./login.module.css";
import { Link } from "react-router-dom";
import LandingNavbar from "../../components/LandingNavbar";
import LandingFooter from "../../components/LandingFooter";

function CantSign() {
  return (
    <>
      <div className={styles.wrapper}>
        <section className={styles.container}>
          <div className={styles.background}></div>

          <LandingNavbar />

          <div className={styles.signupContainer}>
            <div className={styles.cantOptions}>
              <Link to="/forgot-username" className={styles.cantLink}>
                <div className={styles.cantCard}>
                  <img src="/images/ForgotUser.png" alt="Forgot Username" />
                  <h3>Forgot username?</h3>
                  <p>
                    Need help remembering? You can request a reminder be sent
                    to your linked email here.
                  </p>
                </div>
              </Link>

              <Link to="/forgot" className={styles.cantLink}>
                <div className={styles.cantCard}>
                  <img src="/images/ForgotPassword.png" alt="Forgot Password" />
                  <h3>Forgot password?</h3>
                  <p>
                    If you have forgotten your password, you can reset it here.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </>
  );
}

export default CantSign;