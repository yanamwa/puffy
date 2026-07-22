import styles from "./login.module.css";
import { useState } from "react";
import Swal from "sweetalert2";
import {
  useNavigate,
  Link,
} from "react-router-dom";
import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginAttempts, setLoginAttempts] =
    useState(0);

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const MAX_ATTEMPTS = 10;

  const showLoginError = (message) => {
    Swal.fire({
      imageUrl: "/images/error.png",
      imageWidth: 170,
      imageHeight: 170,
      title: "Login Failed",
      text: message,
    });
  };

  const handleDeletedAccount = async (
    data
  ) => {
    const result = await Swal.fire({
      imageUrl: "/images/error.png",
      imageWidth: 170,
      imageHeight: 170,
      title: "Account Deleted",
      text: "This account was deleted. Do you want to recover it?",
      showCancelButton: true,
      confirmButtonText: "Recover Account",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#999",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const otpRes = await fetch(
        `${API_BASE}/send-recovery-otp.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username:
              data.username ||
              username
                .trim()
                .toLowerCase(),
          }),
        }
      );

      const otpData = await otpRes
        .json()
        .catch(() => ({}));

      console.log(
        "RECOVERY OTP RESPONSE:",
        otpData
      );

      if (!otpRes.ok || !otpData.success) {
        Swal.fire({
          imageUrl: "/images/error.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Failed",
          text:
            otpData.message ||
            "Could not send verification code.",
        });

        return;
      }

      await Swal.fire({
        imageUrl:
          "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        title:
          "Verification Code Sent",
        text:
          "Please check your email for the recovery code.",
      });

      navigate("/recover-account", {
        state: {
          username:
            data.username ||
            username
              .trim()
              .toLowerCase(),

          email:
            otpData.email ||
            data.email ||
            username
              .trim()
              .toLowerCase(),
        },
      });
    } catch (otpError) {
      console.error(
        "RECOVERY OTP ERROR:",
        otpError
      );

      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Server Error",
        text:
          "Failed to send verification code.",
      });
    }
  };

  const redirectUser = async (
    data,
    loggedInUser
  ) => {
    const role =
      loggedInUser?.role ||
      data.user?.role ||
      "student";

    const mustChangePassword =
      loggedInUser?.mustChangePassword ===
        true ||
      loggedInUser?.must_change_password ===
        true ||
      Number(
        loggedInUser?.must_change_password
      ) === 1;

    if (
      role === "student" &&
      mustChangePassword
    ) {
      await Swal.fire({
        imageUrl:
          "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        title:
          "Password Update Required",
        text:
          "Please change your temporary password.",
      });

      navigate("/student/settings", {
        replace: true,
      });

      return;
    }

    if (data.isNewUser) {
      await Swal.fire({
        imageUrl:
          "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Welcome!",
        text: "Let's get you started",
      });

      navigate("/welcome", {
        replace: true,
      });

      return;
    }

    await Swal.fire({
      imageUrl:
        "/images/success.png",
      imageWidth: 170,
      imageHeight: 170,
      title: "Welcome back!",
      text:
        "Redirecting to your dashboard",
      timer: 1200,
      showConfirmButton: false,
    });

    if (role === "super_admin") {
      navigate("/super-admin", {
        replace: true,
      });
    } else if (role === "admin") {
      navigate("/admin", {
        replace: true,
      });
    } else if (role === "professor") {
      navigate("/professor", {
        replace: true,
      });
    } else {
      navigate("/student", {
        replace: true,
      });
    }
  };

  const handleLogin = async () => {
    const email = username
      .trim()
      .toLowerCase();

    if (!email || !password) {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Missing Fields",
        text:
          "Please enter email and password",
      });

      return;
    }

    if (
      loginAttempts >= MAX_ATTEMPTS
    ) {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Too Many Attempts",
        text:
          "You reached the maximum login attempts. Please try again later.",
      });

      return;
    }

    if (isLoggingIn) {
      return;
    }

    try {
      setIsLoggingIn(true);

      const res = await fetch(
        `${API_BASE}/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => ({}));

      console.log(
        "LOGIN RESPONSE:",
        data
      );

      if (!res.ok || !data.success) {
        const accountDeleted =
          data.account_deleted ===
            true ||
          data.account_deleted === 1 ||
          data.account_deleted ===
            "1" ||
          data.account_deleted ===
            "true";

        if (accountDeleted) {
          await handleDeletedAccount(
            data
          );

          return;
        }

        const newAttempts =
          loginAttempts + 1;

        setLoginAttempts(newAttempts);

        const attemptsLeft =
          Math.max(
            MAX_ATTEMPTS -
              newAttempts,
            0
          );

        showLoginError(
          data.message ||
            `Invalid credentials. Attempts left: ${attemptsLeft}`
        );

        return;
      }

      setLoginAttempts(0);
      const token =
        data.token ||
        data.accessToken ||
        data.access_token ||
        "";

      if (token) {
        localStorage.setItem(
          "token",
          token
        );

        localStorage.setItem(
          "authToken",
          token
        );
      }
      const sessionResult =
        saveSession(data);

      const loggedInUser =
        sessionResult ||
        data.user ||
        null;

      if (loggedInUser) {
        localStorage.setItem(
          "user",
          JSON.stringify(
            loggedInUser
          )
        );

        localStorage.setItem(
          "currentUser",
          JSON.stringify(
            loggedInUser
          )
        );
      }

      await redirectUser(
        data,
        loggedInUser
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Server Error",
        text:
          "Could not connect to the server. Please check that your backend is running.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section
        className={styles.container}
      >
        <div
          className={styles.background}
        ></div>

<header className={styles.loginNavbar}>
  <nav className={styles.loginNavbarInner}>
    <Link to="/" className={styles.loginNavLink}>
      Home
    </Link>

    <Link to="/about" className={styles.loginNavLink}>
      About
    </Link>

    <Link to="/" className={styles.loginBrand}>
      <img
        src="/images/logo_solo.png"
        alt="PuffyBrain logo"
      />

      <span>PuffyBrain</span>
    </Link>

    <Link to="/faq" className={styles.loginNavLink}>
      FAQ
    </Link>

    <Link to="/contact" className={styles.loginNavLink}>
      Contact us
    </Link>
  </nav>
</header>

        <div
          className={
            styles.signupContainer
          }
        >
          <div
            className={
              styles.signupCard
            }
          >
            <h2>Login</h2>

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={username}
              autoComplete="email"
              disabled={isLoggingIn}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
            />

            <label>Password</label>

            <div
              className={
                styles.passwordWrapper
              }
            >
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                disabled={isLoggingIn}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    handleLogin();
                  }
                }}
              />

              <i
                role="button"
                tabIndex={0}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className={`fa-solid ${
                  showPassword
                    ? "fa-eye-slash"
                    : "fa-eye"
                } ${
                  styles.toggleEye
                }`}
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                      "Enter" ||
                    e.key === " "
                  ) {
                    e.preventDefault();

                    setShowPassword(
                      (current) =>
                        !current
                    );
                  }
                }}
              />
            </div>

            <p
              className={styles.forgot}
            >
              <Link to="/forgot">
                Forgot your password?
              </Link>
            </p>

            <button
              type="button"
              className={
                styles.loginBtn
              }
              disabled={isLoggingIn}
              onClick={handleLogin}
            >
              {isLoggingIn
                ? "Logging in..."
                : "Login"}
            </button>

            <p
              className={
                styles.signupText
              }
            >
              Don&apos;t have an
              account?{" "}
              <Link to="/signup">
                Signup
              </Link>
            </p>

            <p
              className={
                styles.signupText
              }
            >
              <Link to="/cant-signin">
                Can&apos;t sign in?
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;