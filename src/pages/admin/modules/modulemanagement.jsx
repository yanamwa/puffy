import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE } from "../../config.js";
import "boxicons/css/boxicons.min.css";
import styles from "./modulemanage.module.css";
import AHeader from "../../components/AHeader";
import ASidebar from "../../components/ASidebar";
import LoadingState from "../../components/LoadingState.jsx";

function formatToday() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function parseDeckCards(raw) {
  if (!raw) return [];

  const text = String(raw).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed
        .map((x, i) => ({
          id: i + 1,
          question: String(x.question ?? x.q ?? "").trim(),
          answer: String(
            x.correct_answer ?? x.correctAnswer ?? x.answer ?? x.a ?? ""
          ).trim(),
        }))
        .filter((c) => c.question || c.answer);
    }
  } catch {}

  const blocks = text
    .split(/\n\s*\n+/g)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length) {
    return blocks.map((block, idx) => {
      const lines = block.split("\n").filter(Boolean);

      return {
        id: idx + 1,
        question: lines[0] || "",
        answer: lines.slice(1).join("\n"),
      };
    });
  }

  const lines = text.split("\n").filter(Boolean);
  const cards = [];

  for (let i = 0; i < lines.length; i += 2) {
    cards.push({
      id: cards.length + 1,
      question: lines[i] || "",
      answer: lines[i + 1] || "",
    });
  }

  return cards;
}

