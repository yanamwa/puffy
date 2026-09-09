import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './courseview.module.css';

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('requests');
  const [course, setCourse] = useState(null);
  const [requests, setRequests] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
  async function loadCourse() {
    try {
      setLoading(true);

      const courseData = {
        id: courseId,
        code: 'AKDF-23AD-DKDK',
        title: 'ITEC 106 - Web Systems and Technologies 2',
        program: 'Bachelor of Science Information Technology',
        yearLevel: '1st year',
        students: 30,
        modules: 5,
        quizzes: 10,
        dateCreated: '08-23-26',
      };

      const requestData = [
        {
          id: 1,
          studentId: '202310102',
          name: 'Raeliana Obelia Blake',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 2,
          studentId: '202310103',
          name: 'Lucas Virel',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 3,
          studentId: '202310104',
          name: 'Emma Valeria',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 4,
          studentId: '202310105',
          name: 'Noah Alaric',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
      ];

      const enrolledData = [
        {
          id: 101,
          studentId: '202210001',
          name: 'Raeliana Obelia Blake',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 102,
          studentId: '202210002',
          name: 'Aurelia Vance',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 103,
          studentId: '202210003',
          name: 'Lucian Hart',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 104,
          studentId: '202210004',
          name: 'Evelyn Rose',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
        {
          id: 105,
          studentId: '202210005',
          name: 'Theo Aldrin',
          course: 'Bachelor of Science Information Technology',
          yearLevel: '1st Year',
          profileImage: '',
        },
      ];

      setCourse(courseData);
      setRequests(requestData);
      setEnrolledStudents(enrolledData);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  }

  loadCourse();
}, [courseId]);

  const displayedStudents = useMemo(() => {
    return activeTab === 'requests' ? requests : enrolledStudents;
  }, [activeTab, requests, enrolledStudents]);

  const handleApprove = (student) => {
    const approved = window.confirm(
      `Approve enrollment request from ${student.name}?`
    );

    if (!approved) return;

    setRequests((current) =>
      current.filter((item) => item.id !== student.id)
    );

    setEnrolledStudents((current) => [...current, student]);
  };

  const handleDecline = (student) => {
    const declined = window.confirm(
      `Decline enrollment request from ${student.name}?`
    );

    if (!declined) return;

    setRequests((current) =>
      current.filter((item) => item.id !== student.id)
    );
  };

  const handleUnenroll = (student) => {
    const confirmed = window.confirm(
      `Remove ${student.name} from this course?`
    );

    if (!confirmed) return;

    setEnrolledStudents((current) =>
      current.filter((item) => item.id !== student.id)
    );
  };

  if (loading) {
    return (
      <section className={styles.courseViewPage}>
        <div className={styles.loading}>Loading course...</div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className={styles.courseViewPage}>
        <div className={styles.loading}>Course not found.</div>
      </section>
    );
  }

  return (
    <section className={styles.courseViewPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Course View</h1>
          <p>
            Build the course using modules. Each module can contain lesson
            pages and its own quiz.
          </p>
        </div>
      </div>

      <div className={styles.courseInfo}>
        <div className={styles.courseInfoTop}>
          <div className={styles.courseCode}>
            <span>Course Code:</span>
            <strong>{course.code}</strong>
          </div>

          <span className={styles.dateCreated}>
            Date created: {course.dateCreated}
          </span>
        </div>

        <h2>{course.title}</h2>

        <p className={styles.courseProgram}>
          {course.yearLevel} - {course.program}
        </p>

        <div className={styles.courseStats}>
          <span>{course.students} students</span>
          <span>{course.modules} Modules</span>
          <span>{course.quizzes} Quizzes</span>
        </div>
      </div>

      <div className={styles.studentSection}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === 'requests' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Enrollment Request
            {requests.length > 0 && (
              <span className={styles.requestCount}>{requests.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === 'enrolled' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('enrolled')}
          >
            Enrolled Students
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.studentTable}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Year Level</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyTable}>
                    {activeTab === 'requests'
                      ? 'No enrollment requests.'
                      : 'No enrolled students yet.'}
                  </td>
                </tr>
              ) : (
                displayedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentId}</td>

                    <td>
                      <div className={styles.studentName}>
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={student.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {student.name.charAt(0)}
                          </div>
                        )}

                        <span>{student.name}</span>
                      </div>
                    </td>

                    <td>{student.course}</td>
                    <td>{student.yearLevel}</td>

                    <td>
                      {activeTab === 'requests' ? (
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.approveBtn}
                            onClick={() => handleApprove(student)}
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            className={styles.declineBtn}
                            onClick={() => handleDecline(student)}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className={styles.actionButtons}>
                            <button
                            type="button"
                            className={styles.viewBtn}
                            onClick={() =>
                                navigate(
                                `/professor/courses/view/${courseId}/student/${student.id}`
                                )
                            }
                            >
                            View
                            </button>

                            <button
                            type="button"
                            className={styles.unenrollBtn}
                            onClick={() => handleUnenroll(student)}
                            >
                            Unenroll
                            </button>
                        </div>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}