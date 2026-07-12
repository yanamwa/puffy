import styles from "./Info.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";
import {
  getCurrentEmail,
  getCurrentRole,
  getStoredUser,
  updateStoredUser,
} from "./onboardingData.js";

function Name() {
  const storedUser = getStoredUser();
  const [displayName, setDisplayName] = useState(
    storedUser.displayName ||
      storedUser.name ||
      localStorage.getItem("username") ||
      ""
  );
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isProfessor = role === "professor";

  const handleSubmit = async () => {
    const selectedName = displayName.trim();
    const email = getCurrentEmail();

    if (!selectedName) {
      Swal.fire("Name Required", "Please enter what we should call you.", "warning");
      return;
    }

    if (!email) {
      Swal.fire("Error", "User not identified. Please log in again.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/onboarding/name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          displayName: selectedName,
        }),
      });

      const text = await res.text();
      console.log("RAW NAME RESPONSE:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      if (data.success) {
        updateStoredUser({
          ...(data.user || {}),
          name: data.user?.name || selectedName,
          displayName: data.user?.displayName || selectedName,
          display_name: data.user?.display_name || selectedName,
          role,
          email,
        });
        navigate("/year");
      } else {
        Swal.fire("Error", data.message || "Could not update your name.", "error");
      }
    } catch (error) {
      console.error("UPDATE NAME ERROR:", error);
      Swal.fire("Server Error", "Could not update your name.", "error");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.notebook}>
        <div className={styles.tabs}>
          <div className={styles.tab}>welcome</div>
          <div className={styles.tab}>how-it-works</div>
          <div className={`${styles.tab} ${styles.active}`}>about-you</div>
        </div>

        <div className={styles.bookmark}></div>

        <div className={styles.page}>
          <h1>
            {isProfessor
              ? "What should we call you, Professor?"
              : "What should we call you?"}
          </h1>

          <input
            className={styles.textInput}
            type="text"
            value={displayName}
            placeholder={isProfessor ? "Professor name" : "Your name"}
            onChange={(event) => setDisplayName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
          />

          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default Name;
