import styles from "./Profile.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";
import {
  getCurrentEmail,
  getCurrentRole,
  getDashboardPath,
  updateStoredUser,
} from "./onboardingData.js";

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleStart = async () => {
    const email = getCurrentEmail();

    if (!email) {
      Swal.fire("Error", "User not logged in", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/onboarding/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        updateStoredUser(data.user || {});
        navigate(data.redirectPath || getDashboardPath(data.user?.role || getCurrentRole()), {
          replace: true,
        });
      } else {
        Swal.fire("Error", data.message || "Could not complete onboarding.", "error");
      }
    } catch {
      Swal.fire("Server Error", "Could not complete onboarding.", "error");
    }
  };

  useEffect(() => {
    const email = getCurrentEmail();

    if (!email) {
      Swal.fire({
        imageUrl: "/images/error.png",
        imageWidth: 180,
        imageHeight: 180,
        title: "Not Logged In",
        text: "Please log in first.",
      });
      return;
    }

    fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          updateStoredUser(data.user || {});
          setUser(data.user);
        } else {
          Swal.fire("Error", data.message || "Could not load profile.", "error");
        }
      })
      .catch(() => {
        Swal.fire("Server Error", "Could not load profile.", "error");
      });
  }, []);

  if (!user) return null;

  const role = user.role || getCurrentRole();
  const isProfessor = role === "professor";
  const displayName = user.displayName || user.display_name || user.name || "Not set";
  const yearLevel = user.yearLevel || user.year_level || "Not set";
  const sectionName = user.sectionName || user.section_name || "Not set";

  return (
    <div className={styles.wrapper}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Great!</h1>
        <h2 className={styles.subtitle}>You are all set!</h2>
      </div>

      <div className={styles.cardContainer}>
        <div className={styles.photo}>
          <img src="/images/fri.jpg" alt="Profile" />
          <div className={styles.barcode}></div>
        </div>

        <div className={styles.idDetails}>
          <h3 className={styles.idTitle}>
            {isProfessor ? "Professor ID Card" : "Student ID Card"}
          </h3>

          <p className={`${styles.info} ${styles.infoRow}`}>
            <span>Name: {displayName}</span>
            <span className={styles.year}>
              {isProfessor ? "Teaching" : "Year"}: {yearLevel}
            </span>
          </p>

          <p className={styles.info}>
            {isProfessor ? "Handles" : "Section"}: {sectionName}
          </p>

          <p className={styles.info}>
            Signature:
            <span className={styles.signature}>{displayName}</span>
          </p>
        </div>
      </div>

      <div className={styles.footer}>
        <h2 className={styles.footerTitle}>Have fun learning!</h2>

        <button onClick={handleStart} className={styles.submitBtn}>
          Start
        </button>
      </div>
    </div>
  );
}

export default Profile;
