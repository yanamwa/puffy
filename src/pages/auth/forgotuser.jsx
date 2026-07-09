import styles from './login.module.css';
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";
import LandingFooter from "../../components/LandingFooter";

function ForgotUsername() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      Swal.fire({
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        imageUrl: "/images/error.png",
        imageWidth: 200,
        imageHeight: 200,
      });
      return;
    }

    fetch(`${API_BASE}/fogot-username.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then(() => {
        Swal.fire({
          title: "Email Sent!",
          text: "Check your email, a email has been sent.",
          imageUrl: "/images/3.png",
          imageWidth: 200,
          imageHeight: 200,
        }).then(() => {
          navigate("/login");
        });
      })
      .catch(() => {
        Swal.fire("Server Error", "Please try again later.", "error");
      });
  };

return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>
   <LandingNavbar />
        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>
            <h2>Forgot Username</h2>

            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
            >
              Submit
            </button>

            <p className={styles.forgotText}>
              Already remembered?
              <Link
                to="/login"
                style={{
                  textDecoration: "none",
                  color: "#A993D8",
                  marginLeft: "5px",
                }}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
        <LandingFooter />
      </section>
    </div>
  );
}

export default ForgotUsername;
