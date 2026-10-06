import Swal from 'sweetalert2';
import './quizGenerationUi.css';

export function requestQuizSettings() {
  return Swal.fire({ title: 'Generate module quiz',
    customClass: { popup: 'quizGeneratorPopup', confirmButton: 'quizGeneratorConfirm', cancelButton: 'quizGeneratorCancel' },
    html: `<p class="quizGeneratorIntro">Create questions grounded in your saved source material.</p>
      <div class="quizGeneratorFields">
        <label for="quiz-question-count">Total questions</label>
        <input id="quiz-question-count" type="number" min="1" max="50" step="1" value="5" />
        <label for="quiz-identification-count">Identification questions</label>
        <input id="quiz-identification-count" type="number" min="0" max="5" step="1" value="0" />
        <p id="quiz-type-summary" class="quizGeneratorHint" aria-live="polite">5 multiple choice · 0 identification</p>
        <label for="quiz-difficulty">Difficulty</label>
        <select id="quiz-difficulty"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select>
      </div>`,
    showCancelButton: true, confirmButtonText: 'Generate quiz', cancelButtonText: 'Cancel',
    buttonsStyling: false, focusConfirm: false,
    didOpen: popup => {
      popup.parentElement.style.zIndex = '1000000';
      const total = popup.querySelector('#quiz-question-count'), identification = popup.querySelector('#quiz-identification-count');
      const update = () => {
        identification.max = total.value;
        const count = Number(total.value), ids = Number(identification.value);
        popup.querySelector('#quiz-type-summary').textContent = Number.isInteger(count) && count >= ids && ids >= 0
          ? `${count - ids} multiple choice · ${ids} identification` : 'Identification count cannot exceed the total.';
      };
      total.addEventListener('input', update); identification.addEventListener('input', update);
    },
    preConfirm: () => {
      const popup = Swal.getPopup();
      const questionCount = Number(popup.querySelector('#quiz-question-count').value);
      const identificationCount = Number(popup.querySelector('#quiz-identification-count').value);
      if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50) { Swal.showValidationMessage('Choose 1 to 50 questions.'); return false; }
      if (!Number.isInteger(identificationCount) || identificationCount < 0 || identificationCount > questionCount) { Swal.showValidationMessage('Identification count must be between 0 and the total.'); return false; }
      return { questionCount, identificationCount, difficulty: popup.querySelector('#quiz-difficulty').value };
    },
  });
}

export function quizSourceFields(courseId, lessonId, pages = []) {
  const ids = [...new Set(pages.flatMap(p => [...(p.source_document_ids || []), ...(p.source_document_id ? [p.source_document_id] : [])]))];
  return { course_id: Number(courseId), lesson_id: Number.isInteger(Number(lessonId)) && Number(lessonId) > 0 ? Number(lessonId) : null, document_ids: ids };
}

export function notifyQuizGenerated(count) {
  Swal.close();
  return Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Quiz generated',
    text: `${count} questions ready. Review the answers and save your changes.`,
    showConfirmButton: false, showCloseButton: true, timer: 6500, timerProgressBar: true,
    customClass: { popup: 'quizGeneratorPopup' },
    didOpen: popup => { popup.parentElement.style.zIndex = '1000000'; },
  });
}
