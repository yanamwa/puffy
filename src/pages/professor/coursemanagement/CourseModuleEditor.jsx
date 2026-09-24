import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import { API_BASE } from '../../../config.js';
import { fetchCourse } from '../../../services/courseApi.js';
import LoadingState from '../../../components/LoadingState.jsx';

import styles from './Addmodule.module.css';

const TITLE_LIMIT = 100;
const LONG_LIMIT = 750;
const LESSON_LIMIT = 6000;
const QUIZ_LIMIT = 500;
const COURSE_DRAFT_STORAGE_PREFIX = 'puffy-course-builder-draft';

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function limit(value, max) {
  return String(value || '').slice(0, max);
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

function parseList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readList(...values) {
  for (const value of values) {
    const parsed = parseList(value);

    if (parsed.length) {
      return parsed;
    }
  }

  return [];
}

function normalizeLessonPage(page) {
  return {
    id: page?.id || createId('page'),
    title: String(page?.title || ''),
    content: String(page?.content || page?.description || ''),
  };
}

function normalizeQuizItem(item) {
  const type = item?.type === 'true_false' ? 'true_false' : 'multiple_choice';
  let options = Array.isArray(item?.options)
    ? item.options.map((option) => String(option || ''))
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
    correct_answer: String(item?.correct_answer || item?.answer || ''),
    explanation: String(item?.explanation || ''),
  };
}

function normalizeContentModule(module, index = 0) {
  return {
    id: module?.id || module?.lesson_id || module?.module_id || createId('module'),
    title: String(module?.title || '').trim() || `Module ${index + 1}`,
    description: String(module?.description || module?.summary || ''),
    learningObjectives: String(
      module?.learningObjectives || module?.learning_objectives || ''
    ),
    lessonPages: readList(
      module?.lessonPages,
      module?.lesson_pages,
      module?.lessonContent,
      module?.lesson_content,
      module?.lesson_contents
    ).map(normalizeLessonPage),
    quizItems: readList(
      module?.quizItems,
      module?.quiz_items,
      module?.quizModule,
      module?.quiz_contents
    ).map(normalizeQuizItem),
  };
}

function normalizeCourse(course) {
  const nestedModules = Array.isArray(course?.contentModules)
    ? course.contentModules
    : Array.isArray(course?.content_modules)
      ? course.content_modules
      : Array.isArray(course?.learningModules)
        ? course.learningModules
        : Array.isArray(course?.learning_modules)
          ? course.learning_modules
          : [];

  return {
    ...course,
    title: String(course?.title || ''),
    code: String(course?.code || course?.courseCode || course?.course_code || ''),
    summary: String(course?.summary || ''),
    subject: String(course?.subject || ''),
    status: course?.status === 'published' ? 'published' : 'draft',
    visibility: course?.visibility === 'public' ? 'public' : 'private',
    contentModules: nestedModules.map(normalizeContentModule),
  };
}

function getCourseDraftStorageKey(courseId) {
  return `${COURSE_DRAFT_STORAGE_PREFIX}:${courseId || 'new'}`;
}

function readCourseBuilderDraft(courseId) {
  try {
    return JSON.parse(
      sessionStorage.getItem(getCourseDraftStorageKey(courseId)) || 'null'
    );
  } catch {
    return null;
  }
}

function writeCourseBuilderDraft(courseId, draft) {
  try {
    sessionStorage.setItem(getCourseDraftStorageKey(courseId), JSON.stringify(draft));
  } catch {
    // Session storage can fail in private windows. Navigation state still carries the draft.
  }
}

