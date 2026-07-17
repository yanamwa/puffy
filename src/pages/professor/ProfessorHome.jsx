import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLayers,
  FiPlusCircle,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  professorCoursesSeed,
  readProfessorCourses,
} from './professorData';
import './ProfessorLayout.css';

const coursePerformanceSeed = {
  WEB101: {
    section: 'BSIT 1A',
    averageQuizScore: 84,
    completionRate: 88,
    averageMastery: 82,
    mastery: {
      Advanced: 12,
      Proficient: 18,
      Developing: 9,
      Beginning: 3,
    },
    support: [
      {
        name: 'Bea Reyes',
        concern: 'Incomplete learning modules',
        latestScore: 54,
      },
      {
        name: 'Jomari Cruz',
        concern: 'Low mastery in responsive design',
        latestScore: 69,
      },
    ],
  },
  DBS204: {
    section: 'BSIT 2B',
    averageQuizScore: 70,
    completionRate: 76,
    averageMastery: 69,
    mastery: {
      Advanced: 6,
      Proficient: 14,
      Developing: 10,
      Beginning: 5,
    },
    support: [
      {
        name: 'Paolo Garcia',
        concern: 'Needs support in SQL joins',
        latestScore: 48,
      },
      {
        name: 'Marco Dela Cruz',
        concern: '3 incomplete modules',
        latestScore: 60,
      },
    ],
  },
  HCI310: {
    section: 'BSCS 3A',
    averageQuizScore: 86,
    completionRate: 91,
    averageMastery: 85,
    mastery: {
      Advanced: 10,
      Proficient: 12,
      Developing: 5,
      Beginning: 1,
    },
    support: [
      {
        name: 'Mara Torres',
        concern: 'Recent participation gap',
        latestScore: 57,
      },
      {
        name: 'Ken Ramos',
        concern: 'Declining accessibility scores',
        latestScore: 70,
      },
    ],
  },
};

const fallbackSections = ['BSIT 1A', 'BSIT 2B', 'BSCS 3A', 'BSIT 4A'];

function getProfessorName(user) {
  const rawName =
    user?.displayName ||
    user?.display_name ||
    user?.name ||
    localStorage.getItem('username') ||
    'Professor';

  return rawName.trim() || 'Professor';
}

function getCourseId(course, index) {
  return String(course.id || course.course_id || course.code || `course-${index}`);
}

function getCourseCode(course, index) {
  return course.code || course.course_code || `CRS${String(index + 1).padStart(3, '0')}`;
}

function getCourseTitle(course) {
  return course.title || course.courseName || course.course_name || 'Untitled course';
}

