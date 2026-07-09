import { useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiDownload,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  professorCoursesSeed,
  readProfessorCourses,
} from './professorData';
import './ProfessorLayout.css';

const courseMonitoringSeed = {
  WEB101: {
    section: 'BSIT 1A',
    schedule: 'Mon/Wed, 9:00 AM',
    topics: [
      { name: 'HTML semantics', average: 92 },
      { name: 'CSS layout', average: 84 },
      { name: 'JavaScript basics', average: 76 },
      { name: 'Responsive design', average: 81 },
    ],
    assessments: [
      { label: 'Quiz average', value: 82 },
      { label: 'Activity completion', value: 88 },
      { label: 'Project milestone', value: 79 },
    ],
    students: [
      {
        id: 'STU-1001',
        name: 'Mika Santos',
        completion: 96,
        score: 91,
        lastActive: 'Today',
        status: 'onTrack',
        weakestTopic: 'JavaScript basics',
        topicScores: [94, 88, 86, 95],
      },
      {
        id: 'STU-1002',
        name: 'Jomari Cruz',
        completion: 74,
        score: 69,
        lastActive: '2 days ago',
        status: 'needsReview',
        weakestTopic: 'Responsive design',
        topicScores: [82, 71, 68, 55],
      },
      {
        id: 'STU-1003',
        name: 'Bea Reyes',
        completion: 43,
        score: 54,
        lastActive: '6 days ago',
        status: 'atRisk',
        weakestTopic: 'JavaScript basics',
        topicScores: [65, 58, 41, 52],
      },
      {
        id: 'STU-1004',
        name: 'Enzo Villanueva',
        completion: 89,
        score: 84,
        lastActive: 'Yesterday',
        status: 'onTrack',
        weakestTopic: 'CSS layout',
        topicScores: [91, 77, 82, 85],
      },
      {
        id: 'STU-1005',
        name: 'Aira Mendoza',
        completion: 68,
        score: 72,
        lastActive: 'Today',
        status: 'needsReview',
        weakestTopic: 'JavaScript basics',
        topicScores: [80, 76, 59, 71],
      },
    ],
  },
  DBS204: {
    section: 'BSIT 2B',
    schedule: 'Tue/Thu, 10:30 AM',
    topics: [
      { name: 'ER diagrams', average: 78 },
      { name: 'Normalization', average: 66 },
      { name: 'SQL joins', average: 73 },
      { name: 'Transactions', average: 61 },
    ],
    assessments: [
      { label: 'Quiz average', value: 70 },
      { label: 'Lab completion', value: 76 },
      { label: 'Case analysis', value: 68 },
    ],
    students: [
      {
        id: 'STU-2101',
        name: 'Lia Aquino',
        completion: 91,
        score: 86,
        lastActive: 'Today',
        status: 'onTrack',
        weakestTopic: 'Transactions',
        topicScores: [92, 84, 88, 79],
      },
      {
        id: 'STU-2102',
        name: 'Marco Dela Cruz',
        completion: 63,
        score: 65,
        lastActive: '3 days ago',
        status: 'needsReview',
        weakestTopic: 'Normalization',
        topicScores: [73, 55, 69, 63],
      },
      {
        id: 'STU-2103',
        name: 'Nina Salcedo',
        completion: 78,
        score: 74,
        lastActive: 'Yesterday',
        status: 'needsReview',
        weakestTopic: 'Transactions',
        topicScores: [81, 77, 75, 62],
      },
      {
        id: 'STU-2104',
        name: 'Paolo Garcia',
        completion: 39,
        score: 48,
        lastActive: '8 days ago',
        status: 'atRisk',
        weakestTopic: 'SQL joins',
        topicScores: [58, 49, 36, 50],
      },
    ],
  },
  HCI310: {
    section: 'BSCS 3A',
    schedule: 'Friday, 1:00 PM',
    topics: [
      { name: 'User research', average: 86 },
      { name: 'Wireframing', average: 91 },
      { name: 'Accessibility', average: 72 },
      { name: 'Usability testing', average: 83 },
    ],
    assessments: [
      { label: 'Design critique', value: 87 },
      { label: 'Prototype progress', value: 90 },
      { label: 'Testing report', value: 76 },
    ],
    students: [
      {
        id: 'STU-3101',
        name: 'Sam Ortega',
        completion: 98,
        score: 93,
        lastActive: 'Today',
        status: 'onTrack',
        weakestTopic: 'Accessibility',
        topicScores: [96, 94, 84, 97],
      },
      {
        id: 'STU-3102',
        name: 'Ivy Tan',
        completion: 88,
        score: 85,
        lastActive: 'Today',
        status: 'onTrack',
        weakestTopic: 'Usability testing',
        topicScores: [86, 91, 84, 79],
      },
      {
        id: 'STU-3103',
        name: 'Ken Ramos',
        completion: 71,
        score: 70,
        lastActive: '4 days ago',
        status: 'needsReview',
        weakestTopic: 'Accessibility',
        topicScores: [78, 82, 55, 66],
      },
      {
        id: 'STU-3104',
        name: 'Mara Torres',
        completion: 52,
        score: 57,
        lastActive: '7 days ago',
        status: 'atRisk',
        weakestTopic: 'Accessibility',
        topicScores: [62, 70, 39, 56],
      },
    ],
  },
};

