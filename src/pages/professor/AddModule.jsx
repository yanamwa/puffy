import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import { useAuth } from '../../context/AuthContext';
import {
  fetchCourse,
  saveCourse,
} from '../../services/courseApi.js';

import styles from './Addmodule.module.css';

const TITLE_LIMIT = 100;
const CODE_LIMIT = 24;
const LONG_LIMIT = 750;
const LESSON_LIMIT = 6000;
const QUIZ_LIMIT = 500;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createEmptyLessonPage() {
  return {
    id: createId('page'),
    title: '',
    content: '',
  };
}

function createEmptyQuizItem() {
  return {
    id: createId('quiz'),
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
  };
}

function createEmptyContentModule(index = 0) {
  return {
    id: createId('module'),
    title: `Module ${index + 1}`,
    description: '',
    learningObjectives: '',
    lessonPages: [],
    quizItems: [],
  };
}

const emptyCourse = {
  title: '',
  code: '',
  summary: '',
  subject: '',
  status: 'draft',
  visibility: 'private',
  contentModules: [],
  students: 0,
};

function limit(value, max) {
  return String(value || '').slice(0, max);
}

function counterClass(current, max) {
  return current >= max
    ? `${styles.wordCounter} ${styles.wordCounterFull}`
    : styles.wordCounter;
}

function normalizeLessonPage(page) {
  return {
    id: page?.id || createId('page'),
    title: String(page?.title || ''),
    content: String(
      page?.content ||
        page?.description ||
        ''
    ),
  };
}

function normalizeQuizItem(item) {
  const type =
    item?.type === 'true_false'
      ? 'true_false'
      : 'multiple_choice';

  let options = Array.isArray(item?.options)
    ? item.options.map((option) =>
        String(option || '')
      )
    : [];

  if (type === 'true_false') {
    options = ['True', 'False'];
  } else {
    options = options.slice(0, 4);

    while (options.length < 4) {
      options.push('');
    }
  }

  return {
    id: item?.id || createId('quiz'),
    type,
    question: String(item?.question || ''),
    options,
    correct_answer: String(
      item?.correct_answer ||
        item?.answer ||
        ''
    ),
    explanation: String(
      item?.explanation || ''
    ),
  };
}

function normalizeContentModule(module, index) {
  return {
    id:
      module?.id ||
      module?.module_id ||
      createId('module'),

    title:
      String(module?.title || '').trim() ||
      `Module ${index + 1}`,

    description: String(
      module?.description ||
        module?.summary ||
        ''
    ),

    learningObjectives: String(
      module?.learningObjectives ||
        module?.learning_objectives ||
        ''
    ),

    lessonPages: Array.isArray(
      module?.lessonPages
    )
      ? module.lessonPages.map(
          normalizeLessonPage
        )
      : Array.isArray(module?.lesson_pages)
        ? module.lesson_pages.map(
            normalizeLessonPage
          )
        : [],

    quizItems: Array.isArray(
      module?.quizItems
    )
      ? module.quizItems.map(
          normalizeQuizItem
        )
      : Array.isArray(module?.quiz_items)
        ? module.quiz_items.map(
            normalizeQuizItem
          )
        : [],
  };
}

function normalizeCourse(course) {
  const nestedModules =
    Array.isArray(course?.contentModules)
      ? course.contentModules
      : Array.isArray(course?.content_modules)
        ? course.content_modules
        : null;

  let contentModules = [];

  if (nestedModules?.length) {
    contentModules =
      nestedModules.map(
        normalizeContentModule
      );
  } else {
    const oldLessonPages =
      Array.isArray(course?.lessonPages)
        ? course.lessonPages
        : [];

    const oldQuizItems =
      Array.isArray(course?.quizItems)
        ? course.quizItems
        : [];

    if (
      oldLessonPages.length ||
      oldQuizItems.length ||
      course?.learningObjectives
    ) {
      contentModules = [
        normalizeContentModule(
          {
            title: 'Module 1',
            description:
              course?.summary || '',
            learningObjectives:
              course?.learningObjectives ||
              '',
            lessonPages:
              oldLessonPages,
            quizItems: oldQuizItems,
          },
          0
        ),
      ];
    }
  }

  return {
    ...emptyCourse,
    ...course,

    code: String(course?.code || ''),

    summary: String(
      course?.summary || ''
    ),

    subject: String(
      course?.subject || ''
    ),

    status:
      course?.status === 'published'
        ? 'published'
        : 'draft',

    visibility:
      course?.visibility === 'public'
        ? 'public'
        : 'private',

    contentModules,
  };
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'puffy-user'
      ) || 'null'
    );
  } catch {
    return null;
  }
}

