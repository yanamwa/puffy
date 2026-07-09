import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  enrollStudentInCourse,
  findJoinableCourseByCodeAsync,
} from './studentCourseData';

export default function StudentJoinCourse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseCode = searchParams.get('courseCode') || searchParams.get('code') || '';

  useEffect(() => {
    let active = true;

    async function joinCourse() {
      const course = await findJoinableCourseByCodeAsync(courseCode);

      if (!active) return;

      if (course) {
        enrollStudentInCourse(course);
        navigate(`/student/enrolled-courses/${course.id || course.code}`, { replace: true });
        return;
      }

      window.alert('Course link is invalid or the course is not published.');
      navigate('/student/public-courses', { replace: true });
    }

    joinCourse();

    return () => {
      active = false;
    };
  }, [courseCode, navigate]);

  return null;
}