const statusLabels = {
  onTrack: 'On track',
  needsReview: 'Needs review',
  atRisk: 'At risk',
};

const rosterNamePool = [
  'Rafa Bautista',
  'Celine Ong',
  'Daryl Lim',
  'Trisha Navarro',
  'Luis Mercado',
  'Alexa Rivera',
  'Noel Santiago',
  'Gia Flores',
  'Miguel Sy',
  'Andrea Lopez',
  'Harvey Yu',
  'Sofia Castillo',
  'Renz Villamor',
  'Patricia Uy',
  'Carlo Reyes',
  'Janelle Cruz',
  'Theo Ramos',
  'Bianca Tan',
  'Gab Mateo',
  'Elise Gomez',
  'Ivan Chua',
  'Faith Santos',
  'Nico Mendoza',
  'Kyla Dizon',
  'Arman Lee',
  'Elaine Roxas',
  'Joshua Co',
  'Mia Fernando',
  'Cedric Villanueva',
  'Yna Aquino',
  'Bryan Cortez',
  'Lea Garcia',
  'Troy Valdez',
  'Rica Salcedo',
  'Paulo Enriquez',
  'Dana Mariano',
  'Vince Robles',
  'Iris Domingo',
  'Kurt Angeles',
  'Shane Ignacio',
];

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

