import { useEffect, useMemo, useState } from 'react';
import { FiBarChart2, FiGrid } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from '../../config.js';
import { fetchCourses } from '../../services/courseApi.js';
import styles from './AssessmentAnalysis.module.css';

const FALLBACK_RATIOS = [1, 0.83, 0.7, 0.5, 0.4];
const QUESTIONS_PER_PAGE = 10;
const VIEW_MODES = {
  GRAPHICAL: 'graphical',
  TABLE: 'table',
};

const BLOOM_LEVELS = {
  remembering: {
    level: 'Remembering',
    category: 'LOTS',
    task: 'Recalls facts or information',
    reason: 'The question asks students to recall previously learned information.',
  },
  understanding: {
    level: 'Understanding',
    category: 'LOTS',
    task: 'Explains or interprets information',
    reason: 'The question asks students to explain, describe, or interpret the idea.',
  },
  applying: {
    level: 'Applying',
    category: 'LOTS',
    task: 'Uses learned knowledge in a situation',
    reason: 'The question asks students to use learned knowledge in a given situation.',
  },
  analyzing: {
    level: 'Analyzing',
    category: 'HOTS',
    task: 'Compares, distinguishes, examines relationships',
    reason: 'The question requires students to compare, distinguish, or examine relationships.',
  },
  evaluating: {
    level: 'Evaluating',
    category: 'HOTS',
    task: 'Makes and justifies a judgment',
    reason: 'The question asks students to make and justify a judgment.',
  },
  creating: {
    level: 'Creating',
    category: 'HOTS',
    task: 'Designs or produces something new',
    reason: 'The question asks students to design or produce something new.',
  },
};

const BLOOM_DISPLAY_ORDER = [
  'Remembering',
  'Understanding',
  'Applying',
  'Analyzing',
  'Evaluating',
  'Creating',
];
const THINKING_SKILL_ORDER = ['LOTS', 'HOTS'];

const BLOOM_RULES = [
  {
    key: 'creating',
    terms: ['create', 'design', 'develop', 'produce', 'construct', 'compose', 'formulate', 'build'],
  },
  {
    key: 'analyzing',
    terms: [
      'analyze',
      'compare',
      'contrast',
      'distinguish',
      'differentiate',
      'examine',
      'relationship',
      'determine which',
    ],
  },
  {
    key: 'evaluating',
    terms: ['evaluate', 'justify', 'defend', 'critique', 'recommend', 'judge', 'assess', 'prioritize', 'most appropriate', 'best'],
  },
  {
    key: 'applying',
    terms: ['apply', 'solve', 'calculate', 'implement', 'demonstrate', 'perform', 'execute', 'use the'],
  },
  {
    key: 'understanding',
    terms: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'give an example', 'in your own words'],
  },
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  if (!trimmed) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function readArrayField(...values) {
  for (const value of values) {
    const parsed = parseMaybeJson(value);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.attempts)) return parsed.attempts;
    if (Array.isArray(parsed?.responses)) return parsed.responses;
    if (Array.isArray(parsed?.results)) return parsed.results;
    if (Array.isArray(parsed?.items)) return parsed.items;
    if (Array.isArray(parsed?.questions)) return parsed.questions;
  }

  return [];
}

function getQuestionNumber(value, fallbackIndex = 0) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : fallbackIndex + 1;
}

function makeQuestionLabel(value, fallbackIndex = 0) {
  return `Question ${getQuestionNumber(value, fallbackIndex)}`;
}

function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return 'N/A';

  return Number(value)
    .toFixed(decimals)
    .replace(/\.?0+$/, '');
}

function formatScore(value, total) {
  if (!Number.isFinite(value)) return 'N/A';

  return `${formatNumber(value)} / ${total || 0}`;
}

function getScorePercent(score, total) {
  if (!Number.isFinite(score) || !Number(total)) return null;

  return (score / total) * 100;
}

function formatScoreWithPercent(score, total) {
  const percent = getScorePercent(score, total);

  if (!Number.isFinite(score)) return 'N/A';
  if (!Number.isFinite(percent)) return formatScore(score, total);

  return `${formatScore(score, total)} (${formatPercent(percent)})`;
}

function formatExamineeCount(value) {
  const count = Number(value || 0);

  return `${count} ${count === 1 ? 'Examinee' : 'Examinees'}`;
}

function getBloomDetail(value) {
  if (!value) return null;

  const normalized = String(value).toLowerCase().replace(/[^a-z]/g, '');
  return Object.values(BLOOM_LEVELS).find(
    (detail) =>
      detail.level.toLowerCase() === normalized ||
      normalized.includes(detail.level.toLowerCase())
  );
}

function normalizeCognitiveCategory(value, fallback) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('hots') || normalized.includes('higher')) return 'HOTS';
  if (normalized.includes('lots') || normalized.includes('lower')) return 'LOTS';

  return fallback;
}

function inferCognitiveLevel(question) {
  const providedLevel = getBloomDetail(question?.cognitiveLevel);
  const source = String(question?.question || '').toLowerCase();
  const inferredRule = BLOOM_RULES.find((rule) =>
    rule.terms.some((term) => source.includes(term))
  );
  const detail =
    providedLevel || BLOOM_LEVELS[inferredRule?.key] || BLOOM_LEVELS.remembering;

  return {
    ...detail,
    category: normalizeCognitiveCategory(question?.cognitiveCategory, detail.category),
    reason: question?.cognitiveReason || detail.reason,
  };
}

function normalizeChoices(...values) {
  for (const value of values) {
    if (!value) continue;

    const choices = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value
            .split(/\r?\n|[,|]/g)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const normalized = choices
      .map((choice) => String(choice || '').trim())
      .filter(Boolean);

    if (normalized.length > 0) return normalized;
  }

  return [];
}

function cleanChoiceText(value) {
  return String(value || '')
    .replace(/^[A-Z]\s*[.)-]\s*/i, '')
    .trim();
}

function sameChoice(left, right) {
  return cleanChoiceText(left).toLowerCase() === cleanChoiceText(right).toLowerCase();
}

function addUniqueChoice(choices, value) {
  const cleaned = cleanChoiceText(value);

  if (!cleaned || choices.some((choice) => sameChoice(choice, cleaned))) return;

  choices.push(cleaned);
}

function getAnswerChoices(question) {
  const choices = [];

  if (Array.isArray(question?.options)) {
    question.options.forEach((choice) => addUniqueChoice(choices, choice));
  }

  addUniqueChoice(choices, question?.answer);

  if (choices.length === 0) choices.push('Correct response');
  if (choices.length === 1 && Number(question?.incorrect || 0) > 0) {
    choices.push('Other answers');
  }

  return choices.slice(0, OPTION_LETTERS.length);
}

function splitIncorrectCount(total, slots) {
  if (slots <= 0) return [];

  const weights = Array.from({ length: slots }, (_, index) => slots - index);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = total;

  return weights.map((weight, index) => {
    if (index === weights.length - 1) return remaining;

    const count = Math.min(remaining, Math.round((total * weight) / weightTotal));
    remaining -= count;
    return count;
  });
}

