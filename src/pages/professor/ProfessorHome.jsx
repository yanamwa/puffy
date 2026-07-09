import {
  professorCoursesSeed,
  readProfessorCourses,
  recentProfessorActivities,
} from './professorData';
import './ProfessorLayout.css';

export default function ProfessorHome() {
  const courses = readProfessorCourses();
  const activeCourses = courses.filter((course) => !course.archived);
  const publishedCourses = activeCourses.filter(
    (course) => course.status === 'published'
  );
  const totalStudents = activeCourses.reduce(
    (sum, course) => sum + Number(course.students || 0),
    0
  );

  const fallbackCourses = activeCourses.length ? activeCourses : professorCoursesSeed;

  return (
    <section className="professor-page">
      <div>
        <h1>Professor Dashboard</h1>
        <p>Course summary, student statistics, and recent teaching activity.</p>
      </div>

      <div className="professor-card-grid">
        <div className="professor-card">
          <span>Active courses</span>
          <strong>{activeCourses.length}</strong>
        </div>
        <div className="professor-card">
          <span>Published courses</span>
          <strong>{publishedCourses.length}</strong>
        </div>
        <div className="professor-card">
          <span>Enrolled students</span>
          <strong>{totalStudents}</strong>
        </div>
      </div>

      <div className="professor-panel">
        <h2>Course Summary</h2>
        <ul className="professor-list">
          {fallbackCourses.slice(0, 4).map((course) => (
            <li key={course.id}>
              <strong>{course.code}</strong> {course.title} - {course.students} students
            </li>
          ))}
        </ul>
      </div>

      <div className="professor-panel">
        <h2>Recent Activities</h2>
        <ul className="professor-list">
          {recentProfessorActivities.map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
