import { useEffect, useMemo, useState } from 'react';
import '../Features/AdminFeaturePages.css';

const STORAGE_KEY = 'admin-modes';

const seedModes = [
  {
    id: 8113789,
    title: 'Flashcards',
    description:
      'Review facts and test your memory in a fun and quick way. Perfect for learning on the go!',
    route: '/flashcards-tutorial',
  },
  {
    id: 5515895,
    title: 'Q & A',
    description:
      'Challenge your brain with interesting questions and discover something new every time you play!',
    route: '/QandA-tutorial',
  },
  {
    id: 9218948,
    title: 'Multiple Choice',
    description:
      'Only one answer is correct. Trust your instincts, think carefully, and aim for that perfect score!',
    route: '/multipleChoice-tutorial',
  },
  {
    id: 7291701,
    title: 'Matching Type',
    description: "Pair the terms, ideas, or clues correctly. It's a fun way to test your memory and logic!",
    route: '/Matching-tutorial',
  },
];

const emptyForm = {
  title: '',
  description: '',
  route: '',
};

function readModes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedModes;
  } catch {
    return seedModes;
  }
}

function getModeCode(mode) {
  return `MD${String(mode.id).padStart(7, '0')}`;
}

export default function ModePage() {
  const [modes, setModes] = useState(() => readModes());
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingMode, setEditingMode] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
  }, [modes]);

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
    });
    setFormOpen(true);
  };

  const saveMode = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.route.trim()) {
      window.alert('Please fill out title, description, and route.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      route: form.route.trim(),
    };

    if (editingMode) {
      setModes((current) =>
        current.map((mode) => (mode.id === editingMode.id ? { ...mode, ...payload } : mode))
      );
    } else {
      setModes((current) => [{ id: Date.now(), ...payload }, ...current]);
    }

    setFormOpen(false);
    setEditingMode(null);
    setForm(emptyForm);
  };

  const deleteMode = (mode) => {
    const ok = window.confirm(`Delete "${mode.title}"?`);
    if (!ok) return;

    setModes((current) => current.filter((item) => item.id !== mode.id));
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
            {filteredModes.length === 0 ? (
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
