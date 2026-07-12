import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Icon } from './EnrolledCourses';
import JoinCourseModal from './JoinCourseModal';
import {
  enrollStudentInCourse,
  findJoinableCourseByCodeAsync,
} from './studentCourseData';
import './EnrolledCourses.css';

const initialTodos = [
  { id: 1, text: 'finish assignment', done: false },
  { id: 2, text: 'finish assignment', done: false },
  { id: 3, text: 'finish assignment', done: false },
  { id: 4, text: 'finish assignment', done: false },
];

const quizCards = [
  {
    id: 1,
    course: 'ITEC 106',
    title: 'Web Systems Basics',
    progress: 72,
    accent: 'MC',
  },
  {
    id: 2,
    course: 'ITEC 108',
    title: 'Integration by Parts',
    progress: 45,
    accent: 'TF',
  },
  {
    id: 3,
    course: 'ART HISTORY',
    title: 'Renaissance Foundations',
    progress: 90,
    accent: 'QA',
  },
];

const progressCards = [
  { id: 1, label: 'Courses on track', value: '4/5', accent: 'BK' },
  { id: 2, label: 'Studied this week', value: '6.5 hrs', accent: 'TM' },
  { id: 3, label: 'Avg. quiz accuracy', value: '84%', accent: 'OK' },
];

