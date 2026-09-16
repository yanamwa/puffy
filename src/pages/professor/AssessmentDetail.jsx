import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchCourses } from '../../services/courseApi.js';
import styles from './AssessmentAnalysis.module.css';

const FALLBACK_RATIOS = [1, 0.83, 0.7, 0.5, 0.4];

function readNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;

    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return null;
}

function parseItems(raw, fallbackCount) {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.questions)) return parsed.questions;
      if (Array.isArray(parsed?.items)) return parsed.items;
    } catch {
      return raw
        .split(/\n+/g)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  return Array.from({ length: Math.max(fallbackCount, 1) }, (_, index) => ({
    label: `Q${index + 1}`,
    question: `Assessment item ${index + 1}`,
    answer: 'Answer not available',
  }));
}

function normalizeCourse(course, index) {
  const id = course.id || course.courseId || index + 1;
  const code = course.code || course.courseCode || course.course_code || `CRS${String(id).padStart(3, '0')}`;

  return {
    id,
    code,
    title: course.title || course.courseName || course.course_name || 'Untitled Course',
    description: course.summary || course.description || course.subject || 'Course details not available',
    students: readNumber(course.students, course.studentCount, course.student_count) ?? 30,
    maleStudents: readNumber(course.maleStudents, course.male_students) ?? 15,
    femaleStudents: readNumber(course.femaleStudents, course.female_students) ?? 15,
    quizzes: readNumber(course.quizzes, course.quizCount, course.quiz_count, course.quizItems) ?? 5,
    quizContents: course.quizContents || course.quiz_contents || course.quizModule || course.questions || '',
    averageScore: course.averageScore || course.average_score,
    highestScore: course.highestScore || course.highest_score,
    lowestScore: course.lowestScore || course.lowest_score,
    passScore: course.passScore || course.pass_score,
    raw: course.raw || course,
  };
}

