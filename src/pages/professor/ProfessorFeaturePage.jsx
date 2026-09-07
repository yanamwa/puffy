import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiDownload,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  readProfessorCourses,
} from './professorData';
import { fetchCourses } from '../../services/courseApi.js';
import { fetchCourseMonitoring } from '../../services/monitoringApi.js';
import './ProfessorLayout.css';

const courseMonitoringSeed = {};

const emptyMonitoring = {
  section: 'No course selected',
  schedule: '',
  topics: [],
  assessments: [],
  students: [],
};

const statusLabels = {
  onTrack: 'On track',
  needsReview: 'Needs review',
  atRisk: 'At risk',
};

const rosterNamePool = [];

function average(items, key) {
  if (!items.length) return 0;
  return Math.round(
    items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length
  );
}

function averageNumbers(numbers) {
  if (!numbers.length) return 0;
  return Math.round(numbers.reduce((sum, number) => sum + number, 0) / numbers.length);
}

function clampScore(score) {
  return Math.max(35, Math.min(99, Math.round(score)));
}

function getStatus(completion, score) {
  if (completion < 55 || score < 60) return 'atRisk';
  if (completion < 78 || score < 75) return 'needsReview';
  return 'onTrack';
}

function getWeakestTopic(topics, topicScores) {
  const weakestIndex = topicScores.reduce(
    (lowestIndex, score, index) =>
      score < topicScores[lowestIndex] ? index : lowestIndex,
    0
  );

  return topics[weakestIndex]?.name || 'Course topic';
}

function getMonitoringStudents(monitoring) {
  return Array.isArray(monitoring?.students) ? monitoring.students : [];
}

function getMonitoringTopics(monitoring) {
  return Array.isArray(monitoring?.topics) ? monitoring.topics : [];
}

function getMonitoringAssessments(monitoring) {
  return Array.isArray(monitoring?.assessments) ? monitoring.assessments : [];
}

function getStudentDisplayName(student) {
  return student?.name || student?.fullName || student?.full_name || student?.username || student?.email || 'Unnamed student';
}

