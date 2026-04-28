import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewLogsApi, QUERY_KEYS } from '../../api';
import styles from './MyInterviewsPage.module.css';

const ROUND_TYPES = ['PHONE','ONSITE','VIRTUAL','TAKE_HOME','FINAL','CODING','SYSTEM_DESIGN','BEHAVIORAL'];
const OUTCOMES    = ['PENDING','OFFER','REJECTED','GHOSTED','WITHDREW'];

const OUTCOME_COLORS = {
  OFFER: 'var(--green)',
  REJECTED: 'var(--red)',
  GHOSTED: 'var(--text3)',
  PENDING: 'var(--accent)',
  WITHDREW: 'var(--text3)',
};

function LogForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    company: '', interviewDate: '', roundType: 'CODING',
    outcome: 'PENDING', topicsAsked: '', notes: '', selfScore: '',
    ...initial,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className={styles.formCard}>
      <div className={styles.formGrid}>
        <label className={styles.label}>
          Company *
          <input className={styles.input} value={form.company}
            onChange={(e) => set('company', e.target.value)} placeholder="e.g. Google" />
        </label>
        <label className={styles.label}>
          Date
          <input className={styles.input} type="date" value={form.interviewDate || ''}
            onChange={(e) => set('interviewDate', e.target.value)} />
        </label>
        <label className={styles.label}>
          Round Type
          <select className={styles.select} value={form.roundType}
            onChange={(e) => set('roundType', e.target.value)}>
            {ROUND_TYPES.map((r) => <option key={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className={styles.label}>
          Outcome
          <select className={styles.select} value={form.outcome}
            onChange={(e) => set('outcome', e.target.value)}>
            {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </label>
        <label className={styles.label}>
          Self Score (1–10)
          <input className={styles.input} type="number" min={1} max={10}
            value={form.selfScore || ''} onChange={(e) => set('selfScore', e.target.value)} />
        </label>
        <label className={styles.label}>
          Topics Asked
          <input className={styles.input} value={form.topicsAsked || ''}
            onChange={(e) => set('topicsAsked', e.target.value)}
            placeholder="e.g. Arrays, System Design" />
        </label>
      </div>
      <label className={styles.label} style={{ marginTop: 12 }}>
        Notes
        <textarea className={styles.textarea} rows={3} value={form.notes || ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="What went well? What did you forget?" />
      </label>
      <div className={styles.formActions}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary btn-sm"
          disabled={!form.company.trim() || saving}
          onClick={() => onSave({
            ...form,
            selfScore: form.selfScore ? parseInt(form.selfScore) : null,
            interviewDate: form.interviewDate || null,
          })}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function LogCard({ log, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.logCard}>
      <div className={styles.logHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.logLeft}>
          <span className={styles.logCompany}>{log.company}</span>
          {log.roundType && <span className={styles.logRound}>{log.roundType.replace(/_/g,' ')}</span>}
          {log.interviewDate && <span className={styles.logDate}>{log.interviewDate}</span>}
        </div>
        <div className={styles.logRight}>
          {log.outcome && (
            <span className={styles.logOutcome} style={{ color: OUTCOME_COLORS[log.outcome] || 'var(--text)' }}>
              {log.outcome}
            </span>
          )}
          {log.selfScore != null && (
            <span className={styles.logScore}>⭐ {log.selfScore}/10</span>
          )}
          <span className={styles.expandArrow}>{expanded ? '▴' : '▾'}</span>
        </div>
      </div>
      {expanded && (
        <div className={styles.logBody}>
          {log.topicsAsked && <p className={styles.logField}><strong>Topics:</strong> {log.topicsAsked}</p>}
          {log.notes        && <p className={styles.logField}><strong>Notes:</strong> {log.notes}</p>}
          <div className={styles.logActions}>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(log)}>Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(log.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyInterviewsPage() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [adding,  setAdding]  = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.interviewLogs,
    queryFn:  interviewLogsApi.getAll,
    staleTime: 60 * 1000,
  });

  const createMut = useMutation({
    mutationFn: interviewLogsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewLogs }); setAdding(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => interviewLogsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewLogs }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: interviewLogsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.interviewLogs }),
  });

  // Stats
  const total   = logs.length;
  const offers  = logs.filter((l) => l.outcome === 'OFFER').length;
  const pending = logs.filter((l) => l.outcome === 'PENDING').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Home</button>
        <h1 className={styles.title}>My Interview Log</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setEditing(null); }}>
          + Log Interview
        </button>
      </div>

      {total > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.stat}><span className={styles.statNum}>{total}</span><span className={styles.statLbl}>Total</span></div>
          <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--green)' }}>{offers}</span><span className={styles.statLbl}>Offers</span></div>
          <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--accent)' }}>{pending}</span><span className={styles.statLbl}>Pending</span></div>
          {total > 0 && <div className={styles.stat}><span className={styles.statNum}>{Math.round(offers / total * 100)}%</span><span className={styles.statLbl}>Offer Rate</span></div>}
        </div>
      )}

      {adding && (
        <LogForm
          onSave={(data) => createMut.mutate(data)}
          onCancel={() => setAdding(false)}
          saving={createMut.isPending}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>Loading…</div>
      ) : logs.length === 0 && !adding ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No interview logs yet</div>
          <p className={styles.emptyHint}>Log your first interview to start tracking your progress.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {logs.map((log) =>
            editing?.id === log.id ? (
              <LogForm
                key={log.id}
                initial={log}
                onSave={(data) => updateMut.mutate({ id: log.id, data })}
                onCancel={() => setEditing(null)}
                saving={updateMut.isPending}
              />
            ) : (
              <LogCard
                key={log.id}
                log={log}
                onEdit={setEditing}
                onDelete={(id) => deleteMut.mutate(id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
