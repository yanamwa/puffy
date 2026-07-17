import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import {
  getProfessorCourseOwner,
} from '../../professor/professorData';
import { deleteCourseById, fetchCourses } from '../../../services/courseApi.js';
import './Modules.css';

function formatCourseId(course) {
  const cleanDate = String(course.updatedAt || '')
    .replaceAll('-', '')
    .slice(2);

  return course.code || `CRS${cleanDate || '000000'}${String(course.id).slice(-3).padStart(3, '0')}`;
}

function getStatusLabel(status) {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'published' || normalized === 'publish' ? 'Publish' : 'Draft';
}

function parseList(value) {
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ModuleManagementPage() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const refreshCourses = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const loadedCourses = await fetchCourses();

        if (active) {
          setCourses(loadedCourses.filter((course) => !course.archived));
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
    };

    refreshCourses();
    window.addEventListener('focus', refreshCourses);

    return () => {
      active = false;
      window.removeEventListener('focus', refreshCourses);
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return courses;

    return courses.filter((course) =>
      [
        course.title,
        course.code,
        course.subject,
        course.summary,
        getProfessorCourseOwner(course),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [courses, searchQuery]);

  const selectedLessons = useMemo(
    () => parseList(selectedCourse?.lessonPages || selectedCourse?.lessonContent),
    [selectedCourse]
  );

  const selectedQuizItems = useMemo(
    () => parseList(selectedCourse?.quizItems || selectedCourse?.quizModule),
    [selectedCourse]
  );

  const deleteCourse = async (course) => {
    const ok = window.confirm(`Delete "${course.title}" from professor courses?`);
    if (!ok) return;

    try {
      await deleteCourseById(course.id);
      setCourses((current) =>
        current.filter((item) => String(item.id) !== String(course.id))
      );

      if (selectedCourse && String(selectedCourse.id) === String(course.id)) {
        setSelectedCourse(null);
      }
    } catch (error) {
      window.alert(error.message || 'Could not delete course.');
    }
  };

  return (
    <div className="admin-page admin-modules-page">
      <div className="admin-modules-header">
        <div>
          <h1>Course Management</h1>
          <p>Connected to professor Course Management. Admins can view details or delete courses only.</p>
        </div>
      </div>

      <div className="admin-modules-toolbar">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search courses..."
          aria-label="Search professor courses"
        />
        <span>{filteredCourses.length} course(s)</span>
      </div>

      <div className="admin-modules-table-wrap">
        <table className="admin-modules-table">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Title</th>
              <th>Professor</th>
              <th>Subject</th>
              <th>Date Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="admin-modules-empty">
                  Loading courses...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan="7" className="admin-modules-empty">
                  {errorMessage}
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="7" className="admin-modules-empty">
                  No professor courses found.
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>{formatCourseId(course)}</td>
                  <td>{course.title || 'Untitled course'}</td>
                  <td>{getProfessorCourseOwner(course)}</td>
                  <td>{course.subject || course.code || 'Not set'}</td>
                  <td>{course.updatedAt || 'Not set'}</td>
                  <td>
                    <span
                      className={
                        getStatusLabel(course.status) === 'Publish'
                          ? 'admin-module-status publish'
                          : 'admin-module-status draft'
                      }
                    >
                      {getStatusLabel(course.status)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-module-actions">
                      <button type="button" onClick={() => setSelectedCourse(course)}>
                        <FiEye />
                        View
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteCourse(course)}
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCourse && (
        <div className="admin-module-modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <section
            className="admin-module-modal"
            aria-modal="true"
            role="dialog"
            aria-labelledby="admin-module-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{formatCourseId(selectedCourse)}</span>
                <h2 id="admin-module-title">{selectedCourse.title || 'Untitled course'}</h2>
              </div>
              <button
                type="button"
                className="admin-module-close"
                aria-label="Close course details"
                onClick={() => setSelectedCourse(null)}
              >
                x
              </button>
            </header>

            <div className="admin-module-detail-grid">
              <div>
                <span>Professor</span>
                <strong>{getProfessorCourseOwner(selectedCourse)}</strong>
              </div>
              <div>
                <span>Subject</span>
                <strong>{selectedCourse.subject || selectedCourse.code || 'Not set'}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{getStatusLabel(selectedCourse.status)}</strong>
              </div>
              <div>
                <span>Date Created</span>
                <strong>{selectedCourse.updatedAt || 'Not set'}</strong>
              </div>
              <div>
                <span>Quiz Items</span>
                <strong>{selectedQuizItems.length || selectedCourse.quizzes || 0}</strong>
              </div>
            </div>

            <div className="admin-module-section">
              <h3>Description</h3>
              <p>{selectedCourse.summary || 'No course description yet.'}</p>
            </div>

            <div className="admin-module-section">
              <h3>Learning Objectives</h3>
              <p>{selectedCourse.learningObjectives || 'No learning objectives yet.'}</p>
            </div>

            <div className="admin-module-section">
              <h3>Lesson Pages</h3>
              {selectedLessons.length === 0 ? (
                <p>No lesson pages yet.</p>
              ) : (
                <div className="admin-module-list">
                  {selectedLessons.map((page, index) => (
                    <article key={`${page.title || 'lesson'}-${index}`}>
                      <h4>{page.title || `Page ${index + 1}`}</h4>
                      <p>{page.content || 'No lesson content.'}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-module-section">
              <h3>Course Quiz</h3>
              {selectedQuizItems.length === 0 ? (
                <p>No quiz items yet.</p>
              ) : (
                <div className="admin-module-list">
                  {selectedQuizItems.map((item, index) => (
                    <article key={`${item.question || 'quiz'}-${index}`}>
                      <h4>{item.question || `Question ${index + 1}`}</h4>
                      <p>Answer: {item.correct_answer || item.answer || 'Not set'}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
