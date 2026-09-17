import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import StudentSidebar from "../../components/students/StudentSidebar";
import StudentHeader from "../../components/students/StudentHeader";
import { Avatar, SortToggle } from "./EnrolledCourses";
import JoinCourseModal from "./JoinCourseModal";

import { PROFESSOR_COURSES_EVENT } from "../professor/professorData";
import {
  findJoinableCourseByCodeAsync,
  loadPublicStudentCourses,
} from "./studentCourseData";

import "./EnrolledCourses.css";
import "./PublicCourses.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_PROFILE_IMAGE = "/images/temporary profile.jpg";

function resolveProfileImage(imagePath) {
  if (!imagePath) return DEFAULT_PROFILE_IMAGE;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, "");

  return `${serverOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("puffy-token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken")
  );
}

function getCourseTitle(course) {
  return (
    course.title ||
    course.courseName ||
    course.course_name ||
    "Untitled course"
  );
}

function getCourseKey(course) {
  return String(
    course?.id ||
      course?.courseId ||
      course?.course_id ||
      course?.code ||
      course?.courseCode ||
      course?.course_code ||
      ""
  ).trim();
}

function getCourseTimestamp(course) {
  const rawDate =
    course?.updatedAt ||
    course?.updated_at ||
    course?.createdAt ||
    course?.created_at ||
    "";

  const timestamp = Date.parse(rawDate);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getProfessorDepartment(course) {
  return (
    course.professorDepartment ||
    course.professor_department ||
    "Department not set"
  );
}

function normalizeCourse(course) {
  return {
    ...course,
    id:
      course.id ||
      course.courseId ||
      course.course_id ||
      course.courseCode ||
      course.course_code,

    code:
      course.code ||
      course.courseCode ||
      course.course_code ||
      "COURSE",

    title:
      course.title ||
      course.courseName ||
      course.course_name ||
      course.name ||
      "Untitled course",
  };
}

export default function PublicCourses() {
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");

  const [publicCourses, setPublicCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateSort, setDateSort] = useState("Recent");
  const [titleSort, setTitleSort] = useState("A to Z");
  const [activeSort, setActiveSort] = useState("date");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const enrolledCourseKeys = useMemo(
    () => new Set(enrolledCourses.map(getCourseKey).filter(Boolean)),
    [enrolledCourses]
  );

  const visiblePublicCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return publicCourses
      .filter((course) => {
        if (!query) return true;

        return [
          getCourseTitle(course),
          course.code,
          course.courseCode,
          course.course_code,
          course.instructor,
          getProfessorDepartment(course),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((firstCourse, secondCourse) => {
        if (activeSort === "title") {
          const direction = titleSort === "A to Z" ? 1 : -1;

          return (
            getCourseTitle(firstCourse).localeCompare(
              getCourseTitle(secondCourse)
            ) * direction
          );
        }

        const direction = dateSort === "Recent" ? -1 : 1;

        const timestampDifference =
          getCourseTimestamp(firstCourse) -
          getCourseTimestamp(secondCourse);

        if (timestampDifference !== 0) {
          return timestampDifference * direction;
        }

        return getCourseTitle(firstCourse).localeCompare(
          getCourseTitle(secondCourse)
        );
      });
  }, [
    activeSort,
    dateSort,
    publicCourses,
    searchQuery,
    titleSort,
  ]);

  const loadEnrolledCourses = async () => {
    try {
      const token = getStoredToken();

      if (!token) {
        setEnrolledCourses([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/courses/enrolled?summaryOnly=true`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load enrolled courses."
        );
      }

      const loadedCourses = Array.isArray(data.courses)
        ? data.courses
        : Array.isArray(data.data)
          ? data.data
          : [];

      setEnrolledCourses(loadedCourses.map(normalizeCourse));
    } catch (error) {
      console.error("Enrolled courses loading error:", error);
      setEnrolledCourses([]);
    }
  };

  useEffect(() => {
    let active = true;

    const refreshCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const courses = await loadPublicStudentCourses();

        if (active) {
          setPublicCourses(Array.isArray(courses) ? courses : []);
        }
      } catch (error) {
        if (active) {
          setPublicCourses([]);
          setErrorMessage(
            error.message || "Could not load public courses."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const handleRefresh = () => {
      refreshCourses();
      loadEnrolledCourses();
    };

    refreshCourses();
    loadEnrolledCourses();

    window.addEventListener(PROFESSOR_COURSES_EVENT, handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(
        PROFESSOR_COURSES_EVENT,
        handleRefresh
      );
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode("");
  };

  const confirmEnrollment = async (course) => {
    const courseTitle = getCourseTitle(course);

    const result = await Swal.fire({
      title: "Do you want to enroll in this course?",
      text: courseTitle,
      imageUrl: "/images/asking.png",
      imageWidth: 180,
      imageHeight: 180,
      showCancelButton: true,
      confirmButtonText: "Send Request",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "enroll-popup",
        confirmButton: "enroll-confirm-btn",
        cancelButton: "enroll-cancel-btn",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) {
      return false;
    }

    try {
      const token = getStoredToken();

      if (!token) {
        throw new Error(
          "You must be logged in to send an enrollment request."
        );
      }

      const courseId =
        course.id ||
        course.courseId ||
        course.course_id;

      const selectedCourseCode =
        course.code ||
        course.courseCode ||
        course.course_code ||
        "";

      if (!courseId && !selectedCourseCode) {
        throw new Error("Unable to identify this course.");
      }

      const response = await fetch(
        `${API_BASE_URL}/courses/enroll`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId,
            courseCode: selectedCourseCode,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (
        response.status === 409 &&
        data.status === "pending"
      ) {
        await Swal.fire({
          title: "Request already sent",
          text:
            data.message ||
            `Your enrollment request for ${courseTitle} is still waiting for professor approval.`,
          imageUrl: "/images/asking.png",
          imageWidth: 160,
          imageHeight: 160,
          confirmButtonText: "OK",
          confirmButtonColor: "#198754",
        });

        return false;
      }

      if (
        response.status === 409 &&
        data.status === "approved"
      ) {
        await Swal.fire({
          title: "Already enrolled",
          text:
            data.message ||
            `You are already enrolled in ${courseTitle}.`,
          imageUrl: "/images/success.png",
          imageWidth: 160,
          imageHeight: 160,
          confirmButtonText: "OK",
          confirmButtonColor: "#198754",
        });

        await loadEnrolledCourses();
        return false;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not send enrollment request."
        );
      }

      await Swal.fire({
        title: "Enrollment request sent!",
        text:
          data.message ||
          `Your request to join ${courseTitle} is waiting for professor approval.`,
        imageUrl: "/images/success.png",
        imageWidth: 170,
        imageHeight: 170,
        confirmButtonText: "OK",
        confirmButtonColor: "#198754",
      });

      return true;
    } catch (error) {
      console.error("Enrollment request error:", error);

      await Swal.fire({
        title: "Unable to send request",
        text:
          error.message ||
          "Could not send your enrollment request. Please try again.",
        imageUrl: "/images/error.png",
        imageWidth: 170,
        imageHeight: 170,
        confirmButtonText: "OK",
        confirmButtonColor: "#858d9b",
      });

      return false;
    }
  };

  const joinByCourseCode = async () => {
    try {
      const trimmedCode = courseCode.trim();

      if (!trimmedCode) {
        await Swal.fire({
          icon: "warning",
          title: "Enter Course Code",
          text: "Please enter the course code provided by your professor.",
          confirmButtonText: "OK",
          confirmButtonColor: "#198754",
        });

        return;
      }

      const course =
        await findJoinableCourseByCodeAsync(trimmedCode);

      if (!course) {
        await Swal.fire({
          icon: "error",
          title: "Course Not Found",
          text: "Course code not found. Please check the code from your professor.",
          confirmButtonText: "OK",
          confirmButtonColor: "#198754",
        });

        return;
      }

      closeJoinModal();
      await confirmEnrollment(course);
    } catch (error) {
      console.error("Join course error:", error);

      await Swal.fire({
        icon: "error",
        title: "Unable to Join Course",
        text:
          error?.message ||
          "Unable to find or request enrollment for this course.",
        confirmButtonText: "OK",
        confirmButtonColor: "#198754",
      });
    }
  };

  return (
    <div className="public-courses-page">
      <StudentSidebar />

      <div className="public-courses-main-area">
        <StudentHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search your course"
          onJoinCourse={() => setJoinModalOpen(true)}
        />

        <main className="public-courses-content">
          <section className="public-heading">
            <h1>Public Courses</h1>

            <div className="filter-actions">
              <span className="sort-by-label">Sort by</span>

              <SortToggle
                options={["Recent", "Oldest"]}
                value={dateSort}
                onChange={(value) => {
                  setDateSort(value);
                  setActiveSort("date");
                }}
              />

              <SortToggle
                options={["A to Z", "Z to A"]}
                value={titleSort}
                onChange={(value) => {
                  setTitleSort(value);
                  setActiveSort("title");
                }}
              />
            </div>
          </section>

          <section
            className="public-courses-grid"
            aria-label="Public courses"
          >
            {loading ? (
              <div className="student-empty-state">
                Loading public courses...
              </div>
            ) : errorMessage ? (
              <div className="student-empty-state">
                {errorMessage}
              </div>
            ) : visiblePublicCourses.length === 0 ? (
              <div className="student-empty-state">
                {publicCourses.length === 0
                  ? "No public courses available yet."
                  : "No public courses match your search."}
              </div>
            ) : (
              visiblePublicCourses.map((course) => {
                const courseEnrolled =
                  enrolledCourseKeys.has(getCourseKey(course));

                return (
                  <article
                    key={
                      course.id ||
                      course.course_id ||
                      course.code
                    }
                    className="course-folder public-course-folder"
                  >
                    <button
                      type="button"
                      className={`add-course-button ${
                        courseEnrolled
                          ? "enrolled-course-status"
                          : ""
                      }`}
                      aria-label={
                        courseEnrolled
                          ? `Already enrolled in ${getCourseTitle(course)}`
                          : `Add ${getCourseTitle(course)}`
                      }
                      disabled={courseEnrolled}
                      onClick={() => {
                        if (!courseEnrolled) {
                          confirmEnrollment(course);
                        }
                      }}
                    >
                      {courseEnrolled ? "Enrolled" : "+"}
                    </button>

                    <div className="course-card-body">
                      <h2>{getCourseTitle(course)}</h2>
                    </div>

                    <div className="course-card-footer">
                      <Avatar
                        src={
                          course.professorProfileImage ||
                          course.professor_profile_image
                            ? resolveProfileImage(
                                course.professorProfileImage ||
                                  course.professor_profile_image
                              )
                            : undefined
                        }
                        alt={`${
                          course.instructor || "Professor"
                        }'s profile`}
                      />

                      <div className="public-course-meta">
                        <span>
                          {course.instructor || "Professor"}
                        </span>

                        <small>
                          {getProfessorDepartment(course)}
                        </small>
                      </div>

                      <button
                        type="button"
                        className={`start-learning-button ${
                          courseEnrolled
                            ? "enrolled-course-status"
                            : ""
                        }`}
                        disabled={courseEnrolled}
                        onClick={() => {
                          if (!courseEnrolled) {
                            confirmEnrollment(course);
                          }
                        }}
                      >
                        {courseEnrolled ? "Enrolled" : "Enroll"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>
      </div>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={courseCode}
        onCourseCodeChange={setCourseCode}
        onCancel={closeJoinModal}
        onJoin={joinByCourseCode}
      />
    </div>
  );
}