function readDistributionEntries(value) {
  const parsed = parseMaybeJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .map((entry, index) => {
        if (typeof entry === 'number') {
          return {
            count: entry,
            index,
            key: OPTION_LETTERS[index],
            label: OPTION_LETTERS[index],
          };
        }

        if (!entry || typeof entry !== 'object') return null;

        return {
          count:
            readNumber(
              entry.count,
              entry.total,
              entry.responses,
              entry.selected,
              entry.students,
              entry.value
            ) ?? 0,
          index,
          isCorrect:
            entry.isCorrect === true ||
            entry.correct === true ||
            String(entry.isCorrect || entry.correct || '').toLowerCase() === 'true',
          key: entry.key || entry.letter || entry.optionKey || entry.option_key,
          label:
            entry.label ||
            entry.option ||
            entry.answer ||
            entry.choice ||
            entry.text ||
            entry.name ||
            entry.value ||
            OPTION_LETTERS[index],
        };
      })
      .filter(Boolean);
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed)
      .map(([key, entry], index) => {
        const entryObject = entry && typeof entry === 'object' ? entry : null;

        return {
          count:
            readNumber(
              entryObject?.count,
              entryObject?.total,
              entryObject?.responses,
              entryObject?.students,
              entry
            ) ?? 0,
          index,
          isCorrect:
            entryObject?.isCorrect === true ||
            entryObject?.correct === true ||
            String(entryObject?.isCorrect || entryObject?.correct || '').toLowerCase() === 'true',
          key,
          label:
            entryObject?.label ||
            entryObject?.option ||
            entryObject?.answer ||
            entryObject?.choice ||
            entryObject?.text ||
            key,
        };
      })
      .filter((entry) => Number.isFinite(entry.count));
  }

  return [];
}

function getDistributionEntries(question) {
  return readArrayField(
    question?.answerDistribution,
    question?.answer_distribution,
    question?.responseDistribution,
    question?.response_distribution,
    question?.optionDistribution,
    question?.option_distribution
  ).length
    ? readDistributionEntries(
        readArrayField(
          question?.answerDistribution,
          question?.answer_distribution,
          question?.responseDistribution,
          question?.response_distribution,
          question?.optionDistribution,
          question?.option_distribution
        )
      )
    : [
        question?.answerDistribution,
        question?.answer_distribution,
        question?.responseDistribution,
        question?.response_distribution,
        question?.optionDistribution,
        question?.option_distribution,
        question?.answerCounts,
        question?.answer_counts,
        question?.optionCounts,
        question?.option_counts,
        question?.responseCounts,
        question?.response_counts,
      ].flatMap(readDistributionEntries);
}

function distributionEntryMatchesChoice(entry, choice, index) {
  const letter = OPTION_LETTERS[index]?.toLowerCase();
  const candidates = [entry.key, entry.label]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim());

  if (!candidates.length && entry.index === index) return true;

  return candidates.some((candidate) => {
    const normalized = candidate.toLowerCase();
    const cleaned = cleanChoiceText(candidate).toLowerCase();

    return (
      normalized === letter ||
      normalized === `answer ${letter}` ||
      normalized === `${letter}.` ||
      normalized === `${letter})` ||
      cleaned === letter ||
      sameChoice(candidate, choice)
    );
  });
}

function buildAnswerDistribution(question) {
  const choices = getAnswerChoices(question);
  const totalCorrect = Math.max(Math.round(Number(question?.totalCorrect || 0)), 0);
  const incorrect = Math.max(Math.round(Number(question?.incorrect || 0)), 0);
  const correctIndex = choices.findIndex((choice) => sameChoice(choice, question?.answer));
  const resolvedCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
  const explicitEntries = getDistributionEntries(question);

  if (explicitEntries.length > 0) {
    const explicitCounts = choices.map((choice, index) =>
      explicitEntries
        .filter((entry) => distributionEntryMatchesChoice(entry, choice, index))
        .reduce((sum, entry) => sum + Math.max(Math.round(Number(entry.count || 0)), 0), 0)
    );

    if (explicitCounts.some((count) => count > 0)) {
      return choices.map((choice, index) => ({
        choice,
        count: explicitCounts[index],
        isCorrect:
          index === resolvedCorrectIndex ||
          explicitEntries.some(
            (entry) => entry.isCorrect && distributionEntryMatchesChoice(entry, choice, index)
          ),
        label: `Answer ${OPTION_LETTERS[index]}`,
      }));
    }
  }

  const counts = choices.map(() => 0);
  const incorrectIndexes = choices
    .map((_, index) => index)
    .filter((index) => index !== resolvedCorrectIndex);
  const incorrectCounts = splitIncorrectCount(incorrect, incorrectIndexes.length);

  counts[resolvedCorrectIndex] = totalCorrect;
  incorrectIndexes.forEach((index, countIndex) => {
    counts[index] = incorrectCounts[countIndex] || 0;
  });

  return choices.map((choice, index) => ({
    choice,
    count: counts[index],
    isCorrect: index === resolvedCorrectIndex,
    label: `Answer ${OPTION_LETTERS[index]}`,
  }));
}

function getQuestionAnalysisTitle(question) {
  const number = getQuestionNumber(question?.label, 0);

  return number ? `Question ${number} Analysis` : 'Question Analysis';
}

function getStoredToken() {
  return (
    localStorage.getItem('puffy-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('puffy-token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('authToken') ||
    ''
  );
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['male', 'm'].includes(normalized)) return 'male';
  if (['female', 'f'].includes(normalized)) return 'female';

  return '';
}

function getEnrollmentSummary(enrolledStudents = []) {
  const enrolled = Array.isArray(enrolledStudents) ? enrolledStudents : [];

  return enrolled.reduce(
    (summary, student) => {
      const gender = normalizeGender(student.gender || student.studentGender);

      if (gender === 'male') {
        summary.maleStudents += 1;
      }

      if (gender === 'female') {
        summary.femaleStudents += 1;
      }

      return summary;
    },
    {
      totalStudents: enrolled.length,
      maleStudents: 0,
      femaleStudents: 0,
    }
  );
}

async function fetchEnrollmentSummary(courseId) {
  const token = getStoredToken();

  if (!token || !courseId) {
    return null;
  }

  const response = await fetch(
    `${API_BASE}/courses/${encodeURIComponent(courseId)}/enrollments`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Could not load enrolled students.');
  }

  return getEnrollmentSummary(data.enrolled);
}

function readNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;

    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return null;
}

function parseItems(raw, fallbackCount) {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.questions)) return parsed.questions;
      if (Array.isArray(parsed?.items)) return parsed.items;
    } catch {
      return raw
        .split(/\n+/g)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  return Array.from({ length: Math.max(Number(fallbackCount) || 0, 0) }, (_, index) => ({
    label: `Q${index + 1}`,
    question: `Assessment item ${index + 1}`,
    answer: 'Answer not available',
  }));
}

function normalizeCourse(course, index) {
  const id = course.id || course.courseId || index + 1;
  const code = course.code || course.courseCode || course.course_code || `CRS${String(id).padStart(3, '0')}`;

  return {
    id,
    code,
    title: course.title || course.courseName || course.course_name || 'Untitled Course',
    description: course.summary || course.description || course.subject || 'Course details not available',
    students: readNumber(course.students, course.studentCount, course.student_count) ?? 0,
    maleStudents: readNumber(course.maleStudents, course.male_students) ?? 0,
    femaleStudents: readNumber(course.femaleStudents, course.female_students) ?? 0,
    quizzes: readNumber(course.quizzes, course.quizCount, course.quiz_count, course.quizItems) ?? 0,
    quizContents: course.quizContents || course.quiz_contents || course.quizModule || course.questions || '',
    quizTitle:
      course.quizTitle ||
      course.quiz_title ||
      course.assessmentTitle ||
      course.assessment_title ||
      course.quizName ||
      course.quiz_name ||
      course.moduleTitle ||
      course.module_title,
    averageScore: course.averageScore || course.average_score,
    highestScore: course.highestScore || course.highest_score,
    lowestScore: course.lowestScore || course.lowest_score,
    medianScore: course.medianScore || course.median_score,
    passScore: course.passScore || course.pass_score,
    passRate: course.passRate || course.pass_rate,
    scoreCounts: course.scoreCounts || course.score_counts,
    scoreDistribution: course.scoreDistribution || course.score_distribution,
    studentsFailed: course.studentsFailed || course.students_failed || course.failCount || course.fail_count,
    studentsPassed: course.studentsPassed || course.students_passed || course.passCount || course.pass_count,
    quizAttempts:
      course.quizAttempts ||
      course.quiz_attempts ||
      course.assessmentAttempts ||
      course.assessment_attempts ||
      course.attemptRecords ||
      course.attempt_records ||
      course.attempts ||
      course.results ||
      course.quizResults ||
      course.quiz_results,
    raw: course.raw || course,
  };
}

