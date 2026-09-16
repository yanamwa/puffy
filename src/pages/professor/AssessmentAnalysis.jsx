import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCourses } from '../../services/courseApi.js';
import styles from './AssessmentAnalysis.module.css';

function formatDate(value) {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  return `${mm}-${dd}-${yy}`;
}

function getCourseCode(course, index) {
  return (
    course.code ||
    course.courseCode ||
    course.course_code ||
    `CRS${String(course.id || index + 1).padStart(3, '0')}`
  );
}

function normalizeCourse(course, index) {
  return {
    id: course.id || course.courseId || index + 1,
    code: getCourseCode(course, index),
    title: course.title || course.courseName || course.course_name || 'Untitled Course',
    description: course.summary || course.description || course.subject || 'Course details not available',
    students: course.students || course.studentCount || course.student_count || 0,
    modules: course.moduleCount || course.module_count || course.modules || 0,
    quizzes: course.quizzes || course.quizCount || course.quiz_count || course.quizItems || 0,
    date: formatDate(course.createdAt || course.created_at || course.dateCreated || course.updatedAt),
    raw: course,
  };
}

export default function AssessmentAnalysis() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        setLoading(true);
        setErrorMessage('');

        const loadedCourses = await fetchCourses();

        if (active) {
          setCourses(
            Array.isArray(loadedCourses)
              ? loadedCourses.map((course, index) => normalizeCourse(course, index))
              : []
          );
        }
      } catch (error) {
        if (active) {
          setCourses([]);
          setErrorMessage(error.message || 'Could not load courses.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return courses;

    return courses.filter((course) =>
      [course.code, course.title, course.description]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [courses, searchQuery]);

  const openAssessment = (course) => {
    navigate(`/professor/assessment/${course.id}`, {
      state: { course },
    });
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Assessment Analysis</h1>
        <p>
          Select a course, then review class progress and each student's
          performance inside that course.
        </p>
      </header>

      <section className={styles.searchPanel}>
        <label className={styles.searchBox}>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="search for courses"
            aria-label="Search courses"
          />
        </label>
      </section>

      <section className={styles.courseArea}>
        {loading ? (
          <div className={styles.message}>Loading courses...</div>
        ) : errorMessage ? (
          <div className={styles.message}>{errorMessage}</div>
        ) : filteredCourses.length === 0 ? (
          <div className={styles.message}>No courses found.</div>
        ) : (
          <div className={styles.courseGrid}>
            {filteredCourses.map((course) => (
              <button
                type="button"
                key={course.id}
                className={styles.courseCard}
                onClick={() => openAssessment(course)}
              >
                <span className={styles.folderTab} aria-hidden="true" />

                <span className={styles.dateText}>Date created: {course.date}</span>

                <span className={styles.codeText}>
                  <span>Course Code:</span> {course.code}
                </span>

                <strong>{course.title}</strong>

                <span className={styles.description}>{course.description}</span>

                <span className={styles.divider} />

                <span className={styles.stats}>
                  <span>{course.students} students</span>
                  <span>{course.modules} Modules</span>
                  <span>{course.quizzes} Quizzes</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
