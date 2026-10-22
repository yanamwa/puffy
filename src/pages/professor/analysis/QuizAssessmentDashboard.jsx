import {
  assessmentModules,
  filterModuleAttempts,
} from "../../../utils/assessmentModuleScope.js";
import styles from "./AssessmentAnalysis.module.css";
import MainQuizAnalysis from "./MainQuizAnalysis.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../../config.js";
import { lessonAuthHeaders } from "../../../services/lessonAuth.js";
import "./QuizAssessmentDashboard.css";

const pct = (value) =>
  value === null || !Number.isFinite(value) ? "0%" : `${Math.round(value)}%`;
import { summarizeAssessment } from "../../../utils/assessmentAnalytics.js";

function Bars({ rows }) {
  return (
    <div className="qa-bars">
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <div
            className="qa-bar-track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={row.percent || 0}
            aria-label={row.label}
          >
            <div style={{ width: `${row.percent || 0}%` }} />
          </div>
          <strong>{pct(row.percent)}</strong>
        </div>
      ))}
    </div>
  );
}
export default function QuizAssessmentDashboard({
  courseId,
  courseTitle,
  items = [],
  course,
}) {
  const modules = useMemo(() => assessmentModules(course), [course]);
  const [moduleIndex, setModuleIndex] = useState("all");
  useEffect(() => {
    setModuleIndex("all");
  }, [courseId]);
  const moduleTitle =
    moduleIndex === "all"
      ? "All Modules"
      : modules[Number(moduleIndex)]?.title || "Module";
  const scopedItems =
    moduleIndex === "all"
      ? items
      : modules[Number(moduleIndex)]?.quizItems ||
        modules[Number(moduleIndex)]?.quiz_items ||
        [];
  const [type, setType] = useState("practice");
  const [responseView, setResponseView] = useState(false);
  const [view, setView] = useState("graph");
  const [data, setData] = useState({ attempts: [], students: [] });
  const [status, setStatus] = useState("Loading recorded attempts…");
  const [refresh, setRefresh] = useState(0);
  const loadedCourseId = useRef(null);
  const [refreshError, setRefreshError] = useState("");
  useEffect(() => {
    const update = () => setRefresh((value) => value + 1);
    window.addEventListener("focus", update);
    const timer = window.setInterval(update, 10000);
    return () => {
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const isInitialLoad = loadedCourseId.current !== courseId;
    if (isInitialLoad) setStatus("Loading recorded attempts…");
    fetch(`${API_BASE}/assessment-attempts/${encodeURIComponent(courseId)}`, {
      credentials: "include",
      headers: lessonAuthHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success)
          throw Error(result.message || "Could not load attempts.");
        if (controller.signal.aborted) return;
        setData(result);
        loadedCourseId.current = courseId;
        setRefreshError("");
        setStatus("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          if (isInitialLoad) setStatus(error.message);
          else
            setRefreshError(
              "Could not refresh results. Showing the last loaded data.",
            );
        }
      });
    return () => controller.abort();
  }, [courseId, refresh]);
  const summary = useMemo(
    () =>
      summarizeAssessment(
        filterModuleAttempts(data.attempts, moduleIndex, modules).filter(
          (a) => a.assessment_type === type,
        ),
        data.students,
        scopedItems,
      ),
    [data, type, scopedItems, moduleIndex, modules],
  );
  const cognitiveRows = ["LOTS", "HOTS"].map((label) => ({
    label,
    percent: summary.cognitive.find((row) => row.label === label)?.percent || 0,
  }));
  const levels = [
    "Remember",
    "Understand",
    "Apply",
    "Analyze",
    "Evaluate",
    "Create",
  ].map((label) => ({
    label,
    percent: summary.levels.find((row) => row.label === label)?.percent || 0,
  }));
  const skillCounts = cognitiveRows.map((row) => ({
    ...row,
    count: summary.questions.filter((question) => question.skill === row.label)
      .length,
  }));
  const classifiedCount = skillCounts.reduce(
    (total, row) => total + row.count,
    0,
  );
  const lotsShare = classifiedCount
    ? (skillCounts[0].count / classifiedCount) * 100
    : 0;
  const selectType = (next) => {
    setType(next);
    setResponseView(false);
  };
  const metrics = [
    ["Students", summary.students.length],
    ["Attempts", summary.attempts],
    ["Avg. Score", pct(summary.average)],
    ...["LOTS", "HOTS"].map((skill) => [
      `Avg. ${skill}`,
      pct(summary.cognitive.find((r) => r.label === skill)?.percent ?? null),
    ]),
  ];
  return (
    <section className="qa-dashboard">
      {refreshError && <p role="status">{refreshError}</p>}
      <div className="qa-module-filter">
        <label htmlFor="analysis-module">Module</label>
        <select
          id="analysis-module"
          value={moduleIndex}
          onChange={(event) => {
            setModuleIndex(event.target.value);
            setResponseView(false);
          }}
        >
          <option value="all">All Modules</option>
          {modules.map((module, index) => (
            <option key={module.id || index} value={String(index)}>
              {index + 1}. {module.title || `Module ${index + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div className="qa-workspace-navigation">
        <nav className="qa-assessment-tabs" aria-label="Assessment type">
          {["practice", "main"].map((value) => (
            <button
              key={value}
              aria-pressed={type === value}
              onClick={() => selectType(value)}
            >
              {value === "practice" ? "Practice Quiz" : "Main Quiz"}
            </button>
          ))}
        </nav>
        {type === "main" && (
          <button
            className="qa-response-button"
            type="button"
            aria-pressed={responseView}
            onClick={() => setResponseView((value) => !value)}
          >
            {responseView ? "Summary" : "Individual Responses"}
          </button>
        )}
      </div>
      {type === "main" && (moduleIndex !== "all" || responseView) ? (
        <div className="qa-main-analysis">
          <MainQuizAnalysis
            key={`${courseId}:${moduleIndex}`}
            moduleIndex={moduleIndex}
            modules={modules}
            moduleTitle={moduleTitle}
            responseView={responseView}
            onSummary={() => setResponseView(false)}
          />
        </div>
      ) : (
        <div className="qa-content-panel qa-print-report">
          <div className={`${styles.detailTop} qa-heading`}>
            <div className={styles.detailTitle}>
              <p className={styles.detailEyebrow}>
                {type === "practice"
                  ? "PRACTICE QUIZ ANALYSIS"
                  : "MAIN QUIZ ANALYSIS"}
              </p>
              <h2>{courseTitle}</h2>
              <p className="qa-report-module">{moduleTitle}</p>
            </div>
            <button
              type="button"
              className="qa-print-button"
              onClick={() => window.print()}
              disabled={Boolean(status)}
            >
              Print / Save as PDF
            </button>
            <div className={styles.viewSwitch} aria-label="Analysis view">
              <span>View as</span>
              <div>
                <button
                  className={view === "graph" ? styles.activeViewButton : ""}
                  aria-pressed={view === "graph"}
                  onClick={() => setView("graph")}
                >
                  Graphical View
                </button>
                <button
                  className={view === "table" ? styles.activeViewButton : ""}
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                >
                  Table View
                </button>
              </div>
            </div>
          </div>

          {status ? (
            <p role="status">{status}</p>
          ) : (
            <>
              <>
                <div className={styles.analysisSectionTitle}>
                  Overall {type === "practice" ? "Practice" : "Main"} Quiz
                  Analysis
                </div>
                <div className={`${styles.performanceGrid} qa-metrics`}>
                  {metrics.map(([label, value]) => (
                    <article className={styles.performanceCard} key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>

                <div className={styles.analysisSectionTitle}>
                  Topic Performance
                </div>
                <p className="qa-topic-intro">
                  Topic performance shows how accurately students answered
                  questions about each topic across all recorded {type}
                  attempts. It helps identify which topics students understand
                  and which need further explanation or practice. Repeated
                  attempts are included in these results.
                </p>
                {!summary.topics.length ? (
                  <p>
                    Topic performance appears after attempts include question
                    responses.
                  </p>
                ) : view === "graph" ? (
                  <Bars rows={summary.topics} />
                ) : (
                  <div className="qa-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Topic</th>
                          <th>Correct</th>
                          <th>Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.topics.map((topic) => (
                          <tr key={topic.label}>
                            <td>{topic.label}</td>
                            <td>{pct(topic.percent)}</td>
                            <td>
                              {topic.percent >= 80
                                ? "Strong"
                                : topic.percent >= 60
                                  ? "Average"
                                  : "Weak"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className={styles.analysisSectionTitle}>
                  Performance by Thinking Skill
                </div>
                <div className="qa-cognitive-grid">
                  <article className="qa-cognitive-card">
                    <h4>LOTS / HOTS</h4>
                    {view === "graph" ? (
                      <>
                        <div
                          className="qa-donut"
                          role="img"
                          aria-label={
                            classifiedCount
                              ? `Question distribution: LOTS ${pct(lotsShare)}, HOTS ${pct(100 - lotsShare)}`
                              : "No classified question responses yet"
                          }
                          style={{
                            background: classifiedCount
                              ? `conic-gradient(#24476b 0 ${lotsShare}%, #7fa8d6 ${lotsShare}% 100%)`
                              : "#edf1f5",
                          }}
                        >
                          <span>
                            {classifiedCount}
                            <small>questions</small>
                          </span>
                        </div>
                        <div className="qa-chart-legend">
                          <span>
                            <i style={{ background: "#24476b" }} />
                            LOTS {pct(lotsShare)}
                          </span>
                          <span>
                            <i style={{ background: "#7fa8d6" }} />
                            HOTS {pct(classifiedCount ? 100 - lotsShare : 0)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="qa-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Thinking Skill</th>
                              <th>Questions</th>
                              <th>Share (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {skillCounts.map((row) => (
                              <tr key={row.label}>
                                <td>{row.label}</td>
                                <td>{row.count}</td>
                                <td>
                                  {pct(
                                    classifiedCount
                                      ? (row.count / classifiedCount) * 100
                                      : 0,
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p>Share of classified questions in recorded responses.</p>
                  </article>
                  <article className="qa-cognitive-card">
                    <h4>Cognitive Levels</h4>
                    {view === "graph" ? (
                      <Bars rows={levels} />
                    ) : (
                      <div className="qa-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Level</th>
                              <th>Correct</th>
                            </tr>
                          </thead>
                          <tbody>
                            {levels.map((row) => (
                              <tr key={row.label}>
                                <td>{row.label}</td>
                                <td>{pct(row.percent)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <p>Percentage of correct responses at each level.</p>
                  </article>
                </div>
                {view === "table" && (
                  <div className="qa-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Thinking Skill</th>
                          <th>Correct</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cognitiveRows.map((r) => (
                          <tr key={r.label}>
                            <td>{r.label}</td>
                            <td>{pct(r.percent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {view === "graph" && <Bars rows={cognitiveRows} />}
                <p className="qa-skill-guide">
                  LOTS: Lower-Order Thinking Skills · HOTS: Higher-Order
                  Thinking Skills
                </p>
              </>

              <>
                <div className={styles.analysisSectionTitle}>
                  Question Analysis
                </div>
                {!summary.questions.length ? (
                  <p>
                    Question analysis appears after attempts include question
                    responses. Older score-only attempts remain included in
                    overall score totals.
                  </p>
                ) : (
                  <>
                    <div className="qa-table qa-question-analysis">
                      <table>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Topic</th>
                            <th>Skill</th>
                            <th>Level</th>
                            <th>Responses</th>
                            <th>Correct (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.questions.map((q, i) => (
                            <tr key={i}>
                              <td>
                                <strong>Question {i + 1}</strong>
                                <p>{q.question}</p>
                              </td>
                              <td>{q.topic}</td>
                              <td>{q.skill}</td>
                              <td>{q.level || "Unclassified"}</td>
                              <td>{q.responses}</td>
                              <td>
                                {view === "graph" && (
                                  <div
                                    className="qa-bar-track qa-question-bar"
                                    role="meter"
                                    aria-label={`Question ${i + 1} correct responses`}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={q.percent || 0}
                                  >
                                    <div
                                      style={{ width: `${q.percent || 0}%` }}
                                    />
                                  </div>
                                )}
                                {pct(q.percent)}
                                <small style={{ display: "block" }}>
                                  {q.correct} of {q.responses} correct
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            </>
          )}
        </div>
      )}
    </section>
  );
}