function formatPercent(value) {
  const fixed = Number(value || 0).toFixed(2);
  return `${fixed.replace(/\.?0+$/, '')}%`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeScoreToItems(score, total, totalItems) {
  if (!Number.isFinite(score)) return null;

  const itemTotal = Number(totalItems) || Number(total) || 0;
  const sourceTotal = Number(total) || itemTotal;

  if (itemTotal > 0 && sourceTotal > 0 && sourceTotal !== itemTotal) {
    return (score / sourceTotal) * itemTotal;
  }

  if (itemTotal > 0 && score > itemTotal && score <= 100) {
    return (score / 100) * itemTotal;
  }

  return score;
}

function normalizeQuizAttempts(course, totalItems) {
  const attempts = readArrayField(
    course?.quizAttempts,
    course?.quiz_attempts,
    course?.assessmentAttempts,
    course?.assessment_attempts,
    course?.attemptRecords,
    course?.attempt_records,
    course?.attempts,
    course?.results,
    course?.quizResults,
    course?.quiz_results,
    course?.raw?.quizAttempts,
    course?.raw?.quiz_attempts,
    course?.raw?.assessmentAttempts,
    course?.raw?.assessment_attempts,
    course?.raw?.attempts,
    course?.raw?.results,
    course?.raw?.quizResults,
    course?.raw?.quiz_results
  );

  return attempts
    .map((attempt, index) => {
      const answers = readArrayField(
        attempt?.answers,
        attempt?.responses,
        attempt?.userResults,
        attempt?.user_results,
        attempt?.answerDetails,
        attempt?.answer_details,
        attempt?.items
      );
      const rawScore = readNumber(
        attempt?.score,
        attempt?.finalScore,
        attempt?.final_score,
        attempt?.totalCorrect,
        attempt?.total_correct,
        attempt?.correct,
        attempt?.points
      );
      const answerScore =
        rawScore ??
        (answers.length
          ? answers.filter((answer) => readAttemptCorrectness(answer, null, '') === true).length
          : null);
      const rawTotal =
        readNumber(
          attempt?.total,
          attempt?.totalItems,
          attempt?.total_items,
          attempt?.questionCount,
          attempt?.question_count,
          attempt?.maxScore,
          attempt?.max_score
        ) ||
        answers.length ||
        totalItems;

      return {
        answers,
        gender: normalizeGender(
          attempt?.gender ||
            attempt?.studentGender ||
            attempt?.student_gender ||
            attempt?.user?.gender ||
            attempt?.student?.gender
        ),
        id: attempt?.id || attempt?.attemptId || attempt?.attempt_id || index,
        score: normalizeScoreToItems(Number(answerScore), rawTotal, totalItems),
        total: rawTotal,
      };
    })
    .filter((attempt) => Number.isFinite(attempt.score) || attempt.answers.length > 0);
}

function readAttemptSelectedAnswer(answer) {
  if (answer === null || answer === undefined) return '';
  if (typeof answer !== 'object') return String(answer);

  return String(
    answer.userAnswer ||
      answer.user_answer ||
      answer.selectedAnswer ||
      answer.selected_answer ||
      answer.selected ||
      answer.choice ||
      answer.response ||
      answer.value ||
      answer.answer ||
      ''
  );
}

function readAttemptCorrectness(answer, selectedAnswer, correctAnswer) {
  if (answer && typeof answer === 'object') {
    const explicit =
      answer.isCorrect ??
      answer.is_correct ??
      answer.correct ??
      answer.wasCorrect ??
      answer.was_correct;

    if (explicit === true || explicit === false) return explicit;
    if (String(explicit).toLowerCase() === 'true') return true;
    if (String(explicit).toLowerCase() === 'false') return false;
  }

  if (!selectedAnswer || !correctAnswer) return null;

  return sameChoice(selectedAnswer, correctAnswer);
}

function getAttemptAnswerAt(attempt, item, index) {
  const answers = Array.isArray(attempt.answers) ? attempt.answers : [];

  if (answers[index]) return answers[index];

  const questionNumber = getQuestionNumber(item?.label, index);
  const questionText = String(item?.question || '').trim().toLowerCase();

  return answers.find((answer, answerIndex) => {
    if (!answer || typeof answer !== 'object') return false;

    const answerNumber = getQuestionNumber(
      answer.questionNumber ||
        answer.question_number ||
        answer.label ||
        answer.item ||
        answer.key ||
        `Question ${answerIndex + 1}`,
      answerIndex
    );
    const answerQuestion = String(answer.question || answer.prompt || '').trim().toLowerCase();

    return answerNumber === questionNumber || (questionText && answerQuestion === questionText);
  });
}

function addAnswerCount(answerCounts, value) {
  const key = cleanChoiceText(value) || 'No answer';
  answerCounts[key] = (answerCounts[key] || 0) + 1;
}

function getQuestionAttemptStats(attempts, item, index) {
  if (!Array.isArray(attempts) || attempts.length === 0) return null;

  return attempts.reduce(
    (stats, attempt) => {
      const answer = getAttemptAnswerAt(attempt, item, index);

      if (!answer) return stats;

      const selectedAnswer = readAttemptSelectedAnswer(answer);
      const isCorrect = readAttemptCorrectness(answer, selectedAnswer, item?.answer);

      if (selectedAnswer || isCorrect !== null) {
        stats.responses += 1;
      }

      if (selectedAnswer) {
        addAnswerCount(stats.answerCounts, selectedAnswer);
      }

      if (isCorrect === true) {
        stats.totalCorrect += 1;

        if (attempt.gender === 'female') stats.femaleCorrect += 1;
        if (attempt.gender === 'male') stats.maleCorrect += 1;
      } else if (isCorrect === false) {
        stats.incorrect += 1;
      }

      return stats;
    },
    {
      answerCounts: {},
      femaleCorrect: 0,
      incorrect: 0,
      maleCorrect: 0,
      responses: 0,
      totalCorrect: 0,
    }
  );
}

function readScoreDistribution(course, totalItems) {
  const raw =
    parseMaybeJson(course?.scoreDistribution) ||
    parseMaybeJson(course?.score_distribution) ||
    parseMaybeJson(course?.scoreCounts) ||
    parseMaybeJson(course?.score_counts) ||
    parseMaybeJson(course?.raw?.scoreDistribution) ||
    parseMaybeJson(course?.raw?.score_distribution);

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        const score = normalizeScoreToItems(
          readNumber(entry?.score, entry?.value, entry?.label),
          readNumber(entry?.total, entry?.maxScore, entry?.max_score),
          totalItems
        );
        const count = Math.max(
          Math.round(readNumber(entry?.count, entry?.students, entry?.totalStudents, entry?.total_students) ?? 0),
          0
        );

        return Number.isFinite(score) && count > 0
          ? { count, score: Math.round(score) }
          : null;
      })
      .filter(Boolean);
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .map(([scoreValue, countValue]) => {
        const score = normalizeScoreToItems(Number(scoreValue), totalItems, totalItems);
        const count = Math.max(
          Math.round(readNumber(countValue?.count, countValue?.students, countValue) ?? 0),
          0
        );

        return Number.isFinite(score) && count > 0
          ? { count, score: Math.round(score) }
          : null;
      })
      .filter(Boolean);
  }

  return [];
}

