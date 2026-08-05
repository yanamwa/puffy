import { API_BASE } from "../config.js";

export const ADMIN_MODES_KEY = "admin-modes";
export const ADMIN_MODES_EVENT = "admin-modes-updated";
export const ADMIN_MODES_SEED_VERSION_KEY = "admin-modes-seed-version";
export const ADMIN_MODES_SEED_VERSION = "2";

export const quizModeSeeds = [
  {
    id: 8113789,
    kind: "flashcard",
    title: "Flashcards",
    description:
      "Review facts and test your memory in a fun and quick way. Perfect for learning on the go!",
    route: "/flashcards-tutorial",
    image: "/images/flashcard.png",
  },
  {
    id: 5515895,
    kind: "qna",
    title: "Q & A",
    description:
      "Challenge your brain with interesting questions and discover something new every time you play!",
    route: "/QandA-tutorial",
    image: "/images/qna.png",
  },
  {
    id: 9218948,
    kind: "multiple",
    title: "Multiple Choice",
    description:
      "Only one answer is correct. Trust your instincts, think carefully, and aim for that perfect score!",
    route: "/multipleChoice-tutorial",
    image: "/images/multiplechoice.png",
  },
  {
    id: 7291701,
    kind: "matching",
    title: "Matching Type",
    description:
      "Pair the terms, ideas, or clues correctly. It's a fun way to test your memory and logic!",
    route: "/Matching-tutorial",
    image: "/images/matching.png",
  },
  {
    id: 7291702,
    kind: "timed",
    title: "Timed Quiz",
    description:
      "Answer questions within a time limit and build speed while reviewing the lesson.",
    route: "/timedquiz-tutorial",
    image: "/images/timedquiz.png",
  },
  {
    id: 7291703,
    kind: "survival",
    title: "Survival Mode",
    description:
      "Practice with three lives. Each missed answer costs a life, so students stay focused while reviewing.",
    route: "/survival-tutorial",
    image: "/images/needpractice.png",
  },
];

function dispatchModesUpdate(modes) {
  window.dispatchEvent(
    new CustomEvent(ADMIN_MODES_EVENT, {
      detail: { modes },
    })
  );
}

function normalizeImagePath(value, title = "") {
  const image = String(value || "").trim();
  if (image) return image;

  const lowerTitle = String(title).toLowerCase();
  if (lowerTitle.includes("multiple")) return "/images/multiplechoice.png";
  if (lowerTitle.includes("matching")) return "/images/matching.png";
  if (lowerTitle.includes("survival")) return "/images/needpractice.png";
  if (lowerTitle.includes("timed")) return "/images/timedquiz.png";
  if (lowerTitle.includes("q")) return "/images/qna.png";
  return "/images/flashcard.png";
}

function inferModeKind(mode, title) {
  const text = `${mode?.kind || ""} ${mode?.quizMode || ""} ${title || ""} ${
    mode?.mode_name || ""
  } ${mode?.route || ""}`.toLowerCase();

  if (text.includes("survival")) return "survival";
  if (text.includes("timed")) return "timed";
  if (text.includes("multiple")) return "multiple";
  if (text.includes("matching")) return "matching";
  if (text.includes("q")) return "qna";
  return "flashcard";
}

export function normalizeQuizMode(mode) {
  const id = mode?.id || mode?.mode_id || mode?.quiz_id || Date.now();
  const title = mode?.title || mode?.mode_name || "Untitled Mode";
  const kind = inferModeKind(mode, title);

  return {
    ...mode,
    id,
    kind,
    mode_id: mode?.mode_id || id,
    quiz_id: mode?.quiz_id || id,
    title,
    mode_name: mode?.mode_name || title,
    description: mode?.description || "",
    route: mode?.route || "",
    image: normalizeImagePath(mode?.image, title),
  };
}

