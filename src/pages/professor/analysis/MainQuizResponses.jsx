import { useState } from "react";
import Swal from "sweetalert2";
import { API_BASE } from "../../../config.js";
import { lessonAuthHeaders } from "../../../services/lessonAuth.js";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiPrinter,
  FiMail,
  FiDownload,
} from "react-icons/fi";
import "./MainQuizResponses.css";

import { readMainQuizResponseAnswer } from "../../../services/mainQuizResponse.js";

export default function MainQuizResponses({
  courseId,
  courseTitle,
  quizTitle,
  attempts,
  onBack,
  embedded = false,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [includeKey, setIncludeKey] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const foundIndex = attempts.findIndex(
    (attempt) => String(attempt.id) === String(selectedId),
  );
  const index = foundIndex < 0 ? 0 : foundIndex;
  const attempt = attempts[index];
  const answers = (attempt?.answers || []).map(readMainQuizResponseAnswer);
  const reportText = attempt
    ? [
        courseTitle,
        quizTitle,
        `Student: ${attempt.name}`,
        `Email: ${attempt.email || "Unavailable"}`,
        `Score: ${attempt.earnedScore ?? "Unavailable"} / ${attempt.total}`,
        "",
        ...answers.map(
          (answer, i) =>
            `${i + 1}. ${answer.question}\nStudent answer: ${answer.selected || "No answer"}\nCorrect answer: ${answer.correct || "Not recorded"}${answer.explanation ? `\nExplanation: ${answer.explanation}` : ""}`,
        ),
      ].join("\n")
    : "";
  const changeStudent = (next) => {
    setSelectedId(attempts[next].id);
    setNotice("");
  };
  const emailScore = async () => {
    if (sending || !attempts.length || !courseId) return;
    const escape = (value) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char],
      );
    const recipients = attempts.filter((item) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email || ""),
    );
    const skipped = attempts.length - recipients.length;
    const selection = await Swal.fire({
      title: "Email scores & answer keys",
      html:
        '<p class="quiz-email-description">Each student receives their own saved score and answer key.</p>' +
        '<label class="quiz-email-all"><input type="checkbox" id="quiz-email-all"> Select all students (' +
        recipients.length +
        ")</label>" +
        '<div class="quiz-email-recipients">' +
        recipients
          .map(
            (item, i) =>
              '<label class="quiz-email-recipient"><input type="checkbox" name="quiz-email-recipient" value="' +
              i +
              '" ' +
              (String(item.id) === String(attempt?.id) ? "checked" : "") +
              "><span><strong>" +
              escape(item.name) +
              "</strong><small>" +
              escape(item.email) +
              "</small></span></label>",
          )
          .join("") +
        "</div>" +
        (skipped
          ? '<p class="quiz-email-description">' +
            skipped +
            " response(s) unavailable because the student email is missing or invalid.</p>"
          : ""),
      showCancelButton: true,
      confirmButtonText: "Send emails",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7fa8d6",
      customClass: { popup: "quiz-email-popup" },
      didOpen: (popup) => {
        const all = popup.querySelector("#quiz-email-all");
        const boxes = [
          ...popup.querySelectorAll('input[name="quiz-email-recipient"]'),
        ];
        const sync = () => {
          const count = boxes.filter((box) => box.checked).length;
          all.checked = count > 0 && count === boxes.length;
          all.indeterminate = count > 0 && count < boxes.length;
          Swal.getConfirmButton().textContent = "Send emails (" + count + ")";
        };
        all.addEventListener("change", () => {
          boxes.forEach((box) => {
            box.checked = all.checked;
          });
          sync();
        });
        boxes.forEach((box) => box.addEventListener("change", sync));
        sync();
      },
      preConfirm: () => {
        const chosen = [
          ...Swal.getPopup().querySelectorAll(
            'input[name="quiz-email-recipient"]:checked',
          ),
        ].map((box) => recipients[Number(box.value)]);
        if (!chosen.length) {
          Swal.showValidationMessage("Select at least one student.");
          return false;
        }
        return chosen;
      },
    });
    if (!selection.isConfirmed) return;
    setSending(true);
    setNotice("");
    const failed = [];
    let sent = 0;
    Swal.fire({
      title: "Sending emails…",
      text: "0 of " + selection.value.length + " processed",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      for (const recipient of selection.value) {
        try {
          const response = await fetch(
            `${API_BASE}/assessment-attempts/${encodeURIComponent(courseId)}/${encodeURIComponent(recipient.id)}/email`,
            {
              method: "POST",
              credentials: "include",
              headers: lessonAuthHeaders(),
            },
          );
          const data = await response.json();
          if (!response.ok || !data.success)
            throw new Error(data.message || "Could not send the email.");
          sent++;
        } catch (error) {
          failed.push(
            recipient.name + ": " + (error.message || "Could not send email."),
          );
        }
        Swal.update({
          text:
            sent +
            failed.length +
            " of " +
            selection.value.length +
            " processed",
        });
      }
      const message =
        sent +
        " email(s) sent successfully." +
        (failed.length ? " " + failed.length + " failed." : "");
      setNotice(message);
      await Swal.fire({
        icon: failed.length ? (sent ? "warning" : "error") : "success",
        title: failed.length ? "Email delivery results" : "Emails sent!",
        text:
          message +
          (failed.length
            ? "\n\n" + failed.join("\n")
            : " Students received their scores and answer keys."),
        confirmButtonColor: "#7fa8d6",
      });
    } finally {
      setSending(false);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([reportText], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `main-quiz-result-${attempt.id}.txt`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section
      className={`main-response-page ${embedded ? "main-response-embedded" : ""}`}
    >
      <div className="main-response-toolbar">
        {!embedded && (
          <button type="button" onClick={onBack}>
            <FiArrowLeft /> Back to summary
          </button>
        )}
        <div className="main-response-toolbar-heading">
          <div>
            <span className="main-response-eyebrow">MAIN QUIZ RESPONSES</span>
            <h2>
              Individual responses{" "}
              <span className="main-response-count">{attempts.length}</span>
            </h2>
            <p>
              {courseTitle} · {quizTitle}
            </p>
          </div>
        </div>
        {!embedded && (
          <nav className="main-response-tabs" aria-label="Response views">
            <button type="button" onClick={onBack}>
              Summary
            </button>
            <span className="main-response-active-tab" aria-current="page">
              Individual
            </span>
          </nav>
        )}
        <div className="main-response-actions">
          <div className="main-response-pager">
            <span className="main-response-field-label">Student response</span>
            <button
              type="button"
              aria-label="Previous response"
              onClick={() => changeStudent(index - 1)}
              disabled={index === 0}
            >
              <FiChevronLeft />
            </button>
            <select
              aria-label="Select student response"
              value={attempt?.id ?? ""}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setNotice("");
              }}
            >
              {attempts.map((item, i) => (
                <option key={item.id} value={item.id}>
                  {i + 1}. {item.name}
                </option>
              ))}
            </select>
            <span className="main-response-position">
              {attempts.length ? index + 1 : 0} / {attempts.length}
            </span>
            <button
              type="button"
              aria-label="Next response"
              onClick={() => changeStudent(index + 1)}
              disabled={index >= attempts.length - 1}
            >
              <FiChevronRight />
            </button>
          </div>
          <div className="main-response-action-buttons">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!attempt}
            >
              <FiPrinter /> Print / Save as PDF
            </button>
            <button
              className="main-response-primary"
              type="button"
              onClick={emailScore}
              disabled={!attempts.length || sending || !courseId}
              title="Choose students to receive their scores and answer keys"
            >
              <FiMail /> {sending ? "Sending…" : "Email score & answer key"}
            </button>
            <button type="button" onClick={download} disabled={!attempt}>
              <FiDownload /> Download results
            </button>
          </div>
        </div>
        <label className="main-response-key-toggle">
          <input
            type="checkbox"
            checked={includeKey}
            onChange={(event) => setIncludeKey(event.target.checked)}
          />{" "}
          Show answer key in response and print
        </label>
        <p className="main-response-email-note">
          Choose selected students or all students to receive their own score
          and answer key.
        </p>
        {notice && (
          <p className="main-response-notice" role="status">
            {notice}
          </p>
        )}
      </div>
      {attempt ? (
        <div className="main-response-report qa-print-report">
          <header className="main-response-title main-response-card">
            <div className="main-response-score">
              <strong>
                {attempt.earnedScore ?? "Unavailable"} of {attempt.total} points
              </strong>
              {attempt.submittedAt && (
                <span>
                  Submitted {new Date(attempt.submittedAt).toLocaleString()}
                </span>
              )}
            </div>
            <h1>{courseTitle}</h1>
            <p>{quizTitle}</p>
          </header>
          <section className="main-response-card main-response-student">
            <h3>STUDENT DETAILS</h3>
            <strong>{attempt.name}</strong>
            <p>{attempt.email || "Email not recorded"}</p>
            <p>Section: {attempt.section}</p>
          </section>
          {answers.map((answer, i) => (
            <article
              className={`main-response-card main-response-question ${answer.isCorrect === true ? "response-correct" : answer.isCorrect === false ? "response-incorrect" : ""}`}
              key={i}
            >
              <div className="main-response-question-heading">
                <div>
                  <span className="main-response-question-number">
                    Question {i + 1}
                  </span>
                  <h3>{answer.question}</h3>
                </div>
                <span>
                  {answer.isCorrect === true
                    ? "✓ Correct"
                    : answer.isCorrect === false
                      ? "✕ Incorrect"
                      : "Not graded"}
                </span>
              </div>
              {answer.options.length > 0 && (
                <ul>
                  {answer.options.map((option, j) => (
                    <li
                      key={j}
                      className={
                        option === answer.selected ? "response-selected" : ""
                      }
                    >
                      <span aria-hidden="true">
                        {option === answer.selected ? "◉" : "○"}
                      </span>{" "}
                      {option}
                      {option === answer.selected && (
                        <small>Student answer</small>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p>
                <strong>Student answer:</strong>{" "}
                {answer.selected || "No answer"}
              </p>
              {includeKey && (
                <div className="main-response-answer-key">
                  <p>
                    <strong>Correct answer:</strong>{" "}
                    {answer.correct || "Not recorded"}
                  </p>
                  {answer.explanation && <p>{answer.explanation}</p>}
                </div>
              )}
            </article>
          ))}
          {!answers.length && (
            <p className="main-response-card">
              Question-level answers were not recorded for this response.
            </p>
          )}
        </div>
      ) : (
        <p className="main-response-card">No responses yet.</p>
      )}
    </section>
  );
}