function mergeScoreDistribution(distribution) {
  const counts = new Map();

  distribution.forEach((bucket) => {
    const score = Math.round(Number(bucket.score || 0));
    counts.set(score, (counts.get(score) || 0) + Number(bucket.count || 0));
  });

  return Array.from(counts.entries())
    .map(([score, count]) => ({ count, score }))
    .sort((first, second) => first.score - second.score);
}

function medianFromDistribution(distribution) {
  const total = distribution.reduce((sum, bucket) => sum + bucket.count, 0);

  if (!total) return null;

  const firstMiddle = (total - 1) / 2;
  const secondMiddle = total / 2;
  let seen = 0;
  let firstValue = null;
  let secondValue = null;

  for (const bucket of distribution) {
    const nextSeen = seen + bucket.count;

    if (firstValue === null && firstMiddle < nextSeen) firstValue = bucket.score;
    if (secondValue === null && secondMiddle < nextSeen) secondValue = bucket.score;

    seen = nextSeen;
  }

  return ((firstValue ?? 0) + (secondValue ?? firstValue ?? 0)) / 2;
}

function standardDeviationFromDistribution(distribution, mean) {
  const total = distribution.reduce((sum, bucket) => sum + bucket.count, 0);

  if (!Number.isFinite(mean) || total <= 1) return null;

  const variance =
    distribution.reduce(
      (sum, bucket) => sum + ((bucket.score - mean) ** 2) * bucket.count,
      0
    ) / total;

  return Math.sqrt(variance);
}

function buildScoreDistribution(course, attempts, rows, totals, totalItems) {
  const attemptDistribution = attempts
    .filter((attempt) => Number.isFinite(attempt.score))
    .map((attempt) => ({ count: 1, score: Math.round(attempt.score) }));
  const explicitDistribution = readScoreDistribution(course, totalItems);

  if (attemptDistribution.length > 0) {
    return mergeScoreDistribution(attemptDistribution);
  }

  if (explicitDistribution.length > 0) {
    return mergeScoreDistribution(explicitDistribution);
  }

  if (totals.totalStudents === 1 && rows.length > 0) {
    const onlyStudentScore = rows.reduce(
      (sum, row) => sum + (Number(row.totalCorrect) > 0 ? 1 : 0),
      0
    );

    return [{ count: 1, score: onlyStudentScore }];
  }

  return [];
}

function buildQuizAnalytics(course, rows, totals, attempts) {
  const totalItems = Number(totals.quizItems || 0);
  const scoreDistribution = buildScoreDistribution(course, attempts, rows, totals, totalItems);
  const distributionTotal = scoreDistribution.reduce((sum, bucket) => sum + bucket.count, 0);
  const weightedScoreTotal = scoreDistribution.reduce(
    (sum, bucket) => sum + bucket.score * bucket.count,
    0
  );
  const fallbackAverage =
    totals.totalStudents > 0
      ? rows.reduce((sum, row) => sum + Number(row.totalCorrect || 0), 0) /
        totals.totalStudents
      : null;
  const passScore =
    normalizeScoreToItems(
      readNumber(course?.passScore, course?.pass_score, course?.passingScore, course?.passing_score),
      totalItems,
      totalItems
    ) ?? Math.max(Math.ceil(totalItems * 0.6), 1);
  const averageScore =
    distributionTotal > 0
      ? weightedScoreTotal / distributionTotal
      : normalizeScoreToItems(readNumber(course?.averageScore, course?.average_score), totalItems, totalItems) ??
        fallbackAverage;
  const standardDeviation =
    standardDeviationFromDistribution(scoreDistribution, averageScore) ??
    readNumber(
      course?.standardDeviation,
      course?.standard_deviation,
      course?.stdDeviation,
      course?.std_deviation
    );
  const medianScore =
    medianFromDistribution(scoreDistribution) ??
    normalizeScoreToItems(readNumber(course?.medianScore, course?.median_score), totalItems, totalItems) ??
    (distributionTotal === 1 ? averageScore : null);
  const highestScore =
    scoreDistribution.length > 0
      ? Math.max(...scoreDistribution.map((bucket) => bucket.score))
      : normalizeScoreToItems(readNumber(course?.highestScore, course?.highest_score), totalItems, totalItems) ??
        (totals.totalStudents === 1 ? averageScore : null);
  const lowestScore =
    scoreDistribution.length > 0
      ? Math.min(...scoreDistribution.map((bucket) => bucket.score))
      : normalizeScoreToItems(readNumber(course?.lowestScore, course?.lowest_score), totalItems, totalItems) ??
        (totals.totalStudents === 1 ? averageScore : null);
  const studentsPassed =
    distributionTotal > 0
      ? scoreDistribution
          .filter((bucket) => bucket.score >= passScore)
          .reduce((sum, bucket) => sum + bucket.count, 0)
      : readNumber(course?.studentsPassed, course?.students_passed, course?.passCount, course?.pass_count);
  const responseTotal = distributionTotal || attempts.length || totals.totalStudents;
  const studentsFailed =
    Number.isFinite(studentsPassed) && Number.isFinite(responseTotal)
      ? Math.max(responseTotal - studentsPassed, 0)
      : readNumber(course?.studentsFailed, course?.students_failed, course?.failCount, course?.fail_count);

  return {
    averageScore,
    highestScore,
    lowestScore,
    medianScore,
    passRate:
      Number.isFinite(studentsPassed) && responseTotal
        ? (studentsPassed / responseTotal) * 100
        : readNumber(course?.passRate, course?.pass_rate),
    passScore,
    responseTotal,
    scoreDistribution,
    standardDeviation,
    studentsFailed,
    studentsPassed,
  };
}

function buildCognitiveAnalytics(rows, totals) {
  const levelCounts = BLOOM_DISPLAY_ORDER.reduce((counts, level) => {
    counts[level] = 0;
    return counts;
  }, {});
  const skillCounts = THINKING_SKILL_ORDER.reduce((counts, skill) => {
    counts[skill] = 0;
    return counts;
  }, {});
  const skillPerformance = THINKING_SKILL_ORDER.reduce((summary, skill) => {
    summary[skill] = {
      correct: 0,
      total: 0,
    };
    return summary;
  }, {});

  rows.forEach((row) => {
    const detail = inferCognitiveLevel(row);
    const level = detail.level;
    const skill = detail.category;
    const responseTotal = getQuestionResponseTotal(row, totals.totalStudents);

    levelCounts[level] = (levelCounts[level] || 0) + 1;
    skillCounts[skill] = (skillCounts[skill] || 0) + 1;

    if (!skillPerformance[skill]) {
      skillPerformance[skill] = {
        correct: 0,
        total: 0,
      };
    }

    skillPerformance[skill].correct += Number(row.totalCorrect || 0);
    skillPerformance[skill].total += responseTotal;
  });

  const questionTotal = Math.max(rows.length, 1);
  const levels = BLOOM_DISPLAY_ORDER.map((level) => ({
    count: levelCounts[level] || 0,
    label: level,
    percent: ((levelCounts[level] || 0) / questionTotal) * 100,
  }));
  const skills = THINKING_SKILL_ORDER.map((skill) => ({
    count: skillCounts[skill] || 0,
    label: skill,
    percent: ((skillCounts[skill] || 0) / questionTotal) * 100,
  }));
  const performance = THINKING_SKILL_ORDER.map((skill) => {
    const summary = skillPerformance[skill] || { correct: 0, total: 0 };

    return {
      label: skill,
      percent: summary.total ? (summary.correct / summary.total) * 100 : 0,
    };
  });

  return {
    levels,
    performance,
    skills,
  };
}

