import { useEffect, useMemo, useState } from 'react';
import {
  deleteQuizModeById,
  fetchQuizModes,
  saveQuizMode,
} from '../../../services/quizModeApi.js';
import '../Features/AdminFeaturePages.css';

const emptyForm = {
  title: '',
  description: '',
  route: '',
  image: '',
};

function getModeCode(mode) {
  return `MD${String(mode.id).padStart(7, '0')}`;
}

export default function ModePage() {
  const [modes, setModes] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingMode, setEditingMode] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadModes() {
      try {
        setLoading(true);
        const loadedModes = await fetchQuizModes();

        if (active) {
          setModes(loadedModes);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadModes();

    return () => {
      active = false;
    };
  }, []);

  const filteredModes = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return modes;

    return modes.filter((mode) =>
      [mode.id, mode.title, mode.description, mode.route]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }, [modes, query]);

  const openAdd = () => {
    setEditingMode(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (mode) => {
    setEditingMode(mode);
    setForm({
      title: mode.title || '',
      description: mode.description || '',
      route: mode.route || '',
      image: mode.image || '',
    });
    setFormOpen(true);
  };

  const saveMode = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.route.trim()) {
      window.alert('Please fill out title, description, and route.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      route: form.route.trim(),
      image: form.image.trim(),
    };

    const savedMode = await saveQuizMode(
      editingMode ? { ...editingMode, ...payload } : payload
    );

    setModes((current) =>
      editingMode
        ? current.map((mode) =>
            String(mode.id) === String(savedMode.id) ? savedMode : mode
          )
        : [savedMode, ...current]
    );

    setFormOpen(false);
    setEditingMode(null);
    setForm(emptyForm);
  };

  const deleteMode = async (mode) => {
    const ok = window.confirm(`Delete "${mode.title}"?`);
    if (!ok) return;

    await deleteQuizModeById(mode.id);
    setModes((current) =>
      current.filter((item) => String(item.id) !== String(mode.id))
    );
  };

  return (
    <div className="admin-page feature-page">
      <div className="feature-page-top">
        <div>
          <h1>Mode Management</h1>
          <p>Create and manage practice modes for PuffyBrain users.</p>
        </div>
        <button className="primary-feature-btn compact" type="button" onClick={openAdd}>
          + Add New Mode
        </button>
      </div>

      <div className="mode-search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search mode..."
        />
      </div>

      <div className="mode-table-wrap">
        <table className="mode-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Route</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="feature-empty" colSpan="5">
                  Loading modes...
                </td>
              </tr>
            ) : filteredModes.length === 0 ? (
              <tr>
                <td className="feature-empty" colSpan="5">
                  No modes found.
                </td>
              </tr>
            ) : (
              filteredModes.map((mode) => (
                <tr key={mode.id}>
                  <td className="mode-id">{getModeCode(mode)}</td>
                  <td>{mode.title}</td>
                  <td>{mode.description}</td>
                  <td>{mode.route}</td>
                  <td>
                    <div className="mode-actions">
                      <button className="view-btn" type="button" onClick={() => setViewMode(mode)}>
                        View
                      </button>
                      <button className="edit-btn" type="button" onClick={() => openEdit(mode)}>
                        Edit
                      </button>
                      <button className="delete-btn" type="button" onClick={() => deleteMode(mode)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="feature-modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="feature-modal" onSubmit={saveMode} onClick={(event) => event.stopPropagation()}>
            <h2>{editingMode ? 'Edit Mode' : 'Add New Mode'}</h2>
            <label className="feature-field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Mode title"
              />
            </label>
            <label className="feature-field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Mode description"
              />
            </label>
            <label className="feature-field">
              <span>Route</span>
              <input
                value={form.route}
                onChange={(event) => setForm((current) => ({ ...current, route: event.target.value }))}
                placeholder="/flashcards-tutorial"
              />
            </label>
            <label className="feature-field">
              <span>Image Path</span>
              <input
                value={form.image}
                onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                placeholder="/images/flashcard.png"
              />
            </label>
            <div className="feature-modal-actions">
              <button type="button" className="secondary-feature-btn" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-feature-btn">
                Save Mode
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode && (
        <div className="feature-modal-backdrop" onClick={() => setViewMode(null)}>
          <section className="feature-modal" onClick={(event) => event.stopPropagation()}>
            <h2>View Mode</h2>
            <dl className="feature-details">
              <div>
                <dt>ID</dt>
                <dd>{getModeCode(viewMode)}</dd>
              </div>
              <div>
                <dt>Title</dt>
                <dd>{viewMode.title}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{viewMode.description}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>{viewMode.route}</dd>
              </div>
              <div>
                <dt>Image</dt>
                <dd>{viewMode.image || 'Default image'}</dd>
              </div>
            </dl>
            <div className="feature-modal-actions">
              <button type="button" className="primary-feature-btn" onClick={() => setViewMode(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
