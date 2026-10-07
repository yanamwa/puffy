import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchCourses } from '../../../services/courseApi.js';
import QuizAssessmentDashboard from './QuizAssessmentDashboard.jsx';
import styles from './AssessmentAnalysis.module.css';
function readItems(course) {
  const value = course?.quizItems || course?.quiz_contents || course?.quizModule || course?.quiz_items || [];
  try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed : parsed?.questions || []; } catch { return []; }
}
export default function AssessmentDetail() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state?.course?.raw || location.state?.course || null;
  const [course, setCourse] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetchCourses({}, { fallback: false }).then(courses => {
      const found = courses.find(item => String(item.id || item.course_id || item.courseId) === String(courseId));
      if (active) { setCourse(found || null); if (!found) setError('Assessment not found.'); }
    }).catch(error => { if (active) setError(error.message || 'Could not load assessment details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);
  const title = course?.title || course?.course_name || 'Assessment Analysis';
  return <section className="qa-assessment-page">
    <header className={styles.header}><div><h1>Assessment Analysis</h1><p>{title}</p></div>
      <button className={styles.backButton} onClick={() => navigate('/professor/students')}>Back to assessments</button></header>
    {loading ? <p>Loading assessment details…</p> : error ? <p role="alert">{error}</p> : <QuizAssessmentDashboard courseId={courseId} courseTitle={title} items={readItems(course)} />}
  </section>;
}