function getQuestionResponseTotal(question, fallback) {
  return Math.max(
    readNumber(question?.responses, question?.totalResponses, question?.total_responses) ?? 0,
    Number(question?.totalCorrect || 0) + Number(question?.incorrect || 0),
    Number(fallback || 0)
  );
}

function getOptionDisplayLabel(label) {
  return String(label || '').replace(/^Answer/i, 'Option');
}

function getThinkingSkillName(category) {
  return String(category || '').toUpperCase() === 'HOTS'
    ? 'Higher-Order Thinking Skills'
    : 'Lower-Order Thinking Skills';
}

function buildRows(items, totals, attempts = []) {
  return items.map((item, index) => {
    const ratio = FALLBACK_RATIOS[index] ?? clamp(0.4 - (index - 4) * 0.05, 0.2, 0.9);
    const rawLabel = item.label || item.item || item.question_number || `Q${index + 1}`;
    const label = makeQuestionLabel(rawLabel, index);
    const attemptStats = getQuestionAttemptStats(attempts, item, index);
    const totalCorrect = clamp(
      Math.round(
        attemptStats && attemptStats.responses > 0
          ? attemptStats.totalCorrect
          : readNumber(item.totalCorrect, item.total_correct) ?? totals.totalStudents * ratio
      ),
      0,
      totals.totalStudents
    );
    const femaleCorrect = clamp(
      Math.round(
        attemptStats && attemptStats.responses > 0
          ? attemptStats.femaleCorrect
          : readNumber(item.femaleCorrect, item.female_correct) ?? totalCorrect / 2
      ),
      0,
      totals.femaleStudents
    );
    const maleCorrect = clamp(
      Math.round(
        attemptStats && attemptStats.responses > 0
          ? attemptStats.maleCorrect
          : readNumber(item.maleCorrect, item.male_correct) ?? totalCorrect - femaleCorrect
      ),
      0,
      totals.maleStudents
    );
    const incorrect = clamp(
      Math.round(
        attemptStats && attemptStats.responses > 0
          ? attemptStats.incorrect
          : readNumber(item.incorrect, item.total_incorrect) ?? totals.totalStudents - totalCorrect
      ),
      0,
      totals.totalStudents
    );
    const percent = readNumber(item.percent, item.correctPercent, item.correct_percent) ??
      (totalCorrect / Math.max(totals.totalStudents, 1)) * 100;

    return {
      answerCounts: attemptStats?.answerCounts,
      label,
      questionNumber: getQuestionNumber(rawLabel, index),
      responses: attemptStats?.responses || Number(item.responses || item.totalResponses || item.total_responses || 0),
      shortLabel: `Q${getQuestionNumber(rawLabel, index)}`,
      question: item.question || item.prompt || item.title || `Assessment item ${index + 1}`,
      answer: item.answer || item.correctAnswer || item.correct_answer || 'Answer not available',
      options: normalizeChoices(
        item.options,
        item.choices,
        item.answers,
        item.wrong_options,
        item.wrongOptions
      ),
      cognitiveLevel:
        item.cognitiveLevel ||
        item.cognitive_level ||
        item.bloomLevel ||
        item.bloom_level ||
        item.taxonomyLevel ||
        item.taxonomy_level,
      cognitiveCategory:
        item.cognitiveCategory ||
        item.cognitive_category ||
        item.thinkingCategory ||
        item.thinking_category ||
        item.hotsLots ||
        item.hots_lots,
      cognitiveReason:
        item.cognitiveReason ||
        item.cognitive_reason ||
        item.bloomReason ||
        item.bloom_reason ||
        item.classificationReason ||
        item.classification_reason,
      totalCorrect,
      femaleCorrect,
      maleCorrect,
      incorrect,
      percent:
        attemptStats && attemptStats.responses > 0
          ? (totalCorrect / Math.max(attemptStats.responses, 1)) * 100
          : percent,
    };
  });
}