export default function ModuleManagement() {
  const navigate = useNavigate();
  const API_URL = `${API_BASE}/adminLearningModule.php`;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [bellNotifications, setBellNotifications] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsToShow, setRowsToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [textViewOpen, setTextViewOpen] = useState(false);
  const [textViewTitle, setTextViewTitle] = useState("");
  const [textViewContent, setTextViewContent] = useState("");
  const fetchedOnce = useRef(false);
  const [admin, setAdmin] = useState({
    id: "",
    username: "Admin",
    full_name: "",
    email: "",
    role: "",
    profile_image: "/images/temporary profile.jpg",
  });

  const adminImage =
    admin.profile_image && !admin.profile_image.includes("temporary profile.jpg")
      ? admin.profile_image.startsWith("http")
        ? admin.profile_image
        : `${API_BASE}/${admin.profile_image.replace(/^\/+/, "")}`
      : "/images/temporary profile.jpg";

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAdminProfile.php`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) {
        console.error(data.message || "Admin not found");
        return;
      }

      setAdmin({
        id: data.admin?.id || data.admin?.AdminID || "",
        username: data.admin?.username || data.admin?.Username || "Admin",
        full_name: data.admin?.full_name || data.admin?.FullName || "",
        email: data.admin?.email || data.admin?.Email || "",
        role: data.admin?.role || data.admin?.Role || "Administrator",
        profile_image:
          data.admin?.profile_image || "/images/temporary profile.jpg",
      });
    } catch (err) {
      console.error("Fetch admin error:", err);
    }
  };

  const fetchBellNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAdminNotifications.php`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setBellNotifications(data.notifications || []);
      } else {
        setBellNotifications([]);
      }
    } catch (err) {
      console.error("Bell notification fetch error:", err);
      setBellNotifications([]);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();

    try {
      const res = await fetch(`${API_BASE}/markAdminNotificationsRead.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.success) {
        await fetchBellNotifications();
        setNotificationOpen(true);
      } else {
        Swal.fire("Error", data.message || "Failed to mark as read.", "error");
      }
    } catch (err) {
      console.error("Mark all as read error:", err);
      Swal.fire("Server Error", "Failed to mark as read.", "error");
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7b5cff",
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`${API_BASE}/adminLogout.php`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }

    localStorage.removeItem("admin");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_username");
    localStorage.removeItem("admin_email");
    sessionStorage.clear();

    navigate("/pb-admin-access", { replace: true });
  };

  const openTextView = (title, content) => {
    setTextViewTitle(title);
    setTextViewContent(content || "—");
    setTextViewOpen(true);
  };

  const closeTextView = () => {
    setTextViewOpen(false);
    setTextViewTitle("");
    setTextViewContent("");
  };

  const getPreviewText = (text, max = 140) => {
    const clean = String(text || "").trim();
    if (!clean) return "—";
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (data?.success && Array.isArray(data.modules)) {
        setModules(
          data.modules.map((m) => ({
            id: m.id,
            title: m.title,
              date: m.created_at
                ? new Date(m.created_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : formatToday(),
            status: String(m.status || "").toLowerCase(),
            module_description: m.description ?? "",
            subject: m.subject ?? "",
            learningObjectives: m.learning_objectives ?? "",
            lessonContent: m.lesson_content ?? "",
            quizModule: m.quiz_contents ?? "",
          }))
        );
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error(err);
      setModules([]);

      await Swal.fire({
        icon: "error",
        title: "Load Failed",
        text: "Could not fetch modules.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async (mod) => {
    if (!mod?.id) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: mod.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetchModules();

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Module has been deleted.",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: data.message || "Delete failed.",
        });
      }
    } catch (err) {
      console.error(err);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting module.",
      });
    }
  };

  const openDelete = (mod) => {
    setDeleteTarget(mod);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget?.id) return;

    await confirmDelete(deleteTarget);
    closeDelete();
  };

  useEffect(() => {
    if (fetchedOnce.current) return;

    fetchedOnce.current = true;

    fetchAdmin();
    fetchModules();
    fetchBellNotifications();

    const handler = (e) => {
      const insideDropdown = e.target.closest('[class*="notificationWrapper"]');

      if (!insideDropdown) {
        setNotificationOpen(false);
      }
    };

    window.addEventListener("click", handler);

    return () => {
      window.removeEventListener("click", handler);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowsToShow]);

  const filteredModules = useMemo(
    () =>
      modules.filter((m) =>
        String(m.title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [modules, searchQuery]
  );

  const totalPages = Math.ceil(filteredModules.length / rowsToShow);

  const shownModules = useMemo(() => {
    const start = (currentPage - 1) * rowsToShow;
    const end = start + rowsToShow;

    return filteredModules.slice(start, end);
  }, [filteredModules, currentPage, rowsToShow]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedId) || null,
    [modules, selectedId]
  );

  const selectedCards = useMemo(
    () => (selectedModule ? parseDeckCards(selectedModule.quizModule) : []),
    [selectedModule]
  );

  const openView = (mod) => {
    setSelectedId(mod.id);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelectedId(null);
  };

  const openAdd = () => {
    navigate("/admin/modules/new");
  };

  const openEdit = (mod) => {
    navigate(`/admin/modules/edit/${mod.id}`);
  };

  return (
    <div
className={`${styles.layout} ${
  isCollapsed ? styles.collapsedGrid : ""
}`}
    >
      <ASidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        handleLogout={handleLogout}
      />

      <AHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        notificationOpen={notificationOpen}
        setNotificationOpen={setNotificationOpen}
        bellNotifications={bellNotifications}
        handleMarkAllAsRead={handleMarkAllAsRead}
        admin={admin}
        adminImage={adminImage}
      />

      <main className={styles.main}>
        <div className={styles.pageTop}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Module Management</h1>
            <p>Create and manage learning modules for PuffyBrain users.</p>
          </div>

          <button type="button" className={styles.addBtn} onClick={openAdd}>
            + Add new module
          </button>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Module ID</th>
                <th>Module Title</th>
                <th>Date created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    <LoadingState fullPage={false} />
                  </td>
                </tr>
              ) : shownModules.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No modules found.
                  </td>
                </tr>
              ) : (
                shownModules.map((mod) => (
                  <tr key={mod.id}>
                    <td>
                      {`MOD${String(mod.date)
                        .replace(/[-/: ]/g, "")
                        .slice(2, 10)}${String(mod.id).padStart(3, "0")}`}
                    </td>

                    <td>{mod.title}</td>
                    <td>{mod.date}</td>

                    <td>
                      <span
                        className={
                          mod.status === "publish"
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        ● {mod.status === "publish" ? "Publish" : "Draft"}
                      </span>
                    </td>

                    <td className={styles.actions}>
                      <button
                        type="button"
                        className={styles.actionEdit}
                        onClick={() => openEdit(mod)}
                      >
                        <i className="bx bx-pencil"></i>
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionDelete}
                        onClick={() => openDelete(mod)}
                      >
                        <i className="bx bx-trash"></i>
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        className={styles.actionView}
                        onClick={() => openView(mod)}
                      >
                        <i className="bx bx-show"></i>
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className={styles.paginationWrapper}>
            <div className={styles.paginationCenter}>
              <button
                className={styles.navBtn}
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                {"<"}
              </button>

              {[...Array(totalPages || 1)].map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    className={`${styles.pageBtn} ${
                      currentPage === page ? styles.pageActive : ""
                    }`}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className={styles.navBtn}
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                {">"}
              </button>
            </div>

            <div className={styles.rowsControl}>
              <span>Show</span>

              <select
                value={rowsToShow}
                onChange={(e) => setRowsToShow(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span>Row</span>
            </div>
          </div>
        </div>
      </main>

      {viewOpen && selectedModule && (
        <div className={styles.mmOverlay} onClick={closeView}>
          <div className={styles.mmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mmHeader}>
              <h2 className={styles.mmTitle}>Module Details:</h2>

              <button
                type="button"
                className={styles.mmHeaderEdit}
                onClick={() => openEdit(selectedModule)}
              >
                Edit
              </button>

              <button
                type="button"
                className={styles.mmClose}
                onClick={closeView}
              >
                ✕
              </button>
            </div>

            <div className={styles.mmBody}>
              <div className={styles.mmDetails}>
                <div className={styles.mmCol}>
                  <div className={styles.mmGroup}>
                    <div className={styles.mmLabel}>Module Title</div>
                    <div className={styles.mmValue}>
                      {selectedModule.title || "—"}
                    </div>
                  </div>

                  <div className={styles.mmGroup}>
                    <div className={styles.mmLabel}>Module Description</div>
                    <div className={styles.mmValue}>
                      {selectedModule.module_description?.trim()
                        ? selectedModule.module_description
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className={styles.mmCol}>
                  <div className={styles.mmGroup}>
                    <div className={styles.mmLabelRow}>
                      <div className={styles.mmLabel}>Learning Objectives</div>

                      <button
                        type="button"
                        className={styles.mmViewBtn}
                        onClick={() =>
                          openTextView(
                            "Learning Objectives",
                            selectedModule.learningObjectives
                          )
                        }
                      >
                        View
                      </button>
                    </div>

                    <div className={styles.mmValue}>
                      {getPreviewText(selectedModule.learningObjectives)}
                    </div>
                  </div>

                  <div className={styles.mmGroup}>
                    <div className={styles.mmLabelRow}>
                      <div className={styles.mmLabel}>Lessons</div>

                      <button
                        type="button"
                        className={styles.mmViewBtn}
                        onClick={() =>
                          openTextView(
                            "Lessons",
                            (() => {
                              try {
                                const parsed = JSON.parse(
                                  selectedModule.lessonContent
                                );

                                if (Array.isArray(parsed)) {
                                  return parsed
                                    .map((page) => page.content || "")
                                    .join("\n\n");
                                }
                              } catch {}

                              return selectedModule.lessonContent;
                            })()
                          )
                        }
                      >
                        View
                      </button>
                    </div>

                    <div className={styles.mmValue}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(
                            selectedModule.lessonContent
                          );

                          if (Array.isArray(parsed)) {
                            return getPreviewText(
                              parsed.map((page) => page.content || "").join(" ")
                            );
                          }
                        } catch {}

                        return getPreviewText(selectedModule.lessonContent);
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.mmDecksTitle}>Module decks</div>

              {selectedCards.length > 0 ? (
                selectedCards.map((c) => (
                  <div key={c.id} className={styles.mmCard}>
                    <div className={styles.mmQ}>{c.question || "—"}</div>
                    <div className={styles.mmA}>{c.answer || "—"}</div>
                  </div>
                ))
              ) : (
                <div className={styles.mmCard}>
                  <div className={styles.mmQ}>No decks yet</div>
                  <div className={styles.mmA}>—</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {textViewOpen && (
        <div className={styles.popupOverlay} onClick={closeTextView}>
          <div
            className={styles.textViewModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>{textViewTitle}</h2>

              <button
                type="button"
                className={styles.popupClose}
                onClick={closeTextView}
              >
                ✕
              </button>
            </div>

            <div className={styles.textViewBody}>{textViewContent}</div>
          </div>
        </div>
      )}

      {deleteOpen && deleteTarget && (
        <div className={styles.popupOverlay} onClick={closeDelete}>
          <div
            className={styles.popupDeleteModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>Delete Module</h2>

              <button
                type="button"
                className={styles.popupClose}
                onClick={closeDelete}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupBody}>
              <p className={styles.popupDeleteText}>
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.title}</strong>?
              </p>

              <div className={styles.warningBox}>
                <i className="bx bx-error-circle"></i>
                <span>This action cannot be undone.</span>
              </div>

              <div className={styles.popupActions}>
                <button
                  className={styles.popupCancelBtn}
                  type="button"
                  onClick={closeDelete}
                >
                  Cancel
                </button>

                <button
                  className={styles.popupDeleteBtn}
                  type="button"
                  onClick={handleDeleteConfirmed}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
