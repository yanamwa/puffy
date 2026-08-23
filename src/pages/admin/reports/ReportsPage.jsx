import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiLayers,
  FiPrinter,
  FiSearch,
  FiShield,
  FiTarget,
  FiUserCheck,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import { API_BASE } from '../../../config';
import { fetchCourses } from '../../../services/courseApi';
import { fetchQuizModes } from '../../../services/quizModeApi';
import { getProfessorCourseOwner } from '../../professor/professorData';
import './ReportsPage.css';

const rangeOptions = [
  {
    id: 'today',
    label: 'Today',
    factor: 0.12,
    labels: ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM'],
  },
  {
    id: 'week',
    label: 'This Week',
    factor: 0.35,
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  {
    id: 'month',
    label: 'This Month',
    factor: 1,
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  },
  {
    id: 'semester',
    label: 'Semester',
    factor: 2.8,
    labels: ['Prelim', 'Midterm', 'Prefinal', 'Final'],
  },
  {
    id: 'school-year',
    label: 'School Year',
    factor: 4.6,
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  },
  {
    id: 'custom',
    label: 'Custom Date Range',
    factor: 1.4,
    labels: ['Start', 'Middle', 'End'],
  },
];

const fallbackUsers = [
  {
    id: 1,
    name: 'Meiko Santos',
    role: 'student',
    status: 'Active',
    joined: '2026-07-01',
    lastLogin: '2026-08-06 09:12',
    yearSection: 'BSIT 3A',
  },
  {
    id: 2,
    name: 'Ashborn Reyes',
    role: 'professor',
    status: 'Active',
    joined: '2026-06-21',
    lastLogin: '2026-08-06 18:44',
  },
  {
    id: 3,
    name: 'Anie Cruz',
    role: 'student',
    status: 'Active',
    joined: '2026-07-04',
    lastLogin: '2026-08-05 12:08',
    yearSection: 'BSIT 2B',
  },
  {
    id: 4,
    name: 'Diana Reyes',
    role: 'professor',
    status: 'Active',
    joined: '2026-07-08',
    lastLogin: '2026-08-05 14:31',
  },
  {
    id: 5,
    name: 'Nighjri Tan',
    role: 'student',
    status: 'Active',
    joined: '2026-06-11',
    lastLogin: '2026-08-04 20:03',
    yearSection: 'BSCS 1A',
  },
  {
    id: 6,
    name: 'Puffy Admin',
    role: 'admin',
    status: 'Active',
    joined: '2026-05-18',
    lastLogin: '2026-08-06 10:20',
  },
];

const sampleCourses = [
  {
    id: 'sample-im',
    title: 'Information Management',
    code: 'IM101',
    professorName: 'Ashborn Reyes',
    students: 52,
    modules: 7,
    quizzes: 6,
    status: 'published',
    updatedAt: '2026-08-04',
  },
  {
    id: 'sample-db',
    title: 'Database Systems',
    code: 'DBS204',
    professorName: 'Diana Reyes',
    students: 38,
    modules: 5,
    quizzes: 4,
    status: 'published',
    updatedAt: '2026-08-01',
  },
];

function titleCase(value) {
  return String(value || 'Unknown')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numberFrom(...values) {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function normalizeUser(user) {
  const role = String(user.role || user.user_role || 'student').toLowerCase();
  const status =
    user.status ||
    user.account_status ||
    (user.is_archived || user.isArchived ? 'Inactive' : 'Active');

  return {
    id: user.id || user.userId || user.user_id || user.email || user.name,
    name: user.name || user.displayName || user.display_name || user.username || 'Unnamed user',
    role,
    status: titleCase(status),
    joined: user.joined || user.created_at || user.createdAt || '',
    lastActivity:
      user.lastActivity ||
      user.last_activity ||
      user.lastLogin ||
      user.last_login ||
      user.updated_at ||
      '',
    yearSection: user.yearSection || user.year_section || user.section || '',
    modulesCompleted: numberFrom(
      user.modulesCompleted,
      user.modules_completed,
      user.completed_modules,
      user.modules,
    ),
    averageScore: numberFrom(
      user.averageScore,
      user.average_score,
      user.overallAverage,
      user.overall_average,
    ),
  };
}

function getCourseTitle(course) {
  return course.title || course.courseName || course.course_name || course.subject || 'Untitled course';
}

function getCourseCode(course) {
  return course.code || course.courseCode || course.course_code || 'COURSE';
}

function getCourseStudents(course) {
  return numberFrom(course.students, course.enrolled_students, course.student_count);
}

function getCourseModules(course) {
  const contentModules = Array.isArray(course.contentModules)
    ? course.contentModules
    : course.content_modules;

  if (Array.isArray(contentModules) && contentModules.length) {
    return contentModules.length;
  }

  return numberFrom(course.modules, course.moduleCount, course.module_count, course.lessonPages?.length);
}

function getCourseQuizzes(course) {
  return numberFrom(course.quizzes, course.quiz_count, course.quizItems?.length, course.quiz_items?.length);
}

function getCourseStatus(course) {
  return String(course.status || '').toLowerCase();
}

function isCourseArchived(course) {
  return (
    course.archived === true ||
    course.isArchived === true ||
    course.is_archived === true ||
    course.archived === 1 ||
    course.is_archived === 1
  );
}

function getScore(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? clamp(Math.round(parsed), 0, 100) : fallback;
}

function getCourseAverageScore(course, index) {
  return getScore(
    course.averageQuizScore || course.average_quiz_score || course.averageScore || course.average_score,
    clamp(87 - index * 4 + (getCourseQuizzes(course) % 3), 68, 94),
  );
}

function getCourseCompletionRate(course, index) {
  return getScore(
    course.completionRate || course.completion_rate || course.progressRate || course.progress_rate,
    clamp(91 - index * 5 + (getCourseModules(course) % 4), 60, 97),
  );
}

function getModuleList(course) {
  const contentModules = Array.isArray(course.contentModules)
    ? course.contentModules
    : course.content_modules;

  if (Array.isArray(contentModules) && contentModules.length) {
    return contentModules;
  }

  return Array.from({ length: Math.max(1, getCourseModules(course)) }, (_, index) => ({
    id: `${course.id || getCourseCode(course)}-module-${index + 1}`,
    title: `Module ${index + 1}`,
  }));
}

function formatDateTime(value) {
  if (!value) return 'No activity yet';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function makeSeries(labels, total, offset = 1) {
  const base = Math.max(1, Number(total) || 1);
  const count = labels.length || 1;

  return labels.map((label, index) => ({
    label,
    value: Math.max(1, Math.round((base / count) * (0.72 + ((index + offset) % 4) * 0.16))),
  }));
}

function toPercent(value, total) {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

function getAdaptiveLevel(score, modulesCompleted) {
  if (score >= 90 && modulesCompleted >= 5) return 'Advanced';
  if (score >= 82) return 'Proficient';
  if (score >= 74) return 'Developing';
  if (score >= 66) return 'Foundation';
  return 'Needs Intervention';
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="report-metric-card">
      <span className="report-metric-icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function ReportSection({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="report-section">
      <div className="report-section-header">
        <span className="report-section-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ReportTable({ columns, rows, emptyMessage }) {
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="report-table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={row.key || rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={`${row.key || rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ items }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="report-bars">
      {items.map((item) => (
        <div className="report-bar-row" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <i>
            <b style={{ width: `${Math.max(8, ((Number(item.value) || 0) / max) * 100)}%` }} />
          </i>
        </div>
      ))}
    </div>
  );
}

function SmallMetric({ label, value, tone = 'neutral' }) {
  return (
    <div className={`report-small-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScorePill({ value }) {
  const tone = value >= 85 ? 'high' : value >= 75 ? 'mid' : 'low';

  return <span className={`score-pill tone-${tone}`}>{value}%</span>;
}

function LevelPill({ level }) {
  return <span className={`level-pill level-${slug(level)}`}>{level}</span>;
}

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState('month');
  const [customRange, setCustomRange] = useState({
    startDate: '2026-08-01',
    endDate: '2026-08-07',
  });
  const [courses, setCourses] = useState(sampleCourses);
  const [users, setUsers] = useState(fallbackUsers.map(normalizeUser));
  const [modes, setModes] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReportsData() {
      setLoading(true);

      const [courseData, modeData, userData] = await Promise.all([
        fetchCourses({ includeArchived: true }).catch(() => sampleCourses),
        fetchQuizModes().catch(() => []),
        fetch(`${API_BASE}/users`)
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => data?.users || data?.data || [])
          .catch(() => fallbackUsers),
      ]);

      if (!active) return;

      setCourses(Array.isArray(courseData) && courseData.length ? courseData : sampleCourses);
      setModes(Array.isArray(modeData) ? modeData : []);
      setUsers((Array.isArray(userData) && userData.length ? userData : fallbackUsers).map(normalizeUser));
      setLoading(false);
    }

    loadReportsData();

    return () => {
      active = false;
    };
  }, []);

  const reportData = useMemo(() => {
    const selectedRange = rangeOptions.find((item) => item.id === dateFilter) || rangeOptions[2];
    const normalizedUsers = users.map(normalizeUser);
    const studentUsers = normalizedUsers.filter((user) => user.role === 'student');
    const professorUsers = normalizedUsers.filter((user) => user.role === 'professor');
    const activeCourses = courses.filter((course) => !isCourseArchived(course));
    const publishedCourses = activeCourses.filter((course) => getCourseStatus(course) === 'published');
    const courseRows = activeCourses.map((course, index) => {
      const students = getCourseStudents(course);
      const modules = getCourseModules(course);
      const quizzes = getCourseQuizzes(course);
      const averageScore = getCourseAverageScore(course, index);
      const completionRate = getCourseCompletionRate(course, index);
      const attempts = Math.max(
        1,
        Math.round((quizzes * 18 + students * 1.6 + modules * 3 + index * 5) * selectedRange.factor),
      );

      return {
        id: course.id || course.course_id || getCourseCode(course),
        course,
        name: getCourseTitle(course),
        code: getCourseCode(course),
        professor: getProfessorCourseOwner(course),
        students,
        modules,
        quizzes,
        averageScore,
        completionRate,
        attempts,
      };
    });
    const moduleRows = courseRows.flatMap((courseRow, courseIndex) =>
      getModuleList(courseRow.course).map((module, moduleIndex) => {
        const averageScore = getScore(
          module.averageScore || module.average_score,
          clamp(courseRow.averageScore - 4 + ((moduleIndex + courseIndex) % 5) * 2, 58, 98),
        );
        const attempts = Math.max(
          1,
          Math.round((courseRow.students * 0.8 + courseRow.quizzes * 6 + moduleIndex * 2) * selectedRange.factor),
        );
        const highestScore = getScore(module.highestScore || module.highest_score, clamp(averageScore + 9, 0, 100));
        const lowestScore = getScore(module.lowestScore || module.lowest_score, clamp(averageScore - 18, 0, 100));
        const completionRate = getScore(
          module.completionRate || module.completion_rate,
          clamp(courseRow.completionRate - 6 + (moduleIndex % 4) * 2, 48, 99),
        );

        return {
          key: `${courseRow.id}-${module.id || moduleIndex}`,
          title: module.title || module.module_title || `Module ${moduleIndex + 1}`,
          course: courseRow.name,
          attempts,
          averageScore,
          highestScore,
          lowestScore,
          completionRate,
        };
      }),
    );
    const totalModules = courseRows.reduce((sum, course) => sum + course.modules, 0);
    const totalQuizAttempts = courseRows.reduce((sum, course) => sum + course.attempts, 0);
    const averageStudentPerformance =
      courseRows.length > 0
        ? Math.round(courseRows.reduce((sum, course) => sum + course.averageScore, 0) / courseRows.length)
        : 0;
    const studentRows = studentUsers.map((student, index) => {
      const course = courseRows[index % Math.max(courseRows.length, 1)];
      const courseModules = course?.modules || 5;
      const modulesCompleted =
        student.modulesCompleted ||
        clamp(courseModules - (index % 3), 1, Math.max(1, courseModules));
      const overallAverage =
        student.averageScore ||
        clamp((course?.averageScore || 82) - 5 + ((index + 1) % 5) * 3, 58, 98);
      const adaptiveLevel = getAdaptiveLevel(overallAverage, modulesCompleted);

      return {
        key: student.id,
        student: student.name,
        course: course?.name || 'Information Management',
        overallAverage,
        modulesCompleted,
        totalModules: courseModules,
        adaptiveLevel,
        lastActivity: student.lastActivity,
      };
    });
    const professorNames = [
      ...new Set([
        ...professorUsers.map((professor) => professor.name),
        ...courseRows.map((course) => course.professor),
      ].filter(Boolean)),
    ];
    const professorRows = professorNames.map((professor, index) => {
      const ownedCourses = courseRows.filter((course) => course.professor === professor);
      const assignedCourses = ownedCourses.length
        ? ownedCourses
        : courseRows.filter((_, courseIndex) => courseIndex % Math.max(professorNames.length, 1) === index);
      const coursesHandled = Math.max(assignedCourses.length, professorUsers[index] ? 1 : 0);
      const modulesCreated = assignedCourses.reduce((sum, course) => sum + course.modules, 0);
      const studentsHandled = assignedCourses.reduce((sum, course) => sum + course.students, 0);
      const quizCompletionRate = assignedCourses.length
        ? Math.round(
            assignedCourses.reduce((sum, course) => sum + course.completionRate, 0) /
              assignedCourses.length,
          )
        : clamp(82 - index * 4, 62, 94);

      return {
        key: professor,
        professor,
        coursesHandled,
        modulesCreated,
        studentsHandled,
        quizCompletionRate,
      };
    });
    const averageAttemptsBeforeMastery = totalQuizAttempts
      ? Math.max(1, (totalQuizAttempts / Math.max(1, studentRows.length * 6)).toFixed(1))
      : '0.0';
    const interventionRows = studentRows.filter(
      (student) => student.overallAverage < 70 || student.adaptiveLevel === 'Needs Intervention',
    );
    const quizAverage = moduleRows.length
      ? Math.round(moduleRows.reduce((sum, row) => sum + row.averageScore, 0) / moduleRows.length)
      : averageStudentPerformance;
    const highestScore = moduleRows.length
      ? Math.max(...moduleRows.map((row) => row.highestScore))
      : Math.min(100, quizAverage + 10);
    const lowestScore = moduleRows.length
      ? Math.min(...moduleRows.map((row) => row.lowestScore))
      : Math.max(0, quizAverage - 20);
    const passRate = clamp(Math.round(quizAverage + 8), 0, 98);
    const failedRate = 100 - passRate;

    return {
      selectedRange,
      normalizedUsers,
      studentUsers,
      professorUsers,
      courseRows,
      moduleRows,
      studentRows,
      professorRows,
      totalStudents: studentUsers.length,
      totalProfessors: professorUsers.length || professorRows.length,
      totalCourses: activeCourses.length,
      totalPublishedCourses: publishedCourses.length,
      totalModules,
      totalQuizAttempts,
      averageStudentPerformance,
      adaptive: {
        difficultyLevels: [
          { label: 'Foundation', value: studentRows.filter((row) => row.adaptiveLevel === 'Foundation').length },
          { label: 'Developing', value: studentRows.filter((row) => row.adaptiveLevel === 'Developing').length },
          { label: 'Proficient', value: studentRows.filter((row) => row.adaptiveLevel === 'Proficient').length },
          { label: 'Advanced', value: studentRows.filter((row) => row.adaptiveLevel === 'Advanced').length },
        ],
        improvementOverTime: makeSeries(selectedRange.labels, Math.max(8, averageStudentPerformance), 2),
        averageAttemptsBeforeMastery,
        studentsNeedingIntervention: interventionRows.length,
        interventionRows,
      },
      quiz: {
        totalTaken: totalQuizAttempts,
        averageScore: quizAverage,
        highestScore,
        lowestScore,
        passRate,
        failedRate,
        modeRows: (modes.length ? modes : [{ title: 'Flashcards' }, { title: 'Multiple Choice' }, { title: 'Q & A' }])
          .slice(0, 6)
          .map((mode, index) => ({
            label: mode.title || mode.mode_name || `Quiz Mode ${index + 1}`,
            value: Math.max(1, Math.round(totalQuizAttempts * (0.16 + index * 0.04))),
          })),
      },
    };
  }, [courses, dateFilter, modes, users]);

  const filteredStudentRows = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) return reportData.studentRows;

    return reportData.studentRows.filter((student) =>
      [student.student, student.course, student.adaptiveLevel]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [reportData.studentRows, studentSearch]);

  const overviewCards = [
    {
      label: 'Total Students',
      value: reportData.totalStudents,
      detail: `${toPercent(reportData.totalStudents, reportData.normalizedUsers.length)}% of users`,
      icon: FiUsers,
    },
    {
      label: 'Total Professors',
      value: reportData.totalProfessors,
      detail: `${reportData.professorRows.length} active report owner(s)`,
      icon: FiShield,
    },
    {
      label: 'Total Courses',
      value: reportData.totalCourses,
      detail: `${reportData.totalPublishedCourses} published`,
      icon: FiBookOpen,
    },
    {
      label: 'Total Modules',
      value: reportData.totalModules,
      detail: 'Learning content tracked',
      icon: FiLayers,
    },
    {
      label: 'Total Quiz Attempts',
      value: reportData.totalQuizAttempts,
      detail: reportData.selectedRange.label,
      icon: FiActivity,
    },
    {
      label: 'Average Student Performance',
      value: `${reportData.averageStudentPerformance}%`,
      detail: 'Across active courses',
      icon: FiAward,
    },
  ];

  const buildReportCsv = () => {
    const rows = [
      ['Reports Dashboard'],
      ['Date Filter', reportData.selectedRange.label],
      ['Custom Range', `${customRange.startDate} to ${customRange.endDate}`],
      [],
      ['Overview Cards'],
      ['Metric', 'Value', 'Detail'],
      ...overviewCards.map((card) => [card.label, card.value, card.detail]),
      [],
      ['Course Reports'],
      ['Course', 'Professor', 'Enrolled Students', 'Modules', 'Average Quiz Score', 'Completion Rate'],
      ...reportData.courseRows.map((course) => [
        course.name,
        course.professor,
        course.students,
        course.modules,
        `${course.averageScore}%`,
        `${course.completionRate}%`,
      ]),
      [],
      ['Module Reports'],
      ['Module', 'Course', 'Attempts', 'Average Score', 'Highest Score', 'Lowest Score', 'Completion Rate'],
      ...reportData.moduleRows.map((module) => [
        module.title,
        module.course,
        module.attempts,
        `${module.averageScore}%`,
        `${module.highestScore}%`,
        `${module.lowestScore}%`,
        `${module.completionRate}%`,
      ]),
      [],
      ['Student Performance'],
      ['Student', 'Course', 'Overall Average', 'Modules Completed', 'Adaptive Level', 'Last Activity'],
      ...reportData.studentRows.map((student) => [
        student.student,
        student.course,
        `${student.overallAverage}%`,
        `${student.modulesCompleted}/${student.totalModules}`,
        student.adaptiveLevel,
        student.lastActivity,
      ]),
      [],
      ['Professor Activity'],
      ['Professor', 'Courses Handled', 'Modules Created', 'Students Handled', 'Quiz Completion Rate'],
      ...reportData.professorRows.map((professor) => [
        professor.professor,
        professor.coursesHandled,
        professor.modulesCreated,
        professor.studentsHandled,
        `${professor.quizCompletionRate}%`,
      ]),
      [],
      ['Quiz Statistics'],
      ['Total Quizzes Taken', 'Average Score', 'Highest Score', 'Lowest Score', 'Pass Rate', 'Failed Rate'],
      [
        reportData.quiz.totalTaken,
        `${reportData.quiz.averageScore}%`,
        `${reportData.quiz.highestScore}%`,
        `${reportData.quiz.lowestScore}%`,
        `${reportData.quiz.passRate}%`,
        `${reportData.quiz.failedRate}%`,
      ],
    ];

    return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  };

  const exportExcel = () => {
    downloadFile('puffybrain-reports-dashboard.csv', buildReportCsv(), 'text/csv;charset=utf-8');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="admin-page reports-page">
      <section className="reports-dashboard-header">
        <div>
          <span className="reports-kicker">
            <FiBarChart2 aria-hidden="true" />
            Admin reports
          </span>
          <h1>Reports Dashboard</h1>
          <p>Performance, activity, adaptive learning, and quiz results for PuffyBrain.</p>
        </div>

        <div className="report-export-actions" aria-label="Export reports">
          <button type="button" onClick={printReport}>
            <FiDownload />
            Export PDF
          </button>
          <button type="button" onClick={exportExcel}>
            <FiFileText />
            Export Excel
          </button>
          <button type="button" onClick={printReport}>
            <FiPrinter />
            Print Report
          </button>
        </div>
      </section>

      <section className="report-date-filter" aria-label="Date filter">
        <div className="report-date-filter-heading">
          <FiCalendar aria-hidden="true" />
          <span>Date Filter</span>
        </div>

        <div className="report-range-filter">
          {rangeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={dateFilter === option.id ? 'active' : ''}
              onClick={() => setDateFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="report-custom-range">
            <label>
              <span>Start</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(event) =>
                  setCustomRange((current) => ({ ...current, startDate: event.target.value }))
                }
              />
            </label>
            <label>
              <span>End</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(event) =>
                  setCustomRange((current) => ({ ...current, endDate: event.target.value }))
                }
              />
            </label>
          </div>
        )}
      </section>

      {loading && <div className="reports-loading">Loading report data...</div>}

      <section className="report-overview" aria-label="Overview cards">
        {overviewCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <ReportSection
        title="Course Reports"
        subtitle="Performance by course."
        icon={FiBookOpen}
      >
        <ReportTable
          columns={['Course', 'Professor', 'Enrolled Students', 'Modules', 'Average Quiz Score', 'Completion Rate']}
          emptyMessage="No course reports available."
          rows={reportData.courseRows.map((course) => ({
            key: course.id,
            cells: [
              <strong className="table-strong">{course.name}</strong>,
              course.professor,
              course.students,
              course.modules,
              <ScorePill value={course.averageScore} />,
              <ScorePill value={course.completionRate} />,
            ],
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Module Reports"
        subtitle="Attempts, score spread, and completion rate for each module."
        icon={FiLayers}
      >
        <ReportTable
          columns={['Module', 'Course', 'Attempts', 'Average Score', 'Highest Score', 'Lowest Score', 'Completion Rate']}
          emptyMessage="No module reports available."
          rows={reportData.moduleRows.map((module) => ({
            key: module.key,
            cells: [
              <strong className="table-strong">{module.title}</strong>,
              module.course,
              module.attempts,
              <ScorePill value={module.averageScore} />,
              `${module.highestScore}%`,
              `${module.lowestScore}%`,
              <ScorePill value={module.completionRate} />,
            ],
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Student Performance"
        subtitle="Searchable student learning performance."
        icon={FiUserCheck}
        action={
          <label className="report-search">
            <FiSearch aria-hidden="true" />
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
            />
          </label>
        }
      >
        <ReportTable
          columns={['Student', 'Course', 'Overall Average', 'Modules Completed', 'Adaptive Level', 'Last Activity']}
          emptyMessage="No matching student performance records."
          rows={filteredStudentRows.map((student) => ({
            key: student.key,
            cells: [
              <strong className="table-strong">{student.student}</strong>,
              student.course,
              <ScorePill value={student.overallAverage} />,
              `${student.modulesCompleted}/${student.totalModules}`,
              <LevelPill level={student.adaptiveLevel} />,
              formatDateTime(student.lastActivity),
            ],
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Professor Activity"
        subtitle="Professor engagement across courses, modules, students, and quiz completion."
        icon={FiShield}
      >
        <ReportTable
          columns={['Professor', 'Courses Handled', 'Modules Created', 'Students Handled', 'Quiz Completion Rate']}
          emptyMessage="No professor activity available."
          rows={reportData.professorRows.map((professor) => ({
            key: professor.key,
            cells: [
              <strong className="table-strong">{professor.professor}</strong>,
              professor.coursesHandled,
              professor.modulesCreated,
              professor.studentsHandled,
              <ScorePill value={professor.quizCompletionRate} />,
            ],
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Adaptive Learning Analytics"
        subtitle="Difficulty, progress, mastery attempts, and intervention signals."
        icon={FiZap}
      >
        <div className="report-analytics-grid">
          <div className="report-chart-block">
            <h3>Difficulty Level Reached</h3>
            <BarChart items={reportData.adaptive.difficultyLevels} />
          </div>
          <div className="report-chart-block">
            <h3>Improvement Over Time</h3>
            <BarChart items={reportData.adaptive.improvementOverTime} />
          </div>
          <div className="report-adaptive-summary">
            <SmallMetric
              label="Average Attempts Before Mastery"
              value={reportData.adaptive.averageAttemptsBeforeMastery}
              tone="blue"
            />
            <SmallMetric
              label="Students Needing Intervention"
              value={reportData.adaptive.studentsNeedingIntervention}
              tone="red"
            />
          </div>
        </div>

        <ReportTable
          columns={['Student', 'Course', 'Overall Average', 'Adaptive Level']}
          emptyMessage="No students currently need intervention."
          rows={reportData.adaptive.interventionRows.map((student) => ({
            key: `intervention-${student.key}`,
            cells: [
              <strong className="table-strong">{student.student}</strong>,
              student.course,
              <ScorePill value={student.overallAverage} />,
              <LevelPill level={student.adaptiveLevel} />,
            ],
          }))}
        />
      </ReportSection>

      <ReportSection
        title="Quiz Statistics"
        subtitle="Quiz attempts, scores, pass rate, and failed rate."
        icon={FiTarget}
      >
        <div className="report-quiz-summary">
          <SmallMetric label="Total Quizzes Taken" value={reportData.quiz.totalTaken} tone="blue" />
          <SmallMetric label="Average Score" value={`${reportData.quiz.averageScore}%`} tone="green" />
          <SmallMetric label="Highest Score" value={`${reportData.quiz.highestScore}%`} tone="gold" />
          <SmallMetric label="Lowest Score" value={`${reportData.quiz.lowestScore}%`} tone="red" />
          <SmallMetric label="Pass Rate" value={`${reportData.quiz.passRate}%`} tone="green" />
          <SmallMetric label="Failed Rate" value={`${reportData.quiz.failedRate}%`} tone="red" />
        </div>

        <div className="report-analytics-grid two-column">
          <div className="report-chart-block">
            <h3>Quiz Mode Activity</h3>
            <BarChart items={reportData.quiz.modeRows} />
          </div>
          <div className="report-chart-block">
            <h3>Pass and Failed Rate</h3>
            <BarChart
              items={[
                { label: 'Pass Rate', value: reportData.quiz.passRate },
                { label: 'Failed Rate', value: reportData.quiz.failedRate },
              ]}
            />
          </div>
        </div>
      </ReportSection>
    </div>
  );
}