export default function AssessmentDetail() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialCourse = location.state?.course
    ? normalizeCourse(location.state.course.raw || location.state.course, 0)
    : null;

  const [course, setCourse] = useState(initialCourse);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [enrollmentSummary, setEnrollmentSummary] = useState(null);
  const [questionPage, setQuestionPage] = useState(0);
  const [activeView, setActiveView] = useState(VIEW_MODES.GRAPHICAL);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        setErrorMessage('');

        const loadedCourses = await fetchCourses();
        const loadedEnrollmentSummary = await fetchEnrollmentSummary(courseId).catch((error) => {
          console.warn('Could not load enrolled students for assessment totals.', error);
          return null;
        });
        const normalized = Array.isArray(loadedCourses)
          ? loadedCourses.map((item, index) => normalizeCourse(item, index))
          : [];
        const found = normalized.find((item) => String(item.id) === String(courseId));

        if (active) {
          setEnrollmentSummary(loadedEnrollmentSummary);
        }

        if (active && found) {
          setCourse(found);
        } else if (active && !initialCourse) {
          setErrorMessage('Assessment details could not be found.');
        }
      } catch (error) {
        if (active && !initialCourse) {
          setErrorMessage(error.message || 'Could not load assessment details.');
        }
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
  }, [courseId]);

  const activeCourse = course || initialCourse;
  const quizItems = useMemo(
    () => parseItems(activeCourse?.quizContents, Number(activeCourse?.quizzes) || 5),
    [activeCourse]
  );
  const quizAttempts = useMemo(
    () => normalizeQuizAttempts(activeCourse, quizItems.length),
    [activeCourse, quizItems.length]
  );
  const totals = useMemo(
    () => ({
      totalStudents:
        enrollmentSummary?.totalStudents ??
        (Number(activeCourse?.students || 0) || quizAttempts.length),
      maleStudents:
        enrollmentSummary?.maleStudents ??
        Number(activeCourse?.maleStudents || 0),
      femaleStudents:
        enrollmentSummary?.femaleStudents ??
        Number(activeCourse?.femaleStudents || 0),
      quizItems: quizItems.length,
    }),
    [activeCourse, quizAttempts.length, quizItems, enrollmentSummary]
  );
  const rows = useMemo(() => buildRows(quizItems, totals, quizAttempts), [quizItems, quizAttempts, totals]);
  const quizAnalytics = useMemo(
    () => buildQuizAnalytics(activeCourse, rows, totals, quizAttempts),
    [activeCourse, quizAttempts, rows, totals]
  );
  const cognitiveAnalytics = useMemo(
    () => buildCognitiveAnalytics(rows, totals),
    [rows, totals]
  );
  const questionPageCount = Math.max(
    Math.ceil(rows.length / QUESTIONS_PER_PAGE),
    1
  );
  const pagedRows = useMemo(() => {
    const start = questionPage * QUESTIONS_PER_PAGE;
    return rows.slice(start, start + QUESTIONS_PER_PAGE);
  }, [questionPage, rows]);
  const questionPages = useMemo(
    () =>
      Array.from({ length: questionPageCount }, (_, index) => {
        const start = index * QUESTIONS_PER_PAGE + 1;
        const end = Math.min((index + 1) * QUESTIONS_PER_PAGE, rows.length);
        return {
          end,
          index,
          label: String(index + 1),
          range: `Question ${start}-${end}`,
          start,
        };
      }),
    [questionPageCount, rows.length]
  );
  const currentQuestionRange = questionPages[questionPage]?.range || '';
  const quizTitle =
    activeCourse?.quizTitle ||
    activeCourse?.description ||
    `${activeCourse?.title || 'Assessment'} Quiz`;

  useEffect(() => {
    setQuestionPage((current) =>
      Math.min(current, Math.max(questionPageCount - 1, 0))
    );
  }, [questionPageCount]);

  const selectedQuestionDetails = useMemo(() => {
    if (!selectedQuestion) return null;

    const totalResponses = getQuestionResponseTotal(selectedQuestion, totals.totalStudents);

    return {
      answerDistribution: buildAnswerDistribution(selectedQuestion),
      cognitiveLevel: inferCognitiveLevel(selectedQuestion),
      title: getQuestionAnalysisTitle(selectedQuestion),
      totalResponses,
    };
  }, [selectedQuestion, totals.totalStudents]);
  const selectedCorrectAnswer = selectedQuestionDetails?.answerDistribution.find(
    (answer) => answer.isCorrect
  );
  const performanceCards = useMemo(
    () => [
      {
        label: 'Mean Score',
        primary: formatScore(quizAnalytics.averageScore, totals.quizItems),
        secondary:
          Number.isFinite(getScorePercent(quizAnalytics.averageScore, totals.quizItems))
            ? formatPercent(getScorePercent(quizAnalytics.averageScore, totals.quizItems))
            : '',
      },
      {
        label: 'Median',
        primary: formatScore(quizAnalytics.medianScore, totals.quizItems),
        secondary:
          Number.isFinite(getScorePercent(quizAnalytics.medianScore, totals.quizItems))
            ? formatPercent(getScorePercent(quizAnalytics.medianScore, totals.quizItems))
            : '',
      },
      {
        label: 'Highest',
        primary: formatScore(quizAnalytics.highestScore, totals.quizItems),
        secondary:
          Number.isFinite(getScorePercent(quizAnalytics.highestScore, totals.quizItems))
            ? formatPercent(getScorePercent(quizAnalytics.highestScore, totals.quizItems))
            : '',
      },
      {
        label: 'Lowest',
        primary: formatScore(quizAnalytics.lowestScore, totals.quizItems),
        secondary:
          Number.isFinite(getScorePercent(quizAnalytics.lowestScore, totals.quizItems))
            ? formatPercent(getScorePercent(quizAnalytics.lowestScore, totals.quizItems))
            : '',
      },
      {
        label: 'Range',
        primary:
          Number.isFinite(quizAnalytics.lowestScore) && Number.isFinite(quizAnalytics.highestScore)
            ? formatNumber(quizAnalytics.highestScore - quizAnalytics.lowestScore)
            : 'N/A',
        secondary:
          Number.isFinite(quizAnalytics.lowestScore) && Number.isFinite(quizAnalytics.highestScore)
            ? `${formatNumber(quizAnalytics.lowestScore)}-${formatNumber(quizAnalytics.highestScore)}`
            : '',
      },
      {
        label: 'Std. Deviation',
        primary: Number.isFinite(quizAnalytics.standardDeviation)
          ? formatNumber(quizAnalytics.standardDeviation)
          : 'N/A',
        secondary:
          quizAnalytics.responseTotal <= 1
            ? '1 examinee only'
            : '',
      },
      {
        label: 'Pass Score',
        primary: formatScore(quizAnalytics.passScore, totals.quizItems),
        secondary:
          Number.isFinite(getScorePercent(quizAnalytics.passScore, totals.quizItems))
            ? formatPercent(getScorePercent(quizAnalytics.passScore, totals.quizItems))
            : '',
      },
      {
        label: 'Pass Rate',
        primary: Number.isFinite(quizAnalytics.passRate)
          ? formatPercent(quizAnalytics.passRate)
          : 'N/A',
        secondary:
          Number.isFinite(quizAnalytics.studentsPassed) && quizAnalytics.responseTotal
            ? `${quizAnalytics.studentsPassed} / ${quizAnalytics.responseTotal}`
            : '',
      },
    ],
    [quizAnalytics, totals.quizItems]
  );
  const maxScoreBucket = Math.max(
    ...quizAnalytics.scoreDistribution.map((bucket) => bucket.count),
    1
  );
  const unspecifiedStudents = Math.max(
    totals.totalStudents - totals.maleStudents - totals.femaleStudents,
    0
  );
  const genderTotal = Math.max(
    totals.maleStudents + totals.femaleStudents + unspecifiedStudents,
    totals.totalStudents,
    0
  );
  const malePercent = genderTotal ? (totals.maleStudents / genderTotal) * 100 : 0;
  const femalePercent = genderTotal ? (totals.femaleStudents / genderTotal) * 100 : 0;
  const knownGenderPercent = malePercent + femalePercent;
  const genderGradient = genderTotal
    ? `conic-gradient(#7fa8d6 0 ${malePercent}%, #a8c0dc ${malePercent}% ${knownGenderPercent}%, #d6dce4 ${knownGenderPercent}% 100%)`
    : '#edf1f5';
  const passedCount = Number.isFinite(quizAnalytics.studentsPassed)
    ? quizAnalytics.studentsPassed
    : 0;
  const failedCount = Number.isFinite(quizAnalytics.studentsFailed)
    ? quizAnalytics.studentsFailed
    : 0;
  const resultTotal = Math.max(quizAnalytics.responseTotal || 0, passedCount + failedCount, totals.totalStudents);
  const passedPercent = resultTotal ? (passedCount / resultTotal) * 100 : 0;
  const skillPercentStops = cognitiveAnalytics.skills.reduce((stops, skill, index) => {
    const start = index === 0 ? 0 : stops[index - 1].end;
    const end = start + skill.percent;

    return [...stops, { ...skill, end, start }];
  }, []);
  const lotsStop = skillPercentStops.find((skill) => skill.label === 'LOTS');
  const hotsStop = skillPercentStops.find((skill) => skill.label === 'HOTS');
  const cognitiveGradient = rows.length
    ? `conic-gradient(#7fa8d6 ${lotsStop?.start || 0}% ${lotsStop?.end || 0}%, #596879 ${hotsStop?.start || 0}% ${hotsStop?.end || 100}%)`
    : '#edf1f5';

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Assessment Analysis</h1>
          <p>{activeCourse?.title || 'Review the full details of this assessment.'}</p>
        </div>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/professor/students')}
        >
          Back to assessments
        </button>
      </header>

      {loading && !activeCourse ? (
        <div className={styles.message}>Loading assessment details...</div>
      ) : errorMessage && !activeCourse ? (
        <div className={styles.message}>{errorMessage}</div>
      ) : activeCourse ? (
        <section className={styles.detailPanel}>
          <div className={styles.detailTop}>
            <div className={styles.detailTitle}>
              <span className={styles.detailEyebrow}>ASSESSMENT ANALYSIS</span>
              <h2>{activeCourse.title}</h2>
              <strong>{quizTitle}</strong>
              <p>
                {totals.quizItems} Questions &bull; {formatExamineeCount(totals.totalStudents)}
              </p>
            </div>

            <div className={styles.viewSwitch} aria-label="Assessment analysis view">
              <span>View as</span>
              <div>
                <button
                  type="button"
                  className={activeView === VIEW_MODES.GRAPHICAL ? styles.activeViewButton : ''}
                  onClick={() => setActiveView(VIEW_MODES.GRAPHICAL)}
                  aria-pressed={activeView === VIEW_MODES.GRAPHICAL}
                >
                  <FiBarChart2 aria-hidden="true" />
                  Graphical View
                </button>
                <button
                  type="button"
                  className={activeView === VIEW_MODES.TABLE ? styles.activeViewButton : ''}
                  onClick={() => setActiveView(VIEW_MODES.TABLE)}
                  aria-pressed={activeView === VIEW_MODES.TABLE}
                >
                  <FiGrid aria-hidden="true" />
                  Table
                </button>
              </div>
            </div>
          </div>

          {activeView === VIEW_MODES.GRAPHICAL ? (
            <div className={styles.graphicalView}>
              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Overall Quiz Analysis</div>
                <div className={styles.performanceGrid}>
                  {performanceCards.map((card) => (
                    <div className={styles.performanceCard} key={card.label}>
                      <span>{card.label}</span>
                      <strong>{card.primary}</strong>
                      {card.secondary ? <em>{card.secondary}</em> : null}
                    </div>
                  ))}
                </div>
                <h3 className={styles.chartTitle}>Overall Score Distribution</h3>
                {quizAnalytics.scoreDistribution.length > 0 ? (
                  <div className={styles.scoreChart} aria-label="Score distribution">
                    <div className={styles.chartYAxis}>Students</div>
                    <div className={styles.chartBars}>
                      {quizAnalytics.scoreDistribution.map((bucket) => (
                        <div className={styles.scoreBucket} key={bucket.score}>
                          <span>{bucket.count}</span>
                          <div
                            style={{
                              height: `${Math.max((bucket.count / maxScoreBucket) * 100, 8)}%`,
                            }}
                          />
                          <strong>{bucket.score}</strong>
                        </div>
                      ))}
                    </div>
                    <div className={styles.chartXAxis}>Quiz Score</div>
                    <div className={styles.passScoreNote}>
                      <span>Pass Score: {formatNumber(quizAnalytics.passScore)}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyChart}>
                    Score distribution appears after recorded attempts include student scores.
                  </div>
                )}
              </section>

              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Student Overview</div>
                <div className={styles.pieGrid}>
                  <article className={styles.pieCard}>
                    <h3>Examinees</h3>
                    <div
                      className={styles.pieGraphic}
                      style={{
                        background: genderGradient,
                      }}
                      aria-label={`Male ${totals.maleStudents}, Female ${totals.femaleStudents}, Unspecified ${unspecifiedStudents}`}
                    >
                      <span>Male / Female</span>
                    </div>
                    <div className={styles.pieLegend}>
                      <div><span>Male</span><strong>{totals.maleStudents}</strong></div>
                      <div><span>Female</span><strong>{totals.femaleStudents}</strong></div>
                      <div><span>Unspecified</span><strong>{unspecifiedStudents}</strong></div>
                    </div>
                  </article>

                  <article className={styles.pieCard}>
                    <h3>Quiz Result</h3>
                    <div
                      className={styles.pieGraphic}
                      style={{
                        background: `conic-gradient(#7fa8d6 0 ${passedPercent}%, #c9ced6 ${passedPercent}% 100%)`,
                      }}
                      aria-label={`Passed ${passedCount}, Failed ${failedCount}`}
                    >
                      <span>Pass / Fail</span>
                    </div>
                    <div className={styles.pieLegend}>
                      <div><span>Passed</span><strong>{passedCount}</strong></div>
                      <div><span>Failed</span><strong>{failedCount}</strong></div>
                    </div>
                  </article>
                </div>
              </section>

              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Cognitive Analysis</div>
                <div className={styles.pieGrid}>
                  <article className={styles.pieCard}>
                    <h3>HOTS / LOTS Distribution</h3>
                    <div
                      className={styles.pieGraphic}
                      style={{ background: cognitiveGradient }}
                      aria-label="HOTS and LOTS question distribution"
                    >
                      <span>HOTS / LOTS</span>
                    </div>
                    <div className={styles.pieLegend}>
                      {cognitiveAnalytics.skills.map((skill) => (
                        <div key={skill.label}>
                          <span>{skill.label}</span>
                          <strong>
                            {skill.count} / {rows.length || 0} {formatPercent(skill.percent)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className={`${styles.pieCard} ${styles.levelCard}`}>
                    <h3>Cognitive Levels</h3>
                    <div className={styles.levelRows}>
                      {cognitiveAnalytics.levels.map((level) => (
                        <div key={level.label}>
                          <span>{level.label}</span>
                          <strong>{level.count}</strong>
                          <em>{formatPercent(level.percent)}</em>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </section>

              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Performance by Thinking Skill</div>
                <div className={styles.skillPerformance}>
                  {cognitiveAnalytics.performance.map((skill) => (
                    <div className={styles.skillPerformanceRow} key={skill.label}>
                      <span>{skill.label}</span>
                      <div className={styles.skillTrack}>
                        <i style={{ width: `${Math.min(skill.percent, 100)}%` }} />
                      </div>
                      <strong>{formatPercent(skill.percent)}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Question Analysis</div>

                <div className={styles.questionResponses}>
                  {rows.map((item) => {
                    const totalResponses = getQuestionResponseTotal(item, totals.totalStudents);
                    const correctPercent =
                      (item.totalCorrect / Math.max(totalResponses, 1)) * 100;

                    return (
                      <article className={styles.responseCard} key={item.label}>
                        <header>
                          <span className={styles.questionNumber}>{item.label}</span>
                          <h4>{item.question}</h4>
                          <div className={styles.questionResult}>
                            <span>{item.totalCorrect} / {totalResponses} Correct</span>
                            <strong>
                              {formatPercent(correctPercent)}
                            </strong>
                          </div>
                        </header>

                        <div
                          className={styles.questionProgress}
                          aria-label={`${formatPercent(correctPercent)} correct`}
                        >
                          <i style={{ width: `${Math.min(correctPercent, 100)}%` }} />
                        </div>
                        <button
                          type="button"
                          className={styles.questionViewButton}
                          onClick={() => setSelectedQuestion(item)}
                        >
                          View Analysis
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : (
            <div className={styles.tableView}>
              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Overall Quiz Analysis</div>
                <div className={`${styles.tableWrap} ${styles.summaryTable}`}>
                  <table>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Quiz Title</td><td>{quizTitle}</td></tr>
                      <tr><td>Total Questions</td><td>{totals.quizItems}</td></tr>
                      <tr><td>Total Examinees</td><td>{totals.totalStudents}</td></tr>
                      <tr><td>Male Examinees</td><td>{totals.maleStudents}</td></tr>
                      <tr><td>Female Examinees</td><td>{totals.femaleStudents}</td></tr>
                      <tr><td>Mean Score</td><td>{formatScoreWithPercent(quizAnalytics.averageScore, totals.quizItems)}</td></tr>
                      <tr><td>Median Score</td><td>{formatScoreWithPercent(quizAnalytics.medianScore, totals.quizItems)}</td></tr>
                      <tr><td>Highest Score</td><td>{formatScoreWithPercent(quizAnalytics.highestScore, totals.quizItems)}</td></tr>
                      <tr><td>Lowest Score</td><td>{formatScoreWithPercent(quizAnalytics.lowestScore, totals.quizItems)}</td></tr>
                      <tr>
                        <td>Std. Deviation</td>
                        <td>
                          {Number.isFinite(quizAnalytics.standardDeviation)
                            ? formatNumber(quizAnalytics.standardDeviation)
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td>Range</td>
                        <td>
                          {Number.isFinite(quizAnalytics.lowestScore) && Number.isFinite(quizAnalytics.highestScore)
                            ? `${formatNumber(quizAnalytics.highestScore - quizAnalytics.lowestScore)} (${formatNumber(quizAnalytics.lowestScore)}-${formatNumber(quizAnalytics.highestScore)})`
                            : 'N/A'}
                        </td>
                      </tr>
                      <tr><td>Pass Score</td><td>{formatScoreWithPercent(quizAnalytics.passScore, totals.quizItems)}</td></tr>
                      <tr><td>Students Passed</td><td>{Number.isFinite(quizAnalytics.studentsPassed) ? `${quizAnalytics.studentsPassed} / ${quizAnalytics.responseTotal}` : 'N/A'}</td></tr>
                      <tr><td>Students Failed</td><td>{Number.isFinite(quizAnalytics.studentsFailed) ? `${quizAnalytics.studentsFailed} / ${quizAnalytics.responseTotal}` : 'N/A'}</td></tr>
                      <tr><td>Pass Rate</td><td>{Number.isFinite(quizAnalytics.passRate) ? formatPercent(quizAnalytics.passRate) : 'N/A'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <h3 className={styles.chartTitle}>Score Distribution</h3>
                <div className={`${styles.tableWrap} ${styles.scoreTable}`}>
                  <table>
                    <thead>
                      <tr>
                        <th>Score</th>
                        <th>Number of Students</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizAnalytics.scoreDistribution.length > 0 ? (
                        quizAnalytics.scoreDistribution
                          .slice()
                          .sort((first, second) => second.score - first.score)
                          .map((bucket) => (
                            <tr key={bucket.score}>
                              <td>{bucket.score}</td>
                              <td>{bucket.count}</td>
                              <td>{formatPercent((bucket.count / Math.max(quizAnalytics.responseTotal, 1)) * 100)}</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="3">No score attempts recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.analysisSection}>
                <div className={styles.analysisSectionTitle}>Question Analysis</div>

                <div className={`${styles.tableWrap} ${styles.questionSummaryTable}`}>
                  <table>
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Correct</th>
                        <th>Incorrect</th>
                        <th>Correct %</th>
                        <th>Female Correct</th>
                        <th>Male Correct</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item) => (
                        <tr key={item.label}>
                          <td>{item.label}</td>
                          <td>{item.totalCorrect}/{totals.totalStudents}</td>
                          <td>{item.incorrect}/{totals.totalStudents}</td>
                          <td>{formatPercent(item.percent)}</td>
                          <td>{item.femaleCorrect}/{totals.femaleStudents}</td>
                          <td>{item.maleCorrect}/{totals.maleStudents}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedQuestion(item)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </section>
      ) : null}

      {selectedQuestion && selectedQuestionDetails && (
        <div className={styles.modalOverlay} onClick={() => setSelectedQuestion(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>{selectedQuestionDetails.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                aria-label="Close question analysis"
              >
                &times;
              </button>
            </header>

            <div className={styles.modalBody}>
              <section className={styles.modalQuestionBlock}>
                <span className={styles.modalSectionLabel}>Question</span>
                <p className={styles.analysisQuestion}>{selectedQuestion.question}</p>

                <div className={styles.modalSkillGrid}>
                  <div className={styles.modalSkillCard}>
                    <span>Thinking Skill</span>
                    <strong>{selectedQuestionDetails.cognitiveLevel.category}</strong>
                  </div>

                  <div className={styles.modalSkillCard}>
                    <span>Cognitive Level</span>
                    <strong>{selectedQuestionDetails.cognitiveLevel.level}</strong>
                  </div>
                </div>

                <div className={styles.modalExplanation}>
                  <h3>Why is this {selectedQuestionDetails.cognitiveLevel.category}?</h3>
                  <p>
                    This question is classified as {getThinkingSkillName(
                      selectedQuestionDetails.cognitiveLevel.category
                    )} ({selectedQuestionDetails.cognitiveLevel.category}) because{' '}
                    {selectedQuestionDetails.cognitiveLevel.reason
                      .replace(/^The question asks students to /i, 'students must ')
                      .replace(/^The question requires students to /i, 'students must ')}
                  </p>
                </div>

                <div className={styles.modalExplanation}>
                  <h3>Cognitive Level Explanation</h3>
                  <p>
                    {selectedQuestionDetails.cognitiveLevel.level} requires students to{' '}
                    {selectedQuestionDetails.cognitiveLevel.task
                      .charAt(0)
                      .toLowerCase() +
                      selectedQuestionDetails.cognitiveLevel.task.slice(1)}
                    .
                  </p>
                </div>
              </section>

              <section className={styles.modalResponseBlock}>
                <div className={styles.modalSectionLabel}>Response Analysis</div>

                <div className={styles.modalResponseStats}>
                  <div>
                    <span>Correct:</span>
                    <strong>{selectedQuestion.totalCorrect} / {selectedQuestionDetails.totalResponses}</strong>
                    <em>
                      {formatPercent(
                        (selectedQuestion.totalCorrect /
                          Math.max(selectedQuestionDetails.totalResponses, 1)) *
                          100
                      )}
                    </em>
                  </div>

                  <div>
                    <span>Incorrect:</span>
                    <strong>{selectedQuestion.incorrect} / {selectedQuestionDetails.totalResponses}</strong>
                    <em>
                      {formatPercent(
                        (selectedQuestion.incorrect /
                          Math.max(selectedQuestionDetails.totalResponses, 1)) *
                          100
                      )}
                    </em>
                  </div>
                </div>

                <div className={styles.modalOptionBars}>
                  {selectedQuestionDetails.answerDistribution.map((answer) => {
                    const percent =
                      (answer.count / Math.max(selectedQuestionDetails.totalResponses, 1)) *
                      100;
                    const label = getOptionDisplayLabel(answer.label);

                    return (
                      <div className={styles.modalOptionRow} key={answer.label}>
                        <span title={answer.choice}>{label}</span>
                        <div>
                          <i
                            className={answer.isCorrect ? styles.correctBar : ''}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <strong>
                          {answer.count} ({formatPercent(percent)})
                          {answer.isCorrect ? ` ${String.fromCharCode(10003)}` : ''}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                <p className={styles.correctAnswerLine}>
                  <span>Correct Answer:</span>{' '}
                  <strong>
                    {selectedCorrectAnswer
                      ? `${getOptionDisplayLabel(selectedCorrectAnswer.label)}${
                          selectedCorrectAnswer.choice
                            ? ` - ${selectedCorrectAnswer.choice}`
                            : ''
                        }`
                      : selectedQuestion.answer}
                  </strong>
                </p>
              </section>

              <details className={styles.bloomReference}>
                <summary>Bloom&apos;s level guide</summary>
                <div>
                  {Object.values(BLOOM_LEVELS).map((level) => (
                    <p key={level.level}>
                      <strong>{level.level} ({level.category})</strong>
                      <span>{level.task}</span>
                    </p>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
