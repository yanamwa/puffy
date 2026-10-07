import styles from './AssessmentAnalysis.module.css';
import MainQuizAnalysis from './MainQuizAnalysis.jsx';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../../config.js';
import { lessonAuthHeaders } from '../../../services/lessonAuth.js';
import './QuizAssessmentDashboard.css';

const pct = value => value === null || !Number.isFinite(value) ? '0%' : `${Math.round(value)}%`;
import { summarizeAssessment } from '../../../utils/assessmentAnalytics.js';

function Bars({ rows }) {
  return <div className="qa-bars">{rows.map(row => <div key={row.label}><span>{row.label}</span><div className="qa-bar-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.percent || 0} aria-label={row.label}><div style={{ width: `${row.percent || 0}%` }} /></div><strong>{pct(row.percent)}</strong></div>)}</div>;
}
export default function QuizAssessmentDashboard({ courseId, courseTitle, items = [] }) {
  const [type, setType] = useState('practice');
  const [view, setView] = useState('graph');
  const [data, setData] = useState({ attempts: [], students: [] });
  const [status, setStatus] = useState('Loading recorded attempts…');
  useEffect(() => {
    const controller = new AbortController();
    setStatus('Loading recorded attempts…');
    fetch(`${API_BASE}/assessment-attempts/${encodeURIComponent(courseId)}`, { credentials: 'include', headers: lessonAuthHeaders(), signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok || !result.success) throw Error(result.message || 'Could not load attempts.'); setData(result); setStatus(''); })
      .catch(error => { if (error.name !== 'AbortError') setStatus(error.message); });
    return () => controller.abort();
  }, [courseId]);
  const summary = useMemo(() => summarizeAssessment(data.attempts.filter(a => a.assessment_type === type), data.students, items), [data, type, items]);
  const cognitiveRows = ['LOTS', 'HOTS'].map(label => ({ label, percent: summary.cognitive.find(row => row.label === label)?.percent || 0 }));
  const scoreBuckets = ['0–19%', '20–39%', '40–59%', '60–79%', '80–100%'].map((label, index) => ({ label, count: data.attempts.filter(a => a.assessment_type === 'practice' && Number(a.total) > 0 && Math.min(4, Math.floor((Number(a.score) / Number(a.total) * 100) / 20)) === index).length }));
  const selectType = next => setType(next);
  const metrics = [['Total Students', summary.students.length], ['Total Attempts', summary.attempts], ['Avg. Score', pct(summary.average)], ...['LOTS', 'HOTS'].map(skill => [`Average ${skill}`, pct(summary.cognitive.find(r => r.label === skill)?.percent ?? null)])];
  return <section className="qa-dashboard">
    <nav className="qa-assessment-tabs" aria-label="Assessment type">{['practice', 'main'].map(value => <button key={value} aria-pressed={type === value} onClick={() => selectType(value)}>{value === 'practice' ? 'Practice Quiz' : 'Main Quiz'}</button>)}</nav>
    {type === 'main' ? <div className="qa-main-analysis"><MainQuizAnalysis /></div> : <div className="qa-content-panel">
    <div className={`${styles.detailTop} qa-heading`}><div className={styles.detailTitle}><p className={styles.detailEyebrow}>{type === 'practice' ? 'PRACTICE QUIZ ANALYSIS' : 'MAIN QUIZ ANALYSIS'}</p><h2>{courseTitle}</h2></div><div className={styles.viewSwitch} aria-label="Analysis view"><span>View as</span><div><button className={view === 'graph' ? styles.activeViewButton : ''} aria-pressed={view === 'graph'} onClick={() => setView('graph')}>Graphical View</button><button className={view === 'table' ? styles.activeViewButton : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>Table View</button></div></div></div>

    {status ? <p role="status">{status}</p> : <>
      <><div className={styles.analysisSectionTitle}>Overall Practice Quiz Analysis</div><div className={`${styles.performanceGrid} qa-metrics`}>{metrics.map(([label, value]) => <article className={styles.performanceCard} key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>

        <div className={styles.analysisSectionTitle}>Student Progress</div>
        <div className="qa-table"><table><thead><tr><th scope="col">Student</th><th scope="col">Attempts</th><th scope="col">First</th><th scope="col">Latest</th><th scope="col">Best</th></tr></thead><tbody>{summary.students.length ? summary.students.map((student, index) => <tr key={index}><td>{student.name}</td><td>{student.attempts}</td><td>{pct(student.first)}</td><td>{pct(student.latest)}</td><td>{pct(student.best)}</td></tr>) : <tr><td colSpan={5}>No enrolled students yet.</td></tr>}</tbody></table></div>
        {view === 'graph' && <><h3 className={styles.chartTitle}>Practice Score Distribution</h3><div className="qa-score-chart" role="img" aria-label={scoreBuckets.map(b => `${b.label}: ${b.count} attempts`).join(', ')}>{scoreBuckets.map(bucket => <div key={bucket.label}><strong>{bucket.count}</strong><div className="qa-score-track"><div style={{ height: `${bucket.count / Math.max(1, ...scoreBuckets.map(b => b.count)) * 100}%` }} /></div><span>{bucket.label}</span></div>)}</div><div className={styles.analysisSectionTitle}>Practice Overview</div><div className={styles.pieGrid}>{cognitiveRows.map(row => <article className={styles.pieCard} key={row.label}><h4>{row.label} Performance</h4><div className={styles.pieGraphic} style={{ background: `conic-gradient(${row.label === 'LOTS' ? '#7fa8d6' : '#a8c0dc'} 0 ${row.percent}%, #edf1f5 ${row.percent}% 100%)` }}><span><strong>{pct(row.percent)}</strong></span></div><p>Correct responses</p></article>)}</div></>}
        <div className={styles.analysisSectionTitle}>Topic Performance</div>{!summary.topics.length ? <p>Topic performance appears after attempts include question responses.</p> : view === 'graph' ? <Bars rows={summary.topics} /> : <div className="qa-table"><table><thead><tr><th>Topic</th><th>Correct</th><th>Performance</th></tr></thead><tbody>{summary.topics.map(r => <tr key={r.label}><td>{r.label}</td><td>{pct(r.percent)}</td><td>{r.percent >= 80 ? 'Strong' : r.percent >= 60 ? 'Average' : 'Weak'}</td></tr>)}</tbody></table></div>}
        <div className={styles.analysisSectionTitle}>Cognitive Performance</div>{view === 'graph' ? <Bars rows={cognitiveRows} /> : <div className="qa-table"><table><thead><tr><th>Thinking Skill</th><th>Correct</th></tr></thead><tbody>{cognitiveRows.map(r => <tr key={r.label}><td>{r.label}</td><td>{pct(r.percent)}</td></tr>)}</tbody></table></div>}</>

      <><div className={styles.analysisSectionTitle}>Question Analysis</div>{!summary.questions.length ? <p>Question analysis appears after attempts include question responses. Older score-only attempts remain included in student progress.</p> : <>{view === 'graph' && <Bars rows={summary.questions.map((q, i) => ({ label: `Question ${i + 1}`, percent: q.percent }))} />}<div className="qa-table"><table><thead><tr><th>Question</th><th>Topic</th><th>Skill</th><th>Level</th><th>Responses</th><th>Correct</th></tr></thead><tbody>{summary.questions.map((q, i) => <tr key={i}><td><strong>Question {i + 1}</strong><p>{q.question}</p></td><td>{q.topic}</td><td>{q.skill}</td><td>{q.level || 'Unclassified'}</td><td>{q.responses}</td><td>{pct(q.percent)}</td></tr>)}</tbody></table></div></>}</>
    </>}
    </div>}
  </section>;
}
