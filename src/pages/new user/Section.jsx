import styles from "./Info.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";
import {
  getCurrentEmail,
  getCurrentRole,
  getCurrentYear,
  getSectionOptions,
  updateStoredUser,
} from "./onboardingData.js";

function Section() {
  const [section, setSection] = useState("");
  const [yearLevel, setYearLevel] = useState(getCurrentYear());
  const navigate = useNavigate();
  const role = getCurrentRole();
  const isProfessor = role === "professor";
  const sectionOptions = getSectionOptions(yearLevel);

  useEffect(() => {
    const email = getCurrentEmail();

    if (yearLevel || !email) return;

    fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.user) {
          updateStoredUser(data.user);
          setYearLevel(data.user.yearLevel || data.user.year_level || "");
        }
      })
      .catch(() => {});
  }, [yearLevel]);

  const handleSubmit = async () => {
    const email = getCurrentEmail();

    if (!email) {
      Swal.fire("Error", "User not logged in", "error");
      return;
    }

    if (!yearLevel) {
      Swal.fire("Select Year", "Please select your year level first.", "warning");
      navigate("/year");
      return;
    }

    if (!section) {
      Swal.fire("Select Section", "Please select a section.", "warning");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/onboarding/section`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          year_level: yearLevel,
          section_name: section,
        }),
      });

      const text = await res.text();
      console.log("RAW SECTION RESPONSE:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (data.success) {
        updateStoredUser({
          ...(data.user || {}),
          sectionName: data.user?.sectionName || section,
          section_name: data.user?.section_name || section,
          role,
          email,
        });
        navigate("/profile");
      } else {
        Swal.fire("Error", data.message || "Could not update section.", "error");
      }
    } catch (error) {
      console.error("UPDATE SECTION ERROR:", error);
      Swal.fire("Server Error", "Could not update section.", "error");
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
              ? "Which section do you handle?"
              : "Which section are you in?"}
          </h1>

          <select
            className={styles.schoolSelect}
            value={section}
            onChange={(event) => setSection(event.target.value)}
          >
            <option value="">
              {yearLevel ? `Select ${yearLevel} section` : "Select section"}
            </option>
            {sectionOptions.map((option) => (
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

export default Section;