export default function AddModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditing = Boolean(id);

  const [form, setForm] =
    useState(emptyCourse);

  const [loading, setLoading] =
    useState(isEditing);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    processingModuleId,
    setProcessingModuleId,
  ] = useState(null);

  const [
    generatingQuizModuleId,
    setGeneratingQuizModuleId,
  ] = useState(null);

  const [
    expandedModuleId,
    setExpandedModuleId,
  ] = useState(null);

  const [
    moduleFiles,
    setModuleFiles,
  ] = useState({});

  const [
    activePageIndexes,
    setActivePageIndexes,
  ] = useState({});

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);

        const selected =
          await fetchCourse(id);

        if (active && selected) {
          const normalized =
            normalizeCourse(selected);

          setForm(normalized);

          setExpandedModuleId(
            normalized
              .contentModules[0]
              ?.id || null
          );
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title:
            'Unable to Load Course',
          text:
            error.message ||
            'Could not load course.',
          confirmButtonText: 'OK',
        });

        navigate(
          '/professor/courses'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      active = false;
    };
  }, [
    id,
    isEditing,
    navigate,
  ]);

  const moduleCount =
    form.contentModules.length;

  const totalLessonPages =
    useMemo(
      () =>
        form.contentModules.reduce(
          (total, module) =>
            total +
            module.lessonPages.length,
          0
        ),
      [form.contentModules]
    );

  const totalQuizItems =
    useMemo(
      () =>
        form.contentModules.reduce(
          (total, module) =>
            total +
            module.quizItems.filter(
              (item) =>
                item.question.trim()
            ).length,
          0
        ),
      [form.contentModules]
    );

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCourseCode = (
    value
  ) => {
    updateField(
      'code',
      String(value || '')
        .toUpperCase()
        .replace(
          /[^A-Z0-9-]/g,
          ''
        )
        .slice(0, CODE_LIMIT)
    );
  };

  const addContentModule = () => {
    const module =
      createEmptyContentModule(
        form.contentModules.length
      );

    setForm((current) => ({
      ...current,
      contentModules: [
        ...current.contentModules,
        module,
      ],
    }));

    setExpandedModuleId(module.id);

    setActivePageIndexes(
      (current) => ({
        ...current,
        [module.id]: 0,
      })
    );
  };

  const updateContentModule = (
    moduleId,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id === moduleId
              ? {
                  ...module,
                  [field]: value,
                }
              : module
        ),
    }));
  };

  const removeContentModule =
    async (moduleId) => {
      const selectedModule =
        form.contentModules.find(
          (module) =>
            module.id === moduleId
        );

      const result =
        await Swal.fire({
          icon: 'warning',
          title: 'Remove Module?',
          text:
            `This will remove ${
              selectedModule?.title ||
              'this module'
            }, including its lesson pages and quiz items.`,
          showCancelButton: true,
          confirmButtonText:
            'Remove Module',
          cancelButtonText: 'Cancel',
        });

      if (!result.isConfirmed) {
        return;
      }

      setForm((current) => ({
        ...current,

        contentModules:
          current.contentModules.filter(
            (module) =>
              module.id !== moduleId
          ),
      }));

      setModuleFiles((current) => {
        const next = {
          ...current,
        };

        delete next[moduleId];

        return next;
      });

      setActivePageIndexes(
        (current) => {
          const next = {
            ...current,
          };

          delete next[moduleId];

          return next;
        }
      );

      if (
        expandedModuleId === moduleId
      ) {
        const remaining =
          form.contentModules.filter(
            (module) =>
              module.id !== moduleId
          );

        setExpandedModuleId(
          remaining[0]?.id || null
        );
      }
    };

  const addLessonPage = (
    moduleId
  ) => {
    const page =
      createEmptyLessonPage();

    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id === moduleId
              ? {
                  ...module,
                  lessonPages: [
                    ...module.lessonPages,
                    page,
                  ],
                }
              : module
        ),
    }));

    const selectedModule =
      form.contentModules.find(
        (module) =>
          module.id === moduleId
      );

    setActivePageIndexes(
      (current) => ({
        ...current,

        [moduleId]:
          selectedModule
            ?.lessonPages.length || 0,
      })
    );
  };

  const updateLessonPage = (
    moduleId,
    pageIndex,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id !== moduleId
              ? module
              : {
                  ...module,

                  lessonPages:
                    module.lessonPages.map(
                      (
                        page,
                        currentPageIndex
                      ) =>
                        currentPageIndex ===
                        pageIndex
                          ? {
                              ...page,
                              [field]:
                                value,
                            }
                          : page
                    ),
                }
        ),
    }));
  };

  const removeLessonPage = (
    moduleId,
    pageIndex
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) => {
            if (
              module.id !== moduleId
            ) {
              return module;
            }

            return {
              ...module,

              lessonPages:
                module.lessonPages.filter(
                  (
                    _,
                    currentPageIndex
                  ) =>
                    currentPageIndex !==
                    pageIndex
                ),
            };
          }
        ),
    }));

    setActivePageIndexes(
      (current) => {
        const selectedModule =
          form.contentModules.find(
            (module) =>
              module.id === moduleId
          );

        const nextLength = Math.max(
          0,
          (selectedModule
            ?.lessonPages.length || 1) -
            1
        );

        return {
          ...current,

          [moduleId]:
            nextLength === 0
              ? 0
              : Math.min(
                  current[moduleId] || 0,
                  nextLength - 1
                ),
        };
      }
    );
  };

  const addQuizItem = (
    moduleId
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id === moduleId
              ? {
                  ...module,

                  quizItems: [
                    ...module.quizItems,
                    createEmptyQuizItem(),
                  ],
                }
              : module
        ),
    }));
  };

  const updateQuizItem = (
    moduleId,
    quizIndex,
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id !== moduleId
              ? module
              : {
                  ...module,

                  quizItems:
                    module.quizItems.map(
                      (
                        item,
                        currentQuizIndex
                      ) =>
                        currentQuizIndex ===
                        quizIndex
                          ? {
                              ...item,
                              [field]:
                                value,
                            }
                          : item
                    ),
                }
        ),
    }));
  };

  const updateQuizOption = (
    moduleId,
    quizIndex,
    optionIndex,
    value
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) => {
            if (
              module.id !== moduleId
            ) {
              return module;
            }

            return {
              ...module,

              quizItems:
                module.quizItems.map(
                  (
                    item,
                    currentQuizIndex
                  ) => {
                    if (
                      currentQuizIndex !==
                      quizIndex
                    ) {
                      return item;
                    }

                    const oldOption =
                      item.options[
                        optionIndex
                      ];

                    const options =
                      item.options.map(
                        (
                          option,
                          currentOptionIndex
                        ) =>
                          currentOptionIndex ===
                          optionIndex
                            ? value
                            : option
                      );

                    return {
                      ...item,
                      options,

                      correct_answer:
                        item.correct_answer ===
                        oldOption
                          ? value
                          : item.correct_answer,
                    };
                  }
                ),
            };
          }
        ),
    }));
  };

  const removeQuizItem = (
    moduleId,
    quizIndex
  ) => {
    setForm((current) => ({
      ...current,

      contentModules:
        current.contentModules.map(
          (module) =>
            module.id !== moduleId
              ? module
              : {
                  ...module,

                  quizItems:
                    module.quizItems.filter(
                      (
                        _,
                        currentQuizIndex
                      ) =>
                        currentQuizIndex !==
                        quizIndex
                    ),
                }
        ),
    }));
  };

  const uploadAndAutoSort =
    async (moduleId) => {
      const uploadedFile =
        moduleFiles[moduleId];

      if (!uploadedFile) {
        await Swal.fire({
          icon: 'warning',
          title:
            'No File Selected',
          text:
            'Please choose a PDF, DOCX, or TXT lesson file first.',
          confirmButtonText: 'OK',
        });

        return;
      }

      const selectedModule =
        form.contentModules.find(
          (module) =>
            module.id === moduleId
        );

      const formData =
        new FormData();

      formData.append(
        'file',
        uploadedFile
      );

      try {
        setProcessingModuleId(
          moduleId
        );

        const response =
          await fetch(
            `${API_BASE}/api/lessons/process-file`,
            {
              method: 'POST',
              credentials:
                'include',
              body: formData,
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Could not process the uploaded lesson file.'
          );
        }

        const generatedPages =
          Array.isArray(
            data.lesson_pages
          )
            ? data.lesson_pages
                .map((page) => ({
                  id:
                    createId('page'),

                  title: limit(
                    page?.title ||
                      '',
                    TITLE_LIMIT
                  ),

                  content: limit(
                    page?.content ||
                      '',
                    LESSON_LIMIT
                  ),
                }))
                .filter(
                  (page) =>
                    page.title ||
                    page.content
                )
            : [];

        updateContentModule(
          moduleId,
          'title',
          limit(
            data.module_title ||
              selectedModule?.title ||
              '',
            TITLE_LIMIT
          )
        );

        setForm((current) => ({
          ...current,

          subject: limit(
            data.subject ||
              current.subject,
            TITLE_LIMIT
          ),

          contentModules:
            current.contentModules.map(
              (module) =>
                module.id !==
                moduleId
                  ? module
                  : {
                      ...module,

                      title: limit(
                        data.module_title ||
                          module.title,
                        TITLE_LIMIT
                      ),

                      description:
                        limit(
                          data.description ||
                            module.description,
                          LONG_LIMIT
                        ),

                      learningObjectives:
                        limit(
                          data.learning_objectives ||
                            module.learningObjectives,
                          LONG_LIMIT
                        ),

                      lessonPages:
                        generatedPages.length
                          ? generatedPages
                          : module.lessonPages,
                    }
            ),
        }));

        setActivePageIndexes(
          (current) => ({
            ...current,
            [moduleId]: 0,
          })
        );

        await Swal.fire({
          icon: 'success',
          title:
            'Module Processed',
          text:
            'The lesson file was processed and added to this module.',
          confirmButtonText:
            'Continue',
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title:
            'Processing Failed',
          text:
            error.message ||
            'Could not process the lesson file.',
          confirmButtonText: 'OK',
        });
      } finally {
        setProcessingModuleId(
          null
        );
      }
    };

  const autoGenerateQuiz =
    async (moduleId) => {
      const selectedModule =
        form.contentModules.find(
          (module) =>
            module.id === moduleId
        );

      if (!selectedModule) {
        return;
      }

      const lessonContent =
        selectedModule.lessonPages
          .map((page) =>
            [
              page.title
                ? `Lesson page: ${page.title}`
                : '',
              page.content,
            ]
              .filter(Boolean)
              .join('\n')
          )
          .filter(Boolean)
          .join('\n\n');

      if (
        !lessonContent &&
        !selectedModule
          .learningObjectives.trim()
      ) {
        await Swal.fire({
          icon: 'warning',
          title:
            'Module Content Required',
          text:
            'Add learning objectives or lesson pages to this module first.',
          confirmButtonText: 'OK',
        });

        return;
      }

      const result =
        await Swal.fire({
          title:
            'Generate Module Quiz',

          html: `
            <div class="quiz-generator-fields" style="display:grid; gap:10px; text-align:left;">
              <label for="quiz-question-count">
                Total number of questions
              </label>

              <input
                id="quiz-question-count"
                class="swal2-input"
                type="number"
                min="1"
                max="50"
                value="5"
                style="width:100%; margin:0; box-sizing:border-box;"
              />

              <label for="quiz-true-false-count">
                Number of True or False questions
              </label>

              <input
                id="quiz-true-false-count"
                class="swal2-input"
                type="number"
                min="0"
                max="50"
                value="0"
                style="width:100%; margin:0; box-sizing:border-box;"
              />

              <label for="quiz-difficulty">
                Difficulty
              </label>

              <select
                id="quiz-difficulty"
                class="swal2-select"
                style="width:100%; margin:0; box-sizing:border-box;"
              >
                <option value="easy">
                  Easy
                </option>

                <option value="medium" selected>
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>
              </select>
            </div>
          `,

          showCancelButton: true,
          confirmButtonText:
            'Generate',
          cancelButtonText: 'Cancel',
          focusConfirm: false,

          preConfirm: () => {
            const questionCount =
              Number.parseInt(
                document.getElementById(
                  'quiz-question-count'
                )?.value,
                10
              );

            const trueFalseCount =
              Number.parseInt(
                document.getElementById(
                  'quiz-true-false-count'
                )?.value,
                10
              );

            const difficulty =
              document.getElementById(
                'quiz-difficulty'
              )?.value ||
              'medium';

            if (
              !Number.isInteger(
                questionCount
              ) ||
              questionCount < 1 ||
              questionCount > 50
            ) {
              Swal.showValidationMessage(
                'Enter a total question count from 1 to 50.'
              );

              return false;
            }

            if (
              !Number.isInteger(
                trueFalseCount
              ) ||
              trueFalseCount < 0 ||
              trueFalseCount >
                questionCount
            ) {
              Swal.showValidationMessage(
                'The True or False count must be between 0 and the total question count.'
              );

              return false;
            }

            return {
              questionCount,
              trueFalseCount,
              difficulty,
            };
          },
        });

      if (
        !result.isConfirmed ||
        !result.value
      ) {
        return;
      }

      try {
        setGeneratingQuizModuleId(
          moduleId
        );

        Swal.fire({
          title:
            'Generating Quiz',
          text:
            'Gemini is creating questions for this module.',
          allowOutsideClick:
            false,
          allowEscapeKey: false,

          didOpen: () => {
            Swal.showLoading();
          },
        });

        const response =
          await fetch(
            `${API_BASE}/api/lessons/generate-quiz`,
            {
              method: 'POST',
              credentials:
                'include',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                lesson_title:
                  selectedModule.title,

                lesson_content:
                  lessonContent,

                learning_objectives:
                  selectedModule
                    .learningObjectives,

                question_count:
                  result.value
                    .questionCount,

                true_false_count:
                  result.value
                    .trueFalseCount,

                difficulty:
                  result.value
                    .difficulty,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Could not generate the quiz.'
          );
        }

        const generatedQuestions =
          Array.isArray(
            data.quiz?.questions
          )
            ? data.quiz.questions
                .map(
                  normalizeQuizItem
                )
                .filter(
                  (item) =>
                    item.question
                )
            : [];

        if (
          generatedQuestions.length ===
          0
        ) {
          throw new Error(
            'No valid quiz questions were generated.'
          );
        }

        updateContentModule(
          moduleId,
          'quizItems',
          generatedQuestions
        );

        await Swal.fire({
          icon: 'success',
          title:
            'Quiz Generated',
          text:
            `${generatedQuestions.length} questions were generated for ${selectedModule.title}.`,
          confirmButtonText:
            'Review Questions',
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title:
            'Quiz Generation Failed',
          text:
            error.message ||
            'Could not generate the quiz.',
          confirmButtonText: 'OK',
        });
      } finally {
        setGeneratingQuizModuleId(
          null
        );
      }
    };

  const saveCourseForm =
    async (event) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      if (
        !form.title.trim() ||
        !form.code.trim() ||
        !form.summary.trim() ||
        !form.subject.trim()
      ) {
        await Swal.fire({
          icon: 'warning',
          title:
            'Required Fields Missing',
          text:
            'Course title, course code, description, and subject are required.',
          confirmButtonText: 'OK',
        });

        return;
      }

      if (
        form.contentModules.length ===
        0
      ) {
        await Swal.fire({
          icon: 'warning',
          title:
            'Add a Module',
          text:
            'Create at least one module before saving the course.',
          confirmButtonText: 'OK',
        });

        return;
      }

      const incompleteModule =
        form.contentModules.find(
          (module) =>
            !module.title.trim() ||
            !module
              .learningObjectives
              .trim() ||
            module.lessonPages.length ===
              0
        );

      if (incompleteModule) {
        await Swal.fire({
          icon: 'warning',
          title:
            'Incomplete Module',
          text:
            `${incompleteModule.title || 'A module'} needs a title, learning objectives, and at least one lesson page.`,
          confirmButtonText: 'OK',
        });

        setExpandedModuleId(
          incompleteModule.id
        );

        return;
      }

      const normalizedCode =
        form.code
          .trim()
          .toUpperCase();

      const storedUser =
        getStoredUser();

      const currentProfessor =
        user ||
        storedUser ||
        {};

      const professorName =
        currentProfessor
          .displayName ||
        currentProfessor
          .display_name ||
        currentProfessor.name ||
        currentProfessor.email ||
        'Professor';

      const professorEmail =
        currentProfessor.email ||
        '';

      const professorId =
        currentProfessor.id ||
        currentProfessor.userId ||
        currentProfessor.user_id ||
        null;

      const flattenedLessonPages =
        form.contentModules.flatMap(
          (module, moduleIndex) =>
            module.lessonPages.map(
              (page, pageIndex) => ({
                ...page,

                moduleId:
                  module.id,

                module_id:
                  module.id,

                moduleTitle:
                  module.title,

                module_title:
                  module.title,

                moduleIndex,

                module_index:
                  moduleIndex,

                pageIndex,

                page_index:
                  pageIndex,
              })
            )
        );

      const flattenedQuizItems =
        form.contentModules.flatMap(
          (module, moduleIndex) =>
            module.quizItems.map(
              (item) => ({
                ...item,

                moduleId:
                  module.id,

                module_id:
                  module.id,

                moduleTitle:
                  module.title,

                module_title:
                  module.title,

                moduleIndex,

                module_index:
                  moduleIndex,
              })
            )
        );

      const payload = {
        ...form,

        title:
          form.title.trim(),

        code: normalizedCode,

        summary:
          form.summary.trim(),

        subject:
          form.subject.trim(),

        visibility:
          form.visibility ===
          'public'
            ? 'public'
            : 'private',

        joinLink:
          `/student/join?courseCode=${encodeURIComponent(
            normalizedCode
          )}`,

        modules: moduleCount,

        lessonPageCount:
          totalLessonPages,

        quizzes:
          totalQuizItems,

        lessonPages:
          flattenedLessonPages,

        quizItems:
          flattenedQuizItems,

        updatedAt:
          new Date()
            .toISOString()
            .slice(0, 10),

        archived: false,

        professorId,
        professor_id:
          professorId,

        professorName,
        professor_name:
          professorName,

        professorEmail,
        professor_email:
          professorEmail,
      };

      try {
        setIsSaving(true);

        await saveCourse(
          isEditing
            ? {
                ...payload,
                id,
              }
            : payload
        );

        await Swal.fire({
          icon: 'success',

          title: isEditing
            ? 'Course Updated'
            : 'Course Added',

          text: isEditing
            ? 'The course changes were saved successfully.'
            : 'The new course was added successfully.',

          confirmButtonText:
            'Done',
        });

        navigate(
          '/professor/courses'
        );
      } catch (error) {
        await Swal.fire({
          icon: 'error',

          title: isEditing
            ? 'Update Failed'
            : 'Save Failed',

          text:
            error.message ||
            'Could not save course.',

          confirmButtonText: 'OK',
        });
      } finally {
        setIsSaving(false);
      }
    };

  if (loading) {
    return (
      <section
        className={
          styles.addModulePage
        }
      >
        <div
          className={
            styles.pageHeader
          }
        >
          <h1>
            Loading Course...
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        styles.addModulePage
      }
    >
      <div
        className={
          styles.pageHeader
        }
      >
        <div>
          <h1>
            {isEditing
              ? 'Edit Course'
              : 'Add Course'}
          </h1>

          <p
            className={
              styles.pageHeaderText
            }
          >
            Build the course using
            modules. Each module can
            contain lesson pages and its
            own quiz.
          </p>
        </div>
      </div>

      <form
        className={
          styles.formCard
        }
        onSubmit={saveCourseForm}
      >
        <div
          className={
            styles.popupInfoGrid
          }
        >
          <div
            className={
              styles.popupField
            }
          >
            <label
              className={
                styles.popupLabel
              }
            >
              Course Title

              <span
                className={
                  styles.required
                }
              >
                *Required
              </span>
            </label>

            <input
              className={
                styles.popupInput
              }
              value={form.title}
              onChange={(event) =>
                updateField(
                  'title',
                  limit(
                    event.target.value,
                    TITLE_LIMIT
                  )
                )
              }
              placeholder="Enter course title"
            />

            <div
              className={counterClass(
                form.title.length,
                TITLE_LIMIT
              )}
            >
              {form.title.length}/
              {TITLE_LIMIT} characters
            </div>
          </div>

          <div
            className={
              styles.popupField
            }
          >
            <label
              className={
                styles.popupLabel
              }
            >
              Course Code

              <span
                className={
                  styles.required
                }
              >
                *Required
              </span>
            </label>

            <input
              className={
                styles.popupInput
              }
              value={form.code}
              onChange={(event) =>
                updateCourseCode(
                  event.target.value
                )
              }
              placeholder="e.g. ITEC-106"
            />

            <div
              className={counterClass(
                form.code.length,
                CODE_LIMIT
              )}
            >
              {form.code.length}/
              {CODE_LIMIT} characters
            </div>
          </div>

          <div
            className={
              styles.popupField
            }
          >
            <label
              className={
                styles.popupLabel
              }
            >
              Status
            </label>

            <select
              className={
                styles.popupSelect
              }
              value={form.status}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target.value
                )
              }
            >
              <option value="draft">
                Draft
              </option>

              <option value="published">
                Publish
              </option>
            </select>
          </div>

          <div
            className={
              styles.popupField
            }
          >
            <label
              className={
                styles.popupLabel
              }
            >
              Student Access
            </label>

            <select
              className={
                styles.popupSelect
              }
              value={form.visibility}
              onChange={(event) =>
                updateField(
                  'visibility',
                  event.target.value
                )
              }
            >
              <option value="public">
                Public - visible in
                Public Courses
              </option>

              <option value="private">
                Private - course code
                or link only
              </option>
            </select>

            <p
              className={
                styles.accessHint
              }
            >
              {form.visibility ===
              'public'
                ? 'Students can discover this course in Public Courses.'
                : 'Students can join only with the course code or invite link.'}
            </p>
          </div>
        </div>

        <div
          className={
            styles.popupSection
          }
        >
          <label
            className={
              styles.popupLabel
            }
          >
            Course Description

            <span
              className={
                styles.required
              }
            >
              *Required
            </span>
          </label>

          <textarea
            className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
            value={form.summary}
            onChange={(event) =>
              updateField(
                'summary',
                limit(
                  event.target.value,
                  LONG_LIMIT
                )
              )
            }
            placeholder="Enter course description"
          />

          <div
            className={counterClass(
              form.summary.length,
              LONG_LIMIT
            )}
          >
            {form.summary.length}/
            {LONG_LIMIT} characters
          </div>
        </div>

        <div
          className={
            styles.popupSection
          }
        >
          <label
            className={
              styles.popupLabel
            }
          >
            Subject

            <span
              className={
                styles.required
              }
            >
              *Required
            </span>
          </label>

          <input
            className={
              styles.popupInput
            }
            value={form.subject}
            onChange={(event) =>
              updateField(
                'subject',
                limit(
                  event.target.value,
                  TITLE_LIMIT
                )
              )
            }
            placeholder="Enter subject"
          />

          <div
            className={counterClass(
              form.subject.length,
              TITLE_LIMIT
            )}
          >
            {form.subject.length}/
            {TITLE_LIMIT} characters
          </div>
        </div>

        <section
          className={
            styles.moduleBuilderSection
          }
        >
          <div
            className={
              styles.moduleBuilderHeader
            }
          >
            <div>
              <h2>
                Course Modules
              </h2>

              <p>
                {moduleCount} module(s),
                {' '}
                {totalLessonPages} lesson
                page(s), and{' '}
                {totalQuizItems} quiz
                item(s)
              </p>
            </div>

            <button
              className={
                styles.popupAddBtn
              }
              type="button"
              onClick={
                addContentModule
              }
            >
              + Add Module
            </button>
          </div>

          {form.contentModules.length ===
          0 ? (
            <div
              className={
                styles.popupEmptyQuiz
              }
            >
              No modules yet. Add your
              first module to begin.
            </div>
          ) : (
            <div
              className={
                styles.moduleCardGrid
              }
            >
              {form.contentModules.map(
                (
                  module,
                  moduleIndex
                ) => {
                  const isExpanded =
                    expandedModuleId ===
                    module.id;

                  const activePageIndex =
                    activePageIndexes[
                      module.id
                    ] || 0;

                  const activePage =
                    module.lessonPages[
                      activePageIndex
                    ] || null;

                  const isProcessing =
                    processingModuleId ===
                    module.id;

                  const isGenerating =
                    generatingQuizModuleId ===
                    module.id;

                  return (
                    <article
                      className={`${styles.moduleCard} ${
                        isExpanded
                          ? styles.moduleCardExpanded
                          : ''
                      }`}
                      key={module.id}
                    >
                      <div
                        className={
                          styles.moduleCardHeader
                        }
                      >
                        <div
                          className={
                            styles.moduleNumber
                          }
                        >
                          {moduleIndex + 1}
                        </div>

                        <div
                          className={
                            styles.moduleCardHeading
                          }
                        >
                          <span>
                            MODULE{' '}
                            {moduleIndex + 1}
                          </span>

                          <h3>
                            {module.title ||
                              `Module ${
                                moduleIndex + 1
                              }`}
                          </h3>

                          <p>
                            {
                              module
                                .lessonPages
                                .length
                            }{' '}
                            lesson page(s)
                            ·{' '}
                            {
                              module
                                .quizItems
                                .length
                            }{' '}
                            quiz item(s)
                          </p>
                        </div>

                        <div
                          className={
                            styles.moduleCardHeaderActions
                          }
                        >
                          <button
                            type="button"
                            className={
                              styles.moduleExpandBtn
                            }
                            onClick={() =>
                              setExpandedModuleId(
                                isExpanded
                                  ? null
                                  : module.id
                              )
                            }
                          >
                            {isExpanded
                              ? 'Collapse'
                              : 'Edit Module'}
                          </button>

                          <button
                            type="button"
                            className={
                              styles.moduleDeleteBtn
                            }
                            onClick={() =>
                              removeContentModule(
                                module.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          className={
                            styles.moduleCardBody
                          }
                        >
                          <div
                            className={
                              styles.moduleInfoGrid
                            }
                          >
                            <div
                              className={
                                styles.popupField
                              }
                            >
                              <label
                                className={
                                  styles.popupLabel
                                }
                              >
                                Module Title
                              </label>

                              <input
                                className={
                                  styles.popupInput
                                }
                                value={
                                  module.title
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateContentModule(
                                    module.id,
                                    'title',
                                    limit(
                                      event
                                        .target
                                        .value,
                                      TITLE_LIMIT
                                    )
                                  )
                                }
                                placeholder="Enter module title"
                              />
                            </div>

                            <div
                              className={
                                styles.popupField
                              }
                            >
                              <label
                                className={
                                  styles.popupLabel
                                }
                              >
                                Module Description
                              </label>

                              <textarea
                                className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
                                value={
                                  module.description
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateContentModule(
                                    module.id,
                                    'description',
                                    limit(
                                      event
                                        .target
                                        .value,
                                      LONG_LIMIT
                                    )
                                  )
                                }
                                placeholder="Enter module description"
                              />
                            </div>
                          </div>

                          <div
                            className={
                              styles.popupSection
                            }
                          >
                            <label
                              className={
                                styles.popupLabel
                              }
                            >
                              Learning Objectives

                              <span
                                className={
                                  styles.required
                                }
                              >
                                *Required
                              </span>
                            </label>

                            <textarea
                              className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
                              value={
                                module.learningObjectives
                              }
                              onChange={(
                                event
                              ) =>
                                updateContentModule(
                                  module.id,
                                  'learningObjectives',
                                  limit(
                                    event
                                      .target
                                      .value,
                                    LONG_LIMIT
                                  )
                                )
                              }
                              placeholder="Enter module learning objectives"
                            />
                          </div>

                          <div
                            className={
                              styles.popupSection
                            }
                          >
                            <label
                              className={
                                styles.popupLabel
                              }
                            >
                              Upload Module File
                            </label>

                            <div
                              className={
                                styles.uploadRow
                              }
                            >
                              <label
                                className={
                                  styles.customFileBtn
                                }
                              >
                                Choose File

                                <input
                                  type="file"
                                  accept=".pdf,.docx,.txt"
                                  disabled={
                                    isProcessing
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setModuleFiles(
                                      (
                                        current
                                      ) => ({
                                        ...current,

                                        [module.id]:
                                          event
                                            .target
                                            .files?.[0] ||
                                          null,
                                      })
                                    )
                                  }
                                />
                              </label>

                              <span
                                className={
                                  styles.fileName
                                }
                              >
                                {moduleFiles[
                                  module.id
                                ]?.name ||
                                  'No file chosen'}
                              </span>

                              <button
                                className={
                                  styles.popupAddBtn
                                }
                                type="button"
                                onClick={() =>
                                  uploadAndAutoSort(
                                    module.id
                                  )
                                }
                                disabled={
                                  isProcessing ||
                                  !moduleFiles[
                                    module.id
                                  ]
                                }
                              >
                                {isProcessing
                                  ? 'Processing...'
                                  : 'Upload and Auto Sort'}
                              </button>
                            </div>
                          </div>

                          <div
                            className={
                              styles.moduleInnerSection
                            }
                          >
                            <div
                              className={
                                styles.popupSectionRow
                              }
                            >
                              <div>
                                <h4>
                                  Lesson Pages
                                </h4>

                                <p>
                                  Pages belonging
                                  only to this
                                  module.
                                </p>
                              </div>

                              <button
                                className={
                                  styles.popupAddBtn
                                }
                                type="button"
                                onClick={() =>
                                  addLessonPage(
                                    module.id
                                  )
                                }
                              >
                                + Add Page
                              </button>
                            </div>

                            {module
                              .lessonPages
                              .length === 0 ? (
                              <div
                                className={
                                  styles.popupEmptyQuiz
                                }
                              >
                                No lesson pages
                                in this module.
                              </div>
                            ) : (
                              <>
                                <div
                                  className={
                                    styles.lessonPageTabs
                                  }
                                >
                                  {module.lessonPages.map(
                                    (
                                      page,
                                      pageIndex
                                    ) => (
                                      <button
                                        key={
                                          page.id
                                        }
                                        type="button"
                                        className={`${styles.lessonPageTab} ${
                                          activePageIndex ===
                                          pageIndex
                                            ? styles.lessonPageTabActive
                                            : ''
                                        }`}
                                        onClick={() =>
                                          setActivePageIndexes(
                                            (
                                              current
                                            ) => ({
                                              ...current,

                                              [module.id]:
                                                pageIndex,
                                            })
                                          )
                                        }
                                      >
                                        {
                                          pageIndex +
                                          1
                                        }
                                      </button>
                                    )
                                  )}
                                </div>

                                <div
                                  className={
                                    styles.popupQuizCard
                                  }
                                >
                                  <div
                                    className={
                                      styles.popupQuizCardTop
                                    }
                                  >
                                    <span
                                      className={
                                        styles.popupQuizCardTitle
                                      }
                                    >
                                      Page{' '}
                                      {
                                        activePageIndex +
                                        1
                                      }{' '}
                                      of{' '}
                                      {
                                        module
                                          .lessonPages
                                          .length
                                      }
                                    </span>

                                    <button
                                      className={
                                        styles.popupRemoveBtn
                                      }
                                      type="button"
                                      onClick={() =>
                                        removeLessonPage(
                                          module.id,
                                          activePageIndex
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <input
                                    className={
                                      styles.popupInput
                                    }
                                    value={
                                      activePage?.title ||
                                      ''
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLessonPage(
                                        module.id,
                                        activePageIndex,
                                        'title',
                                        limit(
                                          event
                                            .target
                                            .value,
                                          TITLE_LIMIT
                                        )
                                      )
                                    }
                                    placeholder="Page title"
                                  />

                                  <textarea
                                    className={`${styles.popupTextarea} ${styles.popupLargeBox}`}
                                    value={
                                      activePage?.content ||
                                      ''
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLessonPage(
                                        module.id,
                                        activePageIndex,
                                        'content',
                                        limit(
                                          event
                                            .target
                                            .value,
                                          LESSON_LIMIT
                                        )
                                      )
                                    }
                                    placeholder="Page content"
                                  />

                                  <div
                                    className={
                                      styles.lessonPageNavigation
                                    }
                                  >
                                    <button
                                      className={
                                        styles.lessonNavigationBtn
                                      }
                                      type="button"
                                      onClick={() =>
                                        setActivePageIndexes(
                                          (
                                            current
                                          ) => ({
                                            ...current,

                                            [module.id]:
                                              Math.max(
                                                0,
                                                activePageIndex -
                                                  1
                                              ),
                                          })
                                        )
                                      }
                                      disabled={
                                        activePageIndex ===
                                        0
                                      }
                                    >
                                      ← Previous
                                    </button>

                                    <span
                                      className={
                                        styles.lessonPageIndicator
                                      }
                                    >
                                      {
                                        activePageIndex +
                                        1
                                      }{' '}
                                      /{' '}
                                      {
                                        module
                                          .lessonPages
                                          .length
                                      }
                                    </span>

                                    <button
                                      className={
                                        styles.lessonNavigationBtn
                                      }
                                      type="button"
                                      onClick={() =>
                                        setActivePageIndexes(
                                          (
                                            current
                                          ) => ({
                                            ...current,

                                            [module.id]:
                                              Math.min(
                                                module
                                                  .lessonPages
                                                  .length -
                                                  1,
                                                activePageIndex +
                                                  1
                                              ),
                                          })
                                        )
                                      }
                                      disabled={
                                        activePageIndex ===
                                        module
                                          .lessonPages
                                          .length -
                                          1
                                      }
                                    >
                                      Next →
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div
                            className={
                              styles.moduleInnerSection
                            }
                          >
                            <div
                              className={
                                styles.popupSectionRow
                              }
                            >
                              <div>
                                <h4>
                                  Module Quiz
                                </h4>

                                <p>
                                  Quiz items
                                  belonging only
                                  to this module.
                                </p>
                              </div>

                              <div
                                className={
                                  styles.quizActions
                                }
                              >
                                <button
                                  className={
                                    styles.popupAddBtn
                                  }
                                  type="button"
                                  onClick={() =>
                                    autoGenerateQuiz(
                                      module.id
                                    )
                                  }
                                  disabled={
                                    isGenerating ||
                                    isProcessing ||
                                    isSaving
                                  }
                                >
                                  {isGenerating
                                    ? 'Generating...'
                                    : 'Auto Generate'}
                                </button>

                                <button
                                  className={
                                    styles.popupAddBtn
                                  }
                                  type="button"
                                  onClick={() =>
                                    addQuizItem(
                                      module.id
                                    )
                                  }
                                >
                                  + Add Quiz
                                </button>
                              </div>
                            </div>

                            {module.quizItems
                              .length === 0 ? (
                              <div
                                className={
                                  styles.popupEmptyQuiz
                                }
                              >
                                No quiz items in
                                this module.
                              </div>
                            ) : (
                              module.quizItems.map(
                                (
                                  item,
                                  quizIndex
                                ) => (
                                  <div
                                    className={
                                      styles.popupQuizCard
                                    }
                                    key={
                                      item.id
                                    }
                                  >
                                    <div
                                      className={
                                        styles.popupQuizCardTop
                                      }
                                    >
                                      <span
                                        className={
                                          styles.popupQuizCardTitle
                                        }
                                      >
                                        Item{' '}
                                        {
                                          quizIndex +
                                          1
                                        }
                                      </span>

                                      <button
                                        className={
                                          styles.popupRemoveBtn
                                        }
                                        type="button"
                                        onClick={() =>
                                          removeQuizItem(
                                            module.id,
                                            quizIndex
                                          )
                                        }
                                      >
                                        Remove
                                      </button>
                                    </div>

                                    <select
                                      className={
                                        styles.popupSelect
                                      }
                                      value={
                                        item.type
                                      }
                                      onChange={(
                                        event
                                      ) => {
                                        const type =
                                          event
                                            .target
                                            .value;

                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'type',
                                          type
                                        );

                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'options',
                                          type ===
                                            'true_false'
                                            ? [
                                                'True',
                                                'False',
                                              ]
                                            : [
                                                '',
                                                '',
                                                '',
                                                '',
                                              ]
                                        );

                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'correct_answer',
                                          ''
                                        );
                                      }}
                                    >
                                      <option value="multiple_choice">
                                        Multiple
                                        Choice
                                      </option>

                                      <option value="true_false">
                                        True or
                                        False
                                      </option>
                                    </select>

                                    <input
                                      className={
                                        styles.popupInput
                                      }
                                      value={
                                        item.question
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'question',
                                          limit(
                                            event
                                              .target
                                              .value,
                                            QUIZ_LIMIT
                                          )
                                        )
                                      }
                                      placeholder="Question"
                                    />

                                    <div
                                      className={
                                        styles.optionsGrid
                                      }
                                    >
                                      {item.options.map(
                                        (
                                          option,
                                          optionIndex
                                        ) => (
                                          <input
                                            className={
                                              styles.popupInput
                                            }
                                            key={
                                              optionIndex
                                            }
                                            value={
                                              option
                                            }
                                            disabled={
                                              item.type ===
                                              'true_false'
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              updateQuizOption(
                                                module.id,
                                                quizIndex,
                                                optionIndex,
                                                limit(
                                                  event
                                                    .target
                                                    .value,
                                                  QUIZ_LIMIT
                                                )
                                              )
                                            }
                                            placeholder={`Option ${
                                              optionIndex +
                                              1
                                            }`}
                                          />
                                        )
                                      )}
                                    </div>

                                    <select
                                      className={
                                        styles.popupSelect
                                      }
                                      value={
                                        item.correct_answer
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'correct_answer',
                                          event
                                            .target
                                            .value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select
                                        correct
                                        answer
                                      </option>

                                      {item.options.map(
                                        (
                                          option,
                                          optionIndex
                                        ) => (
                                          <option
                                            key={
                                              optionIndex
                                            }
                                            value={
                                              option
                                            }
                                            disabled={
                                              !option.trim()
                                            }
                                          >
                                            {option ||
                                              `Option ${
                                                optionIndex +
                                                1
                                              }`}
                                          </option>
                                        )
                                      )}
                                    </select>

                                    <textarea
                                      className={`${styles.popupTextarea} ${styles.popupAnswerBox}`}
                                      value={
                                        item.explanation
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        updateQuizItem(
                                          module.id,
                                          quizIndex,
                                          'explanation',
                                          limit(
                                            event
                                              .target
                                              .value,
                                            QUIZ_LIMIT
                                          )
                                        )
                                      }
                                      placeholder="Explanation"
                                    />
                                  </div>
                                )
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <div
          className={
            styles.popupActions
          }
        >
          <button
            className={
              styles.popupCancelBtn
            }
            type="button"
            onClick={() =>
              navigate(
                '/professor/courses'
              )
            }
            disabled={
              isSaving ||
              Boolean(
                processingModuleId
              ) ||
              Boolean(
                generatingQuizModuleId
              )
            }
          >
            Cancel
          </button>

          <button
            className={
              styles.popupSaveBtn
            }
            type="submit"
            disabled={
              isSaving ||
              Boolean(
                processingModuleId
              ) ||
              Boolean(
                generatingQuizModuleId
              )
            }
          >
            {isSaving
              ? 'Saving...'
              : 'Save Course'}
          </button>
        </div>
      </form>
    </section>
  );
}
