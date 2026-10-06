import './lessonNotifications.css';
import Swal from 'sweetalert2';

export function notifyLessonGenerated(pageCount) {
  return Swal.fire({
    toast: true, position: 'top-end', icon: 'success',
    customClass: { popup: 'lessonGenerationToast' },
    title: 'Lesson generated',
    text: `${pageCount ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} ready. ` : ''}Review the lesson and save your changes.`,
    showConfirmButton: false, showCloseButton: true,
    timer: 6500, timerProgressBar: true,
    didOpen: popup => {
      popup.parentElement.style.zIndex = '1000000';
      popup.addEventListener('mouseenter', Swal.stopTimer);
      popup.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
}
