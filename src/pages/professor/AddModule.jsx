import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchCourse, saveCourse } from '../../services/courseApi.js';
import styles from './Addmodule.module.css';

const TITLE_LIMIT = 100;
const CODE_LIMIT = 24;
const LONG_LIMIT = 750;
const LESSON_LIMIT = 6000;
const QUIZ_LIMIT = 500;

const emptyLessonPage = {
  title: '',
  content: '',
};

const emptyQuizItem = {
  question: '',
  options: ['', '', '', ''],
  correct_answer: '',
  explanation: '',
};

const emptyModule = {
  title: '',
  code: '',
  summary: '',
  subject: '',
  learningObjectives: '',
  status: 'draft',
  visibility: 'private',
  lessonPages: [],
  quizItems: [],
  students: 0,
  modules: 1,
  quizzes: 0,
};

function limit(value, max) {
  return String(value || '').slice(0, max);
}

function counterClass(current, max) {
  return current >= max
    ? `${styles.wordCounter} ${styles.wordCounterFull}`
    : styles.wordCounter;
}

function normalizeCourse(course) {
  return {
    ...emptyModule,
    ...course,
    code: course.code || '',
    summary: course.summary || '',
    learningObjectives: course.learningObjectives || '',
    visibility: course.visibility || 'private',
    lessonPages: Array.isArray(course.lessonPages) ? course.lessonPages : [],
    quizItems: Array.isArray(course.quizItems) ? course.quizItems : [],
  };
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('puffy-user') || 'null');
  } catch {
    return null;
  }
}