function formatPercent(value) {
  const fixed = Number(value || 0).toFixed(2);
  return `${fixed.replace(/\.?0+$/, '')}%`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildRows(items, totals) {
  return items.map((item, index) => {
    const ratio = FALLBACK_RATIOS[index] ?? clamp(0.4 - (index - 4) * 0.05, 0.2, 0.9);
    const label = item.label || item.item || item.question_number || `Q${index + 1}`;
    const totalCorrect = clamp(
      Math.round(readNumber(item.totalCorrect, item.total_correct) ?? totals.totalStudents * ratio),
      0,
      totals.totalStudents
    );
    const femaleCorrect = clamp(
      Math.round(readNumber(item.femaleCorrect, item.female_correct) ?? totalCorrect / 2),
      0,
      totals.femaleStudents
    );
    const maleCorrect = clamp(
      Math.round(readNumber(item.maleCorrect, item.male_correct) ?? totalCorrect - femaleCorrect),
      0,
      totals.maleStudents
    );
    const incorrect = clamp(
      Math.round(readNumber(item.incorrect, item.total_incorrect) ?? totals.totalStudents - totalCorrect),
      0,
      totals.totalStudents
    );
    const percent = readNumber(item.percent, item.correctPercent, item.correct_percent) ??
      (totalCorrect / Math.max(totals.totalStudents, 1)) * 100;

    return {
      label: String(label).startsWith('Q') ? String(label) : `Q${label}`,
      question: item.question || item.prompt || item.title || `Assessment item ${index + 1}`,
      answer: item.answer || item.correctAnswer || item.correct_answer || 'Answer not available',
      totalCorrect,
      femaleCorrect,
      maleCorrect,
      incorrect,
      percent,
    };
  });
}

export default function AssessmentDetail() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialCourse = location.state?.course
    ? normalizeCourse(location.state.course.raw || location.state.course, 0)
    : null;

  const [course, setCourse] = useState(initialCourse);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        setErrorMessage('');

        const loadedCourses = await fetchCourses();
        const normalized = Array.isArray(loadedCourses)
          ? loadedCourses.map((item, index) => normalizeCourse(item, index))
          : [];
        const found = normalized.find((item) => String(item.id) === String(courseId));

        if (active && found) {
          setCourse(found);
        } else if (active && !initialCourse) {
          setErrorMessage('Assessment details could not be found.');
        }
      } catch (error) {
        if (active && !initialCourse) {
          setErrorMessage(error.message || 'Could not load assessment details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      active = false;
    };
  }, [courseId]);

  const activeCourse = course || initialCourse;
  const quizItems = useMemo(
    () => parseItems(activeCourse?.quizContents, Number(activeCourse?.quizzes) || 5),
    [activeCourse]
  );
  const totals = useMemo(
    () => ({
      totalStudents: Number(activeCourse?.students || 0),
      maleStudents: Number(activeCourse?.maleStudents || 0),
      femaleStudents: Number(activeCourse?.femaleStudents || 0),
      quizItems: quizItems.length,
    }),
    [activeCourse, quizItems]
  );
  const rows = useMemo(() => buildRows(quizItems, totals), [quizItems, totals]);
  const average = readNumber(activeCourse?.averageScore) ??
    (rows.length ? rows.reduce((sum, item) => sum + item.percent, 0) / rows.length : 0);
  const highest = readNumber(activeCourse?.highestScore) ?? totals.quizItems;
  const lowest = readNumber(activeCourse?.lowestScore) ?? Math.max(Math.floor(totals.quizItems / 5), 1);
  const passing = readNumber(activeCourse?.passScore) ?? Math.max(Math.ceil(totals.quizItems * 0.6), 1);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Assessment Analysis</h1>
          <p>{activeCourse?.title || 'Review the full details of this assessment.'}</p>
        </div>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/professor/students')}
        >
          Back to assessments
        </button>
      </header>

      {loading && !activeCourse ? (
        <div className={styles.message}>Loading assessment details...</div>
      ) : errorMessage && !activeCourse ? (
        <div className={styles.message}>{errorMessage}</div>
      ) : activeCourse ? (
        <section className={styles.detailPanel}>
          <div className={styles.detailTitle}>
            <h2>{activeCourse.title}</h2>
            <p>{activeCourse.code} - {activeCourse.description}</p>
          </div>

          <div className={styles.metricGrid}>
            <div><span>Total Students</span><strong>{totals.totalStudents}</strong></div>
            <div><span>Male Students</span><strong>{totals.maleStudents}</strong></div>
            <div><span>Female Students</span><strong>{totals.femaleStudents}</strong></div>
            <div><span>Total Quiz Items</span><strong>{totals.quizItems}</strong></div>
          </div>

          <div className={styles.analysisGrid}>
            <section className={styles.questionBlock}>
              <div className={styles.sectionTab}>Question Analysis</div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Female Correct</th>
                      <th>Male Correct</th>
                      <th>Total Correct</th>
                      <th>Incorrect</th>
                      <th>Correct %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.label}>
                        <td>{item.label}</td>
                        <td>{item.femaleCorrect}/{totals.femaleStudents}</td>
                        <td>{item.maleCorrect}/{totals.maleStudents}</td>
                        <td>{item.totalCorrect}/{totals.totalStudents}</td>
                        <td>{item.incorrect}/{totals.totalStudents}</td>
                        <td>{formatPercent(item.percent)}</td>
                        <td>
                          <button type="button" onClick={() => setSelectedQuestion(item)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className={styles.scoreSummary}>
              <h3>Score Summary</h3>
              <div><span>Average Score</span><strong>{formatPercent(average)}</strong></div>
              <div><span>Highest Score</span><strong>{highest} / {totals.quizItems}</strong></div>
              <div><span>Lowest Score</span><strong>{lowest} / {totals.quizItems}</strong></div>
              <div><span>Pass Score</span><strong>{passing} / {totals.quizItems}</strong></div>
            </aside>
          </div>
        </section>
      ) : null}

      {selectedQuestion && (
        <div className={styles.modalOverlay} onClick={() => setSelectedQuestion(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{selectedQuestion.label} Details</h2>
              <button type="button" onClick={() => setSelectedQuestion(null)}>x</button>
            </header>
            <div className={styles.modalBody}>
              <span>Question</span>
              <p>{selectedQuestion.question}</p>
              <span>Correct Answer</span>
              <p>{selectedQuestion.answer}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
