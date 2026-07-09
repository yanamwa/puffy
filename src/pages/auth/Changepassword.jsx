import styles from './login.module.css';
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from "../../config.js";
function ChangePassword() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* PASSWORD RULES */
  const hasLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid =
    hasLength && hasUpper && hasLower && hasNumber && hasSymbol;

  const doPasswordsMatch = password === confirmPassword;

  /* PASSWORD STRENGTH */
  const getPasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return "weak";
    if (strength === 3 || strength === 4) return "medium";
    return "strong";
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isPasswordValid) {
      Swal.fire({
        title: "Weak Password",
        text: "Password must contain 12 characters, uppercase, lowercase, number, and symbol.",
        imageUrl: "/images/error.png",
        imageWidth: 200,
        imageHeight: 200,
      });
      return;
    }

    if (!confirmPassword) {
      Swal.fire({
        title: "Missing Field",
        text: "Please confirm your password.",
        imageUrl: "/images/error.png",
        imageWidth: 200,
        imageHeight: 200,
      });
      return;
    }

    if (!doPasswordsMatch) {
      Swal.fire({
        title: "Password Mismatch",
        text: "Passwords do not match.",
        imageUrl: "/images/error.png",
        imageWidth: 200,
        imageHeight: 200,
      });
      return;
    }

    fetch(`${API_BASE}/change-password.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    })
      .then(res => res.json())
      .then(data => {

        if (!data.success) {
          Swal.fire({
            title: "Error",
            text: data.message,
            imageUrl: "/images/error.png",
            imageWidth: 200,
            imageHeight: 200,
          });
          return;
        }

        Swal.fire({
          title: "Success!",
          text: "Your password has been updated.",
          imageUrl: "/images/3.png",
          imageWidth: 200,
          imageHeight: 200,
        }).then(() => navigate("/login"));

      })
      .catch(() => {
        Swal.fire("Server Error", "Please try again later.", "error");
      });
  };


  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>

        <div className={styles.background}></div>

        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>

            <h2>Change Password</h2>

            <label>New Password</label>

            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <i
                className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.toggleEye}`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>


            {/* PASSWORD CHECKLIST */}

            {password.length > 0 && (
              <div className={styles.passwordChecklist}>

                <p className={hasLength ? styles.valid : styles.invalid}>
                  {hasLength ? "✓" : "✗"} At least 12 characters
                </p>

                <p className={hasUpper ? styles.valid : styles.invalid}>
                  {hasUpper ? "✓" : "✗"} Has uppercase letter
                </p>

                <p className={hasLower ? styles.valid : styles.invalid}>
                  {hasLower ? "✓" : "✗"} Has lowercase letter
                </p>

                <p className={hasNumber ? styles.valid : styles.invalid}>
                  {hasNumber ? "✓" : "✗"} Has number
                </p>

                <p className={hasSymbol ? styles.valid : styles.invalid}>
                  {hasSymbol ? "✓" : "✗"} Has special character (@#$ etc.)
                </p>

              </div>
            )}


            {/* PASSWORD STRENGTH */}

            {password.length > 0 && (
              <div
                className={`${styles.validationMessage} ${
                  passwordStrength === "strong"
                    ? styles.success
                    : passwordStrength === "medium"
                    ? styles.warning
                    : styles.error
                }`}
              >

                {passwordStrength === "weak" && "Weak password"}
                {passwordStrength === "medium" && "Medium strength password"}
                {passwordStrength === "strong" && "✓ Strong password"}

              </div>
            )}


            <label>Confirm New Password</label>

            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <i
                className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"} ${styles.toggleEye}`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>


            {/* PASSWORD MATCH CHECK */}

            {confirmPassword.length > 0 && (
              <div
                className={`${styles.validationMessage} ${
                  doPasswordsMatch ? styles.success : styles.error
                }`}
              >
                {doPasswordsMatch
                  ? "✓ Passwords match"
                  : "Passwords do not match"}
              </div>
            )}


          <button type="button" className={styles.loginBtn} onClick={handleSubmit}>
  Update Password
</button>

          </div>
        </div>

      </section>
    </div>
  );
}

export default ChangePassword;