import { FiRefreshCw, FiRotateCw, FiTrash2, FiFileText, FiPlay } from 'react-icons/fi';
import styles from './LessonSourceManager.module.css';
import { notifyLessonGenerated } from '../../services/lessonNotifications.js';
import { useEffect, useState, useRef } from 'react';
import { retryLessonGeneration, listLessonSources, regenerateLessonSource, deleteLessonSource, waitForLessonJob } from '../../services/lessonRagApi.js';

export default function LessonSourceManager({ courseId, lessonId = null, jobScope, onGenerated }) {
  const [sources, setSources] = useState([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [failedJob, setFailedJob] = useState(null);
  const succeeded = useRef(false);
  const key = `puffy-rag-job:${courseId}:${jobScope || lessonId || 'course'}`;
  const pending = localStorage.getItem(key);
  useEffect(() => { succeeded.current = false; setFailedJob(localStorage.getItem(key + ":failed")); }, [key]);
  const refresh = async () => {
    const result = await listLessonSources(courseId);
    setSources(result.sources.filter(s => String(s.lesson_id || '') === String(lessonId || '')));
    if (!localStorage.getItem(key)) {
      const failed = result.failed_jobs?.find(job => String(job.lesson_id || '') === String(lessonId || ''));
      setFailedJob(succeeded.current ? null : failed?.job_id || null);
    }
  };
  useEffect(() => {
    if (Number(courseId) > 0) refresh().catch(error => setMessage(error.message));
  }, [courseId, lessonId]);
  useEffect(() => {
    let lastRefresh = 0;
    const update = event => {
      if (event.detail.job_id !== localStorage.getItem(key) && event.detail.job_id !== pending) return;
      if (event.detail.status === "failed") { succeeded.current = false; setFailedJob(event.detail.job_id); setMessage("Your files were saved, but generation could not be verified. Retry generation to reuse the indexed sources."); }
      const now = Date.now();
      if (now - lastRefresh > 5000 || ['completed', 'failed'].includes(event.detail.status)) {
        lastRefresh = now;
        refresh().catch(error => setMessage(error.message));
      }
    };
    window.addEventListener('lesson-rag-progress', update);
    return () => window.removeEventListener('lesson-rag-progress', update);
  }, [courseId, lessonId, key, pending]);
  if (!(Number(courseId) > 0)) return null;
  const progress = job => setMessage(`${job.progress}% — ${job.phase}`);
  const queued = jobId => localStorage.setItem(key, jobId);
  const complete = result => {
    onGenerated(result);
    succeeded.current = true;
    localStorage.removeItem(key);
    localStorage.removeItem(key + ':failed');
    setFailedJob(null); setMessage('');
    notifyLessonGenerated(result.lesson_pages?.length);
  };
  const generate = async (id, reindex) => {
    if (!window.confirm('Replace this module’s lesson pages with a new source-based generation?')) return;
    setBusy(true);
    try { complete(await regenerateLessonSource(id, reindex, progress, queued)); await refresh(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const resume = async () => {
    setBusy(true);
    try { complete(await waitForLessonJob(pending, progress)); await refresh(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const retry = async () => {
    setBusy(true); localStorage.setItem(key, failedJob);
    try {
      const result = await retryLessonGeneration(failedJob, progress, queued);
      complete(result); await refresh();
    } catch (error) { setMessage(error.message); localStorage.removeItem(key); }
    finally { setBusy(false); }
  };
  const remove = async id => {
    if (!window.confirm('Delete this source and its searchable chunks? Saved lesson text will remain.')) return;
    setBusy(true);
    try { await deleteLessonSource(id); await refresh(); setMessage('Source deleted.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <details className={styles.panel} aria-busy={busy} onToggle={event => {
    if (event.currentTarget.open) refresh().catch(error => setMessage(error.message));
  }}>
    <summary className={styles.summary}>Saved source documents</summary>
    {pending && <button className={styles.primaryButton} type="button" disabled={busy} onClick={resume}><FiPlay aria-hidden="true" />Resume generation</button>}
    {failedJob && <button className={styles.primaryButton} type="button" disabled={busy} onClick={retry}><FiRotateCw aria-hidden="true" />Retry with saved sources</button>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {!sources.length && <p>No source documents indexed for this module yet.</p>}
    {sources.map(source => <div key={source.document_id} className={styles.source}>
      <div className={styles.sourceHeader}>
        <span className={styles.fileIcon}><FiFileText aria-hidden="true" /></span>
        <div className={styles.sourceInfo}>
          <strong className={styles.filename}>{source.filename}</strong>
          <span className={styles.meta}>{source.chunk_count} searchable chunks</span>
        </div>
        <span className={source.processing_status === 'ready' ? styles.readyBadge : styles.badge}>{source.processing_status}</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={busy || source.processing_status !== 'ready'} onClick={() => generate(source.document_id, false)}><FiPlay aria-hidden="true" />Generate again</button>
        <button className={styles.secondaryButton} type="button" disabled={busy} onClick={() => generate(source.document_id, true)}><FiRefreshCw aria-hidden="true" />Reindex & generate</button>
        <button className={styles.dangerButton} type="button" disabled={busy} onClick={() => remove(source.document_id)}><FiTrash2 aria-hidden="true" />Delete source</button>
      </div>
    </div>)}
  </details>;
}
