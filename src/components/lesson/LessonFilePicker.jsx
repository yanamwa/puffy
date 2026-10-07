import { useState } from 'react';
import styles from './LessonFilePicker.module.css';

export default function LessonFilePicker({ files = [], onChange, disabled, buttonClassName }) {
  const [error, setError] = useState('');
  const choose = event => {
    const selected = Array.from(event.target.files || []);
    const combined = [...new Map([...files, ...selected].map(file => [`${file.name}:${file.size}:${file.lastModified}`, file])).values()];
    let message = '';
    if (combined.some(file => !/\.(pdf|ppt|pptx|txt|docx)$/i.test(file.name))) message = 'Choose PDF, PPT, PPTX, TXT, or DOCX files.';
    else if (combined.length > 10) message = 'Choose at most 10 files.';
    else if (combined.some(file => file.size > 25 * 1024 * 1024)) message = 'Each file must be 25 MB or smaller.';
    else if (combined.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) message = 'The combined files must be 50 MB or smaller.';
    setError(message);
    if (!message) onChange(combined);
    event.target.value = '';
  };
  return <div className={styles.picker}>
    <label className={buttonClassName}>Upload Files Here
      <input type="file" multiple accept=".pdf,.ppt,.pptx,.txt,.docx" disabled={disabled} onChange={choose} />
    </label>
    <small>PDF, PPT, PPTX, TXT, DOCX · Up to 10 files · 25 MB each / 50 MB total</small>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {files.length ? <ul className={styles.files}>
      {files.map((file, index) => <li key={`${file.name}:${index}`}>
        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={() => {
          onChange(files.filter((_, i) => i !== index)); setError('');
        }}>Remove</button>
      </li>)}
    </ul> : <small>No files chosen</small>}
  </div>;
}
