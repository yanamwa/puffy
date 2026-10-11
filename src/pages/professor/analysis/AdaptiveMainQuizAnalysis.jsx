import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../config.js";
import { lessonAuthHeaders } from "../../../services/lessonAuth.js";
import { summarizeAssessment } from "../../../utils/assessmentAnalytics.js";
const pct = (value) => `${Math.round(value || 0)}%`;
function PerformanceBars({ rows }) {
  return (
    <div className="qa-bars">
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <div
            className="qa-bar-track"
            role="meter"
            aria-label={row.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={row.percent || 0}
          >
            <div style={{ width: pct(row.percent) }} />
          </div>
          <strong>{pct(row.percent)}</strong>
        </div>
      ))}
    </div>
  );
}
export default function AdaptiveMainQuizAnalysis({ courseId }) {
  const [results, setResults] = useState([]),
    [status, setStatus] = useState("Loading Main Quiz results…");
  useEffect(() => {
    const controller = new AbortController();
    setStatus("Loading Main Quiz results…");
    fetch(
      `${API_BASE}/lessons/main-quiz/analysis/${encodeURIComponent(courseId)}`,
      {
        credentials: "include",
        headers: lessonAuthHeaders(),
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success)
          throw Error(data.message || "Could not load results.");
        setResults(data.results);
        setStatus("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus(error.message);
      });
    return () => controller.abort();
  }, [courseId]);
  const summary = useMemo(
    () =>
      summarizeAssessment(
        results.map((row) => ({
          user_id: row.userId,
          student_name: row.studentName,
          score: row.result.score,
          total: row.result.total,
          answers: row.result.answers,
          module_index: row.moduleId,
        })),
        [],
        [],
      ),
    [results],
  );
  if (status) return <p role="status">{status}</p>;
  return (
    <div className="qa-content-panel">
      <h2>Main Quiz Assessment Analysis</h2>
      {!results.length ? (
        <p>No personalized Main Quiz submissions yet.</p>
      ) : (
        <>
          <div className="qa-metrics">
            {[
              ["Students", summary.students.length],
              ["Attempts", results.length],
              ["Avg. Score", pct(summary.average)],
              ["Passed", results.filter((row) => row.result.passed).length],
              [
                "Not Passed",
                results.filter((row) => !row.result.passed).length,
              ],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <h3>Final Performance</h3>
          <div className="qa-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Required</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={index}>
                    <td>{row.studentName}</td>
                    <td>{row.config.lessonTitle}</td>
                    <td>
                      {row.result.score}/{row.result.total} (
                      {pct(row.result.percent)})
                    </td>
                    <td>
                      {row.result.requiredCorrect}/{row.result.total}
                    </td>
                    <td>{row.result.passed ? "Passed" : "Not Passed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Topic Performance</h3>
          <PerformanceBars rows={summary.topics} />
          <h3>Performance by Thinking Skill</h3>
          <PerformanceBars rows={summary.cognitive} />
          <h3>Cognitive Levels</h3>
          <PerformanceBars rows={summary.levels} />
          <h3>Adaptive Table of Specifications</h3>
          {results.map((row, index) => (
            <details key={index}>
              <summary>
                {row.studentName} · {row.config.lessonTitle} ·{" "}
                {row.practiceAttemptId
                  ? "Practice attempt #" + row.practiceAttemptId
                  : "Lesson-based quiz (no practice results)"}
              </summary>
              <p>
                {row.blueprint.lotsCount} LOTS · {row.blueprint.hotsCount} HOTS
              </p>
              <div className="qa-table">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Practice</th>
                      <th>Questions</th>
                      {[
                        "Remember",
                        "Understand",
                        "Apply",
                        "Analyze",
                        "Evaluate",
                        "Create",
                      ].map((level) => (
                        <th key={level}>{level}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {row.blueprint.tosDistribution.map((topic) => (
                      <tr key={topic.topic}>
                        <td>{topic.topic}</td>
                        <td>{pct(topic.practice_percent)}</td>
                        <td>{topic.question_count}</td>
                        {Object.entries(topic.cognitive_levels).map(
                          ([level, count]) => (
                            <td key={level}>{count}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
          <h3>Question Analysis</h3>
          <div className="qa-table">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Topic</th>
                  <th>Skill</th>
                  <th>Level</th>
                  <th>Responses</th>
                  <th>Correct</th>
                </tr>
              </thead>
              <tbody>
                {summary.questions.map((question, index) => (
                  <tr key={index}>
                    <td>{question.question}</td>
                    <td>{question.topic}</td>
                    <td>{question.skill}</td>
                    <td>{question.level}</td>
                    <td>{question.responses}</td>
                    <td>{pct(question.percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
