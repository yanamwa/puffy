import styles from "./AssessmentAnalysis.module.css";
import MainQuizAnalysis from "./MainQuizAnalysis.jsx";
import { useEffect, useMemo, useState } from "react";
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
function StudentProgressChart({ students }) {
  const series = [
    { key: "first", label: "First", color: "#c1d3e8" },
    { key: "latest", label: "Latest", color: "#7fa8d6" },
    { key: "best", label: "Best", color: "#24476b" },
  ];
  if (!students.length) return null;
  return (
    <div className="qa-progress-chart">
      <div className="qa-chart-legend">
        {series.map((row) => (
          <span key={row.key}>
            <i style={{ background: row.color }} />
            {row.label}
          </span>
        ))}
      </div>
      <div className="qa-progress-scroll">
        <div className="qa-progress-groups">
          {students.map((student, index) => (
            <div className="qa-progress-student" key={index}>
              <div className="qa-progress-bars">
                {series.map((row) => (
                  <div className="qa-progress-series" key={row.key}>
                    <strong>{pct(student[row.key])}</strong>
                    <div className="qa-progress-track">
                      <div
                        style={{
                          height: `${Math.min(100, Math.max(0, student[row.key] || 0))}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <span>{student.name}</span>
            </div>
          ))}
        </div>
      </div>
      <p>First, latest, and best scores by student (0–100%).</p>
    </div>
  );
}

export default function QuizAssessmentDashboard({
  courseId,
  courseTitle,
  items = [],
}) {
  const [type, setType] = useState("practice");
  const [view, setView] = useState("graph");
  const [data, setData] = useState({ attempts: [], students: [] });
  const [status, setStatus] = useState("Loading recorded attempts…");
  const [refresh, setRefresh] = useState(0);
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
    setStatus("Loading recorded attempts…");
    fetch(`${API_BASE}/assessment-attempts/${encodeURIComponent(courseId)}`, {
      credentials: "include",
      headers: lessonAuthHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success)
          throw Error(result.message || "Could not load attempts.");
        setData(result);
        setStatus("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus(error.message);
      });
    return () => controller.abort();
  }, [courseId, refresh]);
  const summary = useMemo(
    () =>
      summarizeAssessment(
        data.attempts.filter((a) => a.assessment_type === type),
        data.students,
        items,
      ),
    [data, type, items],
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
  const selectType = (next) => setType(next);
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
      {type === "main" ? (
        <div className="qa-main-analysis">
          <MainQuizAnalysis />
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
                  Overall Practice Quiz Analysis
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
                  Student Progress
                </div>
                {view === "table" && (
                  <div className="qa-table">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Student</th>
                          <th scope="col">Attempts</th>
                          <th scope="col">First</th>
                          <th scope="col">Latest</th>
                          <th scope="col">Best</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.students.length ? (
                          summary.students.map((student, index) => (
                            <tr key={index}>
                              <td>{student.name}</td>
                              <td>{student.attempts}</td>
                              <td>{pct(student.first)}</td>
                              <td>{pct(student.latest)}</td>
                              <td>{pct(student.best)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>No enrolled students yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {view === "graph" && (
                  <StudentProgressChart students={summary.students} />
                )}
                <div className={styles.analysisSectionTitle}>
                  Topic Performance
                </div>
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
                        {summary.topics.map((r) => (
                          <tr key={r.label}>
                            <td>{r.label}</td>
                            <td>{pct(r.percent)}</td>
                            <td>
                              {r.percent >= 80
                                ? "Strong"
                                : r.percent >= 60
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
                <p className="qa-skill-guide">
                  Correct (%) is the percentage of recorded responses that
                  answered each question correctly: correct responses ÷ total
                  responses × 100. For example, 1 correct answer out of 4
                  responses is 25%. Repeat practice attempts count as additional
                  responses. A higher percentage means the question was answered
                  correctly more often.
                </p>
                {!summary.questions.length ? (
                  <p>
                    Question analysis appears after attempts include question
                    responses. Older score-only attempts remain included in
                    student progress.
                  </p>
                ) : (
                  <>
                    {view === "graph" && (
                      <Bars
                        rows={summary.questions.map((q, i) => ({
                          label: `Question ${i + 1}`,
                          percent: q.percent,
                        }))}
                      />
                    )}
                    {view === "table" && (
                      <div className="qa-table">
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
                    )}
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