function mergeSeedModes(modes) {
  const normalized = modes.map(normalizeQuizMode);
  const existingKeys = new Set(
    normalized.flatMap((mode) => [
      String(mode.id),
      String(mode.kind || "").toLowerCase(),
      String(mode.route || "").toLowerCase(),
      String(mode.title || "").toLowerCase(),
    ])
  );

  const missingSeeds = quizModeSeeds
    .map(normalizeQuizMode)
    .filter((seed) => {
      const seedKeys = [
        String(seed.id),
        String(seed.kind || "").toLowerCase(),
        String(seed.route || "").toLowerCase(),
        String(seed.title || "").toLowerCase(),
      ];

      return !seedKeys.some((key) => key && existingKeys.has(key));
    });

  return [...normalized, ...missingSeeds];
}

export function readLocalQuizModes() {
  try {
    const saved = localStorage.getItem(ADMIN_MODES_KEY);
    const parsed = saved ? JSON.parse(saved) : quizModeSeeds;
    const normalized = Array.isArray(parsed)
      ? parsed.map(normalizeQuizMode)
      : quizModeSeeds.map(normalizeQuizMode);

    const seedVersion = localStorage.getItem(ADMIN_MODES_SEED_VERSION_KEY);

    if (saved && seedVersion !== ADMIN_MODES_SEED_VERSION) {
      const merged = mergeSeedModes(normalized);
      localStorage.setItem(ADMIN_MODES_KEY, JSON.stringify(merged));
      localStorage.setItem(ADMIN_MODES_SEED_VERSION_KEY, ADMIN_MODES_SEED_VERSION);
      return merged;
    }

    if (!saved) {
      localStorage.setItem(ADMIN_MODES_SEED_VERSION_KEY, ADMIN_MODES_SEED_VERSION);
    }

    return normalized;
  } catch {
    return quizModeSeeds.map(normalizeQuizMode);
  }
}

export function saveLocalQuizModes(modes) {
  const normalized = modes.map(normalizeQuizMode);
  localStorage.setItem(ADMIN_MODES_KEY, JSON.stringify(normalized));
  localStorage.setItem(ADMIN_MODES_SEED_VERSION_KEY, ADMIN_MODES_SEED_VERSION);
  dispatchModesUpdate(normalized);
  return normalized;
}

async function requestMode(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({
    success: false,
    message: "Server returned an invalid response.",
  }));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Mode request failed.");
  }

  return data;
}

export async function fetchQuizModes() {
  try {
    const data = await requestMode(`${API_BASE}/modes`, {
      credentials: "include",
    });

    const modes = Array.isArray(data.modes) ? data.modes.map(normalizeQuizMode) : [];
    if (modes.length) {
      const mergedModes = mergeSeedModes(modes);
      saveLocalQuizModes(mergedModes);
      return mergedModes;
    }
  } catch (error) {
    console.warn("Mode API unavailable, using local admin modes:", error.message);
  }

  return readLocalQuizModes();
}

export async function saveQuizMode(mode) {
  const normalized = normalizeQuizMode(mode);
  const hasId = mode.id || mode.mode_id || mode.quiz_id;

  try {
    const data = await requestMode(
      hasId
        ? `${API_BASE}/modes/${encodeURIComponent(normalized.id)}`
        : `${API_BASE}/modes`,
      {
        method: hasId ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalized),
      }
    );

    const savedMode = normalizeQuizMode(data.mode || normalized);
    const currentModes = readLocalQuizModes();
    const nextModes = hasId
      ? currentModes.map((item) =>
          String(item.id) === String(savedMode.id) ? savedMode : item
        )
      : [savedMode, ...currentModes];

    saveLocalQuizModes(nextModes);
    return savedMode;
  } catch (error) {
    console.warn("Mode API save failed, saving locally:", error.message);

    const currentModes = readLocalQuizModes();
    const localMode = {
      ...normalized,
      id: hasId ? normalized.id : Date.now(),
    };
    const nextModes = hasId
      ? currentModes.map((item) =>
          String(item.id) === String(localMode.id) ? localMode : item
        )
      : [localMode, ...currentModes];

    saveLocalQuizModes(nextModes);
    return localMode;
  }
}

export async function deleteQuizModeById(id) {
  try {
    await requestMode(`${API_BASE}/modes/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    console.warn("Mode API delete failed, deleting locally:", error.message);
  }

  saveLocalQuizModes(
    readLocalQuizModes().filter((mode) => String(mode.id) !== String(id))
  );
}
