import styles from "./login.module.css";
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../config.js";
import LandingNavbar from "../../components/LandingNavbar";
import { useAuth } from "../../context/AuthContext.jsx";

function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const MAX_ATTEMPTS = 10;

  const handleLogin = async () => {
    if (!username || !password) {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Missing Fields",
        text: "Please enter email and password",
      });
      return;
    }

    if (loginAttempts >= MAX_ATTEMPTS) {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Too Many Attempts",
        text: "You reached the maximum login attempts. Please try again later.",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (!data.success) {

        if (
          data.account_deleted === true ||
          data.account_deleted === 1 ||
          data.account_deleted === "1" ||
          data.account_deleted === "true"
        ) {

          Swal.fire({
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
          }).then(async (result) => {

            if (result.isConfirmed) {

              try {

                const otpRes = await fetch(
                  `${API_BASE}/send-recovery-otp.php`,
                  {
                    method: "POST",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      username: data.username || username,
                    }),
                  }
                );

                const otpData = await otpRes.json();

                console.log("RECOVERY OTP RESPONSE:", otpData);

                if (otpData.success) {

                  Swal.fire({
                    imageUrl: "/images/success.png",
                    imageWidth: 170,
                    imageHeight: 170,
                    title: "Verification Code Sent",
                    text: "Please check your email for the recovery code.",
                  }).then(() => {

                    navigate("/recover-account", {
                      state: {
                        username: data.username || username,
                        email: otpData.email || data.email || "",
                      },
                    });

                  });

                } else {

                  Swal.fire({
                    imageUrl: "/images/error.png",
                    imageWidth: 170,
                    imageHeight: 170,
                    title: "Failed",
                    text:
                      otpData.message ||
                      "Could not send verification code.",
                  });

                }

              } catch (otpError) {

                console.error("OTP ERROR:", otpError);

                Swal.fire({
                  imageUrl: "/images/error.png",
                  imageWidth: 170,
                  imageHeight: 170,
                  title: "Server Error",
                  text: "Failed to send verification code.",
                });

              }

            }

          });

          return;
        }

        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        Swal.fire({
          imageUrl: "/images/error.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Login Failed",
          text:
            data.message ||
            `Invalid credentials. Attempts left: ${
              MAX_ATTEMPTS - newAttempts
            }`,
        });

        return;
      }

      setLoginAttempts(0);

      const loggedInUser = saveSession(data);

      const mustChangePassword =
        loggedInUser.mustChangePassword ||
        loggedInUser.must_change_password === 1 ||
        loggedInUser.must_change_password === true;

      if (loggedInUser.role === "student" && mustChangePassword) {
        Swal.fire({
          imageUrl: "/images/success.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Password Update Required",
          text: "Please change your temporary password.",
        }).then(() => navigate("/student/settings"));
      } else if (data.isNewUser) {

        Swal.fire({
          imageUrl: "/images/success.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Welcome!",
          text: "Let's get you started",
        }).then(() => navigate("/welcome"));

      } else {

        Swal.fire({
          imageUrl: "/images/success.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Welcome back!",
          text: "Redirecting to your dashboard",
        }).then(() => {
          const role = data.user?.role;

          if (role === "super_admin") {
            navigate("/super-admin");
          } else if (role === "admin") {
            navigate("/admin");
          } else if (role === "professor") {
            navigate("/professor");
          } else {
            navigate("/student");
          }
        });

      }

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Server Error",
        text: "Something went wrong.",
      });

    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>
        <LandingNavbar />
        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>

            <h2>Login</h2>

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password</label>

            <div className={styles.passwordWrapper}>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />

              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } ${styles.toggleEye}`}
                onClick={() => setShowPassword(!showPassword)}
              />

            </div>

            <p className={styles.forgot}>
              <Link to="/forgot">Forgot your password?</Link>
            </p>

            <button
              className={styles.loginBtn}
              onClick={handleLogin}
            >
              Login
            </button>

            <p className={styles.signupText}>
              Don't have an account?{" "}
              <Link to="/signup">Signup</Link>
            </p>

            <p className={styles.signupText}>
              <Link to="/cant-signin">
                Can't sign in?
              </Link>
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
