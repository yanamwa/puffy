import styles from "./Info.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config.js";
import Swal from "sweetalert2";
import {
  getCurrentEmail,
  getCurrentRole,
  getCurrentYear,
  updateStoredUser,
  YEAR_OPTIONS,
} from "./onboardingData.js";

function Year() {
  const [year, setYear] = useState(getCurrentYear());
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isProfessor = role === "professor";

  const handleSubmit = async () => {
    if (!year) {
      Swal.fire("Select Year", "Please select a year level.", "warning");
      return;
    }

    const email = getCurrentEmail();

    console.log("EMAIL FROM STORAGE:", email);

    if (!email) {
      Swal.fire("Error", "User not logged in", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/onboarding/year`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          year_level: year,
        }),
      });

      const text = await res.text();
      console.log("RAW YEAR RESPONSE:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (data.success) {
        updateStoredUser({
          ...(data.user || {}),
          yearLevel: data.user?.yearLevel || year,
          year_level: data.user?.year_level || year,
          sectionName: "",
          section_name: "",
          role,
          email,
        });
        localStorage.removeItem("section_name");
        navigate("/section");
      } else {
        Swal.fire(
          "Error",
          data.message || "Could not update year level.",
          "error"
        );
      }
    } catch (error) {
      console.error("UPDATE YEAR ERROR:", error);

      Swal.fire("Server Error", "Could not update year level.", "error");
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
              ? "Which year level do you teach?"
              : "Select your year level"}
          </h1>

          <select
            className={styles.schoolSelect}
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="">Select year</option>
            {YEAR_OPTIONS.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>

          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default Year;