function getStudentInitials(student) {
  return getStudentDisplayName(student)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2) || 'ST';
}
function buildClassRoster(monitoring) {
  return getMonitoringStudents(monitoring).map((student) => ({
    ...student,
    topicScores: getMonitoringTopics(monitoring).map(
      (_, index) => student.topicScores?.[index] ?? student.score ?? 0
    ),
  }));
}
function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function createMonitoringCsv(course, monitoring, students, stats) {
  const summaryRows = [
    ['Course', `${course.code} - ${course.title}`],
    ['Section', monitoring.section],
    ['Schedule', monitoring.schedule],
    ['Enrolled students', stats.enrolled],
    ['Course completion', `${stats.completion}%`],
    ['Average score', `${stats.score}%`],
    ['At-risk students', stats.atRisk],
    ['Needs review', stats.needsReview],
    [],
  ];

  const topicHeader = ['Topic', 'Class average'];
  const topicRows = getMonitoringTopics(monitoring).map((topic) => [topic.name, `${topic.average}%`]);
  const studentHeader = [
    'Student ID',
    'Student',
    'Completion',
    'Average score',
    ...getMonitoringTopics(monitoring).map((topic) => topic.name),
    'Weakest topic',
    'Last active',
    'Status',
  ];
  const studentRows = students.map((student) => [
    student.id,
    getStudentDisplayName(student),
    `${student.completion}%`,
    `${student.score}%`,
    ...(Array.isArray(student.topicScores) ? student.topicScores : []).map((score) => `${score}%`),
    student.weakestTopic,
    student.lastActive,
    statusLabels[student.status],
  ]);

  return [...summaryRows, topicHeader, ...topicRows, [], studentHeader, ...studentRows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}

function getMonitoringFallback(course) {
  return {
    section: course?.section || 'Course section',
    schedule: course?.schedule || 'Schedule not set',
    topics: [],
    assessments: [],
    students: [],
  };
}
function getMonitoringForCourse(course) {
  if (!course) {
    return emptyMonitoring;
  }

  return courseMonitoringSeed[course.code] || getMonitoringFallback(course);
}

function getCourseSelectId(course) {
  return String(
    course?.id ?? course?.course_id ?? course?.code ?? course?.course_code ?? ''
  );
}

function getCourseRequestId(course) {
  return course?.id ?? course?.course_id ?? course?.code ?? course?.course_code ?? '';
}

function StudentMonitoringDashboard() {
  const fallbackCourses = useMemo(() => {
    const storedCourses = readProfessorCourses();
    const activeCourses = storedCourses.filter((course) => !course.archived);

    return activeCourses;
  }, []);

  const [courses, setCourses] = useState(fallbackCourses);
  const [selectedCourseId, setSelectedCourseId] = useState(
    getCourseSelectId(fallbackCourses[0])
  );
  const [activeView, setActiveView] = useState('overview');
  const [showTopicBreakdown, setShowTopicBreakdown] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exportMessage, setExportMessage] = useState('');
  const [monitoringFromDb, setMonitoringFromDb] = useState(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [monitoringError, setMonitoringError] = useState('');

  useEffect(() => {
    let active = true;

    fetchCourses({ includeArchived: true })
      .then((loadedCourses) => {
        if (!active) return;

        const activeCourses = loadedCourses.filter((course) => !course.archived);

        setCourses(activeCourses);
        setSelectedCourseId((currentId) =>
          activeCourses.some(
            (course) => getCourseSelectId(course) === String(currentId)
          )
            ? currentId
            : getCourseSelectId(activeCourses[0])
        );
      })
      .catch((error) => {
        console.error('Professor courses load error:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCourse = useMemo(
    () =>
      courses.find((course) => getCourseSelectId(course) === String(selectedCourseId)) ||
      courses[0] ||
      null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    const courseId = getCourseRequestId(selectedCourse);

    if (!courseId) return undefined;

    let active = true;

    setMonitoringLoading(true);
    setMonitoringError('');
    setMonitoringFromDb(null);

    fetchCourseMonitoring(courseId)
      .then((monitoring) => {
        if (active) setMonitoringFromDb(monitoring);
      })
      .catch((error) => {
        console.error('Course monitoring load error:', error);
        if (active) {
          setMonitoringError(
            error.message || 'Could not load database monitoring data.'
          );
        }
      })
      .finally(() => {
        if (active) setMonitoringLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCourse]);

  const monitoring = useMemo(
    () => monitoringFromDb || getMonitoringForCourse(selectedCourse),
    [monitoringFromDb, selectedCourse]
  );

  const monitoringNotice = monitoringLoading
    ? 'Loading database monitoring...'
    : monitoringError
      ? `${monitoringError} No monitoring records loaded yet.`
      : monitoringFromDb
        ? 'Showing database monitoring data.'
        : '';
  const selectedCourseCode =
    selectedCourse?.code ||
    selectedCourse?.course_code ||
    monitoring.course?.code ||
    'COURSE';
  const selectedCourseTitle =
    selectedCourse?.title ||
    selectedCourse?.courseName ||
    selectedCourse?.course_name ||
    monitoring.course?.title ||
    'Selected course';
  const selectedCourseStudentCount = Number(
    selectedCourse?.students || getMonitoringStudents(monitoring).length
  );

  const allStudents = useMemo(
    () =>
      buildClassRoster(monitoring),
    [monitoring, selectedCourseCode, selectedCourseStudentCount]
  );

  const courseStats = useMemo(() => {
    const students = allStudents;
    const lowestTopic = getMonitoringTopics(monitoring).length
      ? getMonitoringTopics(monitoring).reduce((lowest, topic) =>
          topic.average < lowest.average ? topic : lowest
        )
      : { name: 'Course data', average: 0 };

    return {
      enrolled: selectedCourseStudentCount || students.length,
      completion: average(students, 'completion'),
      score: average(students, 'score'),
      onTrack: students.filter((student) => student.status === 'onTrack').length,
      needsReview: students.filter((student) => student.status === 'needsReview').length,
      atRisk: students.filter((student) => student.status === 'atRisk').length,
      lowestTopic,
    };
  }, [allStudents, monitoring, selectedCourseStudentCount]);

  const displayedStudents = showAllStudents
    ? allStudents
    : allStudents.slice(0, Math.min(4, allStudents.length));

  const studentsNeedingSupport = useMemo(
    () =>
      allStudents
        .filter((student) => student.status !== 'onTrack')
        .sort((first, second) => first.score - second.score),
    [allStudents]
  );

  const topicBreakdown = useMemo(
    () => {
      if (allStudents.length === 0) {
        return getMonitoringTopics(monitoring).map((topic) => ({
          ...topic,
          needsSupport: 0,
          highestScore: 0,
          topStudent: 'No student yet',
        }));
      }

      return getMonitoringTopics(monitoring).map((topic, topicIndex) => {
        const scores = allStudents.map((student) => student.topicScores[topicIndex]);
        const topStudent = allStudents.reduce((best, student) =>
          student.topicScores[topicIndex] > best.topicScores[topicIndex]
            ? student
            : best
        );

        return {
          ...topic,
          needsSupport: scores.filter((score) => score < 70).length,
          highestScore: topStudent.topicScores[topicIndex],
          topStudent: getStudentDisplayName(topStudent),
        };
      });
    },
    [allStudents, monitoring]
  );

  const handleCourseChange = (event) => {
    setSelectedCourseId(event.target.value);
    setShowTopicBreakdown(false);
    setShowAllStudents(false);
    setSelectedStudent(null);
    setExportMessage('');
  };

  const handleExport = () => {
    if (!selectedCourse) {
      return;
    }

    const csv = createMonitoringCsv(
      { ...selectedCourse, code: selectedCourseCode, title: selectedCourseTitle },
      monitoring,
      allStudents,
      courseStats
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${selectedCourseCode.toLowerCase()}-student-monitoring.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportMessage(`CSV exported for ${selectedCourseTitle}.`);
  };

  if (courses.length === 0) {
    return (
      <section className="professor-page monitor-page">
        <div className="monitor-header">
          <div>
            <h1>Student Monitoring</h1>
            <p>
              Select a course, then review class progress and each student's
              performance inside that course.
            </p>
          </div>
        </div>

        <div className="monitor-empty-state">
          No courses yet. Create a course first to start monitoring students.
        </div>
      </section>
    );
  }

  return (
    <section className="professor-page monitor-page">
      <div className="monitor-header">
        <div>
          <h1>Student Monitoring</h1>
          <p>
            Select a course, then review class progress and each student's
            performance inside that course.
          </p>
        </div>

        <div className="monitor-tabs" aria-label="Student monitoring views">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'reports', label: 'Reports' },
            { id: 'analytics', label: 'Analytics' },
          ].map((tab) => (
            <button
              className={activeView === tab.id ? 'active' : ''}
              key={tab.id}
              type="button"
              aria-pressed={activeView === tab.id}
              onClick={() => setActiveView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="monitor-toolbar">
        <label className="monitor-course-select">
          <FiBookOpen />
          <select
            value={getCourseSelectId(selectedCourse)}
            onChange={handleCourseChange}
            aria-label="Select course to monitor"
          >
            {courses.map((course) => (
              <option key={getCourseSelectId(course)} value={getCourseSelectId(course)}>
                {course.title || course.courseName || course.course_name || 'Untitled course'}
              </option>
            ))}
          </select>
        </label>

        <div className="monitor-course-meta">
          <span>{monitoring.section}</span>
          <span>{monitoring.schedule}</span>
          {monitoringNotice && <span>{monitoringNotice}</span>}
        </div>
      </div>

      {activeView === 'overview' && (
        <>
          <div className="monitor-kpi-grid">
            <article className="monitor-kpi">
              <FiUsers />
              <span>Enrolled students</span>
              <strong>{courseStats.enrolled}</strong>
            </article>
            <article className="monitor-kpi">
              <FiTrendingUp />
              <span>Course completion</span>
              <strong>{courseStats.completion}%</strong>
            </article>
            <article className="monitor-kpi">
              <FiBarChart2 />
              <span>Average score</span>
              <strong>{courseStats.score}%</strong>
            </article>
            <article className="monitor-kpi alert">
              <FiAlertTriangle />
              <span>At-risk students</span>
              <strong>{courseStats.atRisk}</strong>
            </article>
          </div>

          <div className="monitor-insight">
            <strong>Course focus: </strong>
            <span>
              {courseStats.lowestTopic.name} is the lowest class average at{' '}
              {courseStats.lowestTopic.average}%. Prioritize review materials or
              a short remediation activity for this topic.
            </span>
          </div>

          <div className="monitor-two-column">
            <section className="monitor-panel">
              <div className="monitor-panel-heading">
                <div>
                  <h2>Course Topic Performance</h2>
                  <p>Class average by topic for the selected course.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTopicBreakdown((isOpen) => !isOpen)}
                >
                  {showTopicBreakdown ? 'Hide breakdown' : 'Full breakdown'}
                </button>
              </div>

              <div className="monitor-topic-list">
                {getMonitoringTopics(monitoring).map((topic) => (
                  <div className="monitor-topic-row" key={topic.name}>
                    <span>{topic.name}</span>
                    <div className="monitor-progress-track">
                      <div
                        className={`monitor-progress-fill ${
                          topic.average < 70
                            ? 'low'
                            : topic.average < 82
                              ? 'mid'
                              : 'high'
                        }`}
                        style={{ width: `${topic.average}%` }}
                      />
                    </div>
                    <strong>{topic.average}%</strong>
                  </div>
                ))}
              </div>

              {showTopicBreakdown && (
                <div className="monitor-breakdown">
                  <table>
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Average</th>
                        <th>Needs support</th>
                        <th>Top student</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicBreakdown.map((topic) => (
                        <tr key={topic.name}>
                          <td>{topic.name}</td>
                          <td>{topic.average}%</td>
                          <td>{topic.needsSupport}</td>
                          <td>
                            {topic.topStudent} ({topic.highestScore}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="monitor-panel">
              <div className="monitor-panel-heading">
                <div>
                  <h2>Assessment Mix</h2>
                  <p>Quick view of graded work for this course.</p>
                </div>
                <div className="monitor-action-stack">
                  <button type="button" onClick={handleExport}>
                    <FiDownload /> Export
                  </button>
                  {exportMessage && (
                    <span className="monitor-action-note">{exportMessage}</span>
                  )}
                </div>
              </div>

              <div className="monitor-assessment-list">
                {getMonitoringAssessments(monitoring).map((assessment) => (
                  <div className="monitor-assessment" key={assessment.label}>
                    <span>{assessment.label}</span>
                    <strong>{assessment.value}%</strong>
                    <div className="monitor-mini-track">
                      <div style={{ width: `${assessment.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="monitor-panel monitor-students-panel">
            <div className="monitor-panel-heading">
              <div>
                <h2>Students in {selectedCourseTitle}</h2>
                <p>
                  Performance is scoped to {selectedCourseTitle}, so the
                  professor can compare students within the same course context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAllStudents((isShowing) => !isShowing);
                  setSelectedStudent(null);
                }}
              >
                {showAllStudents ? 'Show fewer' : `View all ${allStudents.length}`}
              </button>
            </div>

            <div className="monitor-table-wrap">
              <table className="monitor-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Completion</th>
                    <th>Avg. score</th>
                    <th>Topic scores</th>
                    <th>Weakest topic</th>
                    <th>Last active</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        No student monitoring records yet. Add enrollments,
                        lesson progress, or quiz attempts in the database to
                        populate this course.
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="monitor-student-cell">
                          <span className="monitor-avatar">
                            {getStudentInitials(student)}
                          </span>
                          <div>
                            <strong>{getStudentDisplayName(student)}</strong>
                            <span>{student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{student.completion}%</td>
                      <td>{student.score}%</td>
                      <td>
                        <div className="monitor-topic-dots">
                          {(Array.isArray(student.topicScores) ? student.topicScores : []).map((score, index) => (
                            <span
                              key={`${student.id}-${index}`}
                              className={
                                score < 60 ? 'low' : score < 78 ? 'mid' : 'high'
                              }
                              title={`${getMonitoringTopics(monitoring)[index]?.name || 'Topic'}: ${score}%`}
                            >
                              {score}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{student.weakestTopic}</td>
                      <td>{student.lastActive}</td>
                      <td>
                        <span className={`monitor-status ${student.status}`}>
                          {statusLabels[student.status]}
                        </span>
                      </td>
                      <td>
                        <button
                          className="monitor-link-button"
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedStudent && (
              <div className="monitor-student-detail">
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p>
                    {selectedStudent.id} in {selectedCourseTitle} -{' '}
                    {statusLabels[selectedStudent.status]}.
                  </p>
                </div>
                <div className="monitor-detail-grid">
                  <span>
                    <strong>{selectedStudent.completion}%</strong>
                    Completion
                  </span>
                  <span>
                    <strong>{selectedStudent.score}%</strong>
                    Average score
                  </span>
                  <span>
                    <strong>{selectedStudent.weakestTopic}</strong>
                    Topic to review
                  </span>
                </div>
                <div className="monitor-detail-topics">
                  {getMonitoringTopics(monitoring).map((topic, index) => (
                    <div key={topic.name}>
                      <span>{topic.name}</span>
                      <strong>{selectedStudent.topicScores[index]}%</strong>
                    </div>
                  ))}
                </div>
                <button
                  className="monitor-link-button"
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                >
                  Close details
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {activeView === 'reports' && (
        <section className="monitor-panel monitor-report-panel">
          <div className="monitor-panel-heading">
            <div>
              <h2>Statistical Reports</h2>
              <p>
                Generate a course report that includes enrollment, completion,
                topic averages, and student-level performance.
              </p>
            </div>
            <div className="monitor-action-stack">
              <button type="button" onClick={handleExport}>
                <FiDownload /> Download CSV
              </button>
              {exportMessage && (
                <span className="monitor-action-note">{exportMessage}</span>
              )}
            </div>
          </div>

          <div className="monitor-report-grid">
            <article className="monitor-report-card">
              <span>Course</span>
              <strong>{selectedCourseTitle}</strong>
              <p>{courseStats.enrolled} enrolled students</p>
            </article>
            <article className="monitor-report-card">
              <span>Completion</span>
              <strong>{courseStats.completion}%</strong>
              <p>{courseStats.needsReview} students need review.</p>
            </article>
            <article className="monitor-report-card">
              <span>Risk summary</span>
              <strong>{courseStats.atRisk}</strong>
              <p>Students are currently marked at risk.</p>
            </article>
          </div>

          <div className="monitor-report-body">
            <div>
              <h3>Report includes</h3>
              <ul>
                <li>Course summary and enrollment totals</li>
                <li>Topic averages with support counts</li>
                <li>Per-student scores, completion, activity, and status</li>
              </ul>
            </div>
            <div>
              <h3>Students needing support</h3>
              <ul>
                {studentsNeedingSupport.slice(0, 8).map((student) => (
                  <li key={student.id}>
                    {getStudentDisplayName(student)} - {student.weakestTopic} ({student.score}%)
                  </li>
                ))}
                {studentsNeedingSupport.length === 0 && (
                  <li>All students are currently on track.</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeView === 'analytics' && (
        <div className="monitor-analytics-grid">
          <section className="monitor-panel">
            <div className="monitor-panel-heading">
              <div>
                <h2>Topic Difficulty Ranking</h2>
                <p>Topics are sorted from lowest to highest class average.</p>
              </div>
            </div>
            <div className="monitor-topic-list">
              {[...getMonitoringTopics(monitoring)]
                .sort((first, second) => first.average - second.average)
                .map((topic) => (
                  <div className="monitor-topic-row" key={topic.name}>
                    <span>{topic.name}</span>
                    <div className="monitor-progress-track">
                      <div
                        className={`monitor-progress-fill ${
                          topic.average < 70
                            ? 'low'
                            : topic.average < 82
                              ? 'mid'
                              : 'high'
                        }`}
                        style={{ width: `${topic.average}%` }}
                      />
                    </div>
                    <strong>{topic.average}%</strong>
                  </div>
                ))}
            </div>
          </section>

          <section className="monitor-panel">
            <div className="monitor-panel-heading">
              <div>
                <h2>Status Breakdown</h2>
                <p>Student support levels for the selected course.</p>
              </div>
            </div>
            <div className="monitor-status-meters">
              {[
                ['On track', courseStats.onTrack, 'onTrack'],
                ['Needs review', courseStats.needsReview, 'needsReview'],
                ['At risk', courseStats.atRisk, 'atRisk'],
              ].map(([label, count, status]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                  <div className="monitor-mini-track">
                    <div
                      className={status}
                      style={{
                        width: `${Math.max(
                          4,
                          (Number(count) / Math.max(1, allStudents.length)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="monitor-panel monitor-priority-panel">
            <div className="monitor-panel-heading">
              <div>
                <h2>Intervention Priority</h2>
                <p>Lowest scoring students are listed first.</p>
              </div>
            </div>
            <div className="monitor-priority-list">
              {studentsNeedingSupport.slice(0, 6).map((student) => (
                <button
                  type="button"
                  key={student.id}
                  onClick={() => {
                    setActiveView('overview');
                    setSelectedStudent(student);
                  }}
                >
                  <span>
                    <strong>{getStudentDisplayName(student)}</strong>
                    {student.weakestTopic}
                  </span>
                  <em>{student.score}%</em>
                </button>
              ))}
              {studentsNeedingSupport.length === 0 && (
                <p>All students are currently on track.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

const featureCopy = {
  '/professor/modules/upload': {
    title: 'Upload Lesson Files',
    text: 'Upload PDF, DOCX, or TXT lessons and attach them to a course module.',
    cards: ['Choose lesson file', 'Extract lesson content', 'Attach to module'],
  },
  '/professor/modules/pages': {
    title: 'Manage Lesson Pages',
    text: 'Organize lesson pages, reorder content, and keep module materials clean.',
    cards: ['Page list', 'Edit lesson page', 'Preview student view'],
  },
  '/professor/modules/objectives': {
    title: 'Learning Objectives',
    text: 'Define measurable outcomes for each course module.',
    cards: ['Objective bank', 'Map to lessons', 'Check coverage'],
  },
  '/professor/modules/publish': {
    title: 'Publish Modules',
    text: 'Review drafts and publish modules when they are ready for students.',
    cards: ['Draft modules', 'Ready to publish', 'Published modules'],
  },
  '/professor/quizzes/create': {
    title: 'Create Quiz',
    text: 'Build quizzes for course modules using multiple-choice or true-or-false items.',
    cards: ['Quiz details', 'Question setup', 'Answer key'],
  },
  '/professor/quizzes/generate': {
    title: 'Auto-generate Quiz',
    text: 'Generate quiz drafts from learning objectives and lesson pages.',
    cards: ['Select source module', 'Choose difficulty', 'Review generated items'],
  },
  '/professor/quizzes/edit': {
    title: 'Edit Quiz',
    text: 'Update quiz questions, options, explanations, and publishing status.',
    cards: ['Quiz list', 'Edit selected quiz', 'Save changes'],
  },
  '/professor/quizzes/delete': {
    title: 'Delete Quiz',
    text: 'Remove outdated quizzes after confirmation.',
    cards: ['Archived quizzes', 'Delete confirmation', 'Audit note'],
  },
  '/professor/quizzes/questions': {
    title: 'Manage Quiz Questions',
    text: 'Add, revise, remove, and validate quiz questions.',
    cards: ['Question bank', 'Correct answers', 'Explanations'],
  },
  '/professor/students/enrolled': {
    title: 'View Enrolled Students',
    text: 'See students enrolled in each course.',
    cards: ['Enrollment list', 'Course filter', 'Student profile'],
  },
  '/professor/students/individual': {
    title: 'Individual Performance',
    text: 'Monitor one student at a time across modules and quizzes.',
    cards: ['Progress trend', 'Quiz attempts', 'Needs support'],
  },
  '/professor/students/class': {
    title: 'Class Performance',
    text: 'Compare class progress, completion rates, and assessment scores.',
    cards: ['Completion rate', 'Average score', 'At-risk students'],
  },
  '/professor/reports': {
    title: 'Statistical Reports',
    text: 'Prepare course and student performance reports.',
    cards: ['Course report', 'Quiz report', 'Export summary'],
  },
  '/professor/analytics': {
    title: 'Performance Analytics',
    text: 'Analyze activity, quiz results, and module completion patterns.',
    cards: ['Engagement', 'Performance', 'Interventions'],
  },
  '/professor/announcements': {
    title: 'Send Announcements',
    text: 'Send course-wide updates and reminders to enrolled students.',
    cards: ['Recipient group', 'Message composer', 'Send history'],
  },
  '/professor/notifications': {
    title: 'View Notifications',
    text: 'Review student submissions, system alerts, and course updates.',
    cards: ['Unread alerts', 'Course updates', 'Student activity'],
  },

  '/professor/activities': {
    title: 'Recent Activities',
    text: 'Track recent teaching activity and course updates.',
    cards: ['Published modules', 'Quiz changes', 'Announcements'],
  },
  '/professor/students': {
    title: 'Student Statistics',
    text: 'Monitor enrolled students, completion, and performance at a glance.',
    cards: ['105 enrolled students', '84% completion rate', '78% average score'],
  },
};

export default function ProfessorFeaturePage({ path }) {
  if (path === '/professor/students') {
    return <StudentMonitoringDashboard />;
  }

  const feature = featureCopy[path] || {
    title: 'Professor Feature',
    text: 'Manage this professor workflow from the sidebar.',
    cards: ['Overview', 'Manage', 'Review'],
  };

  return (
    <section className="professor-page">
      <div>
        <h1>{feature.title}</h1>
        <p>{feature.text}</p>
      </div>

      <div className="professor-card-grid">
        {feature.cards.map((card) => (
          <div className="professor-card" key={card}>
            <span>{card}</span>
          </div>
        ))}
      </div>
    </section>
  );
}