function buildClassRoster(monitoring, enrolled, courseCode) {
  const baseStudents = monitoring.students.map((student) => ({
    ...student,
    topicScores: monitoring.topics.map(
      (_, index) => student.topicScores[index] ?? student.score
    ),
  }));

  if (baseStudents.length >= enrolled) {
    return baseStudents;
  }

  const generatedStudents = Array.from(
    { length: enrolled - baseStudents.length },
    (_, index) => {
      const rosterIndex = baseStudents.length + index;
      const topicScores = monitoring.topics.map((topic, topicIndex) =>
        clampScore(topic.average + ((rosterIndex * (topicIndex + 3)) % 21) - 10)
      );
      const score = averageNumbers(topicScores);
      const completion = clampScore(score + ((rosterIndex % 13) - 6));
      const status = getStatus(completion, score);

      return {
        id: `${courseCode}-${String(rosterIndex + 1).padStart(3, '0')}`,
        name:
          rosterNamePool[index % rosterNamePool.length] ||
          `Student ${String(rosterIndex + 1).padStart(2, '0')}`,
        completion,
        score,
        lastActive: ['Today', 'Yesterday', '2 days ago', '4 days ago', '1 week ago'][
          rosterIndex % 5
        ],
        status,
        weakestTopic: getWeakestTopic(monitoring.topics, topicScores),
        topicScores,
      };
    }
  );

  return [...baseStudents, ...generatedStudents];
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
  const topicRows = monitoring.topics.map((topic) => [topic.name, `${topic.average}%`]);
  const studentHeader = [
    'Student ID',
    'Student',
    'Completion',
    'Average score',
    ...monitoring.topics.map((topic) => topic.name),
    'Weakest topic',
    'Last active',
    'Status',
  ];
  const studentRows = students.map((student) => [
    student.id,
    student.name,
    `${student.completion}%`,
    `${student.score}%`,
    ...student.topicScores.map((score) => `${score}%`),
    student.weakestTopic,
    student.lastActive,
    statusLabels[student.status],
  ]);

  return [...summaryRows, topicHeader, ...topicRows, [], studentHeader, ...studentRows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
}

function getMonitoringFallback(course) {
  const courseCode = course.code || 'COURSE';
  const base = Number(course.id || 1) * 7;

  return {
    section: 'Course section',
    schedule: 'Schedule not set',
    topics: [
      { name: 'Module completion', average: 70 + (base % 18) },
      { name: 'Quiz performance', average: 62 + (base % 21) },
      { name: 'Activity submissions', average: 66 + (base % 20) },
      { name: 'Final output', average: 58 + (base % 25) },
    ],
    assessments: [
      { label: 'Quiz average', value: 65 + (base % 18) },
      { label: 'Activity completion', value: 70 + (base % 16) },
      { label: 'Project progress', value: 60 + (base % 20) },
    ],
    students: [
      {
        id: `${courseCode}-001`,
        name: 'Mika Santos',
        completion: 90,
        score: 87,
        lastActive: 'Today',
        status: 'onTrack',
        weakestTopic: 'Quiz performance',
        topicScores: [90, 83, 88, 86],
      },
      {
        id: `${courseCode}-002`,
        name: 'Jomari Cruz',
        completion: 72,
        score: 68,
        lastActive: '2 days ago',
        status: 'needsReview',
        weakestTopic: 'Final output',
        topicScores: [76, 70, 73, 55],
      },
      {
        id: `${courseCode}-003`,
        name: 'Bea Reyes',
        completion: 48,
        score: 53,
        lastActive: '6 days ago',
        status: 'atRisk',
        weakestTopic: 'Quiz performance',
        topicScores: [58, 44, 61, 50],
      },
      {
        id: `${courseCode}-004`,
        name: 'Enzo Villanueva',
        completion: 84,
        score: 81,
        lastActive: 'Yesterday',
        status: 'onTrack',
        weakestTopic: 'Activity submissions',
        topicScores: [88, 80, 75, 82],
      },
    ],
  };
}

function getMonitoringForCourse(course) {
  return courseMonitoringSeed[course.code] || getMonitoringFallback(course);
}

function StudentMonitoringDashboard() {
  const storedCourses = readProfessorCourses();
  const activeCourses = storedCourses.filter((course) => !course.archived);
  const courses = activeCourses.length ? activeCourses : professorCoursesSeed;
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [activeView, setActiveView] = useState('overview');
  const [showTopicBreakdown, setShowTopicBreakdown] = useState(false);
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exportMessage, setExportMessage] = useState('');

  const selectedCourse = useMemo(
    () =>
      courses.find((course) => String(course.id) === String(selectedCourseId)) ||
      courses[0],
    [courses, selectedCourseId]
  );

  const monitoring = useMemo(
    () => getMonitoringForCourse(selectedCourse),
    [selectedCourse]
  );

  const allStudents = useMemo(
    () =>
      buildClassRoster(
        monitoring,
        Number(selectedCourse.students || monitoring.students.length),
        selectedCourse.code
      ),
    [monitoring, selectedCourse]
  );

  const courseStats = useMemo(() => {
    const students = allStudents;
    const lowestTopic = monitoring.topics.reduce((lowest, topic) =>
      topic.average < lowest.average ? topic : lowest
    );

    return {
      enrolled: selectedCourse.students || students.length,
      completion: average(students, 'completion'),
      score: average(students, 'score'),
      onTrack: students.filter((student) => student.status === 'onTrack').length,
      needsReview: students.filter((student) => student.status === 'needsReview').length,
      atRisk: students.filter((student) => student.status === 'atRisk').length,
      lowestTopic,
    };
  }, [allStudents, monitoring, selectedCourse]);

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
    () =>
      monitoring.topics.map((topic, topicIndex) => {
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
          topStudent: topStudent.name,
        };
      }),
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
    const csv = createMonitoringCsv(
      selectedCourse,
      monitoring,
      allStudents,
      courseStats
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${selectedCourse.code.toLowerCase()}-student-monitoring.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportMessage(`CSV exported for ${selectedCourse.code}.`);
  };

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
            value={selectedCourse?.id || ''}
            onChange={handleCourseChange}
            aria-label="Select course to monitor"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </label>

        <div className="monitor-course-meta">
          <span>{monitoring.section}</span>
          <span>{monitoring.schedule}</span>
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
                {monitoring.topics.map((topic) => (
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
                {monitoring.assessments.map((assessment) => (
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
                <h2>Students in {selectedCourse.code}</h2>
                <p>
                  Performance is scoped to {selectedCourse.title}, so the
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
                  {displayedStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="monitor-student-cell">
                          <span className="monitor-avatar">
                            {student.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)}
                          </span>
                          <div>
                            <strong>{student.name}</strong>
                            <span>{student.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{student.completion}%</td>
                      <td>{student.score}%</td>
                      <td>
                        <div className="monitor-topic-dots">
                          {student.topicScores.map((score, index) => (
                            <span
                              key={`${student.id}-${index}`}
                              className={
                                score < 60 ? 'low' : score < 78 ? 'mid' : 'high'
                              }
                              title={`${monitoring.topics[index]?.name}: ${score}%`}
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
                  ))}
                </tbody>
              </table>
            </div>

            {selectedStudent && (
              <div className="monitor-student-detail">
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p>
                    {selectedStudent.id} in {selectedCourse.code} -{' '}
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
                  {monitoring.topics.map((topic, index) => (
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
              <strong>{selectedCourse.code}</strong>
              <p>{selectedCourse.title}</p>
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
                    {student.name} - {student.weakestTopic} ({student.score}%)
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
              {[...monitoring.topics]
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
                    <strong>{student.name}</strong>
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
  '/professor/profile': {
    title: 'Edit Profile',
    text: 'Update professor profile details and contact information.',
    cards: ['Basic details', 'Profile photo', 'Office information'],
  },
  '/professor/change-password': {
    title: 'Change Password',
    text: 'Update account password securely.',
    cards: ['Current password', 'New password', 'Confirm update'],
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
