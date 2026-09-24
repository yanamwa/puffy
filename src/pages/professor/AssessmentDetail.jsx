import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../../config.js';
import { fetchCourses } from '../../services/courseApi.js';
import styles from './AssessmentAnalysis.module.css';

const FALLBACK_RATIOS = [1, 0.83, 0.7, 0.5, 0.4];

const BLOOM_LEVELS = {
  remembering: {
    level: 'Remembering',
    category: 'LOTS',
    task: 'Recalls facts or information',
    reason: 'The question asks students to recall previously learned information.',
  },
  understanding: {
    level: 'Understanding',
    category: 'LOTS',
    task: 'Explains or interprets information',
    reason: 'The question asks students to explain, describe, or interpret the idea.',
  },
  applying: {
    level: 'Applying',
    category: 'LOTS',
    task: 'Uses learned knowledge in a situation',
    reason: 'The question asks students to use learned knowledge in a given situation.',
  },
  analyzing: {
    level: 'Analyzing',
    category: 'HOTS',
    task: 'Compares, distinguishes, examines relationships',
    reason: 'The question requires students to compare, distinguish, or examine relationships.',
  },
  evaluating: {
    level: 'Evaluating',
    category: 'HOTS',
    task: 'Makes and justifies a judgment',
    reason: 'The question asks students to make and justify a judgment.',
  },
  creating: {
    level: 'Creating',
    category: 'HOTS',
    task: 'Designs or produces something new',
    reason: 'The question asks students to design or produce something new.',
  },
};

const BLOOM_RULES = [
  {
    key: 'creating',
    terms: ['create', 'design', 'develop', 'produce', 'construct', 'compose', 'formulate', 'build'],
  },
  {
    key: 'analyzing',
    terms: [
      'analyze',
      'compare',
      'contrast',
      'distinguish',
      'differentiate',
      'examine',
      'relationship',
      'determine which',
    ],
  },
  {
    key: 'evaluating',
    terms: ['evaluate', 'justify', 'defend', 'critique', 'recommend', 'judge', 'assess', 'prioritize', 'most appropriate', 'best'],
  },
  {
    key: 'applying',
    terms: ['apply', 'solve', 'calculate', 'implement', 'demonstrate', 'perform', 'execute', 'use the'],
  },
  {
    key: 'understanding',
    terms: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'give an example', 'in your own words'],
  },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function getBloomDetail(value) {
  if (!value) return null;

  const normalized = String(value).toLowerCase().replace(/[^a-z]/g, '');
  return Object.values(BLOOM_LEVELS).find(
    (detail) =>
      detail.level.toLowerCase() === normalized ||
      normalized.includes(detail.level.toLowerCase())
  );
}

function normalizeCognitiveCategory(value, fallback) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('hots') || normalized.includes('higher')) return 'HOTS';
  if (normalized.includes('lots') || normalized.includes('lower')) return 'LOTS';

  return fallback;
}

function inferCognitiveLevel(question) {
  const providedLevel = getBloomDetail(question?.cognitiveLevel);
  const source = String(question?.question || '').toLowerCase();
  const inferredRule = BLOOM_RULES.find((rule) =>
    rule.terms.some((term) => source.includes(term))
  );
  const detail =
    providedLevel || BLOOM_LEVELS[inferredRule?.key] || BLOOM_LEVELS.remembering;

  return {
    ...detail,
    category: normalizeCognitiveCategory(question?.cognitiveCategory, detail.category),
    reason: question?.cognitiveReason || detail.reason,
  };
}

function normalizeChoices(...values) {
  for (const value of values) {
    if (!value) continue;

    const choices = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value
            .split(/\r?\n|[,|]/g)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const normalized = choices
      .map((choice) => String(choice || '').trim())
      .filter(Boolean);

    if (normalized.length > 0) return normalized;
  }

  return [];
}

function cleanChoiceText(value) {
  return String(value || '')
    .replace(/^[A-Z]\s*[.)-]\s*/i, '')
    .trim();
}

function sameChoice(left, right) {
  return cleanChoiceText(left).toLowerCase() === cleanChoiceText(right).toLowerCase();
}

function addUniqueChoice(choices, value) {
  const cleaned = cleanChoiceText(value);

  if (!cleaned || choices.some((choice) => sameChoice(choice, cleaned))) return;

  choices.push(cleaned);
}

function getAnswerChoices(question) {
  const choices = [];

  if (Array.isArray(question?.options)) {
    question.options.forEach((choice) => addUniqueChoice(choices, choice));
  }

  addUniqueChoice(choices, question?.answer);

  if (choices.length === 0) choices.push('Correct response');
  if (choices.length === 1 && Number(question?.incorrect || 0) > 0) {
    choices.push('Other answers');
  }

  return choices.slice(0, OPTION_LETTERS.length);
}