export default function StudentHome() {
  const navigate = useNavigate();
  const [shownMonth, setShownMonth] = useState(new Date(2021, 8, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2021, 8, 19));
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const calendarDays = useMemo(() => {
    const year = shownMonth.getFullYear();
    const month = shownMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstDay }, (_, index) => ({
        key: `blank-${index}`,
        blank: true,
      })),
      ...Array.from({ length: daysInMonth }, (_, index) => ({
        key: `${year}-${month}-${index + 1}`,
        date: new Date(year, month, index + 1),
        day: index + 1,
      })),
    ];
  }, [shownMonth]);

  const monthLabel = shownMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (amount) => {
    setShownMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1)
    );
  };

  const addTodo = () => {
    const text = newTodo.trim();

    if (!text) return;

    setTodos((current) => [
      ...current,
      { id: Date.now(), text, done: false },
    ]);

    setNewTodo('');
  };

  const toggleTodo = (id) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  };

  const removeTodo = (id) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  };

  const closeJoinModal = () => {
    setJoinModalOpen(false);
    setCourseCode('');
  };

  const joinByCourseCode = async () => {
    const course = await findJoinableCourseByCodeAsync(courseCode);

    if (!course) {
      window.alert(
        'Course code not found. Please check the code from your professor.'
      );
      return;
    }

    enrollStudentInCourse(course);
    closeJoinModal();
    navigate(`/student/enrolled-courses/${course.id || course.code}`);
  };

  return (
    <div
  className={`student-home-dashboard striped-dashboard ${
    sidebarCollapsed ? "sidebar-collapsed" : ""
  }`}
>
      <aside className="enrolled-sidebar">
          <div className="brand-lockup">
            <img
              src="/images/logo_solo.png"
              alt="PuffyBrain logo"
              className="sidebar-logo"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            />

            <span className="brand-name">PuffyBrain</span>
          </div>

          <nav className="side-nav" aria-label="Student navigation">
            <Link
              to="/student"
              className="side-nav-item active"
              title={sidebarCollapsed ? "Home" : undefined}
            >
              <Icon name="home" />
              <span className="nav-label">Home</span>
            </Link>

            <Link
              to="/student/enrolled-courses"
              className="side-nav-item"
              title={sidebarCollapsed ? "Enrolled Courses" : undefined}
            >
              <Icon name="courses" />
              <span className="nav-label">Enrolled Courses</span>
              <span className="dropdown-mark">v</span>
            </Link>

            <Link
              to="/student/public-courses"
              className="side-nav-item plain-nav-item"
              title={sidebarCollapsed ? "Public Courses" : undefined}
            >
              <Icon name="public" />
              <span className="nav-label">Public Courses</span>
            </Link>

            <Link
              to="/student/archived-courses"
              className="side-nav-item plain-nav-item"
              title={sidebarCollapsed ? "Archived Classes" : undefined}
            >
              <Icon name="archive" />
              <span className="nav-label">Archived classes</span>
            </Link>

            <Link
              to="/student/settings"
              className="side-nav-item plain-nav-item"
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <Icon name="settings" />
              <span className="nav-label">Settings</span>
            </Link>
          </nav>

          <button
            type="button"
            className="logout-button"
            title={sidebarCollapsed ? "Log-out" : undefined}
          >
            <span className="logout-icon" aria-hidden="true" />
            <span className="logout-label">Log-out</span>
          </button>
        </aside>

      <main className="home-main">
        <header className="enrolled-topbar transparent-topbar home-topbar">
          <label className="search-input">
            <input type="search" placeholder="Search your course" />

            <span className="student-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4 4" />
              </svg>
            </span>
          </label>

          <div className="topbar-actions">
            <button className="notification-button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 17.4h10.8l-.9-1.6v-4.5a4.5 4.5 0 0 0-9 0v4.5l-.9 1.6Z" />
                <path d="M10 19.2h4" />
              </svg>
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => setJoinModalOpen(true)}
            >
              + Join course
            </button>
          </div>
        </header>

        <div className="home-content">
          <section className="welcome-card">
            <div>
              <p className="home-eyebrow">Student dashboard</p>
              <h1>Hello, @User!</h1>
              <p>Continue learning and improve your mastery at your own pace.</p>
            </div>
          </section>

          <section className="home-section" aria-labelledby="continue-quizzes-title">
            <div className="home-section-header">
              <h2 id="continue-quizzes-title">Continue your quizzes</h2>
              <Link to="/student/enrolled-courses">See all quizzes -&gt;</Link>
            </div>

            <div className="quiz-resume-grid">
              {quizCards.map((quiz) => (
                <article key={quiz.id} className="quiz-resume-card">
                  <span className="quiz-card-icon">{quiz.accent}</span>
                  <p>{quiz.course}</p>
                  <h3>{quiz.title}</h3>

                  <div className="quiz-progress-track" aria-hidden="true">
                    <span style={{ width: `${quiz.progress}%` }} />
                  </div>

                  <div className="quiz-card-footer">
                    <span>{quiz.progress}% mastery</span>
                    <button type="button">Practice more</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="home-section progress-section" aria-labelledby="progress-overview-title">
            <div className="home-section-header">
              <h2 id="progress-overview-title">Progress overview</h2>
              <button type="button" className="week-filter">
                This week v
              </button>
            </div>

            <div className="progress-overview-grid">
              {progressCards.map((item) => (
                <article key={item.id} className="progress-overview-card">
                  <span className="progress-card-icon">{item.accent}</span>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <aside className="student-profile-panel">
        <Avatar large />
        <strong>@meiko</strong>
        <span>2nd year</span>
        <button>Profile</button>

        <section className="mini-calendar">
          <div className="calendar-header">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              &lt;
            </button>

            <h2>{monthLabel}</h2>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          <div className="calendar-weekdays">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <div className="calendar-grid">
            {calendarDays.map((item) =>
              item.blank ? (
                <span key={item.key} />
              ) : (
                <button
                  key={item.key}
                  type="button"
                  className={
                    item.date.toDateString() === selectedDate.toDateString()
                      ? 'selected'
                      : ''
                  }
                  onClick={() => setSelectedDate(item.date)}
                >
                  {item.day}
                </button>
              )
            )}
          </div>
        </section>

        <section className="todo-card">
          <h2>
            To do list{' '}
            <button type="button" onClick={addTodo}>
              +
            </button>
          </h2>

          <div className="todo-add-row">
            <input
              type="text"
              value={newTodo}
              placeholder="new task"
              onChange={(event) => setNewTodo(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addTodo();
              }}
            />
          </div>

          {todos.map((todo) => (
            <label key={todo.id} className={todo.done ? 'done' : ''}>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />

              <span>{todo.text}</span>

              <button
                type="button"
                onClick={() => removeTodo(todo.id)}
                aria-label={`Remove ${todo.text}`}
              >
                x
              </button>
            </label>
          ))}
        </section>
      </aside>

      <JoinCourseModal
        open={joinModalOpen}
        courseCode={courseCode}
        onCourseCodeChange={setCourseCode}
        onCancel={closeJoinModal}
        onJoin={joinByCourseCode}
      />
    </div>
  );
}