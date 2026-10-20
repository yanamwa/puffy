import { useEffect, useRef, useState } from "react";
import { academicCalendarRequest } from "../../services/academicCalendarApi.js";
import {
  CalendarInlinePreview,
  useAcademicCalendars,
} from "../../components/academicCalendar/AcademicCalendar.jsx";
const empty = () => ({
  title: "CvSU Academic Calendar",
  academic_year: "",
  published: true,
  events: [],
});
export default function AcademicCalendarPage() {
  const { records, loading, error, reload } = useAcademicCalendars();
  const [value, setValue] = useState(empty);
  const [files, setFiles] = useState([]);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [importReview, setImportReview] = useState(null);
  const initialized = useRef(false);
  const [importing, setImporting] = useState(false);
  const loadCalendar = (record) => {
    setValue({
      ...record,
      title: "CvSU Academic Calendar",
      events: (record.events || []).map((event) => ({ ...event })),
    });
    setFiles([]);
    setFileKey((key) => key + 1);
    setSaveError("");
    setImportReview(null);
    if (record.filename && !(record.events || []).length)
      importEvents([], record);
  };
  useEffect(() => {
    if (loading || error || initialized.current) return;
    initialized.current = true;
    if (records[0]) loadCalendar(records[0]);
  }, [loading, error, records]);

  const importEvents = async (sourceFiles = files, sourceCalendar = value) => {
    if (
      sourceFiles.length > 5 ||
      sourceFiles.some((item) => item.size > 10 * 1024 * 1024)
    ) {
      setSaveError("Choose up to 5 files, each no larger than 10 MB.");
      return;
    }
    setImporting(true);
    setBusy(true);
    setSaveError("");
    setMessage("");
    try {
      let path = `/${sourceCalendar.calendar_id}/extract`;
      let body;
      if (sourceFiles.length) {
        body = new FormData();
        sourceFiles.forEach((item) => body.append("file", item));
        body.append("academic_year", sourceCalendar.academic_year);
        path = "/extract";
      }
      const data = await academicCalendarRequest(path, {
        method: "POST",
        body,
      });
      setValue((current) => {
        const key = (event) =>
          [
            event.title.trim().toLowerCase().replace(/\s+/g, " "),
            event.start_date,
            event.end_date || event.start_date,
            (event.description || "").trim().toLowerCase().replace(/\s+/g, " "),
          ].join("|");
        const seen = new Set(current.events.map(key));
        return {
          ...current,
          academic_year: current.academic_year || data.academic_year,
          events: [
            ...current.events,
            ...data.events.filter((event) => {
              const id = key(event);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            }),
          ],
        };
      });
      setImportReview({
        count: data.events.length,
        undated: data.undated,
        reviewed: false,
      });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setImporting(false);
      setBusy(false);
    }
  };
  const reset = () => {
    setValue(empty());
    setFiles([]);
    setFileKey((k) => k + 1);
    setSaveError("");
    setImportReview(null);
  };
  const changeEvent = (index, key, field) =>
    setValue((current) => ({
      ...current,
      events: current.events.map((event, i) =>
        i === index ? { ...event, [key]: field } : event,
      ),
    }));
  const save = async (event) => {
    event.preventDefault();
    setSaveError("");
    setMessage("");
    if (importReview && !importReview.reviewed) {
      setSaveError(
        "Review the imported event dates and tick the confirmation before saving.",
      );
      return;
    }
    if (!value.calendar_id && !files.length && !value.events.length) {
      setSaveError("Add an event or upload the official academic calendar.");
      return;
    }
    if (
      files.length > 5 ||
      files.some((item) => item.size > 10 * 1024 * 1024)
    ) {
      setSaveError("Choose up to 5 files, each no larger than 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      for (const key of ["title", "academic_year", "published"])
        body.append(key, value[key]);
      body.append("events", JSON.stringify(value.events));
      files.forEach((item) => body.append("file", item));
      await academicCalendarRequest(
        value.calendar_id ? `/${value.calendar_id}` : "",
        { method: value.calendar_id ? "PUT" : "POST", body },
      );
      setMessage(
        value.published
          ? "Academic calendar published. Students can now view events and descriptions on their calendar."
          : "Calendar saved as a draft. It is hidden from students.",
      );
      initialized.current = false;
      reload();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="academic-management">
      <header className="academic-page-heading super-page-heading">
        <div>
          <h1>Academic Calendar</h1>
          <p>
            Manage CvSU academic dates and descriptions. An official calendar
            document can also be attached.
          </p>
        </div>
      </header>
      {message && (
        <p className="academic-success" role="status">
          {message}
        </p>
      )}
      {records.length > 0 && (
        <label className="academic-saved-year">
          Academic year to manage
          <select
            disabled={busy}
            value={value.calendar_id || "new"}
            onChange={(e) => {
              if (e.target.value === "new") reset();
              else {
                const record = records.find(
                  (item) => String(item.calendar_id) === e.target.value,
                );
                if (record) loadCalendar(record);
              }
            }}
          >
            {records.map((record) => (
              <option value={record.calendar_id} key={record.calendar_id}>
                {record.academic_year}
              </option>
            ))}
            <option value="new">Create a new academic year</option>
          </select>
        </label>
      )}
      {loading && <p role="status">Loading saved calendar and event dates…</p>}
      {error && (
        <p className="academic-error" role="alert">
          {error}{" "}
          <button type="button" onClick={reload}>
            Retry
          </button>
        </p>
      )}
      <form className="academic-editor" onSubmit={save}>
        <h2>
          {value.calendar_id
            ? "Edit academic calendar"
            : "Create academic calendar"}
        </h2>
        <fieldset disabled={busy} className="academic-editor-layout">
          <section
            className="academic-calendar-details"
            aria-label="Calendar details and document"
          >
            <label>
              Academic year
              <input
                required
                pattern="[0-9]{4}-[0-9]{4}"
                maxLength={9}
                placeholder="2026-2027"
                value={value.academic_year}
                onChange={(e) =>
                  setValue({ ...value, academic_year: e.target.value })
                }
              />
            </label>
            <label>
              Official calendar attachments (optional) · PDF, PNG or JPEG · Up
              to 5 files · Maximum 10 MB each
              <input
                key={fileKey}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.jpe,application/pdf,image/png,image/jpeg"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (
                    selected.length > 5 ||
                    selected.some((item) => item.size > 10 * 1024 * 1024)
                  ) {
                    setSaveError(
                      "Choose up to 5 files, each no larger than 10 MB.",
                    );
                    e.target.value = "";
                    return;
                  }
                  setFiles(selected);
                  if (selected.length) importEvents(selected);
                }}
              />
            </label>
            {value.filename && (
              <p>
                Current documents:{" "}
                {(value.documents || [{ filename: value.filename }])
                  .map((item) => item.filename)
                  .join(", ")}
                . Select files above to replace it.
              </p>
            )}
            <button
              type="button"
              className="academic-button"
              disabled={!(files.length || value.filename)}
              onClick={() => importEvents()}
            >
              {busy ? "Reading calendar…" : "Import events from image/PDF"}
            </button>
            <p>
              Selecting images or PDFs automatically combines their dated
              activities in the table. Pages without dates are skipped. Review
              the extracted dates in the table before publishing.
            </p>
            {importReview && (
              <div className="academic-import-review" role="status">
                <p>
                  Found {importReview.count} dated activities. Exact matches
                  already in this calendar are kept once.
                </p>
                {importReview.undated.length > 0 && (
                  <>
                    <p>
                      These entries have no readable date and were not added:
                    </p>
                    <ul>
                      {importReview.undated.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  </>
                )}
                <label className="academic-publish">
                  <input
                    type="checkbox"
                    checked={importReview.reviewed}
                    onChange={(e) =>
                      setImportReview({
                        ...importReview,
                        reviewed: e.target.checked,
                      })
                    }
                  />
                  I checked the imported titles and dates against the official
                  calendar.
                </label>
              </div>
            )}
            {files.length ? (
              files.map((item, index) => (
                <CalendarInlinePreview
                  key={`${fileKey}-${index}`}
                  file={item}
                  calendar={value}
                />
              ))
            ) : value.documents?.length ? (
              value.documents.map((item) => (
                <CalendarInlinePreview
                  key={item.file_index}
                  calendar={{
                    ...value,
                    filename: item.filename,
                    mime_type: item.mime_type,
                  }}
                  index={item.file_index}
                />
              ))
            ) : (
              <CalendarInlinePreview calendar={value} />
            )}
          </section>
          <section
            className="academic-calendar-dates"
            aria-labelledby="academic-dates-title"
          >
            <div className="academic-dates-heading">
              <h3 id="academic-dates-title">
                Dates and activities <span>({value.events.length})</span>
              </h3>
              <button
                type="button"
                className="academic-button"
                disabled={value.events.length >= 200}
                onClick={() =>
                  setValue({
                    ...value,
                    events: [
                      ...value.events,
                      {
                        title: "",
                        description: "",
                        start_date: "",
                        end_date: "",
                      },
                    ],
                  })
                }
              >
                Add event
              </button>
            </div>
            <p>
              Review each activity and date against the calendar. Students can
              select a date to read its details.
            </p>
            <div className="academic-dates-table-wrap">
              <table className="academic-dates-table">
                <thead>
                  <tr>
                    <th scope="col">Activity / Description</th>
                    <th scope="col">Start date</th>
                    <th scope="col">End date</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {value.events.length ? (
                    value.events.map((event, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            aria-label={`Event ${index + 1} title`}
                            required
                            maxLength={200}
                            value={event.title}
                            onChange={(e) =>
                              changeEvent(index, "title", e.target.value)
                            }
                            placeholder="Activity title"
                          />
                          <textarea
                            aria-label={`Event ${index + 1} description`}
                            maxLength={2000}
                            rows={3}
                            value={event.description || ""}
                            onChange={(e) =>
                              changeEvent(index, "description", e.target.value)
                            }
                            placeholder="Description or instructions"
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`Event ${index + 1} start date`}
                            required
                            type="date"
                            value={event.start_date}
                            onChange={(e) =>
                              changeEvent(index, "start_date", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            aria-label={`Event ${index + 1} end date`}
                            type="date"
                            min={event.start_date}
                            value={event.end_date}
                            onChange={(e) =>
                              changeEvent(index, "end_date", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="academic-button"
                            aria-label={`Remove event ${index + 1}`}
                            onClick={() =>
                              setValue({
                                ...value,
                                events: value.events.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="academic-dates-empty">
                        {importing
                          ? "Reading the calendar and filling the event dates…"
                          : "Select a calendar document to fill this table, or add an event manually."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <div className="academic-editor-footer">
            <label className="academic-publish">
              <input
                type="checkbox"
                checked={value.published}
                onChange={(e) =>
                  setValue({ ...value, published: e.target.checked })
                }
              />
              Publish for students
            </label>
            {saveError && (
              <p className="academic-error" role="alert">
                {saveError}
              </p>
            )}
            <div className="academic-form-actions">
              <button
                className="academic-button academic-save-button"
                type="submit"
              >
                {busy
                  ? "Saving…"
                  : value.published
                    ? "Save and Publish"
                    : "Save Draft"}
              </button>
              {value.calendar_id && (
                <button
                  className="academic-button academic-cancel-button"
                  type="button"
                  onClick={reset}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </div>
        </fieldset>
      </form>
    </main>
  );
}
