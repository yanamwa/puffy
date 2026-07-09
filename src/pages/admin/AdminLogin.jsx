import styles from "./loginA.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const admin = localStorage.getItem("admin");
    const adminId = localStorage.getItem("admin_id");

    if (admin && adminId) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

const handleLogin = async () => {
  if (!username.trim() || !password.trim()) {
    Swal.fire({
      imageUrl: "/images/error.png",
      imageWidth: 170,
      imageHeight: 170,
      title: "Missing Information",
      text: "Please enter both username and password.",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/AdminLogin.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });

    const text = await res.text();
    console.log("RAW ADMIN LOGIN RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "PHP/JSON Error",
        html: `<pre style="text-align:left;white-space:pre-wrap;font-size:12px;">${text}</pre>`,
      });
      return;
    }

    if (data.success) {
      const adminData = data.admin || {};
      const adminId =
        data.admin_id ||
        adminData.id ||
        adminData.AdminID ||
        adminData.admin_id;

      if (!adminId) {
        Swal.fire({
          imageUrl: "/images/error.png",
          imageWidth: 170,
          imageHeight: 170,
          title: "Login Storage Error",
          text: "Login succeeded, but admin ID was missing from PHP response.",
        });
        return;
      }

      localStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.setItem("admin_id", String(adminId));

      Swal.fire({
        imageUrl: "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Successfully Logged In",
        text: data.message || "Welcome back, admin!",
      }).then(() => {
        navigate("/admin/dashboard", { replace: true });
      });
    } else {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        title: "Login Failed",
        text: data.message || "Invalid username or password.",
      });
    }
  } catch (err) {
    Swal.fire({
      imageUrl: "/images/error.png",
      imageWidth: 170,
      imageHeight: 170,
      title: "Server Error",
      text: err.message,
    });

    console.error(err);
  }
};
  return (
    <div className={styles.wrapper}>
      <section className={styles.container}>
        <div className={styles.background}></div>

        <div className={styles.signupContainer}>
          <div className={styles.signupCard}>
            <h2>Admin Login</h2>

            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
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
                  if (e.key === "Enter") handleLogin();
                }}
              />

              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } ${styles.toggleEye}`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <button className={styles.loginBtn} onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminLogin;