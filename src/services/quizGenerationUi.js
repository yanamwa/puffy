import Swal from 'sweetalert2';
import './quizGenerationUi.css';

export function requestQuizSettings({ assessment = 'practice' } = {}) {
  if (assessment !== 'main') return requestPracticeQuizSettings();
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

function requestPracticeQuizSettings() {
  const fields = [
    ['question-count', 'Total Questions', 20],
    ['multiple-choice-count', 'Multiple Choice', 10],
    ['identification-count', 'Identification', 5],
    ['true-false-count', 'True or False', 5],
    ['lots-count', 'LOTS Questions', 12],
    ['hots-count', 'HOTS Questions', 8],
  ];
  const input = ([id, label, value]) => `<label for="quiz-${id}">${label}</label><input id="quiz-${id}" type="number" min="${id === 'question-count' ? 1 : 0}" max="50" step="1" value="${value}" required />`;
  return Swal.fire({
    title: 'Generate Practice Quiz',
    customClass: { popup: 'quizGeneratorPopup', confirmButton: 'quizGeneratorConfirm', cancelButton: 'quizGeneratorCancel' },
    html: `<p class="quizGeneratorIntro">Create questions grounded in your saved source material.</p>
      <div class="quizGeneratorFields">${input(fields[0])}
      <h3>Question Distribution</h3>${fields.slice(1, 4).map(input).join('')}
      <p id="quiz-type-summary" class="quizGeneratorHint" aria-live="polite"></p>
      <hr /><h3>Cognitive Distribution</h3>${input(fields[4])}
      <p class="quizGeneratorLevels">Remember • Understand • Apply</p>${input(fields[5])}
      <p class="quizGeneratorLevels">Analyze • Evaluate • Create</p>
      <p id="quiz-cognitive-summary" class="quizGeneratorHint" aria-live="polite"></p></div>`,
    showCancelButton: true, confirmButtonText: 'Generate Quiz', cancelButtonText: 'Cancel',
    buttonsStyling: false, focusConfirm: false,
    didOpen: popup => {
      popup.parentElement.style.zIndex = '1000000';
      const update = () => {
        const [total, mc, ids, tf, lots, hots] = fields.map(([id]) => Number(popup.querySelector(`#quiz-${id}`).value));
        popup.querySelector('#quiz-type-summary').textContent = `${mc} Multiple Choice • ${ids} Identification • ${tf} True/False${mc + ids + tf === total ? '' : ' — must equal total questions'}`;
        popup.querySelector('#quiz-cognitive-summary').textContent = `${lots} LOTS • ${hots} HOTS${lots + hots === total ? '' : ' — must equal total questions'}`;
      };
      fields.forEach(([id]) => popup.querySelector(`#quiz-${id}`).addEventListener('input', update));
      update();
    },
    preConfirm: () => {
      const inputs = fields.map(([id]) => Swal.getPopup().querySelector(`#quiz-${id}`));
      const [questionCount, multipleChoiceCount, identificationCount, trueFalseCount, lotsCount, hotsCount] = inputs.map(input => Number(input.value));
      if (inputs.some(input => !input.checkValidity())) { Swal.showValidationMessage('Enter whole question counts from 0 to 50, with at least one total question.'); return false; }
      if (multipleChoiceCount + identificationCount + trueFalseCount !== questionCount) { Swal.showValidationMessage('Question type counts must add up to Total Questions.'); return false; }
      if (lotsCount + hotsCount !== questionCount) { Swal.showValidationMessage('LOTS and HOTS counts must add up to Total Questions.'); return false; }
      return { assessmentType: 'practice', questionCount, multipleChoiceCount, identificationCount, trueFalseCount, lotsCount, hotsCount };
    },
  });
}

export function quizGenerationFields(settings) {
  return settings.assessmentType === 'practice' ? {
    assessment_type: 'practice', question_count: settings.questionCount,
    multiple_choice_count: settings.multipleChoiceCount, identification_count: settings.identificationCount,
    true_false_count: settings.trueFalseCount, lots_count: settings.lotsCount, hots_count: settings.hotsCount,
  } : { question_count: settings.questionCount, identification_count: settings.identificationCount, difficulty: settings.difficulty };
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