export default function AddModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyModule);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        const selected = await fetchCourse(id);

        if (active && selected) {
          setForm(normalizeCourse(selected));
        }
      } catch (error) {
        window.alert(error.message || 'Could not load course.');
        navigate('/professor/courses');
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
  }, [id, isEditing, navigate]);

  const quizCount = useMemo(
    () => form.quizItems.filter((item) => item.question.trim()).length,
    [form.quizItems]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateCourseCode = (value) => {
    updateField(
      'code',
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, CODE_LIMIT)
    );
  };

  const addLessonPage = () => {
    setForm((current) => ({
      ...current,
      lessonPages: [...current.lessonPages, { ...emptyLessonPage }],
    }));
  };

  const updateLessonPage = (index, field, value) => {
    setForm((current) => ({
      ...current,
      lessonPages: current.lessonPages.map((page, pageIndex) =>
        pageIndex === index ? { ...page, [field]: value } : page
      ),
    }));
  };

  const removeLessonPage = (index) => {
    setForm((current) => ({
      ...current,
      lessonPages: current.lessonPages.filter((_, pageIndex) => pageIndex !== index),
    }));
  };

  const addQuizItem = () => {
    setForm((current) => ({
      ...current,
      quizItems: [...current.quizItems, { ...emptyQuizItem, options: ['', '', '', ''] }],
    }));
  };

  const autoGenerateQuiz = () => {
    const source =
      form.learningObjectives ||
      form.lessonPages.map((page) => page.content).join(' ') ||
      form.title ||
      'this module';

    const generated = [1, 2, 3].map((number) => ({
      question: limit(`Question ${number}: What is an important idea from ${source}?`, QUIZ_LIMIT),
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 'Option A',
      explanation: 'Review and edit this generated quiz item before publishing.',
    }));

    setForm((current) => ({
      ...current,
      quizItems: generated,
    }));
  };

  const updateQuizItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      quizItems: current.quizItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateQuizOption = (itemIndex, optionIndex, value) => {
    setForm((current) => ({
      ...current,
      quizItems: current.quizItems.map((item, index) => {
        if (index !== itemIndex) return item;

        const options = item.options.map((option, currentOptionIndex) =>
          currentOptionIndex === optionIndex ? value : option
        );

        return {
          ...item,
          options,
          correct_answer:
            item.correct_answer === item.options[optionIndex]
              ? value
              : item.correct_answer,
        };
      }),
    }));
  };

  const removeQuizItem = (index) => {
    setForm((current) => ({
      ...current,
      quizItems: current.quizItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const uploadAndAutoSort = () => {
    if (!uploadedFile) {
      window.alert('Please choose a lesson file first.');
      return;
    }

    const baseTitle = uploadedFile.name.replace(/\.[^.]+$/, '');
    setForm((current) => ({
      ...current,
      title: current.title || baseTitle,
      subject: current.subject || 'Imported lesson',
      summary:
        current.summary ||
        `Lesson content imported from ${uploadedFile.name}. Review before publishing.`,
      learningObjectives:
        current.learningObjectives ||
        'Identify key concepts, explain core ideas, and answer review questions.',
      lessonPages: current.lessonPages.length
        ? current.lessonPages
        : [
            {
              title: baseTitle,
              content: `Paste or review extracted content from ${uploadedFile.name}.`,
            },
          ],
    }));
  };

  const saveModule = async (event) => {
    event.preventDefault();

    if (isSaving) return;

    if (!form.title.trim() || !form.code.trim() || !form.summary.trim() || !form.subject.trim()) {
      window.alert('Course title, course code, description, and subject are required.');
      return;
    }

    const normalizedCode = form.code.trim().toUpperCase();

    if (!form.learningObjectives.trim() || form.lessonPages.length === 0) {
      window.alert('Learning objectives and at least one lesson page are required.');
      return;
    }

    const storedUser = getStoredUser();
    const currentProfessor = user || storedUser || {};
    const professorName =
      currentProfessor.displayName ||
      currentProfessor.display_name ||
      currentProfessor.name ||
      currentProfessor.email ||
      form.professorName ||
      form.professor_name ||
      form.professorEmail ||
      form.professor_email ||
      'Professor';
    const professorEmail = currentProfessor.email || form.professorEmail || form.professor_email || '';
    const professorId =
      currentProfessor.id ||
      currentProfessor.userId ||
      currentProfessor.user_id ||
      form.professorId ||
      form.professor_id ||
      null;

    const payload = {
      ...form,
      title: form.title.trim(),
      code: normalizedCode,
      summary: form.summary.trim(),
      subject: form.subject.trim(),
      learningObjectives: form.learningObjectives.trim(),
      visibility: form.visibility === 'public' ? 'public' : 'private',
      joinLink: `/student/join?courseCode=${encodeURIComponent(normalizedCode)}`,
      modules: form.lessonPages.length,
      quizzes: quizCount,
      updatedAt: new Date().toISOString().slice(0, 10),
      archived: false,
      professorId,
      professor_id: professorId,
      professorName: professorName,
      professor_name: professorName,
      professorEmail: professorEmail,
      professor_email: professorEmail,
    };

    try {
      setIsSaving(true);
      await saveCourse(isEditing ? { ...payload, id } : payload);
      navigate('/professor/courses');
    } catch (error) {
      window.alert(error.message || 'Could not save course.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.addModulePage}>
        <div className={styles.pageHeader}>
          <h1>Loading Course...</h1>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.addModulePage}>
      <div className={styles.pageHeader}>
        <h1>{isEditing ? 'Edit Course' : 'Add Course'}</h1>
      </div>

      <form className={styles.formCard} onSubmit={saveModule}>
        <div className={styles.popupInfoGrid}>
          <div className={styles.popupField}>
            <label className={styles.popupLabel}>
              Course Title <span className={styles.required}>*Required</span>
            </label>
            <input
              className={styles.popupInput}
              value={form.title}
              onChange={(event) => updateField('title', limit(event.target.value, TITLE_LIMIT))}
              placeholder="Enter course title"
            />
            <div className={counterClass(form.title.length, TITLE_LIMIT)}>
              {form.title.length}/{TITLE_LIMIT} characters
            </div>
          </div>

          <div className={styles.popupField}>
            <label className={styles.popupLabel}>
              Course Code <span className={styles.required}>*Required</span>
            </label>
            <input
              className={styles.popupInput}
              value={form.code}
              onChange={(event) => updateCourseCode(event.target.value)}
              placeholder="e.g. ITEC-106"
            />
            <div className={counterClass(form.code.length, CODE_LIMIT)}>
              {form.code.length}/{CODE_LIMIT} characters
            </div>
          </div>

          <div className={styles.popupField}>
            <label className={styles.popupLabel}>Status</label>
            <select
              className={styles.popupSelect}
              value={form.status}
              onChange={(event) => updateField('status', event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Publish</option>
            </select>
          </div>

          <div className={styles.popupField}>
            <label className={styles.popupLabel}>Student Access</label>
            <select
              className={styles.popupSelect}
              value={form.visibility}
              onChange={(event) => updateField('visibility', event.target.value)}
            >
              <option value="public">Public - visible in Public Courses</option>
              <option value="private">Private - course code or link only</option>
            </select>
            <p className={styles.accessHint}>
              {form.visibility === 'public'
                ? 'Students can discover this course in Public Courses.'
                : 'Students can join only with the course code or invite link.'}
            </p>
          </div>
        </div>

        <div className={styles.popupSection}>
          <label className={styles.popupLabel}>
            Course Description <span className={styles.required}>*Required</span>
          </label>
          <textarea
            className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
            value={form.summary}
            onChange={(event) => updateField('summary', limit(event.target.value, LONG_LIMIT))}
            placeholder="Enter course description"
          />
          <div className={counterClass(form.summary.length, LONG_LIMIT)}>
            {form.summary.length}/{LONG_LIMIT} characters
          </div>
        </div>

        <div className={styles.popupSection}>
          <label className={styles.popupLabel}>
            Subject <span className={styles.required}>*Required</span>
          </label>
          <input
            className={styles.popupInput}
            value={form.subject}
            onChange={(event) => updateField('subject', limit(event.target.value, TITLE_LIMIT))}
            placeholder="Enter subject"
          />
          <div className={counterClass(form.subject.length, TITLE_LIMIT)}>
            {form.subject.length}/{TITLE_LIMIT} characters
          </div>
        </div>

        <div className={styles.popupSection}>
          <label className={styles.popupLabel}>Upload Lesson File</label>
          <div className={styles.uploadRow}>
            <label className={styles.customFileBtn}>
              Choose File
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setUploadedFile(event.target.files?.[0] || null)}
              />
            </label>
            <span className={styles.fileName}>
              {uploadedFile ? uploadedFile.name : 'No file chosen'}
            </span>
            <button className={styles.popupAddBtn} type="button" onClick={uploadAndAutoSort}>
              Upload and Auto Sort
            </button>
          </div>
        </div>

        <div className={styles.popupSection}>
          <label className={styles.popupLabel}>
            Learning Objectives <span className={styles.required}>*Required</span>
          </label>
          <textarea
            className={`${styles.popupTextarea} ${styles.popupSmallBox}`}
            value={form.learningObjectives}
            onChange={(event) =>
              updateField('learningObjectives', limit(event.target.value, LONG_LIMIT))
            }
            placeholder="Enter learning objectives"
          />
          <div className={counterClass(form.learningObjectives.length, LONG_LIMIT)}>
            {form.learningObjectives.length}/{LONG_LIMIT} characters
          </div>
        </div>

        <div className={styles.popupSection}>
          <div className={styles.popupSectionRow}>
            <label className={styles.popupLabel}>
              Lesson Pages <span className={styles.required}>*Required</span>
            </label>
            <button className={styles.popupAddBtn} type="button" onClick={addLessonPage}>
              Add Page +
            </button>
          </div>

          {form.lessonPages.length === 0 ? (
            <div className={styles.popupEmptyQuiz}>No lesson pages yet.</div>
          ) : (
            form.lessonPages.map((page, index) => (
              <div className={styles.popupQuizCard} key={`lesson-${index}`}>
                <div className={styles.popupQuizCardTop}>
                  <span className={styles.popupQuizCardTitle}>Page {index + 1}</span>
                  <button
                    className={styles.popupRemoveBtn}
                    type="button"
                    onClick={() => removeLessonPage(index)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className={styles.popupInput}
                  value={page.title}
                  onChange={(event) =>
                    updateLessonPage(index, 'title', limit(event.target.value, TITLE_LIMIT))
                  }
                  placeholder="Page title"
                />
                <textarea
                  className={`${styles.popupTextarea} ${styles.popupLargeBox}`}
                  value={page.content}
                  onChange={(event) =>
                    updateLessonPage(index, 'content', limit(event.target.value, LESSON_LIMIT))
                  }
                  placeholder="Page content"
                />
              </div>
            ))
          )}
        </div>

        <div className={styles.popupSection}>
          <div className={styles.popupSectionRow}>
            <label className={styles.popupLabel}>Course Quiz</label>
            <div className={styles.quizActions}>
              <button className={styles.popupAddBtn} type="button" onClick={autoGenerateQuiz}>
                Auto Generate
              </button>
              <button className={styles.popupAddBtn} type="button" onClick={addQuizItem}>
                Add +
              </button>
            </div>
          </div>

          {form.quizItems.length === 0 ? (
            <div className={styles.popupEmptyQuiz}>No quiz items yet.</div>
          ) : (
            form.quizItems.map((item, index) => (
              <div className={styles.popupQuizCard} key={`quiz-${index}`}>
                <div className={styles.popupQuizCardTop}>
                  <span className={styles.popupQuizCardTitle}>Item {index + 1}</span>
                  <button
                    className={styles.popupRemoveBtn}
                    type="button"
                    onClick={() => removeQuizItem(index)}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className={styles.popupInput}
                  value={item.question}
                  onChange={(event) =>
                    updateQuizItem(index, 'question', limit(event.target.value, QUIZ_LIMIT))
                  }
                  placeholder="Question"
                />
                <div className={styles.optionsGrid}>
                  {item.options.map((option, optionIndex) => (
                    <input
                      className={styles.popupInput}
                      key={optionIndex}
                      value={option}
                      onChange={(event) =>
                        updateQuizOption(
                          index,
                          optionIndex,
                          limit(event.target.value, QUIZ_LIMIT)
                        )
                      }
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                  ))}
                </div>
                <select
                  className={styles.popupInput}
                  value={item.correct_answer}
                  onChange={(event) => updateQuizItem(index, 'correct_answer', event.target.value)}
                >
                  <option value="">Select correct answer</option>
                  {item.options.map((option, optionIndex) => (
                    <option key={optionIndex} value={option} disabled={!option.trim()}>
                      Option {optionIndex + 1}
                    </option>
                  ))}
                </select>
                <textarea
                  className={`${styles.popupTextarea} ${styles.popupAnswerBox}`}
                  value={item.explanation}
                  onChange={(event) =>
                    updateQuizItem(index, 'explanation', limit(event.target.value, QUIZ_LIMIT))
                  }
                  placeholder="Explanation"
                />
              </div>
            ))
          )}
        </div>

        <div className={styles.popupActions}>
          <button
            className={styles.popupCancelBtn}
            type="button"
            onClick={() => navigate('/professor/courses')}
          >
            Cancel
          </button>
          <button className={styles.popupSaveBtn} type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  );
}
