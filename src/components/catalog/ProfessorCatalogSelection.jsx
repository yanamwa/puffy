import { applyCatalogToDraft } from "../../services/catalogCourseDraft.js";
import "./catalog.css";
import { useEffect, useState, useRef } from "react";
import { catalogRequest } from "../../services/catalogApi.js";

export default function ProfessorCatalogSelection({
  form,
  onChange,
  isEditing,
}) {
  const [courses, setCourses] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [revision, setRevision] = useState(0);
  const root = useRef(null),
    input = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const locked = isEditing || Number(form.id) > 0;
  useEffect(() => {
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    let active = true;
    const load = () =>
      catalogRequest("/active")
        .then((data) => {
          if (active) {
            setCourses(data.courses);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    load();
    window.addEventListener("puffy-catalog-updated", load);
    return () => {
      active = false;
      window.removeEventListener("puffy-catalog-updated", load);
    };
  }, [revision]);
  const selected = courses.find(
    (c) => String(c.catalog_id) === String(form.catalogId),
  );
  const filtered = courses.filter((c) =>
    (c.code + " " + c.title).toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (
      !locked &&
      selected?.versions?.length &&
      !form.contentModules?.length &&
      !form.coverageSeededVersionId
    )
      onChange(applyCatalogToDraft(form, selected));
  }, [locked, selected, form, onChange]);
  const choose = (course) => {
    onChange(applyCatalogToDraft(form, course));
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    input.current?.focus();
  };
  const label = selected
    ? `${selected.code} — ${selected.title}`
    : form.catalogId
      ? `${form.catalogCode} — ${form.title}`
      : "";
  return (
    <section
      ref={root}
      className="catalog-selection"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      aria-label="Official course and class details"
    >
      {!locked ? (
        <>
          <label htmlFor="catalog-combobox">Course Catalog *</label>
          <div className="catalog-combobox-wrap">
            <div className="catalog-combobox-control">
              <input
                ref={input}
                id="catalog-combobox"
                role="combobox"
                aria-expanded={open}
                aria-controls="catalog-options"
                aria-autocomplete="list"
                aria-activedescendant={
                  open && filtered[activeIndex]
                    ? `catalog-option-${filtered[activeIndex].catalog_id}`
                    : undefined
                }
                autoComplete="off"
                placeholder="Search course code or title…"
                value={open ? query : label}
                disabled={loading}
                onClick={() => {
                  if (!open) {
                    setOpen(true);
                    setQuery("");
                    setActiveIndex(0);
                  }
                }}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                  setActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    setQuery("");
                  }
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    setOpen(true);
                    setActiveIndex((index) =>
                      !open
                        ? 0
                        : Math.max(
                            0,
                            Math.min(
                              filtered.length - 1,
                              index + (event.key === "ArrowDown" ? 1 : -1),
                            ),
                          ),
                    );
                  }
                  if (event.key === "Enter" && open) {
                    event.preventDefault();
                    if (filtered[activeIndex]) choose(filtered[activeIndex]);
                  }
                }}
              />
              <button
                type="button"
                aria-label="Toggle course catalog"
                aria-expanded={open}
                disabled={loading}
                onClick={() => {
                  setOpen(!open);
                  setQuery("");
                  setActiveIndex(0);
                  input.current?.focus();
                }}
              >
                ▾
              </button>
            </div>
            {open && (
              <div
                id="catalog-options"
                role="listbox"
                aria-label="Active courses"
              >
                {filtered.map((course, index) => (
                  <button
                    id={`catalog-option-${course.catalog_id}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={
                      String(form.catalogId) === String(course.catalog_id)
                    }
                    className={
                      index === activeIndex ? "catalog-option-highlight" : ""
                    }
                    key={course.catalog_id}
                    type="button"
                    onPointerDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(course)}
                  >
                    {course.code} — {course.title}
                  </button>
                ))}
                {!filtered.length && !loading && (
                  <p>
                    {courses.length
                      ? "No matching courses."
                      : "No courses are available yet. Please contact an administrator."}
                  </p>
                )}
              </div>
            )}
          </div>
          {loading && <p role="status">Loading active courses…</p>}
          {!loading && !courses.length && !error && (
            <p>
              No courses are available yet. Please contact an administrator.
            </p>
          )}
        </>
      ) : (
        <label htmlFor="catalog-official-code">
          Course Code
          <input
            id="catalog-official-code"
            value={form.catalogCode || form.code || ""}
            readOnly
            aria-readonly="true"
          />
        </label>
      )}
      {error && (
        <p role="alert" className="catalog-error">
          {error}{" "}
          <button type="button" onClick={() => setRevision((v) => v + 1)}>
            Retry
          </button>
        </p>
      )}
    </section>
  );
}