function getManageCoursePath(course) {
  const id = course.id || course.course_id;
  return id ? `/professor/courses/edit/${id}` : '/professor/courses';
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function createFallbackPerformance(course, index) {
  const students = Number(course.students || 0);
  const base = Number(course.id || index + 1) * 7;
  const developing = Math.max(2, Math.round(students * 0.24));
  const beginning = Math.max(1, Math.round(students * 0.08));
  const advanced = Math.max(2, Math.round(students * 0.28));
  const proficient = Math.max(0, students - advanced - developing - beginning);

  return {
    section: fallbackSections[index % fallbackSections.length],
    averageQuizScore: clampPercent(72 + (base % 18)),
    completionRate: clampPercent(76 + (base % 16)),
    averageMastery: clampPercent(70 + (base % 20)),
    mastery: {
      Advanced: advanced,
      Proficient: proficient,
      Developing: developing,
      Beginning: beginning,
    },
    support: [
      {
        name: ['Aira Mendoza', 'Rafa Bautista', 'Celine Ong', 'Nina Salcedo'][
          index % 4
        ],
        concern: ['Low mastery', 'Incomplete modules', 'Recent inactivity', 'Declining score'][
          index % 4
        ],
        latestScore: clampPercent(52 + (base % 17)),
      },
    ],
  };
}

function normalizeDashboardCourse(course, index) {
  const code = getCourseCode(course, index);
  const performance =
    coursePerformanceSeed[code] || createFallbackPerformance(course, index);
  const modules = Number(
    course.modules || course.moduleCount || course.lessonPages?.length || 0
  );
  const publishedQuizzes = Number(
    course.quizzes || course.publishedQuizzes || course.quizItems?.length || 0
  );

  return {
    ...course,
    id: getCourseId(course, index),
    code,
    title: getCourseTitle(course),
    section: course.section || performance.section,
    students: Number(course.students || course.enrolledStudents || 0),
    modules,
    publishedQuizzes,
    averageQuizScore: performance.averageQuizScore,
    completionRate: performance.completionRate,
    averageMastery: performance.averageMastery,
    mastery: performance.mastery,
    support: performance.support.map((student) => ({
      ...student,
      course: code,
    })),
    managePath: getManageCoursePath(course),
  };
}

function buildActivityItems(courses) {
  const firstCourse = courses[0];
  const secondCourse = courses[1] || firstCourse;
  const thirdCourse = courses[2] || firstCourse;

  return [
    {
      icon: FiCheckCircle,
      time: '12 min ago',
      text: `A student completed a quiz in ${firstCourse?.code || 'your course'}.`,
    },
    {
      icon: FiUsers,
      time: '38 min ago',
      text: `New students joined ${secondCourse?.code || 'a course'}.`,
    },
    {
      icon: FiLayers,
      time: 'Today',
      text: `A module was published for ${thirdCourse?.code || 'a course'}.`,
    },
    {
      icon: FiClock,
      time: 'Tomorrow',
      text: `${firstCourse?.code || 'Course'} quiz deadline is approaching.`,
    },
    {
      icon: FiTrendingUp,
      time: 'This week',
      text: `${thirdCourse?.code || 'A class'} reached a new mastery average.`,
    },
  ];
}

function MasteryBar({ mastery }) {
  const entries = Object.entries(mastery);
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;

  return (
    <div className="dashboard-mastery">
      <div className="dashboard-mastery-bar" aria-label="Mastery distribution">
        {entries.map(([label, value]) => (
          <span
            className={`dashboard-mastery-segment ${label.toLowerCase()}`}
            key={label}
            style={{ width: `${Math.max(5, (value / total) * 100)}%` }}
            title={`${label}: ${value}`}
          />
        ))}
      </div>
      <div className="dashboard-mastery-legend">
        {entries.map(([label, value]) => (
          <span key={label}>
            <i className={label.toLowerCase()} />
            {label} {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfessorHome() {
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const dashboardCourses = useMemo(() => {
    const courses = readProfessorCourses();
    const activeCourses = courses.filter((course) => !course.archived);
    const visibleCourses = activeCourses.length ? activeCourses : professorCoursesSeed;

    return visibleCourses.map(normalizeDashboardCourse);
  }, []);

  const selectedCourse =
    dashboardCourses.find((course) => course.id === selectedCourseId) ||
    dashboardCourses[0];
  const overviewCourses = dashboardCourses.slice(0, 4);
  const studentsNeedingAttention = dashboardCourses
    .flatMap((course) => course.support)
    .sort((first, second) => first.latestScore - second.latestScore)
    .slice(0, 5);
  const activityItems = buildActivityItems(dashboardCourses);
  const professorName = getProfessorName(user);
  const professorGreeting =
    professorName.toLowerCase() === 'professor'
      ? 'Good morning, Professor'
      : `Good morning, Prof. ${professorName}`;
  const totalStudents = dashboardCourses.reduce(
    (sum, course) => sum + Number(course.students || 0),
    0
  );
  const publishedQuizzes = dashboardCourses.reduce(
    (sum, course) => sum + Number(course.publishedQuizzes || 0),
    0
  );

  const summaryCards = [
    {
      label: 'Active Courses',
      value: dashboardCourses.length,
      href: '/professor/courses',
      link: 'View courses',
      icon: FiBookOpen,
    },
    {
      label: 'Total Students',
      value: totalStudents,
      href: '/professor/students',
      link: 'View students',
      icon: FiUsers,
    },
    {
      label: 'Published Quizzes',
      value: publishedQuizzes,
      href: '/professor/courses',
      link: 'Review quizzes',
      icon: FiFileText,
    },
  ];

  return (
    <section className="professor-page professor-dashboard">
      <div className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">Professor Dashboard</span>
          <h1>{professorGreeting}</h1>
          <p>Manage your courses and monitor your students' learning progress.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <Link className="dashboard-primary-action" to="/professor/courses/new">
            <FiPlusCircle />
            Create Course
          </Link>
        </div>
      </div>

      <div className="dashboard-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="dashboard-summary-card" key={card.label}>
              <div className="dashboard-summary-top">
                <span className="dashboard-summary-icon">
                  <Icon />
                </span>
                <span>{card.label}</span>
              </div>
              <strong>{card.value}</strong>
              <Link to={card.href}>
                {card.link}
                <FiArrowRight />
              </Link>
            </article>
          );
        })}
      </div>

      <section className="dashboard-panel dashboard-course-overview">
        <div className="dashboard-section-header">
          <div>
            <h2>Course Overview</h2>
            <p>Active classes and their learning progress.</p>
          </div>
          <Link to="/professor/courses">
            View All Courses
            <FiArrowRight />
          </Link>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-course-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Section</th>
                <th>Students</th>
                <th>Modules</th>
                <th>Quizzes</th>
                <th>Mastery</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {overviewCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.code}</strong>
                    <span>{course.title}</span>
                  </td>
                  <td>{course.section}</td>
                  <td>{course.students}</td>
                  <td>{course.modules}</td>
                  <td>{course.publishedQuizzes}</td>
                  <td>
                    <span className="dashboard-mastery-pill">
                      {course.averageMastery}%
                    </span>
                  </td>
                  <td>
                    <Link className="dashboard-table-action" to={course.managePath}>
                      Manage Course
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-panel dashboard-performance">
        <div className="dashboard-section-header">
          <div>
            <h2>Class Performance</h2>
            <p>Quiz scores, completion rates, and mastery levels by course.</p>
          </div>
          <label className="dashboard-course-select">
            <span>Course</span>
            <select
              value={selectedCourse?.id || ''}
              onChange={(event) => setSelectedCourseId(event.target.value)}
            >
              {dashboardCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="dashboard-chart-grid">
          <div className="dashboard-bars" aria-label="Average quiz scores and completion">
            {dashboardCourses.map((course) => (
              <div className="dashboard-bar-row" key={course.id}>
                <span>{course.code}</span>
                <div>
                  <i
                    className="score"
                    style={{ width: `${course.averageQuizScore}%` }}
                  />
                  <i
                    className="completion"
                    style={{ width: `${course.completionRate}%` }}
                  />
                </div>
                <strong>{course.averageQuizScore}%</strong>
              </div>
            ))}
            <div className="dashboard-chart-legend">
              <span>
                <i className="score" />
                Average quiz score
              </span>
              <span>
                <i className="completion" />
                Completion rate
              </span>
            </div>
          </div>

          {selectedCourse && (
            <div className="dashboard-selected-course">
              <div>
                <span>{selectedCourse.code}</span>
                <strong>{selectedCourse.averageMastery}%</strong>
                <p>Average class mastery</p>
              </div>
              <MasteryBar mastery={selectedCourse.mastery} />
            </div>
          )}
        </div>
      </section>

      <div className="dashboard-main-grid attention-grid">
        <section className="dashboard-panel dashboard-attention">
          <div className="dashboard-section-header">
            <div>
              <h2>Students Needing Attention</h2>
              <p>Support signals from recent scores, module progress, and activity.</p>
            </div>
            <Link to="/professor/students">
              View Monitoring
              <FiArrowRight />
            </Link>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-attention-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Concern</th>
                  <th>Latest score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsNeedingAttention.map((student) => (
                  <tr key={`${student.course}-${student.name}`}>
                    <td>{student.name}</td>
                    <td>{student.course}</td>
                    <td>{student.concern}</td>
                    <td>{student.latestScore}%</td>
                    <td>
                      <Link className="dashboard-table-action" to="/professor/students">
                        View Progress
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dashboard-panel dashboard-activity">
          <div className="dashboard-section-header compact">
            <div>
              <h2>Recent Course Activity</h2>
              <p>Latest teaching and class events.</p>
            </div>
            <Link to="/professor/notifications">
              View All Activity
              <FiArrowRight />
            </Link>
          </div>
          <div className="dashboard-timeline">
            {activityItems.map((activity) => {
              const Icon = activity.icon;
              return (
                <div className="dashboard-timeline-item" key={`${activity.time}-${activity.text}`}>
                  <span>
                    <Icon />
                  </span>
                  <div>
                    <p>{activity.text}</p>
                    <time>{activity.time}</time>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