export default function CourseModuleEditor() {
  const { id, moduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courseDraft, setCourseDraft] = useState(null);
  const [moduleDraft, setModuleDraft] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);

  const builderPath = id ? `/professor/courses/edit/${id}` : '/professor/courses/new';

  useEffect(() => {
    let active = true;

    async function loadDraft() {
      try {
        setLoading(true);

        let draft = location.state?.courseDraft || readCourseBuilderDraft(id);

        if (!draft && id) {
          const course = await fetchCourse(id);
          draft = normalizeCourse(course);
        }

        if (!draft) {
          throw new Error('Open a course first before editing its module.');
        }

        const normalizedCourse = normalizeCourse(draft);
        const selectedModule = normalizedCourse.contentModules.find(
          (module) => String(module.id) === String(moduleId)
        );

        if (!selectedModule) {
          throw new Error('This module could not be found.');
        }

        if (!active) {
          return;
        }

        setCourseDraft(normalizedCourse);
        setModuleDraft(selectedModule);
        writeCourseBuilderDraft(id, normalizedCourse);
      } catch (error) {
        if (!active) {
          return;
        }

        await Swal.fire({
          icon: 'error',
          title: 'Unable to Open Module',
          text: error.message || 'Could not open this module.',
          confirmButtonText: 'OK',
        });

        navigate(builderPath, { replace: true });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDraft();

    return () => {
      active = false;
    };
  }, [builderPath, id, location.state, moduleId, navigate]);

  const activePage = moduleDraft?.lessonPages?.[activePageIndex] || null;
  const activeQuiz = moduleDraft?.quizItems?.[activeQuizIndex] || null;

  const lessonCount = moduleDraft?.lessonPages?.length || 0;
  const quizCount = moduleDraft?.quizItems?.length || 0;

  const canMovePrevious = useMemo(
    () => activePageIndex > 0,
    [activePageIndex]
  );

  const canMoveNext = useMemo(
    () => activePageIndex < lessonCount - 1,
    [activePageIndex, lessonCount]
  );

  const updateModuleField = (field, value) => {
    setModuleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateLessonPage = (pageIndex, field, value) => {
    setModuleDraft((current) => ({
      ...current,
      lessonPages: current.lessonPages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              [field]: value,
            }
          : page
      ),
    }));
  };

  const addLessonPage = () => {
    setModuleDraft((current) => {
      const lessonPages = [...current.lessonPages, createEmptyLessonPage()];
      setActivePageIndex(lessonPages.length - 1);

      return {
        ...current,
        lessonPages,
      };
    });
  };

  const updateQuizItem = (quizIndex, field, value) => {
    setModuleDraft((current) => ({
      ...current,
      quizItems: current.quizItems.map((item, index) =>
        index === quizIndex
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const updateQuizOption = (quizIndex, optionIndex, value) => {
    setModuleDraft((current) => ({
      ...current,
      quizItems: current.quizItems.map((item, index) => {
        if (index !== quizIndex) {
          return item;
        }

        const oldOption = item.options[optionIndex];
        const options = item.options.map((option, currentOptionIndex) =>
          currentOptionIndex === optionIndex ? value : option
        );

        return {
          ...item,
          options,
          correct_answer:
            item.correct_answer === oldOption ? value : item.correct_answer,
        };
      }),
    }));
  };

  const addQuizItem = () => {
    setModuleDraft((current) => {
      const quizItems = [...current.quizItems, createEmptyQuizItem()];
      setActiveQuizIndex(quizItems.length - 1);

      return {
        ...current,
        quizItems,
      };
    });
  };

  const handleGenerateModule = async () => {
    if (!uploadedFile) {
      await Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please choose a PDF, DOCX, or TXT lesson file first.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      setProcessingFile(true);

      const response = await fetch(`${API_BASE}/lessons/process-file`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not process the uploaded lesson file.'
        );
      }

      const generatedPages = Array.isArray(data.lesson_pages)
        ? data.lesson_pages
            .map((page) => ({
              id: createId('page'),
              title: limit(page?.title || '', TITLE_LIMIT),
              content: limit(page?.content || '', LESSON_LIMIT),
            }))
            .filter((page) => page.title || page.content)
        : [];

      if (generatedPages.length === 0) {
        throw new Error(
          data.message ||
            'The file uploaded, but no lesson pages were created. Try a searchable PDF, DOCX, or TXT file.'
        );
      }

      setCourseDraft((current) => ({
        ...current,
        subject: limit(data.subject || current.subject, TITLE_LIMIT),
      }));

      setModuleDraft((current) => ({
        ...current,
        title: limit(data.module_title || current.title, TITLE_LIMIT),
        description: limit(data.description || current.description, LONG_LIMIT),
        learningObjectives: limit(
          data.learning_objectives || current.learningObjectives,
          LONG_LIMIT
        ),
        lessonPages: generatedPages,
      }));

      setActivePageIndex(0);

      await Swal.fire({
        icon: 'success',
        title: 'Module Generated',
        text: 'The material was organized into lesson pages.',
        confirmButtonText: 'Continue',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        text: error.message || 'Could not process the lesson file.',
        confirmButtonText: 'OK',
      });
    } finally {
      setProcessingFile(false);
    }
  };

  const buildUpdatedCourse = () => ({
    ...courseDraft,
    contentModules: courseDraft.contentModules.map((module) =>
      String(module.id) === String(moduleId) ? moduleDraft : module
    ),
  });

  const saveModule = async () => {
    if (!moduleDraft.title.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Module Title Required',
        text: 'Please enter a module title.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const updatedCourse = buildUpdatedCourse();
    writeCourseBuilderDraft(id, updatedCourse);

    await Swal.fire({
      icon: 'success',
      title: 'Module Saved',
      text: 'Your module changes were added back to the course.',
      confirmButtonText: 'Done',
    });

    navigate(builderPath, {
      state: {
        courseDraft: updatedCourse,
      },
    });
  };

  const cancelEdit = () => {
    if (courseDraft) {
      writeCourseBuilderDraft(id, courseDraft);
    }

    navigate(builderPath, {
      state: {
        courseDraft,
      },
    });
  };

  if (loading || !moduleDraft) {
    return (
      <div className={`${styles.addModulePage} ${styles.courseModuleEditorPage}`}>
        <main className={styles.moduleEditorLoading}>
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.addModulePage} ${styles.courseModuleEditorPage}`}>
      <div className={styles.pageHeader}>
        <h1>Edit Module</h1>
        <p className={styles.pageHeaderText}>
          Build the course using modules. Each module can contain lesson pages and its own quiz.
        </p>
      </div>

      <main className={styles.moduleEditorForm}>
        <section className={styles.moduleMaterialBand}>
          <h2>Generate Module from Material</h2>
          <p>
            Upload your learning material and PuffyBrain will organize the content into lesson pages automatically.
          </p>

          <label className={styles.customFileBtn}>
            Upload File Here
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              disabled={processingFile}
              onChange={(event) => setUploadedFile(event.target.files?.[0] || null)}
            />
          </label>

          <span className={styles.fileName}>
            {uploadedFile ? uploadedFile.name : 'No file chosen'}
          </span>

          <button
            className={styles.popupAddBtn}
            type="button"
            onClick={handleGenerateModule}
            disabled={processingFile || !uploadedFile}
          >
            {processingFile ? 'Generating...' : 'Generate Module'}
          </button>
        </section>

        <section className={styles.moduleEditorDetails}>
          <div className={styles.popupField}>
            <label className={styles.popupLabel}>
              Module Title <span className={styles.required}>*required</span>
            </label>
            <input
              className={styles.popupInput}
              value={moduleDraft.title}
              onChange={(event) =>
                updateModuleField('title', limit(event.target.value, TITLE_LIMIT))
              }
              placeholder="Enter module title"
            />
          </div>

          <div className={styles.popupField}>
            <label className={styles.popupLabel}>
              Module Description <span className={styles.required}>*required</span>
            </label>
            <input
              className={styles.popupInput}
              value={moduleDraft.description}
              onChange={(event) =>
                updateModuleField('description', limit(event.target.value, LONG_LIMIT))
              }
              placeholder="Enter module description"
            />
          </div>

          <div className={`${styles.popupField} ${styles.moduleEditorObjectives}`}>
            <label className={styles.popupLabel}>
              Learning Objectives <span className={styles.required}>*required</span>
            </label>
            <textarea
              className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
              value={moduleDraft.learningObjectives}
              onChange={(event) =>
                updateModuleField(
                  'learningObjectives',
                  limit(event.target.value, LONG_LIMIT)
                )
              }
              placeholder="Enter learning objectives"
            />
          </div>
        </section>

        <section className={styles.moduleEditorBand}>
          <div className={styles.moduleEditorBandHeader}>
            <div>
              <h2>Lesson Pages</h2>
              <p>Pages belonging only to this module.</p>
            </div>

            <button className={styles.popupAddBtn} type="button" onClick={addLessonPage}>
              + Add Page
            </button>
          </div>

          <div className={styles.moduleEditorWorkspace}>
            <div className={styles.lessonPageTabs}>
              {lessonCount === 0 ? (
                <span className={styles.moduleEditorEmptyTab}>No pages</span>
              ) : (
                moduleDraft.lessonPages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    className={`${styles.lessonPageTab} ${
                      index === activePageIndex ? styles.lessonPageTabActive : ''
                    }`}
                    onClick={() => setActivePageIndex(index)}
                  >
                    Page {index + 1}
                  </button>
                ))
              )}
            </div>

            <div className={styles.popupQuizCard}>
              {activePage ? (
                <>
                  <label className={styles.popupLabel}>
                    Page Title <span className={styles.required}>*required</span>
                  </label>
                  <input
                    className={styles.popupInput}
                    value={activePage.title}
                    onChange={(event) =>
                      updateLessonPage(
                        activePageIndex,
                        'title',
                        limit(event.target.value, TITLE_LIMIT)
                      )
                    }
                    placeholder="Enter page title"
                  />

                  <div className={styles.lessonContentHeading}>
                    <label className={styles.popupLabel}>
                      Content <span className={styles.required}>*required</span>
                    </label>
                    <button className={styles.uploadMediaBtn} type="button">
                      Upload Photo/Video
                    </button>
                  </div>

                  <textarea
                    className={`${styles.popupTextarea} ${styles.popupLargeBox}`}
                    value={activePage.content}
                    onChange={(event) =>
                      updateLessonPage(
                        activePageIndex,
                        'content',
                        limit(event.target.value, LESSON_LIMIT)
                      )
                    }
                    placeholder="Enter page content"
                  />

                  <div className={styles.lessonPageNavigation}>
                    <button
                      className={styles.lessonNavigationBtn}
                      type="button"
                      onClick={() => setActivePageIndex((current) => Math.max(0, current - 1))}
                      disabled={!canMovePrevious}
                    >
                      Previous
                    </button>

                    <span className={styles.lessonPageIndicator}>
                      page {activePageIndex + 1} of {lessonCount}
                    </span>

                    <button
                      className={styles.lessonNavigationBtn}
                      type="button"
                      onClick={() =>
                        setActivePageIndex((current) =>
                          Math.min(lessonCount - 1, current + 1)
                        )
                      }
                      disabled={!canMoveNext}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.popupEmptyQuiz}>Add a lesson page to begin.</div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.moduleEditorBand}>
          <div className={styles.moduleEditorBandHeader}>
            <div>
              <h2>Module Quiz</h2>
              <p>Quiz items belonging only to this module.</p>
            </div>

            <button className={styles.popupAddBtn} type="button" onClick={addQuizItem}>
              + Add Quiz
            </button>
          </div>

          <div className={styles.moduleEditorWorkspace}>
            <div className={styles.lessonPageTabs}>
              {quizCount === 0 ? (
                <span className={styles.moduleEditorEmptyTab}>No quiz</span>
              ) : (
                moduleDraft.quizItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.lessonPageTab} ${
                      index === activeQuizIndex ? styles.lessonPageTabActive : ''
                    }`}
                    onClick={() => setActiveQuizIndex(index)}
                  >
                    Question {index + 1}
                  </button>
                ))
              )}
            </div>

            <div className={styles.popupQuizCard}>
              {activeQuiz ? (
                <>
                  <label className={styles.popupLabel}>
                    Question <span className={styles.required}>*required</span>
                  </label>
                  <input
                    className={styles.popupInput}
                    value={activeQuiz.question}
                    onChange={(event) =>
                      updateQuizItem(
                        activeQuizIndex,
                        'question',
                        limit(event.target.value, QUIZ_LIMIT)
                      )
                    }
                    placeholder="Enter question"
                  />

                  <select
                    className={styles.popupSelect}
                    value={activeQuiz.type}
                    onChange={(event) => {
                      const type = event.target.value;
                      updateQuizItem(activeQuizIndex, 'type', type);
                      updateQuizItem(
                        activeQuizIndex,
                        'options',
                        type === 'true_false' ? ['True', 'False'] : ['', '', '', '']
                      );
                      updateQuizItem(activeQuizIndex, 'correct_answer', '');
                    }}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True or False</option>
                  </select>

                  <div className={styles.optionsGrid}>
                    {activeQuiz.options.map((option, optionIndex) => (
                      <input
                        key={optionIndex}
                        className={styles.popupInput}
                        value={option}
                        disabled={activeQuiz.type === 'true_false'}
                        onChange={(event) =>
                          updateQuizOption(
                            activeQuizIndex,
                            optionIndex,
                            limit(event.target.value, QUIZ_LIMIT)
                          )
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    ))}
                  </div>

                  <select
                    className={styles.popupSelect}
                    value={activeQuiz.correct_answer}
                    onChange={(event) =>
                      updateQuizItem(activeQuizIndex, 'correct_answer', event.target.value)
                    }
                  >
                    <option value="">Select correct answer</option>
                    {activeQuiz.options.map((option, optionIndex) => (
                      <option
                        key={optionIndex}
                        value={option}
                        disabled={!String(option || '').trim()}
                      >
                        {option || `Option ${optionIndex + 1}`}
                      </option>
                    ))}
                  </select>

                  <textarea
                    className={`${styles.popupTextarea} ${styles.popupAnswerBox}`}
                    value={activeQuiz.explanation}
                    onChange={(event) =>
                      updateQuizItem(
                        activeQuizIndex,
                        'explanation',
                        limit(event.target.value, QUIZ_LIMIT)
                      )
                    }
                    placeholder="Explanation"
                  />
                </>
              ) : (
                <div className={styles.popupEmptyQuiz}>Add a quiz item to begin.</div>
              )}
            </div>
          </div>
        </section>

        <div className={styles.moduleEditorActions}>
          <button className={styles.popupCancelBtn} type="button" onClick={cancelEdit}>
            Back
          </button>
          <button className={styles.popupSaveBtn} type="button" onClick={saveModule}>
            Save Module
          </button>
        </div>
      </main>
    </div>
  );
}