function splitIncorrectCount(total, slots) {
  if (slots <= 0) return [];

  const weights = Array.from({ length: slots }, (_, index) => slots - index);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = total;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) return remaining;

    const count = Math.min(remaining, Math.round((total * weight) / weightTotal));
    remaining -= count;
    return count;
  });
}

function buildAnswerDistribution(question) {
  const choices = getAnswerChoices(question);
  const totalCorrect = Math.max(Math.round(Number(question?.totalCorrect || 0)), 0);
  const incorrect = Math.max(Math.round(Number(question?.incorrect || 0)), 0);
  const correctIndex = choices.findIndex((choice) => sameChoice(choice, question?.answer));
  const resolvedCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
  const counts = choices.map(() => 0);
  const incorrectIndexes = choices
    .map((_, index) => index)
    .filter((index) => index !== resolvedCorrectIndex);
  const incorrectCounts = splitIncorrectCount(incorrect, incorrectIndexes.length);

  counts[resolvedCorrectIndex] = totalCorrect;
  incorrectIndexes.forEach((index, countIndex) => {
    counts[index] = incorrectCounts[countIndex] || 0;
  });

  return choices.map((choice, index) => ({
    label: `${OPTION_LETTERS[index]}. ${choice}`,
    count: counts[index],
    isCorrect: index === resolvedCorrectIndex,
  }));
}

function getQuestionAnalysisTitle(question) {
  const number = String(question?.label || '').replace(/^q/i, '').trim();

  return number ? `Question ${number} Analysis` : 'Question Analysis';
}

function getStoredToken() {
  return (
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    ''
  );
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['male', 'm'].includes(normalized)) return 'male';
  if (['female', 'f'].includes(normalized)) return 'female';

  return '';
}

function getEnrollmentSummary(enrolledStudents = []) {
  const enrolled = Array.isArray(enrolledStudents) ? enrolledStudents : [];

  return enrolled.reduce(
    (summary, student) => {
      const gender = normalizeGender(student.gender || student.studentGender);

      if (gender === 'male') {
        summary.maleStudents += 1;
      }

      if (gender === 'female') {
        summary.femaleStudents += 1;
      }

      return summary;
    },
    {
      totalStudents: enrolled.length,
      maleStudents: 0,
      femaleStudents: 0,
    }
  );
}

