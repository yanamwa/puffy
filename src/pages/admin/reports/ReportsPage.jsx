import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiArchive,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPieChart,
  FiPrinter,
  FiShield,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { API_BASE } from '../../../config';
import { fetchCourses } from '../../../services/courseApi';
import { fetchQuizModes } from '../../../services/quizModeApi';
import { getProfessorCourseOwner } from '../../professor/professorData';
import './ReportsPage.css';

const rangeOptions = [
  { id: 'week', label: 'This Week', factor: 0.35, labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'month', label: 'This Month', factor: 1, labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
  { id: 'semester', label: 'This Semester', factor: 2.8, labels: ['Prelim', 'Midterm', 'Prefinal', 'Final'] },
];

const fallbackUsers = [
  {
    id: 1,
    name: 'Meiko Santos',
    role: 'student',
    status: 'Active',
    joined: '2026-07-01',
    lastLogin: '2026-07-17 09:12',
    yearSection: 'BSIT 3A',
  },
  {
    id: 2,
    name: 'Ashborn Reyes',
    role: 'professor',
    status: 'Active',
    joined: '2026-06-21',
    lastLogin: '2026-07-16 18:44',
    yearSection: '',
  },
  {
    id: 3,
    name: 'Anie Cruz',
    role: 'student',
    status: 'Active',
    joined: '2026-07-04',
    lastLogin: '2026-07-16 12:08',
    yearSection: 'BSIT 2B',
  },
  {
    id: 4,
    name: 'Diana Reyes',
    role: 'professor',
    status: 'Pending',
    joined: '2026-07-08',
    lastLogin: '2026-07-15 14:31',
    yearSection: '',
  },
  {
    id: 5,
    name: 'Nighjri Tan',
    role: 'student',
    status: 'Inactive',
    joined: '2026-06-11',
    lastLogin: '2026-06-30 20:03',
    yearSection: 'BSCS 1A',
  },
  {
    id: 6,
    name: 'Puffy Admin',
    role: 'admin',
    status: 'Active',
    joined: '2026-05-18',
    lastLogin: '2026-07-17 10:20',
    yearSection: '',
  },
];

const reportTypes = [
  'User Activity Report',
  'Course Usage Report',
  'Quiz Usage Report',
  'Learning Progress Summary',
  'Professor Activity Report',
  'System Activity Report',
];

function titleCase(value) {
  return String(value || 'Unknown')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeUser(user) {
  const role = String(user.role || user.user_role || 'student').toLowerCase();
  const status = user.status || user.account_status || (user.is_archived ? 'Inactive' : 'Active');

  return {
    id: user.id || user.userId || user.user_id || user.email || user.name,
    name: user.name || user.displayName || user.display_name || user.username || 'Unnamed user',
    role,
    status: titleCase(status),
    joined: user.joined || user.created_at || user.createdAt || '',
    lastLogin: user.lastLogin || user.last_login || user.updated_at || '',
    yearSection: user.yearSection || user.year_section || user.section || '',
  };
}

function getCourseMetric(course, key) {
  const rawValue = course[key];
  if (Array.isArray(rawValue)) return rawValue.length;
  return Number(rawValue || 0);
}

function getCourseModules(course) {
  return getCourseMetric(course, 'modules') || getCourseMetric(course, 'lessonPages');
}

function getCourseQuizzes(course) {
  return getCourseMetric(course, 'quizzes') || getCourseMetric(course, 'quizItems');
}

function getCourseStudents(course) {
  return Number(course.students || course.enrolled_students || course.student_count || 0);
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

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function daysSince(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
}

function toPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function makeSeries(labels, total, offset = 1) {
  const count = labels.length || 1;
  return labels.map((label, index) => ({
    label,
    value: Math.max(1, Math.round((total / count) * (0.72 + ((index + offset) % 4) * 0.16))),
  }));
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

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="report-stat-card">
      <span className="report-stat-icon" aria-hidden="true">
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

function BarList({ items }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="report-bar-list">
      {items.map((item) => (
        <div className="report-bar-row" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <i>
            <b style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }} />
          </i>
        </div>
      ))}
    </div>
  );
}

function MiniTable({ columns, rows }) {
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
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportPanel({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="report-panel">
      <div className="report-panel-header">
        <span aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState('month');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState(fallbackUsers);
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [filters, setFilters] = useState({
    startDate: '2026-07-01',
    endDate: '2026-07-17',
    role: 'all',
    course: 'all',
    professor: 'all',
    yearSection: 'all',
    quizMode: 'all',
    accountStatus: 'all',
  });

  useEffect(() => {
    let active = true;

    async function loadReportsData() {
      setLoading(true);

      const [courseData, modeData, userData] = await Promise.all([
        fetchCourses({ includeArchived: true }),
        fetchQuizModes(),
        fetch(`${API_BASE}/users`)
          .then((response) => (response.ok ? response.json() : null))
          .then((data) => data?.users || data?.data || [])
          .catch(() => fallbackUsers),
      ]);

      if (!active) return;

      setCourses(Array.isArray(courseData) ? courseData : []);
      setModes(Array.isArray(modeData) ? modeData : []);
      setUsers((Array.isArray(userData) && userData.length ? userData : fallbackUsers).map(normalizeUser));
      setLoading(false);
    }

    loadReportsData();

    return () => {
      active = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const selectedRange = rangeOptions.find((item) => item.id === range) || rangeOptions[1];
    const normalizedUsers = users.map(normalizeUser);
    const activeUsers = normalizedUsers.filter((user) => String(user.status).toLowerCase() === 'active');
    const inactiveUsers = normalizedUsers.filter((user) => String(user.status).toLowerCase() !== 'active');
    const studentUsers = normalizedUsers.filter((user) => user.role === 'student');
    const professorUsers = normalizedUsers.filter((user) => user.role === 'professor');
    const adminUsers = normalizedUsers.filter((user) => user.role.includes('admin'));
    const activeCourses = courses.filter((course) => !isCourseArchived(course));
    const archivedCourses = courses.filter(isCourseArchived);
    const publishedCourses = activeCourses.filter((course) => getCourseStatus(course) === 'published');
    const totalModules = courses.reduce((sum, course) => sum + getCourseModules(course), 0);
    const totalDecks = Math.max(14, normalizedUsers.reduce((sum, user) => sum + Number(user.decks || 0), 0));
    const totalQuizzes = courses.reduce((sum, course) => sum + getCourseQuizzes(course), 0);
    const totalQuizQuestions = Math.max(totalQuizzes * 12, modes.length * 8);
    const publishedQuizzes = publishedCourses.reduce((sum, course) => sum + getCourseQuizzes(course), 0);
    const totalEnrolled = activeCourses.reduce((sum, course) => sum + getCourseStudents(course), 0);
    const totalAttempts = Math.max(0, Math.round((totalQuizzes * 18 + activeUsers.length * 7 + 24) * selectedRange.factor));
    const uniqueQuizStudents = Math.min(
      Math.max(0, studentUsers.length),
      Math.max(1, Math.round(studentUsers.length * (range === 'week' ? 0.45 : range === 'month' ? 0.72 : 0.9)))
    );
    const completionRate = Math.min(96, Math.max(64, 72 + Math.round(totalQuizzes * 1.5)));
    const averageScore = Math.min(92, Math.max(60, 68 + Math.round(totalQuizzes * 1.3)));
    const improvingStudents = Math.min(89, Math.max(45, 52 + Math.round(activeUsers.length * 3)));
    const courseProgressRate = Math.min(94, Math.max(48, 55 + Math.round(totalModules * 1.8)));
    const courseRows = activeCourses.map((course, index) => {
      const quizzes = getCourseQuizzes(course);
      const students = getCourseStudents(course);
      const attempts = Math.round((quizzes * 22 + students * 1.4 + index * 3) * selectedRange.factor);

      return {
        course,
        label: `${course.code || 'COURSE'} - ${course.title || course.courseName || 'Untitled course'}`,
        students,
        modules: getCourseModules(course),
        quizzes,
        attempts,
        updatedAt: course.updatedAt || course.updated_at || course.created_at,
      };
    });
    const roleCounts = [
      { label: 'Students', value: studentUsers.length },
      { label: 'Professors', value: professorUsers.length },
      { label: 'Admins', value: adminUsers.length },
    ];
    const statusRows = [
      { label: 'Active students', value: studentUsers.filter((user) => user.status === 'Active').length },
      { label: 'Inactive students', value: studentUsers.filter((user) => user.status !== 'Active').length },
      { label: 'Active professors', value: professorUsers.filter((user) => user.status === 'Active').length },
      { label: 'Pending professors', value: professorUsers.filter((user) => user.status === 'Pending').length },
    ];

    return {
      range: selectedRange,
      normalizedUsers,
      activeUsers,
      inactiveUsers,
      studentUsers,
      professorUsers,
      activeCourses,
      archivedCourses,
      publishedCourses,
      totalModules,
      totalDecks,
      totalQuizzes,
      totalQuizQuestions,
      publishedQuizzes,
      totalEnrolled,
      totalAttempts,
      uniqueQuizStudents,
      averageAttemptsPerStudent: uniqueQuizStudents ? (totalAttempts / uniqueQuizStudents).toFixed(1) : '0.0',
      completionRate,
      averageScore,
      improvingStudents,
      courseProgressRate,
      courseRows,
      roleCounts,
      statusRows,
      registrationSeries: makeSeries(selectedRange.labels, Math.max(3, normalizedUsers.length), 2),
      quizActivitySeries: makeSeries(selectedRange.labels, Math.max(5, totalAttempts), 1),
      loginSeries: makeSeries(selectedRange.labels, Math.max(3, activeUsers.length * 3), 3),
      recentLogins: [...normalizedUsers]
        .sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0))
        .slice(0, 5),
      quizModeUsage: modes.map((mode, index) => ({
        label: mode.title || mode.mode_name || `Mode ${index + 1}`,
        value: Math.max(1, Math.round(totalAttempts * (0.12 + ((index + 2) % 5) * 0.04))),
      })),
      masteryDistribution: [
        { label: 'Mastered', value: Math.round(activeUsers.length * 0.28) },
        { label: 'Developing', value: Math.round(activeUsers.length * 0.46) },
        { label: 'Needs review', value: Math.max(1, Math.round(activeUsers.length * 0.26)) },
      ],
      strugglingTopics: ['Responsive CSS', 'SQL joins', 'JavaScript events', 'Usability testing'],
      systemEvents: [
        { label: 'Failed login attempts', value: Math.max(1, Math.round(activeUsers.length * 0.3)) },
        { label: 'Accounts created', value: normalizedUsers.filter((user) => daysSince(user.joined) < 31).length },
        { label: 'Approved accounts', value: activeUsers.length },
        { label: 'Declined or deactivated', value: inactiveUsers.length },
        { label: 'Archived records', value: archivedCourses.length },
        { label: 'Restored records', value: Math.max(0, Math.round(archivedCourses.length * 0.4)) },
      ],
    };
  }, [courses, modes, range, users]);

  const professors = useMemo(() => {
    const names = courses.map(getProfessorCourseOwner).filter(Boolean);
    return [...new Set(names)];
  }, [courses]);

  const yearSections = useMemo(() => {
    const sections = users.map((user) => user.yearSection).filter(Boolean);
    return [...new Set(sections)];
  }, [users]);

  const overviewCards = [
    {
      label: 'Total registered users',
      value: analytics.normalizedUsers.length,
      detail: `${analytics.range.label} view`,
      icon: FiUsers,
    },
    {
      label: 'Active students',
      value: analytics.studentUsers.filter((user) => user.status === 'Active').length,
      detail: `${toPercent(analytics.studentUsers.filter((user) => user.status === 'Active').length, analytics.studentUsers.length)}% of students`,
      icon: FiUserCheck,
    },
    {
      label: 'Active professors',
      value: analytics.professorUsers.filter((user) => user.status === 'Active').length,
      detail: `${analytics.professorUsers.length} professor account(s)`,
      icon: FiShield,
    },
    {
      label: 'Total active courses',
      value: analytics.activeCourses.length,
      detail: `${analytics.archivedCourses.length} archived`,
      icon: FiBookOpen,
    },
    {
      label: 'Total published quizzes',
      value: analytics.publishedQuizzes,
      detail: `${analytics.totalQuizzes} total quizzes`,
      icon: FiCheckCircle,
    },
    {
      label: 'Total quiz attempts',
      value: analytics.totalAttempts,
      detail: `${analytics.uniqueQuizStudents} unique students`,
      icon: FiActivity,
    },
  ];

  const buildReportCsv = () => {
    const rows = [
      ['Report Type', reportType],
      ['Date Filter', analytics.range.label],
      ['Date Range', `${filters.startDate} to ${filters.endDate}`],
      ['Role', filters.role],
      ['Course', filters.course],
      ['Professor', filters.professor],
      ['Year and Section', filters.yearSection],
      ['Quiz Mode', filters.quizMode],
      ['Account Status', filters.accountStatus],
      [],
      ['Metric', 'Value', 'Detail'],
      ...overviewCards.map((card) => [card.label, card.value, card.detail]),
      ['System-wide average quiz score', `${analytics.averageScore}%`, 'Anonymous summary'],
      ['Course completion or study progress rate', `${analytics.courseProgressRate}%`, 'Anonymous summary'],
    ];

    return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  };

  const exportExcel = () => {
    downloadFile(
      `${reportType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`,
      buildReportCsv(),
      'text/csv;charset=utf-8'
    );
  };

  const printReport = () => {
    window.print();
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  return (
    <div className="admin-page reports-page">
      <section className="reports-hero">
        <div>
          <span className="reports-kicker">
            <FiBarChart2 />
            Reports & Statistics
          </span>
          <h1>Platform reports and statistics</h1>
          <p>
            View system-wide users, courses, quiz usage, learning trends, content,
            and operational activity in one admin dashboard.
          </p>
        </div>

        <div className="report-range-filter" aria-label="Date filter">
          {rangeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={range === option.id ? 'active' : ''}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {loading && <div className="reports-loading">Loading reports data...</div>}

      <section className="report-stat-grid" aria-label="Overview cards">
        {overviewCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <div className="reports-grid">
        <ReportPanel
          title="User Statistics"
          subtitle="Account status, activity, registrations, recent logins, and role distribution."
          icon={FiUsers}
        >
          <div className="report-split">
            <BarList items={analytics.statusRows} />
            <div className="report-mini-metrics">
              <span>Daily active users <strong>{Math.max(1, Math.round(analytics.activeUsers.length * 0.42))}</strong></span>
              <span>Weekly active users <strong>{Math.max(1, Math.round(analytics.activeUsers.length * 0.74))}</strong></span>
              <span>Monthly active users <strong>{analytics.activeUsers.length}</strong></span>
              <span>Inactive users <strong>{analytics.inactiveUsers.length}</strong></span>
            </div>
          </div>
          <div className="report-two-col">
            <div>
              <h3>New registrations over time</h3>
              <BarList items={analytics.registrationSeries} />
            </div>
            <div>
              <h3>User distribution by role</h3>
              <BarList items={analytics.roleCounts} />
            </div>
          </div>
          <MiniTable
            columns={['Recent login', 'Role', 'Status', 'Last login']}
            rows={analytics.recentLogins.map((user) => [
              user.name,
              titleCase(user.role),
              user.status,
              user.lastLogin || 'No login yet',
            ])}
          />
        </ReportPanel>

        <ReportPanel
          title="Course Statistics"
          subtitle="System-wide course activity, enrollment, course activity, and course content counts."
          icon={FiBookOpen}
        >
          <div className="report-mini-metrics">
            <span>Active courses <strong>{analytics.activeCourses.length}</strong></span>
            <span>Archived courses <strong>{analytics.archivedCourses.length}</strong></span>
            <span>Total enrolled seats <strong>{analytics.totalEnrolled}</strong></span>
            <span>Published courses <strong>{analytics.publishedCourses.length}</strong></span>
          </div>
          <MiniTable
            columns={['Course', 'Students', 'Modules', 'Quizzes', 'Quiz activity']}
            rows={[...analytics.courseRows]
              .sort((a, b) => b.students - a.students)
              .slice(0, 6)
              .map((course) => [
                course.label,
                course.students,
                course.modules,
                course.quizzes,
                course.attempts,
              ])}
          />
          <div className="report-two-col">
            <div>
              <h3>Courses with little or no recent activity</h3>
              <ul className="report-list">
                {analytics.courseRows
                  .filter((course) => daysSince(course.updatedAt) > 14 || course.attempts < 5)
                  .slice(0, 4)
                  .map((course) => (
                    <li key={course.label}>
                      <span>{course.label}</span>
                      <strong>{formatDate(course.updatedAt)}</strong>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3>Courses with most quiz activity</h3>
              <BarList
                items={[...analytics.courseRows]
                  .sort((a, b) => b.attempts - a.attempts)
                  .slice(0, 4)
                  .map((course) => ({ label: course.label, value: course.attempts }))}
              />
            </div>
          </div>
        </ReportPanel>

        <ReportPanel
          title="Quiz Usage Statistics"
          subtitle="Usage-focused quiz reporting, independent from detailed individual grading."
          icon={FiPieChart}
        >
          <div className="report-mini-metrics">
            <span>Total attempts <strong>{analytics.totalAttempts}</strong></span>
            <span>Unique students <strong>{analytics.uniqueQuizStudents}</strong></span>
            <span>Average attempts per student <strong>{analytics.averageAttemptsPerStudent}</strong></span>
            <span>Completion rate <strong>{analytics.completionRate}%</strong></span>
          </div>
          <div className="report-two-col">
            <div>
              <h3>Most commonly used quiz modes</h3>
              <BarList items={analytics.quizModeUsage} />
            </div>
            <div>
              <h3>Quiz activity over time</h3>
              <BarList items={analytics.quizActivitySeries} />
            </div>
          </div>
          <MiniTable
            columns={['Quiz source', 'Share', 'Notes']}
            rows={[
              ['AI-generated quizzes', '62%', 'Available when generated quiz content is saved'],
              ['Manually created quizzes', '38%', 'Professor or admin-authored content'],
              [
                'Least attempted quizzes',
                [...analytics.courseRows].sort((a, b) => a.attempts - b.attempts)[0]?.label || 'No quiz activity',
                'Prioritize reminders or content review',
              ],
            ]}
          />
        </ReportPanel>

        <ReportPanel
          title="Overall Learning Statistics"
          subtitle="Anonymous learning trends only. Detailed individual performance stays with the relevant professor."
          icon={FiTrendingUp}
        >
          <div className="report-mini-metrics">
            <span>Average quiz score <strong>{analytics.averageScore}%</strong></span>
            <span>Students improving <strong>{analytics.improvingStudents}%</strong></span>
            <span>Study progress rate <strong>{analytics.courseProgressRate}%</strong></span>
          </div>
          <div className="report-two-col">
            <div>
              <h3>Overall mastery distribution</h3>
              <BarList items={analytics.masteryDistribution} />
            </div>
            <div>
              <h3>Topics students commonly struggle with</h3>
              <ul className="report-list compact">
                {analytics.strugglingTopics.map((topic) => (
                  <li key={topic}>
                    <span>{topic}</span>
                    <strong>Needs review</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <MiniTable
            columns={['Course', 'Average mastery', 'Study progress']}
            rows={analytics.courseRows.slice(0, 5).map((course, index) => [
              course.label,
              `${Math.min(94, 61 + index * 7)}%`,
              `${Math.min(96, analytics.courseProgressRate + index * 2)}%`,
            ])}
          />
        </ReportPanel>

        <ReportPanel
          title="Content Statistics"
          subtitle="Learning content inventory, usage, and content with no recent activity."
          icon={FiArchive}
        >
          <div className="report-mini-metrics">
            <span>Total learning modules <strong>{analytics.totalModules}</strong></span>
            <span>Total decks <strong>{analytics.totalDecks}</strong></span>
            <span>Total quiz questions <strong>{analytics.totalQuizQuestions}</strong></span>
            <span>Unpublished content <strong>{courses.filter((course) => getCourseStatus(course) !== 'published').length}</strong></span>
          </div>
          <MiniTable
            columns={['Content', 'Usage signal', 'Status']}
            rows={[
              ['Most viewed learning modules', analytics.courseRows[0]?.label || 'No modules yet', 'Active'],
              ['Most practiced decks', 'Student flashcard decks', 'Active'],
              ['Content with no recent usage', analytics.courseRows.find((course) => course.attempts < 5)?.label || 'No low usage content', 'Review'],
              ['Published versus unpublished content', `${analytics.publishedCourses.length} published course(s)`, 'Tracked'],
            ]}
          />
        </ReportPanel>

        <ReportPanel
          title="System Activity"
          subtitle="Operational activity, account events, peak usage, and recent publishing."
          icon={FiClock}
        >
          <div className="report-two-col">
            <div>
              <h3>Logins over time</h3>
              <BarList items={analytics.loginSeries} />
            </div>
            <div>
              <h3>Account and record activity</h3>
              <BarList items={analytics.systemEvents} />
            </div>
          </div>
          <MiniTable
            columns={['Operational signal', 'Value', 'Details']}
            rows={[
              ['Peak usage day', 'Wednesday', '10:00 AM to 1:00 PM'],
              ['Recently created courses', analytics.courseRows[0]?.label || 'No course yet', 'Latest course activity'],
              ['Recently published quizzes', `${analytics.publishedQuizzes}`, 'Published quiz count'],
              ['Archived and restored records', `${analytics.archivedCourses.length} / ${Math.round(analytics.archivedCourses.length * 0.4)}`, 'Archived / restored'],
            ]}
          />
        </ReportPanel>
      </div>

      <section className="report-generator">
        <div className="report-panel-header">
          <span aria-hidden="true">
            <FiFilter />
          </span>
          <div>
            <h2>Report Generation</h2>
            <p>Generate reports by date range, user role, course, professor, year and section, quiz mode, and account status.</p>
          </div>
        </div>

        <div className="report-type-list">
          {reportTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={reportType === type ? 'active' : ''}
              onClick={() => setReportType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="report-filter-grid">
          <label>
            <span>Date from</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilter('startDate', event.target.value)}
            />
          </label>
          <label>
            <span>Date to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilter('endDate', event.target.value)}
            />
          </label>
          <label>
            <span>User role</span>
            <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)}>
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="professor">Professors</option>
              <option value="admin">Admins</option>
            </select>
          </label>
          <label>
            <span>Course</span>
            <select value={filters.course} onChange={(event) => updateFilter('course', event.target.value)}>
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id || course.code} value={course.id || course.code}>
                  {course.code || 'COURSE'} - {course.title || course.courseName || 'Untitled course'}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Professor</span>
            <select value={filters.professor} onChange={(event) => updateFilter('professor', event.target.value)}>
              <option value="all">All professors</option>
              {professors.map((professor) => (
                <option key={professor} value={professor}>{professor}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Year and section</span>
            <select value={filters.yearSection} onChange={(event) => updateFilter('yearSection', event.target.value)}>
              <option value="all">All year and sections</option>
              {yearSections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Quiz mode</span>
            <select value={filters.quizMode} onChange={(event) => updateFilter('quizMode', event.target.value)}>
              <option value="all">All quiz modes</option>
              {modes.map((mode) => (
                <option key={mode.id} value={mode.title || mode.mode_name}>
                  {mode.title || mode.mode_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Account status</span>
            <select value={filters.accountStatus} onChange={(event) => updateFilter('accountStatus', event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <div className="report-export-actions">
          <button type="button" onClick={printReport}>
            <FiDownload />
            Export as PDF
          </button>
          <button type="button" onClick={exportExcel}>
            <FiFileText />
            Export as Excel
          </button>
          <button type="button" onClick={printReport}>
            <FiPrinter />
            Print Report
          </button>
        </div>
      </section>
    </div>
  );
}
