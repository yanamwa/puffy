import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";
import styles from "./login.module.css";
import LandingNavbar from "../../components/LandingNavbar";
import LandingFooter from "../../components/LandingFooter";

export default function Otp() {
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || sessionStorage.getItem("otp_email");

  const OTP_DURATION = 300;
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION);
  const [resending, setResending] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const showThinkAlert = (title, text) => {
    Swal.fire({
      title,
      text,
      imageUrl: "/images/think.png",
      imageWidth: 200,
      imageHeight: 200,
      confirmButtonText: "OK",
    });
  };

  const showSuccessAlert = (title, text) => {
    return Swal.fire({
      title,
      text,
      imageUrl: "/images/success.png",
      imageWidth: 200,
      imageHeight: 200,
      confirmButtonText: "OK",
    });
  };

  const showErrorAlert = (title, text) => {
    Swal.fire({
      title,
      text,
      imageUrl: "/images/error.png",
      imageWidth: 200,
      imageHeight: 200,
      confirmButtonText: "OK",
    });
  };

  useEffect(() => {
    if (!email) {
      showThinkAlert("Session Expired", "Please sign up again.");
      setTimeout(() => navigate("/signup"), 1200);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = () => {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getAlertTitle = (message) => {
    if (message === "Wrong code") return "Wrong Code";
    if (message === "Invalid verification code") return "Wrong Code";
    if (message === "Invalid email address") return "Wrong Email";
    if (message === "Verification code expired") return "Code Expired";
    if (message === "Account not found or already verified") {
      return "Account Not Found";
    }

    return "Verification Failed";
  };

  const handleInput = (e, index) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");

    if (e.target.value && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const otp = inputsRef.current.map((input) => input?.value || "").join("");

    if (timeLeft <= 0) {
      setInlineError("Verification code expired");
      return;
    }

    if (otp.length !== 4) {
      showThinkAlert("Incomplete Code", "Enter all 4 digits.");
      return;
    }

    fetch(`${API_BASE}/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInlineError("");
          showSuccessAlert(
            "Verified!",
            "Your account has been verified."
          ).then(() => {
            sessionStorage.removeItem("otp_email");
            navigate("/login");
          });
        } else {
          if (data.message === "Verification code expired") {
            setInlineError("Verification code expired");
            return;
          }

          showThinkAlert(
            getAlertTitle(data.message),
            data.message || "Wrong verification details."
          );
        }
      })
      .catch(() => {
        showErrorAlert("Server Error", "Could not verify OTP.");
      });
  };

  const handleResend = () => {
    setResending(true);

    fetch(`${API_BASE}/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showSuccessAlert("Sent!", "New verification code sent.");
          setTimeLeft(OTP_DURATION);
          setInlineError("");
          inputsRef.current.forEach((input) => {
            if (input) input.value = "";
          });
        } else {
          showThinkAlert("Resend Failed", data.message || "Could not resend code.");
        }
      })
      .catch(() => {
        showErrorAlert("Server Error", "Could not resend OTP.");
      })
      .finally(() => setResending(false));
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>
        <LandingNavbar />

        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>
            <h2>Email Verification</h2>

            <p className={styles.verifySubtext}>
              Enter the 4-digit code sent to your email
            </p>

            <div className={styles.otpWrapper}>
              {[0, 1, 2, 3].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className={styles.otpInput}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
            </div>

            {(inlineError || timeLeft <= 0) && (
              <p className={styles.otpInlineError}>
                {inlineError || "Verification code expired"}
              </p>
            )}

            <div className={styles.otpRow}>
              <span className={styles.otpTimer}>
                {timeLeft > 0
                  ? `Code expires in ${formatTime()}`
                  : "Code expired"}
              </span>

              <button
                type="button"
                className={styles.resendBtn}
                disabled={timeLeft > 0 || resending}
                onClick={handleResend}
              >
                {resending ? "Sending..." : "Resend"}
              </button>
            </div>

            <button
              type="button"
              className={styles.verifyBtn}
              onClick={handleSubmit}
            >
              Verify
            </button>
          </div>
        </div>
        <LandingFooter />
      </section>
    </div>
  );
}
