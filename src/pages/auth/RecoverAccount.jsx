import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./login.module.css";
import { API_BASE } from "../../config";
import LandingNavbar from "../../components/LandingNavbar";
import LandingFooter from "../../components/LandingFooter";

function RecoverAccount() {
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const username = location.state?.username || "";
  const email = location.state?.email || "";

  const OTP_DURATION = 300;

  const [timeLeft, setTimeLeft] = useState(OTP_DURATION);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
    if (!username) {
      showThinkAlert("Session Expired", "Please try logging in again.");
      setTimeout(() => navigate("/login"), 1200);
    }
  }, [username, navigate]);

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

  const handleVerify = async () => {
    const otp = inputsRef.current.map((input) => input?.value || "").join("");

    if (otp.length !== 4) {
      showThinkAlert("Incomplete Code", "Enter all 4 digits.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/verify-recovery-otp.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (!data.success) {
        showThinkAlert(
          "Verification Failed",
          data.message || "Invalid verification code."
        );
        return;
      }

      showSuccessAlert(
        "Account Restored",
        "Your account has been successfully recovered."
      ).then(() => {
        navigate("/login");
      });
    } catch (error) {
      console.error(error);
      showErrorAlert("Server Error", "Could not verify recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);

      const res = await fetch(`${API_BASE}/send-recovery-otp.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (data.success) {
        showSuccessAlert("Sent!", "New recovery code sent.");
        setTimeLeft(OTP_DURATION);

        inputsRef.current.forEach((input) => {
          if (input) input.value = "";
        });
      } else {
        showThinkAlert(
          "Resend Failed",
          data.message || "Could not resend code."
        );
      }
    } catch (error) {
      console.error(error);
      showErrorAlert("Server Error", "Could not resend recovery code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>
        <LandingNavbar />

        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>
            <h2>Recover Account</h2>

            <p className={styles.verifySubtext}>
              Enter the 4-digit code sent to your email
            </p>

            <p className={styles.verifySubtext}>
              {email || "your email"}
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
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Recover"}
            </button>
          </div>
        </div>
        <LandingFooter />
      </section>
    </div>
  );
}

export default RecoverAccount;