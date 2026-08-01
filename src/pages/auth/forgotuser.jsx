import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";
import LandingFooter from "../../components/LandingFooter";

import styles from "./login.module.css";

function ForgotUsername() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      Swal.fire({
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        imageUrl: "/images/error.png",
        imageWidth: 200,
        imageHeight: 200,
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${API_BASE}/forgot-username.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: trimmedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Unable to send your username."
        );
      }

      await Swal.fire({
        title: "Email Sent!",
        text: "Check your email. Your username information has been sent.",
        imageUrl: "/images/3.png",
        imageWidth: 200,
        imageHeight: 200,
      });

      navigate("/login");
    } catch (error) {
      Swal.fire({
        title: "Request Failed",
        text:
          error.message ||
          "Something went wrong. Please try again later.",
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div
          className={styles.background}
          aria-hidden="true"
        />

        {/* Header */}
        <header className={styles.pageHeader}>
          <LandingNavbar />
        </header>

        {/* Main content */}
        <main className={styles.signupContainer}>
          <form
            className={styles.signupCard}
            onSubmit={handleSubmit}
          >
            <h2>Forgot Username</h2>

            <label htmlFor="forgot-username-email">
              Email Address
            </label>

            <input
              id="forgot-username-email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </button>

            <p className={styles.forgotText}>
              Already remembered?

              <Link
                to="/login"
                className={styles.forgotLoginLink}
              >
                Login
              </Link>
            </p>
          </form>
        </main>

        {/* Footer */}
        <LandingFooter />
      </section>
    </div>
  );
}

export default ForgotUsername;