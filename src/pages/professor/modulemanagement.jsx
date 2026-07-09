import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteCourseById, fetchCourses } from '../../services/courseApi.js';
import styles from './modulemanage.module.css';

function formatCourseId(course) {
  return course.code || `CRS${String(course.id).slice(-3).padStart(3, '0')}`;
}

export default function ModuleManagement() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsToShow, setRowsToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
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
          setCourses(loadedCourses);
        }
      } catch (error) {
        if (active) {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowsToShow]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses
      .filter((course) => !course.archived)
      .filter((course) => {
        if (!query) return true;
        return [course.title, course.code, course.summary, course.visibility]
          .join(' ')
          .toLowerCase()
          .includes(query);
      });
  }, [courses, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / rowsToShow));
  const shownCourses = filteredCourses.slice(
    (currentPage - 1) * rowsToShow,
    currentPage * rowsToShow
  );

  const deleteCourse = async (course) => {
    const ok = window.confirm(`Delete "${course.title}" from course management?`);
    if (!ok) return;

    try {
      await deleteCourseById(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
    } catch (error) {
      window.alert(error.message || 'Could not delete course.');
    }
  };

  return (
    <section className={styles.modulePage}>
      <div className={styles.pageTop}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Course Management</h1>
          <p>Create and manage courses for your students.</p>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => navigate('/professor/courses/new')}
        >
          + Add new course
        </button>
      </div>

      <div className={styles.courseToolbar}>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search courses..."
          aria-label="Search courses"
        />
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Loading courses...</div>
        ) : errorMessage ? (
          <div className={styles.emptyState}>{errorMessage}</div>
        ) : shownCourses.length === 0 ? (
          <div className={styles.emptyState}>No courses found.</div>
        ) : (
          <div className={styles.moduleGrid}>
            {shownCourses.map((course) => (
              <article className={styles.moduleBox} key={course.id}>
                <div className={styles.moduleBoxTop}>
                  <span className={styles.courseCode}>{formatCourseId(course)}</span>
                  <div className={styles.moduleBadges}>
                    <span
                      className={
                        course.status === 'published'
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {course.status === 'published' ? 'Publish' : 'Draft'}
                    </span>
                    <span
                      className={`${styles.accessBadge} ${
                        course.visibility === 'public' ? styles.accessPublic : styles.accessPrivate
                      }`}
                    >
                      {course.visibility === 'public' ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>

                <h2>{course.title}</h2>
                <p>{course.summary || 'No course description yet.'}</p>

                <div className={styles.courseStats}>
                  <span>{course.students || 0} students</span>
                  <span>{course.modules || 0} pages</span>
                  <span>{course.quizzes || 0} quiz items</span>
                </div>

                <div className={styles.courseMeta}>Date created: {course.updatedAt}</div>
                <div className={styles.courseMeta}>
                  {course.visibility === 'public'
                    ? 'Visible to students in Public Courses'
                    : `Private access: ${course.code || 'course code'} or /student/join?courseCode=${course.code || ''}`}
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionEdit}
                    onClick={() => navigate(`/professor/courses/edit/${course.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.actionDelete}
                    onClick={() => deleteCourse(course)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className={styles.actionView}
                    onClick={() => navigate(`/professor/courses/edit/${course.id}`)}
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className={styles.paginationWrapper}>
          <div className={styles.paginationCenter}>
            <button
              className={styles.navBtn}
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              {'<'}
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                className={`${styles.pageBtn} ${
                  currentPage === page ? styles.pageActive : ''
                }`}
                type="button"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className={styles.navBtn}
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              {'>'}
            </button>
          </div>

          <div className={styles.rowsControl}>
            <span>Show</span>
            <select
              value={rowsToShow}
              onChange={(event) => setRowsToShow(Number(event.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>Row</span>
          </div>
        </div>
      </div>
    </section>
  );
}
