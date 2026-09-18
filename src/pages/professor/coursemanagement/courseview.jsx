
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import styles from './courseview.module.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

const SERVER_ORIGIN =
  API_BASE_URL.replace(/\/api\/?$/, '');

const DEFAULT_PROFILE_IMAGE =
  '/images/temporaryimg.png';


/* =====================================================
   TOKEN
===================================================== */

function getStoredToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken')
  );
}


/* =====================================================
   PROFILE IMAGE
===================================================== */

function resolveProfileImage(imagePath) {
  if (!imagePath) {
    return DEFAULT_PROFILE_IMAGE;
  }

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  let fixedPath = imagePath;

  if (
    fixedPath.startsWith(
      '/api/uploads/profile-images/'
    )
  ) {
    fixedPath = fixedPath.replace(
      '/api/uploads/profile-images/',
      '/uploads/profile-images/'
    );
  }

  if (!fixedPath.startsWith('/')) {
    fixedPath = `/${fixedPath}`;
  }

  return `${SERVER_ORIGIN}${fixedPath}`;
}


/* =====================================================
   DATE
===================================================== */

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}


/* =====================================================
   COMPONENT
===================================================== */

export default function CourseView() {
  const { courseId } = useParams();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState('requests');

  const [course, setCourse] =
    useState(null);

  const [requests, setRequests] =
    useState([]);

  const [
    enrolledStudents,
    setEnrolledStudents,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  const [
    rejectTarget,
    setRejectTarget,
  ] = useState(null);

  const [
    rejectReason,
    setRejectReason,
  ] = useState('');

  const [
    rejectError,
    setRejectError,
  ] = useState('');


  /* ===================================================
     LOAD COURSE + ENROLLMENTS
  =================================================== */

  const loadCourseData =
    useCallback(async () => {
      const token = getStoredToken();

      if (!token) {
        throw new Error(
          'Professor authentication is required.'
        );
      }

      /*
       * Fetch the exact course selected
       * from Course Management.
       */
      const courseResponse = await fetch(
        `${API_BASE_URL}/courses/${courseId}`,
        {
          method: 'GET',

          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const courseResult =
        await courseResponse
          .json()
          .catch(() => ({}));

      if (!courseResponse.ok) {
        throw new Error(
          courseResult.message ||
            'Could not load course.'
        );
      }

      const loadedCourse =
        courseResult.course ||
        courseResult.data?.course ||
        courseResult.data ||
        null;

      if (!loadedCourse) {
        throw new Error(
          'Course data was not returned.'
        );
      }

      /*
       * Fetch enrollment requests +
       * approved students specifically
       * for THIS course ID.
       */
      const enrollmentResponse =
        await fetch(
          `${API_BASE_URL}/courses/${courseId}/enrollments`,
          {
            method: 'GET',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const enrollmentResult =
        await enrollmentResponse
          .json()
          .catch(() => ({}));

      if (!enrollmentResponse.ok) {
        throw new Error(
          enrollmentResult.message ||
            'Could not load course students.'
        );
      }

      setCourse(loadedCourse);

      setRequests(
        Array.isArray(
          enrollmentResult.pending
        )
          ? enrollmentResult.pending
          : []
      );

      setEnrolledStudents(
        Array.isArray(
          enrollmentResult.enrolled
        )
          ? enrollmentResult.enrolled
          : []
      );
    }, [courseId]);


  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage('');

        await loadCourseData();
      } catch (error) {
        console.error(
          'Course View loading error:',
          error
        );

        if (active) {
          setCourse(null);

          setRequests([]);

          setEnrolledStudents([]);

          setErrorMessage(
            error.message ||
              'Unable to load this course.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [
    courseId,
    loadCourseData,
  ]);


  /* ===================================================
     DISPLAYED STUDENTS
  =================================================== */

  const displayedStudents = useMemo(
    () =>
      activeTab === 'requests'
        ? requests
        : enrolledStudents,
    [
      activeTab,
      requests,
      enrolledStudents,
    ]
  );


  /* ===================================================
     APPROVE
  =================================================== */

  const handleApprove =
    async (student) => {
      const confirmed =
        window.confirm(
          `Approve enrollment request from ${student.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setProcessingId(
          student.enrollmentId
        );

        const token =
          getStoredToken();

        const response = await fetch(
          `${API_BASE_URL}/enrollments/${student.enrollmentId}/approve`,
          {
            method: 'PATCH',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to approve student.'
          );
        }

        /*
         * Reload directly from database
         * after approval.
         */
        await loadCourseData();
      } catch (error) {
        console.error(
          'Approve enrollment error:',
          error
        );

        window.alert(
          error.message ||
            'Unable to approve student.'
        );
      } finally {
        setProcessingId(null);
      }
    };


  /* ===================================================
     DECLINE
  =================================================== */

  const openRejectDialog =
    (student) => {
      setRejectTarget(student);
      setRejectReason('');
      setRejectError('');
    };

  const closeRejectDialog =
    () => {
      if (processingId) {
        return;
      }

      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
    };

  const handleDecline =
    async (student, reason) => {
      const cleanReason =
        reason.trim();

      if (!cleanReason) {
        setRejectError(
          'Please enter a reason before rejecting this request.'
        );
        return;
      }

      if (cleanReason.length > 500) {
        setRejectError(
          'Reason must be 500 characters or fewer.'
        );
        return;
      }

      try {
        setProcessingId(
          student.enrollmentId
        );
        setRejectError('');

        const token =
          getStoredToken();

        const response = await fetch(
          `${API_BASE_URL}/enrollments/${student.enrollmentId}/decline`,
          {
            method: 'PATCH',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              reason: cleanReason,
            }),
          }
        );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Unable to decline request.'
          );
        }

        await loadCourseData();
        setRejectTarget(null);
        setRejectReason('');
      } catch (error) {
        console.error(
          'Decline enrollment error:',
          error
        );

        window.alert(
          error.message ||
            'Unable to decline request.'
        );
      } finally {
        setProcessingId(null);
      }
    };


  /* ===================================================
     UNENROLL
  =================================================== */

  const handleUnenroll =
    async (student) => {
      const confirmed =
        window.confirm(
          `Remove ${student.name} from this course?`
        );

      if (!confirmed) {
        return;
      }

      /*
       * Your existing /courses/:id/unenroll
       * endpoint is designed for the logged
       * in student themselves.
       *
       * Until a professor-specific endpoint
       * is added, keep the button disabled
       * rather than accidentally unenrolling
       * the professor account.
       */

      window.alert(
        'Professor unenrollment endpoint still needs to be connected.'
      );
    };


  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <section
        className={
          styles.courseViewPage
        }
      >
        <div
          className={styles.loading}
        >
          Loading course...
        </div>
      </section>
    );
  }


  /* ===================================================
     ERROR
  =================================================== */

  if (
    errorMessage ||
    !course
  ) {
    return (
      <section
        className={
          styles.courseViewPage
        }
      >
        <div
          className={styles.loading}
        >
          <p>
            {errorMessage ||
              'Course not found.'}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/professor/courses'
              )
            }
          >
            Back to Courses
          </button>
        </div>
      </section>
    );
  }


  /* ===================================================
     COURSE VALUES
  =================================================== */

  const courseCode =
    course.code ||
    course.courseCode ||
    course.course_code ||
    'COURSE';

  const courseTitle =
    course.title ||
    course.courseName ||
    course.course_name ||
    'Untitled Course';

  const courseDescription =
    course.summary ||
    course.description ||
    '';

  const moduleCount =
    course.moduleCount ??
    course.module_count ??
    course.modules ??
    0;

  const quizCount =
    course.quizzes ??
    course.quizCount ??
    course.quiz_count ??
    0;

  const studentCount =
    enrolledStudents.length;

  const createdDate =
    course.createdAt ||
    course.created_at ||
    course.updatedAt ||
    course.updated_at;


  /* ===================================================
     PAGE
  =================================================== */

  return (
    <section
      className={
        styles.courseViewPage
      }
    >

      {/* ===============================================
          PAGE HEADER
      ================================================ */}

      <div
        className={
          styles.pageHeader
        }
      >
        <div>
          <h1>
            Course View
          </h1>

          <p>
            View enrollment requests
            and students enrolled in
            this course.
          </p>
        </div>
      </div>


      {/* ===============================================
          COURSE INFORMATION
      ================================================ */}

      <div
        className={
          styles.courseInfo
        }
      >

        <div
          className={
            styles.courseInfoTop
          }
        >

          <div
            className={
              styles.courseCode
            }
          >
            <span>
              Course Code:
            </span>

            <strong>
              {courseCode}
            </strong>
          </div>


          <span
            className={
              styles.dateCreated
            }
          >
            Date created:{' '}
            {formatDate(
              createdDate
            )}
          </span>

        </div>


        <h2>
          {courseTitle}
        </h2>


        {courseDescription && (
          <p
            className={
              styles.courseProgram
            }
          >
            {courseDescription}
          </p>
        )}


        <div
          className={
            styles.courseStats
          }
        >
          <span>
            {studentCount}{' '}
            students
          </span>

          <span>
            {moduleCount}{' '}
            Modules
          </span>

          <span>
            {quizCount}{' '}
            Quizzes
          </span>
        </div>

      </div>


      {/* ===============================================
          STUDENTS SECTION
      ================================================ */}

      <div
        className={
          styles.studentSection
        }
      >

        {/* =============================================
            TABS
        ============================================== */}

        <div
          className={
            styles.tabs
          }
        >

          <button
            type="button"
            className={`${
              styles.tabButton
            } ${
              activeTab ===
              'requests'
                ? styles.activeTab
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'requests'
              )
            }
          >
            Enrollment Request

            {requests.length >
              0 && (
              <span
                className={
                  styles.requestCount
                }
              >
                {requests.length}
              </span>
            )}
          </button>


          <button
            type="button"
            className={`${
              styles.tabButton
            } ${
              activeTab ===
              'enrolled'
                ? styles.activeTab
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'enrolled'
              )
            }
          >
            Enrolled Students

            {enrolledStudents.length >
              0 && (
              <span
                className={
                  styles.requestCount
                }
              >
                {
                  enrolledStudents.length
                }
              </span>
            )}
          </button>

        </div>


        {/* =============================================
            TABLE
        ============================================== */}

        <div
          className={
            styles.tableWrapper
          }
        >
          <table
            className={
              styles.studentTable
            }
          >

            <thead>
              <tr>
                <th>
                  Student ID
                </th>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Year Level
                </th>

                <th>
                  Section
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>


            <tbody>

              {displayedStudents
                .length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className={
                      styles.emptyTable
                    }
                  >
                    {activeTab ===
                    'requests'
                      ? 'No enrollment requests.'
                      : 'No enrolled students yet.'}
                  </td>
                </tr>
              ) : (
                displayedStudents.map(
                  (student) => {
                    const studentKey =
                      student.enrollmentId ||
                      student.userId ||
                      student.studentId;

                    const name =
                      student.displayName ||
                      student.name ||
                      'Student';

                    const image =
                      resolveProfileImage(
                        student.profileImage
                      );

                    const isProcessing =
                      processingId ===
                      student.enrollmentId;

                    return (
                      <tr
                        key={
                          studentKey
                        }
                      >

                        <td>
                          {student.studentId ||
                            'N/A'}
                        </td>


                        <td>
                          <div
                            className={
                              styles.studentName
                            }
                          >
                            <img
                              src={
                                image
                              }
                              alt={
                                name
                              }
                              className={
                                styles.avatar
                              }
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  DEFAULT_PROFILE_IMAGE;
                              }}
                            />

                            <span>
                              {name}
                            </span>
                          </div>
                        </td>


                        <td>
                          {student.email ||
                            'N/A'}
                        </td>


                        <td>
                          {student.yearLevel ||
                            'N/A'}
                        </td>


                        <td>
                          {student.sectionName ||
                            'N/A'}
                        </td>


                        <td>

                          {activeTab ===
                          'requests' ? (

                            <div
                              className={
                                styles.actionButtons
                              }
                            >

                              <button
                                type="button"
                                className={
                                  styles.approveBtn
                                }
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  handleApprove(
                                    student
                                  )
                                }
                              >
                                {isProcessing
                                  ? 'Processing...'
                                  : 'Approve'}
                              </button>


                              <button
                                type="button"
                                className={
                                  styles.declineBtn
                                }
                                disabled={
                                  isProcessing
                                }
                                onClick={() =>
                                  openRejectDialog(
                                    student
                                  )
                                }
                              >
                                Reject
                              </button>

                            </div>

                          ) : (

                            <div
                              className={
                                styles.actionButtons
                              }
                            >

                              <button
                                type="button"
                                className={
                                  styles.viewBtn
                                }
                                onClick={() =>
                                  navigate(
                                    `/professor/courses/view/${courseId}/student/${student.userId}`
                                  )
                                }
                              >
                                View
                              </button>


                              <button
                                type="button"
                                className={
                                  styles.unenrollBtn
                                }
                                onClick={() =>
                                  handleUnenroll(
                                    student
                                  )
                                }
                              >
                                Unenroll
                              </button>

                            </div>

                          )}

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>
        </div>

      </div>

      {rejectTarget && (
        <div
          className={
            styles.rejectOverlay
          }
          role="presentation"
          onClick={
            closeRejectDialog
          }
        >
          <form
            className={
              styles.rejectDialog
            }
            onSubmit={(event) => {
              event.preventDefault();
              handleDecline(
                rejectTarget,
                rejectReason
              );
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              Reject Enrollment
            </h2>

            <p>
              {`Reason for rejecting ${
                rejectTarget.displayName ||
                rejectTarget.name ||
                'this student'
              }`}
            </p>

            <textarea
              value={rejectReason}
              maxLength={500}
              placeholder="Enter rejection reason"
              onChange={(event) => {
                setRejectReason(
                  event.target.value
                );
                setRejectError('');
              }}
              autoFocus
            />

            <div
              className={
                styles.reasonFooter
              }
            >
              <span>
                {rejectReason.length}/500
              </span>

              {rejectError && (
                <strong>
                  {rejectError}
                </strong>
              )}
            </div>

            <div
              className={
                styles.rejectActions
              }
            >
              <button
                type="button"
                className={
                  styles.cancelRejectBtn
                }
                disabled={
                  processingId ===
                  rejectTarget.enrollmentId
                }
                onClick={
                  closeRejectDialog
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className={
                  styles.confirmRejectBtn
                }
                disabled={
                  processingId ===
                  rejectTarget.enrollmentId
                }
              >
                {processingId ===
                rejectTarget.enrollmentId
                  ? 'Rejecting...'
                  : 'Reject'}
              </button>
            </div>
          </form>
        </div>
      )}

    </section>
  );
}

