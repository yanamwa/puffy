import styles from "./login.module.css";
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";

const ROLE_DETAILS = {
  student: {
    title: "Create a Student Account",
    choiceTitle: "Student",
    choiceText: "Sign up with your Student ID for student access.",
    description: "Enter your Student ID so your student account can be verified.",
    verificationLabel: "Student ID",
    verificationPlaceholder: "Enter your Student ID",
    verificationErrorTitle: "Student ID Required",
    verificationErrorText: "Please enter your Student ID.",
    buttonLabel: "Student",
  },
  professor: {
    title: "Create a Professor Account",
    choiceTitle: "Professor",
    choiceText: "Sign up with your Professor ID for professor access.",
    description:
      "Enter your Professor ID so your professor account can be verified.",
    verificationLabel: "Professor ID",
    verificationPlaceholder: "Enter your Professor ID",
    verificationErrorTitle: "Professor Verification Required",
    verificationErrorText: "Please enter your Professor ID.",
    buttonLabel: "Professor",
  },
};

function Signup() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const roleDetails = selectedRole ? ROLE_DETAILS[selectedRole] : null;

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
    setVerificationId("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSignup = async () => {
    if (isSigningUp) return;

    if (!selectedRole || !roleDetails) {
      return showError(
        "Account Type Required",
        "Please choose Student or Professor first."
      );
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanVerificationId = verificationId.trim();

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

    if (!cleanVerificationId) {
      return showError(
        roleDetails.verificationErrorTitle,
        roleDetails.verificationErrorText
      );
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
          role: selectedRole,
          verificationId: cleanVerificationId,
          studentId: selectedRole === "student" ? cleanVerificationId : null,
          professorId:
            selectedRole === "professor" ? cleanVerificationId : null,
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
        text: "Please check your email for the OTP.",
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
            {!selectedRole ? (
              <>
                <h2>Choose Account Type</h2>
                <p className={styles.roleIntro}>
                  Select the type of account you want to create.
                </p>

                <div className={styles.roleOptions}>
                  {Object.entries(ROLE_DETAILS).map(([role, details]) => (
                    <button
                      key={role}
                      type="button"
                      className={styles.roleChoice}
                      onClick={() => setSelectedRole(role)}
                    >
                      <span className={styles.roleChoiceTitle}>
                        {details.choiceTitle}
                      </span>
                      <span className={styles.roleChoiceText}>
                        {details.choiceText}
                      </span>
                    </button>
                  ))}
                </div>

                <p className={styles.signinText}>
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <div className={styles.roleHeader}>
                  <button
                    type="button"
                    className={styles.roleBackBtn}
                    onClick={() => setSelectedRole("")}
                  >
                    Back
                  </button>
                  <span className={styles.selectedRolePill}>
                    {roleDetails.choiceTitle}
                  </span>
                </div>

                <h2>{roleDetails.title}</h2>
                <p className={styles.roleIntro}>{roleDetails.description}</p>

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

                <label>{roleDetails.verificationLabel}</label>
                <input
                  type="text"
                  placeholder={roleDetails.verificationPlaceholder}
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
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
                    {passwordStrength === "medium" &&
                      "Medium strength password"}
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
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  ></i>
                </div>

                {confirmPassword.length > 0 && (
                  <div
                    className={`${styles.validationMessage} ${
                      passwordsMatch ? styles.success : styles.error
                    }`}
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </div>
                )}

                <button
                  className={styles.loginBtn}
                  onClick={handleSignup}
                  disabled={isSigningUp}
                >
                  {isSigningUp
                    ? "Signing Up..."
                    : `Create ${roleDetails.buttonLabel} Account`}
                </button>

                <p className={styles.termsText}>
                  By signing up, you agree to Terms and Privacy policies
                </p>

                <p className={styles.signinText}>
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Signup;