async function fetchEnrollmentSummary(courseId) {
  const token = getStoredToken();

  if (!token || !courseId) {
    return null;
  }

  const response = await fetch(
    `${API_BASE}/courses/${encodeURIComponent(courseId)}/enrollments`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Could not load enrolled students.');
  }

  return getEnrollmentSummary(data.enrolled);
}

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

  return Array.from({ length: Math.max(Number(fallbackCount) || 0, 0) }, (_, index) => ({
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
    students: readNumber(course.students, course.studentCount, course.student_count) ?? 0,
    maleStudents: readNumber(course.maleStudents, course.male_students) ?? 0,
    femaleStudents: readNumber(course.femaleStudents, course.female_students) ?? 0,
    quizzes: readNumber(course.quizzes, course.quizCount, course.quiz_count, course.quizItems) ?? 0,
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
      options: normalizeChoices(
        item.options,
        item.choices,
        item.answers,
        item.wrong_options,
        item.wrongOptions
      ),
      cognitiveLevel:
        item.cognitiveLevel ||
        item.cognitive_level ||
        item.bloomLevel ||
        item.bloom_level ||
        item.taxonomyLevel ||
        item.taxonomy_level,
      cognitiveCategory:
        item.cognitiveCategory ||
        item.cognitive_category ||
        item.thinkingCategory ||
        item.thinking_category ||
        item.hotsLots ||
        item.hots_lots,
      cognitiveReason:
        item.cognitiveReason ||
        item.cognitive_reason ||
        item.bloomReason ||
        item.bloom_reason ||
        item.classificationReason ||
        item.classification_reason,
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
  const [enrollmentSummary, setEnrollmentSummary] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        setErrorMessage('');

        const loadedCourses = await fetchCourses();
        const loadedEnrollmentSummary = await fetchEnrollmentSummary(courseId).catch((error) => {
          console.warn('Could not load enrolled students for assessment totals.', error);
          return null;
        });
        const normalized = Array.isArray(loadedCourses)
          ? loadedCourses.map((item, index) => normalizeCourse(item, index))
          : [];
        const found = normalized.find((item) => String(item.id) === String(courseId));

        if (active) {
          setEnrollmentSummary(loadedEnrollmentSummary);
        }

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
      totalStudents:
        enrollmentSummary?.totalStudents ??
        Number(activeCourse?.students || 0),
      maleStudents:
        enrollmentSummary?.maleStudents ??
        Number(activeCourse?.maleStudents || 0),
      femaleStudents:
        enrollmentSummary?.femaleStudents ??
        Number(activeCourse?.femaleStudents || 0),
      quizItems: quizItems.length,
    }),
    [activeCourse, quizItems, enrollmentSummary]
  );
  const rows = useMemo(() => buildRows(quizItems, totals), [quizItems, totals]);
  const average = readNumber(activeCourse?.averageScore) ??
    (rows.length ? rows.reduce((sum, item) => sum + item.percent, 0) / rows.length : 0);
  const highest = readNumber(activeCourse?.highestScore) ?? totals.quizItems;
  const lowest = readNumber(activeCourse?.lowestScore) ?? Math.max(Math.floor(totals.quizItems / 5), 1);
  const passing = readNumber(activeCourse?.passScore) ?? Math.max(Math.ceil(totals.quizItems * 0.6), 1);
  const selectedQuestionDetails = useMemo(() => {
    if (!selectedQuestion) return null;

    const totalResponses = Math.max(
      totals.totalStudents,
      Math.round(
        Number(selectedQuestion.totalCorrect || 0) +
          Number(selectedQuestion.incorrect || 0)
      )
    );

    return {
      answerDistribution: buildAnswerDistribution(selectedQuestion),
      cognitiveLevel: inferCognitiveLevel(selectedQuestion),
      title: getQuestionAnalysisTitle(selectedQuestion),
      totalResponses,
    };
  }, [selectedQuestion, totals.totalStudents]);

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

      {selectedQuestion && selectedQuestionDetails && (
        <div className={styles.modalOverlay} onClick={() => setSelectedQuestion(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{selectedQuestionDetails.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                aria-label="Close question analysis"
              >
                x
              </button>
            </header>

            <div className={styles.modalBody}>
              <p className={styles.analysisQuestion}>{selectedQuestion.question}</p>

              <div className={styles.modalSectionTitle}>Question Details</div>

              <div className={styles.cognitiveRows}>
                <div>
                  <span>Suggested Cognitive Level</span>
                  <strong
                    className={`${styles.cognitiveBadge} ${
                      selectedQuestionDetails.cognitiveLevel.category === 'HOTS'
                        ? styles.hotsBadge
                        : ''
                    }`}
                  >
                    {selectedQuestionDetails.cognitiveLevel.category} -{' '}
                    {selectedQuestionDetails.cognitiveLevel.level}
                  </strong>
                </div>

                <div>
                  <span>What the student does</span>
                  <p>{selectedQuestionDetails.cognitiveLevel.task}</p>
                </div>

                <div>
                  <span>Why this classification?</span>
                  <p>{selectedQuestionDetails.cognitiveLevel.reason}</p>
                </div>
              </div>

              <p className={styles.cognitiveNote}>
                Cognitive Level describes the thinking skill required by the question,
                not how students performed on it.
              </p>

              <div className={styles.modalSectionTitle}>Response Analysis</div>

              <div className={styles.responseGrid}>
                <div><span>Total Response</span><strong>{selectedQuestionDetails.totalResponses}</strong></div>
                <div><span>Female</span><strong>{selectedQuestion.femaleCorrect}/{totals.femaleStudents} correct</strong></div>
                <div><span>Correct</span><strong>{selectedQuestion.totalCorrect}</strong></div>
                <div><span>Male</span><strong>{selectedQuestion.maleCorrect}/{totals.maleStudents} correct</strong></div>
                <div><span>Incorrect</span><strong>{selectedQuestion.incorrect}</strong></div>
              </div>

              <div className={styles.modalSectionTitle}>Answer Distribution</div>

              <div className={styles.answerDistribution}>
                {selectedQuestionDetails.answerDistribution.map((answer) => (
                  <div className={styles.answerRow} key={answer.label}>
                    <span>{answer.label}</span>
                    <div className={styles.answerTrack}>
                      <div
                        className={answer.isCorrect ? styles.correctBar : ''}
                        style={{
                          width: `${Math.min(
                            (answer.count /
                              Math.max(selectedQuestionDetails.totalResponses, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <strong>{answer.count}</strong>
                  </div>
                ))}
              </div>

              <div className={styles.modalTotalRow}>
                <span>Total</span>
                <strong>{selectedQuestionDetails.totalResponses}</strong>
              </div>

              <p className={styles.modalFootnote}>
                {selectedQuestion.totalCorrect} of {selectedQuestionDetails.totalResponses}{' '}
                students answered this question correctly.
              </p>

              <details className={styles.bloomReference}>
                <summary>Bloom&apos;s level guide</summary>
                <div>
                  {Object.values(BLOOM_LEVELS).map((level) => (
                    <p key={level.level}>
                      <strong>{level.level} ({level.category})</strong>
                      <span>{level.task}</span>
                    </p>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
