import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import {
  enrollStudentInCourseAsync,
  findJoinableCourseByCodeAsync,
} from './studentCourseData';

export default function StudentJoinCourse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseCode =
    searchParams.get('courseCode') ||
    searchParams.get('code') ||
    '';

  useEffect(() => {
    let active = true;

    async function joinCourse() {
      const course =
        await findJoinableCourseByCodeAsync(courseCode);

      if (!active) return;

      if (course) {
        await enrollStudentInCourseAsync(course);

        if (!active) return;

        navigate(
          `/student/enrolled-courses/${
            course.id || course.code
          }`,
          { replace: true }
        );

        return;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Invalid Course Link',
        text: 'Course link is invalid or the course is not published.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
      });

      if (!active) return;

      navigate('/student/public-courses', {
        replace: true,
      });
    }

    joinCourse();

    return () => {
      active = false;
    };
  }, [courseCode, navigate]);

  return null;
}