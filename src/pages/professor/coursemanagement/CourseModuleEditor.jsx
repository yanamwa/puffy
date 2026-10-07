import QuizSourceEvidence from '../../../components/quizmodes/QuizSourceEvidence.jsx';
import { lessonAuthHeaders } from '../../../services/lessonAuth.js';
import { requestQuizSettings, quizSourceFields, quizGenerationFields, notifyQuizGenerated } from '../../../services/quizGenerationUi.js';
import { notifyLessonGenerated } from '../../../services/lessonNotifications.js';
﻿import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import { API_BASE } from '../../../config.js';
import { fetchCourse, saveCourse } from '../../../services/courseApi.js';
import { uploadLessonSource } from '../../../services/lessonRagApi.js';
import LessonFilePicker from '../../../components/lesson/LessonFilePicker.jsx';
import LessonSourceEvidence from '../../../components/lesson/LessonSourceEvidence.jsx';
import LessonSourceManager from '../../../components/lesson/LessonSourceManager.jsx';
import LoadingState from '../../../components/LoadingState.jsx';

import styles from './Addmodule.module.css';

const TITLE_LIMIT = 100;
const LONG_LIMIT = 750;
const LESSON_LIMIT = 6000;
const QUIZ_LIMIT = 500;
const LESSON_TAB_PAGE_SIZE = 10;
const QUIZ_TAB_PAGE_SIZE = 10;
const COURSE_DRAFT_STORAGE_PREFIX = 'puffy-course-builder-draft';
const MAIN_QUIZ_SETTINGS_STORAGE_KEY = 'puffy-main-quiz-settings';

function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function limit(value, max) {
  return String(value || '').slice(0, max);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected media file.'));
    reader.readAsDataURL(file);
  });
}

function createEmptyLessonPage() {
  return {
    id: createId('page'),
    title: '',
    content: '',
    media: null,
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
    ...page,
    id: page?.id || createId('page'),
    title: String(page?.title || ''),
    content: String(page?.content || page?.description || ''),
    media: page?.media || null,
    mediaUrl: page?.mediaUrl || page?.media_url || '',
    mediaName: page?.mediaName || page?.media_name || '',
    mediaType: page?.mediaType || page?.media_type || '',
  };
}

function getLessonPageMedia(page) {
  const media = page?.media || {};
  const url = media.url || page?.mediaUrl || page?.media_url || '';

  if (!url) {
    return null;
  }

  return {
    url,
    name: media.name || page?.mediaName || page?.media_name || 'Uploaded media',
    type: media.type || page?.mediaType || page?.media_type || '',
  };
}

function normalizeQuizItem(item) {
  const type = ['multiple_choice', 'identification', 'true_false'].includes(item?.type) ? item.type : 'multiple_choice';
  let options = Array.isArray(item?.options)
    ? item.options.map((option) => String(option || ''))
    : [];

  if (type === 'identification') {
    options = [];
  } else if (type === 'true_false') {
    options = ['True', 'False'];
  } else {
    options = options.slice(0, 4);

    while (options.length < 4) {
      options.push('');
    }
  }

  return {
    ...item,
    id: item?.id || createId('quiz'),
    type,
    question: String(item?.question || ''),
    options,
    correct_answer: String(item?.correct_answer || item?.answer || ''),
    explanation: String(item?.explanation || ''),
  };
}

function parseSettingsObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function normalizeDateTimeLocal(value) {
  const text = String(value || '').trim();

  if (!text) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    return text.slice(0, 16);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function normalizeMainQuizSettings(module = {}) {
  const settings = parseSettingsObject(
    module?.mainQuizSettings || module?.main_quiz_settings
  );
  const enabled = normalizeBoolean(
    settings.enabled ??
      settings.isEnabled ??
      module?.mainQuizEnabled ??
      module?.main_quiz_enabled,
    true
  );
  const unlockAt = normalizeDateTimeLocal(
    settings.unlockAt ||
      settings.unlock_at ||
      module?.mainQuizUnlockAt ||
      module?.main_quiz_unlock_at
  );

  const lockAt = normalizeDateTimeLocal(
    settings.lockAt || settings.lock_at || module?.mainQuizLockAt || module?.main_quiz_lock_at
  );

  return {
    enabled,
    unlockAt,
    lockAt,
  };
}

function formatDateTimeLabel(value) {
  const normalized = normalizeDateTimeLocal(value);

  if (!normalized) {
    return '';
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function normalizeAssessmentRoute(value = '') {
  const assessment = String(value || '').toLowerCase();

  if (assessment === 'main' || assessment === 'main-quiz') {
    return 'main';
  }

  if (assessment === 'practice' || assessment === 'practice-quiz') {
    return 'practice';
  }

  return '';
}

function getAssessmentRouteSegment(assessment) {
  return assessment === 'main' ? 'main-quiz' : 'practice-quiz';
}

function getAssessmentLabel(assessment) {
  return assessment === 'main' ? 'Main Quiz' : 'Practice Quiz';
}

function normalizeContentModule(module, index = 0) {
  const mainQuizSettings = normalizeMainQuizSettings(module);

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
    mainQuizSettings,
    mainQuizEnabled: mainQuizSettings.enabled,
    main_quiz_enabled: mainQuizSettings.enabled,
    mainQuizUnlockAt: mainQuizSettings.unlockAt,
    main_quiz_unlock_at: mainQuizSettings.unlockAt,
    mainQuizLockAt: mainQuizSettings.lockAt,
    main_quiz_lock_at: mainQuizSettings.lockAt,
  };
}

function readMainQuizSettingsMap() {
  const mergedSettings = {};

  [sessionStorage, localStorage].forEach((storage) => {
    try {
      const saved = storage.getItem(MAIN_QUIZ_SETTINGS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(mergedSettings, parsed);
      }
    } catch {
      // Ignore malformed storage and keep the editor usable.
    }
  });

  return mergedSettings;
}

function writeMainQuizSettingsMap(settingsMap) {
  [localStorage, sessionStorage].forEach((storage) => {
    try {
      storage.setItem(MAIN_QUIZ_SETTINGS_STORAGE_KEY, JSON.stringify(settingsMap));
    } catch {
      // Storage can fail in private windows. The in-memory draft still updates.
    }
  });
}

function getPagerPages(totalItems, pageSize) {
  const pageCount = Math.ceil(totalItems / pageSize);

  return Array.from({ length: pageCount }, (_, index) => index);
}

function clampPageStart(pageIndex, totalItems, pageSize) {
  if (!totalItems) {
    return 0;
  }

  return Math.min(totalItems - 1, Math.max(0, pageIndex * pageSize));
}

function getCourseSettingKeys(course = {}, routeId = '') {
  const keys = [
    routeId,
    course?.id,
    course?.course_id,
    course?.code,
    course?.courseCode,
    course?.course_code,
    course?.title,
    course?.courseTitle,
    course?.course_title,
    course?.courseName,
    course?.course_name,
    course?.subject,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return [...new Set(keys.flatMap((key) => [key, key.toLowerCase()]))];
}

function getModuleSettingKeys(module = {}, moduleIndex = 0) {
  const keys = [
    module?.id,
    module?.module_id,
    module?.moduleId,
    module?.lesson_id,
    module?.title,
    String(moduleIndex),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return [...new Set(keys.flatMap((key) => [key, key.toLowerCase()]))];
}

function writeMainQuizSettingsOverride(course, module, settings, routeId, moduleIndex) {
  const settingsMap = readMainQuizSettingsMap();
  const courseKeys = getCourseSettingKeys(course, routeId);
  const moduleKeys = getModuleSettingKeys(module, moduleIndex);

  courseKeys.forEach((courseKey) => {
    moduleKeys.forEach((moduleKey) => {
      settingsMap[`${courseKey}::${moduleKey}`] = settings;
    });
  });

  writeMainQuizSettingsMap(settingsMap);
  window.dispatchEvent(new CustomEvent('puffy-main-quiz-settings-updated'));
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
  const { id, moduleId, assessmentType } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routeAssessment = normalizeAssessmentRoute(assessmentType);

  const mainQuizSettingsDialog = useRef(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseDraft, setCourseDraft] = useState(null);
  const [moduleDraft, setModuleDraft] = useState(null);
  const [uploadedFile, setUploadedFile] = useState([]);
  const [generationProgress, setGenerationProgress] = useState('');
  const [processingFile, setProcessingFile] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedPageTitles, setGeneratedPageTitles] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [activeAssessment, setActiveAssessment] = useState(routeAssessment);

  const builderPath = id ? `/professor/courses/edit/${id}` : '/professor/courses/new';
  const moduleEditorPath = `${builderPath}/modules/${moduleId}/edit`;
  const isAssessmentPage = Boolean(routeAssessment);

  useEffect(() => {
    setActiveAssessment(routeAssessment);
    setActiveQuizIndex(0);
  }, [routeAssessment]);

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
  const activePageMedia = getLessonPageMedia(activePage);

  const lessonCount = moduleDraft?.lessonPages?.length || 0;
  const quizCount = moduleDraft?.quizItems?.length || 0;
  const activeLessonTabPageIndex = Math.floor(
    activePageIndex / LESSON_TAB_PAGE_SIZE
  );
  const activeLessonTabPageStart =
    activeLessonTabPageIndex * LESSON_TAB_PAGE_SIZE;
  const activeLessonTabPageEnd = Math.min(
    activeLessonTabPageStart + LESSON_TAB_PAGE_SIZE,
    lessonCount
  );
  const visibleLessonPages =
    moduleDraft?.lessonPages?.slice(
      activeLessonTabPageStart,
      activeLessonTabPageEnd
    ) || [];
  const lessonTabPages = getPagerPages(lessonCount, LESSON_TAB_PAGE_SIZE);
  const activeQuizPageIndex = Math.floor(activeQuizIndex / QUIZ_TAB_PAGE_SIZE);
  const activeQuizPageStart = activeQuizPageIndex * QUIZ_TAB_PAGE_SIZE;
  const activeQuizPageEnd = Math.min(
    activeQuizPageStart + QUIZ_TAB_PAGE_SIZE,
    quizCount
  );
  const visibleQuizItems =
    moduleDraft?.quizItems?.slice(activeQuizPageStart, activeQuizPageEnd) || [];
  const mainQuizSettings = normalizeMainQuizSettings(moduleDraft || {});
  const mainQuizUnlockLabel = formatDateTimeLabel(mainQuizSettings.unlockAt);

  const canMovePrevious = useMemo(
    () => activePageIndex > 0,
    [activePageIndex]
  );

  const canMoveNext = useMemo(
    () => activePageIndex < lessonCount - 1,
    [activePageIndex, lessonCount]
  );

  const canShowPreviousQuizPage = activeQuizPageStart > 0;
  const canShowNextQuizPage = activeQuizPageEnd < quizCount;

  const goToLessonTabPage = (pageIndex) => {
    setActivePageIndex(
      clampPageStart(pageIndex, lessonCount, LESSON_TAB_PAGE_SIZE)
    );
  };

  const goToPreviousQuizPage = () => {
    setActiveQuizIndex(Math.max(0, activeQuizPageStart - QUIZ_TAB_PAGE_SIZE));
  };

  const goToNextQuizPage = () => {
    setActiveQuizIndex(Math.min(quizCount - 1, activeQuizPageEnd));
  };

  const updateModuleField = (field, value) => {
    setModuleDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateMainQuizSettings = async (field, value) => {
    if (!moduleDraft || !courseDraft) {
      return;
    }

    const nextSettings = {
      ...normalizeMainQuizSettings(moduleDraft),
      [field]: value,
    };
    if (nextSettings.unlockAt && nextSettings.lockAt &&
        new Date(nextSettings.lockAt).getTime() <= new Date(nextSettings.unlockAt).getTime()) {
      await Swal.fire({ icon: 'error', title: 'Invalid quiz dates',
        text: 'The lock date must be after the unlock date.' });
      return;
    }
    const nextModule = {
      ...moduleDraft,
      mainQuizSettings: nextSettings,
      main_quiz_settings: nextSettings,
      mainQuizEnabled: nextSettings.enabled,
      main_quiz_enabled: nextSettings.enabled,
      mainQuizUnlockAt: nextSettings.unlockAt,
      main_quiz_unlock_at: nextSettings.unlockAt,
      mainQuizLockAt: nextSettings.lockAt,
      main_quiz_lock_at: nextSettings.lockAt,
    };
    const moduleIndex = courseDraft.contentModules.findIndex(
      (module) => String(module.id) === String(moduleId)
    );
    const nextCourse = {
      ...courseDraft,
      contentModules: courseDraft.contentModules.map((module) =>
        String(module.id) === String(moduleId) ? nextModule : module
      ),
    };

    setModuleDraft(nextModule);
    setCourseDraft(nextCourse);
    writeCourseBuilderDraft(id, nextCourse);
    writeMainQuizSettingsOverride(
      nextCourse,
      nextModule,
      nextSettings,
      id,
      moduleIndex >= 0 ? moduleIndex : 0
    );
    if (id) {
      try {
        await saveCourse(nextCourse);
      } catch (error) {
        await Swal.fire({ icon: 'error', title: 'Quiz settings not saved',
          text: error.message || 'Could not save quiz access. Please try again.' });
      }
    }
  };

  const updateLessonPage = (pageIndex, field, value) => {
    setModuleDraft((current) => ({
      ...current,
      lessonPages: current.lessonPages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              [field]: value,
              ...(field === 'content' || field === 'title' ? { grounding: { ...page.grounding, model_review_passed: false, human_review_required: true } } : {}),
            }
          : page
      ),
    }));
  };

  const handlePageMediaSelected = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      await Swal.fire({
        icon: 'warning',
        title: 'Unsupported File',
        text: 'Please choose an image or video file.',
        confirmButtonText: 'OK',
      });

      return;
    }

    let url = '';

    try {
      url = await readFileAsDataUrl(file);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Could not read the selected media file.',
        confirmButtonText: 'OK',
      });

      return;
    }

    setModuleDraft((current) => ({
      ...current,
      lessonPages: current.lessonPages.map((page, index) =>
        index === activePageIndex
          ? {
              ...page,
              media: {
                name: file.name,
                type: file.type,
                url,
              },
              mediaUrl: url,
              mediaName: file.name,
              mediaType: file.type,
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

  const removeActiveLessonPage = async () => {
    if (!activePage) {
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Remove Page?',
      text: 'This lesson page will be removed from the module.',
      showCancelButton: true,
      confirmButtonText: 'Remove Page',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d93025',
      cancelButtonColor: '#858d9b',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setModuleDraft((current) => {
      const lessonPages = current.lessonPages.filter(
        (_, index) => index !== activePageIndex
      );

      setActivePageIndex(
        lessonPages.length
          ? Math.min(activePageIndex, lessonPages.length - 1)
          : 0
      );

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
      setActiveAssessment((currentAssessment) => currentAssessment || 'practice');

      return {
        ...current,
        quizItems,
      };
    });
  };

  const removeActiveQuizItem = async () => {
    if (!activeQuiz) {
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Remove Question?',
      text: 'This quiz question will be removed from the module.',
      showCancelButton: true,
      confirmButtonText: 'Remove Question',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d93025',
      cancelButtonColor: '#858d9b',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setModuleDraft((current) => {
      const quizItems = current.quizItems.filter(
        (_, index) => index !== activeQuizIndex
      );

      setActiveQuizIndex(
        quizItems.length
          ? Math.min(activeQuizIndex, quizItems.length - 1)
          : 0
      );

      return {
        ...current,
        quizItems,
      };
    });
  };

  const autoGenerateQuiz = async () => {
    if (!moduleDraft) {
      return;
    }

    const lessonContent = moduleDraft.lessonPages
      .map((page) =>
        [
          String(page.title || '').trim(),
          String(page.content || '').trim(),
        ]
          .filter(Boolean)
          .join('\n')
      )
      .filter(Boolean)
      .join('\n\n');

    if (!lessonContent && !moduleDraft.learningObjectives.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Module Content Required',
        text: 'Add learning objectives or lesson pages to this module first.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const result = await requestQuizSettings({ assessment: activeAssessment || 'practice' });


    if (!result.isConfirmed || !result.value) {
      return;
    }

    try {
      setGeneratingQuiz(true);

      Swal.fire({
        title: 'Generating Quiz',
        text: 'Retrieving source passages and checking the questions and answers.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`${API_BASE}/lessons/generate-quiz`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...lessonAuthHeaders(),
        },
        body: JSON.stringify({
          ...quizSourceFields(id, moduleId, moduleDraft.lessonPages),
          lesson_title: moduleDraft.title,
          lesson_content: lessonContent,
          learning_objectives: moduleDraft.learningObjectives,
          ...quizGenerationFields(result.value),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not generate the quiz.');
      }

      const generatedQuestions = Array.isArray(data.quiz?.questions)
        ? data.quiz.questions.map(normalizeQuizItem).filter((item) => item.question)
        : [];

      if (generatedQuestions.length === 0) {
        throw new Error('No valid quiz questions were generated.');
      }

      setModuleDraft((current) => ({
        ...current,
        quizItems: generatedQuestions,
      }));
      setActiveQuizIndex(0);
      setActiveAssessment((currentAssessment) => currentAssessment || 'practice');

      notifyQuizGenerated(generatedQuestions.length);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Quiz Generation Failed',
        text: error.message || 'Could not generate the quiz.',
        confirmButtonText: 'OK',
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const openAssessmentEditor = (assessment) => {
    const nextAssessment = normalizeAssessmentRoute(assessment);

    if (!nextAssessment) {
      return;
    }

    const updatedCourse = courseDraft && moduleDraft
      ? buildUpdatedCourse()
      : courseDraft;

    if (updatedCourse) {
      writeCourseBuilderDraft(id, updatedCourse);
    }

    setActiveAssessment(nextAssessment);

    if (quizCount === 0) {
      setActiveQuizIndex(0);
    }

    navigate(
      `${builderPath}/modules/${moduleId}/${getAssessmentRouteSegment(
        nextAssessment
      )}/edit`,
      {
        state: {
          courseDraft: updatedCourse,
        },
      }
    );
  };

  const returnToAssessments = () => {
    const updatedCourse = courseDraft && moduleDraft
      ? buildUpdatedCourse()
      : courseDraft;

    if (updatedCourse) {
      writeCourseBuilderDraft(id, updatedCourse);
    }

    setActiveAssessment('');

    navigate(moduleEditorPath, {
      state: {
        courseDraft: updatedCourse,
      },
    });
  };

  const handleGenerateModule = async () => {
    if (!uploadedFile.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please choose PDF, PPT, PPTX, DOCX, or TXT lesson files first.',
        confirmButtonText: 'OK',
      });

      return;
    }

    const formData = new FormData();
    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      await Swal.fire('Save the course first', 'Save this course before indexing source materials.', 'info');
      return;
    }
    formData.append('course_id', id);
    formData.append('client_module_key', moduleId);
    if (Number.isInteger(Number(moduleId)) && Number(moduleId) > 0) formData.append('lesson_id', moduleId);
    uploadedFile.forEach(file => formData.append('files', file));

    try {
      setProcessingFile(true);
      setGeneratedPageTitles([]);

      const data = await uploadLessonSource(formData, job => setGenerationProgress(`${job.progress}% — ${job.phase}`));

      if (!data.success) {
        throw new Error(
          data.message || 'Could not process the uploaded lesson file.'
        );
      }

      const generatedPages = Array.isArray(data.lesson_pages)
        ? data.lesson_pages
            .map((page) => ({
              ...page,
              id: createId('page'),
              title: limit(page?.title || '', TITLE_LIMIT),
              content: limit(page?.content || '', LESSON_LIMIT),
            }))
            .filter((page) => page.title || page.content)
        : [];

      if (generatedPages.length === 0) {
        throw new Error(
          data.message ||
            'The materials uploaded, but no lesson pages were created. Use files containing selectable text.'
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
      setGeneratedPageTitles(
        generatedPages.map((page, index) => page.title || `Page ${index + 1}`)
      );

      notifyLessonGenerated(generatedPages.length);
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

    if (id) {
      try {
        await saveCourse(updatedCourse);
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text:
            error?.message ||
            'Could not save the module changes to the course.',
          confirmButtonText: 'OK',
        });

        return;
      }
    }

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
      <div className={`${styles.addModulePage} ${styles.courseModuleEditorPage} course-module-editor-page`}>
        <main className={styles.moduleEditorLoading}>
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.addModulePage} ${styles.courseModuleEditorPage} ${isAssessmentPage ? styles.assessmentPage : ''} course-module-editor-page`}>
      {isAssessmentPage && <div className={styles.assessmentBreadcrumb}><button type="button" onClick={returnToAssessments}>← Go back lesson</button></div>}
      <div className={styles.pageHeader}>
        <h1>
          {isAssessmentPage
            ? `${getAssessmentLabel(activeAssessment)} Editor`
            : 'Edit Module'}
        </h1>
        <p className={styles.pageHeaderText}>
          {isAssessmentPage
            ? `Edit the ${getAssessmentLabel(
                activeAssessment
              ).toLowerCase()} for this module on its own page.`
            : 'Build the course using modules. Each module can contain lesson pages and its own quiz.'}
        </p>
        {activeAssessment === 'main' && <button className={styles.assessmentSettingsButton} type="button" onClick={() => mainQuizSettingsDialog.current?.showModal()}>Main Quiz Settings</button>}
        {!isAssessmentPage && <button className={styles.assessmentSettingsButton} type="button" onClick={() => setGeneratorOpen(true)}>Generate Module</button>}
      </div>

      <main className={styles.moduleEditorForm}>
        {!isAssessmentPage && (
          <>
        {generatorOpen && <div className={styles.generatorOverlay}
          onClick={(event) => { if (event.target === event.currentTarget) setGeneratorOpen(false); }}
          onKeyDown={(event) => { if (event.key === 'Escape') setGeneratorOpen(false); }}>
        <div role="dialog" aria-modal="true" className={styles.generateModuleDialog} aria-labelledby="generate-module-title">
        <section className={styles.moduleMaterialBand}>
          <button type="button" className={styles.settingsDialogClose} aria-label="Close module generator" autoFocus onClick={() => setGeneratorOpen(false)}>×</button>
          <h2 id="generate-module-title">Generate Module from Material</h2>
          <p>
            Upload your learning material and PuffyBrain will organize the content into lesson pages automatically.
          </p>

          <div className={styles.generatorFilePicker}>
          <LessonFilePicker files={uploadedFile} disabled={processingFile} buttonClassName={styles.customFileBtn}
            onChange={files => { setUploadedFile(files); setGeneratedPageTitles([]); }} />
          </div>

          <button
            className={styles.popupAddBtn}
            type="button"
            onClick={handleGenerateModule}
            disabled={processingFile || !uploadedFile.length}
          >
            {processingFile ? 'Generating...' : 'Generate Module'}
          </button>

          {processingFile && <p role="status">{generationProgress || 'Queuing materials...'}</p>}
          <LessonSourceManager courseId={id} jobScope={moduleId}
            lessonId={Number.isInteger(Number(moduleId)) && Number(moduleId) > 0 ? Number(moduleId) : null}
            onGenerated={result => {
              setModuleDraft(current => ({ ...current, title: result.module_title, description: result.description,
                learningObjectives: result.learning_objectives,
                lessonPages: result.lesson_pages.map(page => ({ ...page, id: createId('page') })) }));
              setCourseDraft(current => ({ ...current, subject: result.subject })); setActivePageIndex(0);
            }} />

          {generatedPageTitles.length > 0 && (
            <div className={styles.generatedPageSummary}>
              <h3>Generated Page Titles</h3>

              <ul>
                {generatedPageTitles.map((title, index) => (
                  <li key={`${title}-${index}`}>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        </div>
        </div>}

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
          </>
        )}

        {!isAssessmentPage && (
        <section className={styles.moduleEditorBand}>
          <div className={styles.moduleEditorBandHeader}>
            <div>
              <h2>Lesson Pages</h2>
              <p>Pages belonging only to this module.</p>
            </div>

            <div className={styles.moduleEditorBandActions}>
              <button className={styles.popupAddBtn} type="button" onClick={addLessonPage}>
                + Add Page
              </button>

              <button
                className={`${styles.popupAddBtn} ${styles.moduleEditorRemoveBtn}`}
                type="button"
                onClick={removeActiveLessonPage}
                disabled={!activePage}
              >
                Remove Page
              </button>
            </div>
          </div>

          <div className={styles.moduleEditorWorkspace}>
            <div className={styles.lessonPageTabs}>
              {lessonCount === 0 ? (
                <span className={styles.moduleEditorEmptyTab}>No pages</span>
              ) : (
                <>
                  {visibleLessonPages.map((page, offset) => {
                    const index = activeLessonTabPageStart + offset;

                    return (
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
                    );
                  })}

                  {lessonTabPages.length > 1 && (
                    <div className={styles.questionTabPager}>
                      <div className={styles.questionTabPagerControls}>
                        <button
                          type="button"
                          onClick={() =>
                            goToLessonTabPage(activeLessonTabPageIndex - 1)
                          }
                          disabled={activeLessonTabPageIndex === 0}
                        >
                          Previous
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            goToLessonTabPage(activeLessonTabPageIndex + 1)
                          }
                          disabled={
                            activeLessonTabPageIndex >= lessonTabPages.length - 1
                          }
                        >
                          Next
                        </button>
                      </div>

                    </div>
                  )}
                </>
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

                    <label className={styles.uploadMediaBtn}>
                      Upload Photo/Video

                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handlePageMediaSelected}
                      />
                    </label>
                  </div>

                  {activePageMedia && (
                    <div className={styles.lessonMediaPreview}>
                      <div className={styles.lessonMediaFrame}>
                        {activePageMedia.type.startsWith('video/') ? (
                          <video src={activePageMedia.url} controls />
                        ) : (
                          <img src={activePageMedia.url} alt={activePageMedia.name} />
                        )}
                      </div>

                      <span>
                        {activePageMedia.name}
                      </span>
                    </div>
                  )}

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
                  <LessonSourceEvidence page={activePage} />

                  <div className={styles.lessonPageNavigation}>
                    <button
                      className={styles.lessonNavigationBtn}
                      type="button"
                      onClick={() => setActivePageIndex((current) => Math.max(0, current - 1))}
                      disabled={!canMovePrevious}
                    >
                      Previous
                    </button>

                    <div className={styles.lessonPageCenterNavigation}>
                      <span className={styles.lessonPageIndicator}>
                        page {activePageIndex + 1} of {lessonCount}
                      </span>

                      {lessonTabPages.length > 1 && (
                        <div
                          className={styles.lessonBottomPageGroups}
                          aria-label="Lesson page groups"
                        >
                          {lessonTabPages.map((pageIndex) => (
                            <button
                              key={pageIndex}
                              type="button"
                              className={
                                pageIndex === activeLessonTabPageIndex
                                  ? styles.lessonBottomPageGroupActive
                                  : ''
                              }
                              onClick={() => goToLessonTabPage(pageIndex)}
                              aria-label={`Show lesson pages ${
                                pageIndex * LESSON_TAB_PAGE_SIZE + 1
                              } to ${Math.min(
                                (pageIndex + 1) * LESSON_TAB_PAGE_SIZE,
                                lessonCount
                              )}`}
                            >
                              {pageIndex + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

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
        )}

        <section className={styles.moduleEditorBand}>
          {!activeAssessment && <div className={styles.moduleEditorBandHeader}>
            <div>
              <h2>Module Assessments</h2>
              <p>Practice and main quiz settings belonging only to this module.</p>
            </div>
          </div>}

          {!activeAssessment ? (
            <div className={styles.moduleAssessmentGrid}>
              <article className={styles.moduleAssessmentCard}>
                <span className={styles.assessmentFolderAccent} aria-hidden="true">+</span>
                <div>
                  <h3>Practice Quiz</h3>
                  <p>{quizCount} Questions</p>
                  <p>Unlimited Attempts</p>
                </div>

                <div className={styles.assessmentCardFooter}>
                <button
                  className={styles.assessmentEditButton}
                  type="button"
                  onClick={() => openAssessmentEditor('practice')}
                >
                  Edit Practice Quiz
                </button>
                </div>
              </article>

              <article className={styles.moduleAssessmentCard}>
                <span className={styles.assessmentFolderAccent} aria-hidden="true">+</span>
                <div>
                  <h3>Main Quiz</h3>
                  <p>{quizCount} Questions</p>
                  <p>Passing Score: 60%</p>
                  <p>
                    Status:{' '}
                    {mainQuizSettings.enabled
                      ? mainQuizUnlockLabel
                        ? `Opens ${mainQuizUnlockLabel}`
                        : 'Available now'
                      : 'Disabled'}
                  </p>
                </div>

                <div className={styles.assessmentCardFooter}>
                <button
                  className={styles.assessmentEditButton}
                  type="button"
                  onClick={() => openAssessmentEditor('main')}
                >
                  Edit Main Quiz
                </button>
                </div>
              </article>
            </div>
          ) : (
            <div className={styles.moduleAssessmentEditor}>
              {activeAssessment === 'main' && (
                <dialog ref={mainQuizSettingsDialog} className={styles.mainQuizSettingsDialog} aria-labelledby="main-quiz-access-title" onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
                <div className={styles.mainQuizSettingsPanel}>
                  <button type="button" className={styles.settingsDialogClose} aria-label="Close main quiz settings" onClick={() => mainQuizSettingsDialog.current?.close()}>×</button>
                  <div>
                    <h4 id="main-quiz-access-title">Main Quiz Access</h4>
                    <p>
                      Lock or unlock the main quiz and set when student access opens and closes.
                    </p>
                  </div>

                  <div className={styles.mainQuizSettingsControls}>
                    <button
                      className={`${styles.mainQuizToggle} ${
                        mainQuizSettings.enabled
                          ? styles.mainQuizToggleOn
                          : styles.mainQuizToggleOff
                      }`}
                      type="button"
                      aria-pressed={!mainQuizSettings.enabled}
                      onClick={() =>
                        updateMainQuizSettings('enabled', !mainQuizSettings.enabled)
                      }
                    >
                      {mainQuizSettings.enabled ? 'Lock Main Quiz' : 'Unlock Main Quiz'}
                    </button>

                    <label className={styles.mainQuizTimerField}>
                      Unlock date and time
                      <input
                        className={styles.popupInput}
                        type="datetime-local"
                        value={mainQuizSettings.unlockAt}
                        onChange={(event) =>
                          updateMainQuizSettings('unlockAt', event.target.value)
                        }
                      />
                    </label>

                    <button
                      className={styles.assessmentBackButton}
                      type="button"
                      onClick={() => updateMainQuizSettings('unlockAt', '')}
                      disabled={!mainQuizSettings.unlockAt}
                    >
                      Clear Unlock Date
                    </button>
                    <label className={styles.mainQuizTimerField}>
                      Lock date and time
                      <input
                        className={styles.popupInput}
                        type="datetime-local"
                        value={mainQuizSettings.lockAt}
                        min={mainQuizSettings.unlockAt || undefined}
                        onChange={(event) =>
                          updateMainQuizSettings('lockAt', event.target.value)
                        }
                      />
                    </label>
                    <button
                      className={styles.assessmentBackButton}
                      type="button"
                      onClick={() => updateMainQuizSettings('lockAt', '')}
                      disabled={!mainQuizSettings.lockAt}
                    >
                      Clear Lock Date
                    </button>
                  </div>

                  <p className={styles.mainQuizAccessHint}>
                    {mainQuizSettings.enabled
                      ? mainQuizUnlockLabel
                        ? `Students are locked out until ${mainQuizUnlockLabel}.`
                        : 'Unlocked — students can access the main quiz after they finish the module.'
                      : 'Locked — students cannot access the main quiz. Click Unlock Main Quiz to allow access.'}
                  </p>
                  {mainQuizSettings.lockAt && (
                    <p className={styles.mainQuizAccessHint}>
                      Student access closes on {formatDateTimeLabel(mainQuizSettings.lockAt)}.
                    </p>
                  )}
                  <button type="button" className={styles.assessmentSettingsButton} onClick={() => mainQuizSettingsDialog.current?.close()}>Done</button>
                </div>
                </dialog>
              )}

              <div className={styles.moduleEditorWorkspace}>
                <div className={styles.lessonPageTabs}>
                  {quizCount === 0 ? (
                    <span className={styles.moduleEditorEmptyTab}>No quiz</span>
                  ) : (
                    <>
                      {visibleQuizItems.map((item, offset) => {
                        const index = activeQuizPageStart + offset;

                        return (
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
                        );
                      })}

                      {quizCount > QUIZ_TAB_PAGE_SIZE && (
                        <div className={styles.questionTabPager}>
                          <div className={styles.questionTabPagerControls}>
                            <button
                              type="button"
                              onClick={goToPreviousQuizPage}
                              disabled={!canShowPreviousQuizPage}
                            >
                              Previous
                            </button>

                            <button
                              type="button"
                              onClick={goToNextQuizPage}
                              disabled={!canShowNextQuizPage}
                            >
                              Next
                            </button>
                          </div>

                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={`${styles.popupQuizCard} ${styles.moduleQuizEditorCard}`}>
                  <div className={styles.quizEditorToolbar}>
                    <h2>Question</h2>
                    <div className={styles.moduleEditorBandActions}>
                  <button className={styles.popupAddBtn} type="button" onClick={addQuizItem}>
                    + Add Quiz
                  </button>

                  <button
                    className={`${styles.popupAddBtn} ${styles.moduleEditorRemoveBtn}`}
                    type="button"
                    onClick={removeActiveQuizItem}
                    disabled={!activeQuiz}
                  >
                    Remove Question
                  </button>
                  <button
                    className={styles.popupAddBtn}
                    type="button"
                    onClick={autoGenerateQuiz}
                    disabled={generatingQuiz}
                  >
                    {generatingQuiz ? 'Generating...' : 'Auto Generate'}
                  </button>

                    </div>
                  </div>
                  <div className={styles.quizEditorFields}>
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
                            type === 'identification' ? [] : ['', '', '', '']
                          );
                          updateQuizItem(activeQuizIndex, 'correct_answer', '');
                        }}
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="identification">Identification</option>
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

                      {activeQuiz.type === 'identification' ? <input className={styles.popupInput} value={activeQuiz.correct_answer} onChange={event => updateQuizItem(activeQuizIndex, 'correct_answer', event.target.value)} placeholder="Correct identification answer" aria-label="Correct identification answer" maxLength={150} /> : (<select
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
                      </select>)}

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
                      <QuizSourceEvidence question={activeQuiz} />
                    </>
                  ) : (
                    <div className={styles.popupEmptyQuiz}>Add a quiz item to begin.</div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
