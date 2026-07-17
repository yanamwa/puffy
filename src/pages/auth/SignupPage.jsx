import styles from "./login.module.css";
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";

function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentProof, setEmploymentProof] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const hasLength = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid =
    hasLength && hasUpper && hasLower && hasNumber && hasSymbol;

  const passwordsMatch = password === confirmPassword;

  const showError = (title, text) => {
    Swal.fire({
      imageUrl: "/images/error.png",
      imageWidth: 170,
      imageHeight: 170,
      title,
      text,
    });
  };

  const getPasswordStrength = (value) => {
    let strength = 0;

    if (value.length >= 12) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^A-Za-z0-9]/.test(value)) strength++;

    if (strength <= 2) return "weak";
    if (strength <= 4) return "medium";
    return "strong";
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setFacultyId("");
    setDepartment("");
    setEmploymentProof("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSignup = async () => {
    if (isSigningUp) return;

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      return showError("Username Required", "Please enter your username.");
    }

    if (!cleanEmail) {
      return showError("Email Required", "Please enter your email.");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return showError("Invalid Email", "Please enter a valid email address.");
    }

    if (!facultyId.trim()) {
      return showError(
        "Faculty ID Required",
        "Please enter your employee or faculty ID."
      );
    }

    if (!department.trim()) {
      return showError("Department Required", "Please enter your department.");
    }

    if (!password) {
      return showError("Password Required", "Please enter your password.");
    }

    if (!isPasswordValid) {
      return showError(
        "Weak Password",
        "Password must meet all security requirements."
      );
    }

    if (!confirmPassword) {
      return showError(
        "Confirm Password Required",
        "Please confirm your password."
      );
    }

    if (!passwordsMatch) {
      return showError("Password Mismatch", "Passwords do not match.");
    }

    try {
      setIsSigningUp(true);

      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanUsername,
          email: cleanEmail,
          password,
          role: "professor",
          facultyId: facultyId.trim(),
          department: department.trim(),
          employmentProof: employmentProof.trim(),
        }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        message: "Server returned an invalid response.",
      }));

      if (!res.ok || !data.success) {
        return showError(
          "Signup Failed",
          data.message || "Unable to create account."
        );
      }

      sessionStorage.setItem("otp_email", cleanEmail);

      await Swal.fire({
        imageUrl: "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Verification Code Sent",
        text:
          "Please verify your email. After that, the Super Admin will approve or decline your professor account.",
        confirmButtonText: "Continue",
      });

      resetForm();

      navigate("/otp", {
        state: { email: cleanEmail },
      });
    } catch (err) {
      showError(
        "Server Error",
        "Cannot connect to the server. Make sure your Node.js backend is running."
      );
    } finally {
      setIsSigningUp(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>
        <LandingNavbar />

        <div className={styles.signupContainer}>
          <div className={styles.signupCard} style={{ marginTop: "50px" }}>
            <div className={styles.roleHeader}>
              <span className={styles.selectedRolePill}>Professor</span>
            </div>

            <h2>Create a Professor Account</h2>
            <p className={styles.roleIntro}>
              Register your professor account for Super Admin review.
            </p>

            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Employee or Faculty ID</label>
            <input
              type="text"
              placeholder="Enter your employee or faculty ID"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
            />

            <label>Department</label>
            <input
              type="text"
              placeholder="Enter your department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <label>Proof of Employment</label>
            <input
              type="text"
              placeholder="Paste a document link or proof reference"
              value={employmentProof}
              onChange={(e) => setEmploymentProof(e.target.value)}
            />

            <label>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } ${styles.toggleEye}`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            {password.length > 0 && (
              <div className={styles.passwordChecklist}>
                <p className={hasLength ? styles.valid : styles.invalid}>
                  {hasLength ? "OK" : "X"} At least 12 characters
                </p>
                <p className={hasUpper ? styles.valid : styles.invalid}>
                  {hasUpper ? "OK" : "X"} Has uppercase letter
                </p>
                <p className={hasLower ? styles.valid : styles.invalid}>
                  {hasLower ? "OK" : "X"} Has lowercase letter
                </p>
                <p className={hasNumber ? styles.valid : styles.invalid}>
                  {hasNumber ? "OK" : "X"} Has number
                </p>
                <p className={hasSymbol ? styles.valid : styles.invalid}>
                  {hasSymbol ? "OK" : "X"} Has special character
                </p>
              </div>
            )}

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
                {passwordStrength === "strong" && "Strong password"}
              </div>
            )}

            <label>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <i
                className={`fa-solid ${
                  showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                } ${styles.toggleEye}`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></i>
            </div>

            {confirmPassword.length > 0 && (
              <div
                className={`${styles.validationMessage} ${
                  passwordsMatch ? styles.success : styles.error
                }`}
              >
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </div>
            )}

            <button
              className={styles.loginBtn}
              onClick={handleSignup}
              disabled={isSigningUp}
            >
              {isSigningUp ? "Registering..." : "Register Professor Account"}
            </button>

            <p className={styles.termsText}>
              Student accounts are created by the Super Admin.
            </p>

            <p className={styles.signinText}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Signup;
