import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { algorithmAdminApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const CATEGORIES = [
  'Searching', 'Sorting', 'Two Pointer', 'Sliding Window',
  'Dynamic Programming', 'Graph', 'Tree', 'Greedy',
  'Backtracking', 'Math', 'Linked List', 'Stack & Queue',
  'Heap', 'Bit Manipulation',
];

const BLANK_ALGO = {
  slug: '', name: '', category: 'Searching', emoji: '🔍',
  difficulty: 'INTERMEDIATE', displayOrder: 999,
  tags: '["O(n)", "Example Tag"]',
  timeComplexityBest: '', timeComplexityAverage: '', timeComplexityWorst: '',
  spaceComplexity: '', stability: 'N/A',
  analogy: '', story: '', whenToUse: '', howItWorks: '',
  javaCode: '', interviewTips: '',
  useCases: '[{"title":"","desc":""}]',
  pitfalls: '[""]',
  variants: '[{"name":"","desc":""}]',
};

/* ── Main exported section ──────────────────────────────────────────────────── */
export default function AlgorithmAdminSection() {
  const [tab, setTab] = useState('files'); // files | paste | create | manage

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Algorithms</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['files',   '📁 Seed Files'],
            ['paste',   '📋 Paste JSON'],
            ['create',  '+ New Algorithm'],
            ['manage',  '⚙ Manage'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(key)}
            >{label}</button>
          ))}
        </div>
      </div>

      {tab === 'files'  && <AlgoSeedFilesPanel />}
      {tab === 'paste'  && <AlgoPastePanel />}
      {tab === 'create' && <AlgoFormPanel algo={null} onDone={() => setTab('manage')} />}
      {tab === 'manage' && <AlgoManagePanel onEdit={(a) => setTab('edit-' + a.id)} />}
      {tab.startsWith('edit-') && (
        <AlgoEditWrapper
          id={parseInt(tab.replace('edit-', ''))}
          onDone={() => setTab('manage')}
        />
      )}
    </div>
  );
}

/* ── 1. Seed Files panel ────────────────────────────────────────────────────── */
function AlgoSeedFilesPanel() {
  const qc = useQueryClient();

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ['algoSeedFiles'],
    queryFn:  algorithmAdminApi.getSeedFiles,
    staleTime: 10_000,
  });

  const [importing,   setImporting]   = useState(null);
  const [importedSet, setImportedSet] = useState(new Set());

  async function handleImport(filename) {
    setImporting(filename);
    try {
      const res = await algorithmAdminApi.importSeedFile(filename);
      toast.success(`✅ ${res.created} created · ${res.skipped} skipped · ${res.updated} updated`);
      setImportedSet(prev => new Set([...prev, filename]));
      refetch();
      qc.invalidateQueries({ queryKey: ['algorithms'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(null);
    }
  }

  async function handleImportAll() {
    for (const f of files) {
      if (!importedSet.has(f.filename)) await handleImport(f.filename);
    }
  }

  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.6 }}>
        These are the JSON seed files in <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>classpath:algorithm-seeds/</code>.
        Click <strong>Import</strong> to load algorithms into the database. Files with <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>skipExisting: true</code> will not overwrite existing slugs.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {files.length} seed file{files.length !== 1 ? 's' : ''} found
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}>↻ Refresh</button>
          {files.length > 0 && (
            <button className="btn btn-primary btn-sm" disabled={!!importing} onClick={handleImportAll}>
              ⚡ Import All
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading seed files…</div>
      ) : files.length === 0 ? (
        <EmptyHint text="No seed files found in classpath:algorithm-seeds/" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(file => {
            const isImporting  = importing === file.filename;
            const isImported   = importedSet.has(file.filename);
            return (
              <div key={file.filename} className={styles.seedFileCard}>
                <div className={styles.seedFileRow}>
                  <div className={styles.seedFileInfo}>
                    <span className={styles.seedFileName}>{file.filename}</span>
                    <span className={styles.seedFileMeta}>algorithm seed file</span>
                  </div>
                  {isImported ? (
                    <span className={styles.importedBadge}>✓ Imported</span>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      disabled={!!importing}
                      onClick={() => handleImport(file.filename)}
                    >
                      {isImporting
                        ? <><span className="spinner" /> Importing…</>
                        : '↑ Import'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InfoBox>
        To add a new algorithm batch: create a <code>A0X-name.json</code> file in{' '}
        <code>learning-system/src/main/resources/algorithm-seeds/</code> following the same structure as the existing files, then click Refresh and Import.
      </InfoBox>
    </>
  );
}

/* ── 2. Paste JSON panel ────────────────────────────────────────────────────── */
function AlgoPastePanel() {
  const qc = useQueryClient();
  const [json, setJson]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const TEMPLATE = JSON.stringify({
    batchName: 'A04-my-algorithms',
    skipExisting: true,
    algorithms: [{
      slug: 'my-algorithm',
      name: 'My Algorithm',
      category: 'Searching',
      emoji: '🔍',
      difficulty: 'INTERMEDIATE',
      displayOrder: 1,
      tags: '["O(n)", "Example"]',
      timeComplexityBest: 'O(1)',
      timeComplexityAverage: 'O(n)',
      timeComplexityWorst: 'O(n)',
      spaceComplexity: 'O(1)',
      stability: 'N/A',
      analogy: 'Your memorable one-liner here.',
      story: 'A 3-4 sentence narrative explaining the aha moment.',
      whenToUse: '• Condition 1\n• Condition 2',
      howItWorks: '1. Step one\n2. Step two\n3. Step three',
      javaCode: 'public class MyAlgorithm {\n    // your code\n}',
      interviewTips: '• Tip 1\n• Tip 2',
      useCases: '[{"title":"Use Case 1","desc":"Description of use case."}]',
      pitfalls: '["Common mistake 1","Common mistake 2"]',
      variants: '[{"name":"Variant","desc":"How it differs."}]',
    }],
  }, null, 2);

  async function handleSeed() {
    let payload;
    try { payload = JSON.parse(json); }
    catch { toast.error('Invalid JSON — check the format'); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await algorithmAdminApi.seedBatch(payload);
      setResult(res);
      toast.success(`✅ ${res.created} created · ${res.skipped} skipped`);
      qc.invalidateQueries({ queryKey: ['algorithms'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seed failed');
    } finally { setLoading(false); }
  }

  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.6 }}>
        Paste a JSON batch to import algorithms directly into the database.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setJson(TEMPLATE)}>
          📄 Load Template
        </button>
      </div>
      <textarea
        className={styles.jsonInput}
        value={json}
        onChange={e => setJson(e.target.value)}
        placeholder={'Paste your algorithm batch JSON here, or click "Load Template" above'}
        rows={22}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button className="btn btn-primary" disabled={loading || !json.trim()} onClick={handleSeed}>
          {loading ? <><span className="spinner" />Importing…</> : '📦 Import Batch'}
        </button>
        <button className="btn btn-ghost" onClick={() => { setJson(''); setResult(null); }}>Clear</button>
      </div>
      {result && (
        <div className={`${styles.resultBox} ${result.errors?.length === 0 ? styles.success : styles.partial}`}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {result.created} created · {result.updated} updated · {result.skipped} skipped
          </div>
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>⚠ {e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── 3. New Algorithm form ──────────────────────────────────────────────────── */
function AlgoFormPanel({ algo, onDone }) {
  const qc = useQueryClient();
  const isNew = !algo;
  const [form, setForm] = useState(algo ? { ...algo } : { ...BLANK_ALGO });
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.slug.trim()) { toast.error('Slug is required'); return; }
    if (!form.name.trim()) { toast.error('Name is required'); return; }

    // Validate JSON fields
    for (const field of ['tags', 'useCases', 'pitfalls', 'variants']) {
      try { JSON.parse(form[field] || '[]'); }
      catch { toast.error(`Invalid JSON in "${field}"`); return; }
    }

    setSaving(true);
    try {
      if (isNew) {
        await algorithmAdminApi.create(form);
        toast.success(`✅ Algorithm "${form.name}" created`);
      } else {
        await algorithmAdminApi.update(algo.id, form);
        toast.success(`✅ Algorithm "${form.name}" updated`);
      }
      qc.invalidateQueries({ queryKey: ['algorithms'] });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Slug (unique, URL-safe)" required>
          <input className="input" value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="binary-search" />
        </Field>
        <Field label="Name" required>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Binary Search" />
        </Field>
        <Field label="Category">
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Difficulty">
          <select className="input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Emoji">
          <input className="input" value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="🔍" maxLength={4} />
        </Field>
        <Field label="Display Order">
          <input className="input" type="number" value={form.displayOrder} onChange={e => set('displayOrder', parseInt(e.target.value) || 999)} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Time — Best">
          <input className="input" value={form.timeComplexityBest} onChange={e => set('timeComplexityBest', e.target.value)} placeholder="O(1)" />
        </Field>
        <Field label="Time — Average">
          <input className="input" value={form.timeComplexityAverage} onChange={e => set('timeComplexityAverage', e.target.value)} placeholder="O(n log n)" />
        </Field>
        <Field label="Time — Worst">
          <input className="input" value={form.timeComplexityWorst} onChange={e => set('timeComplexityWorst', e.target.value)} placeholder="O(n²)" />
        </Field>
        <Field label="Space Complexity">
          <input className="input" value={form.spaceComplexity} onChange={e => set('spaceComplexity', e.target.value)} placeholder="O(1)" />
        </Field>
        <Field label="Stability">
          <select className="input" value={form.stability} onChange={e => set('stability', e.target.value)}>
            {['Stable', 'Unstable', 'N/A'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label='Tags (JSON array)' hint='["O(n)", "Sorted"]'>
          <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder='["O(log n)", "Sorted Array"]' />
        </Field>
      </div>

      <Field label="Analogy — memorable one-liner" style={{ marginBottom: 10 }}>
        <input className="input" value={form.analogy} onChange={e => set('analogy', e.target.value)} placeholder="Opening a dictionary in the middle — throw out half the book every time." />
      </Field>

      <TextAreaField label="Story (3-4 sentences)" value={form.story} onChange={v => set('story', v)} rows={4}
        placeholder="A narrative with a character that explains the aha moment..." />
      <TextAreaField label="When to Use (bullet points, one per line starting with •)" value={form.whenToUse} onChange={v => set('whenToUse', v)} rows={5}
        placeholder="• Array is sorted&#10;• Need O(log n) speed" />
      <TextAreaField label="How It Works (numbered steps, one per line starting with 1. 2. 3.)" value={form.howItWorks} onChange={v => set('howItWorks', v)} rows={8}
        placeholder="1. Set low = 0, high = n - 1&#10;2. Compute mid..." />
      <TextAreaField label="Java Code" value={form.javaCode} onChange={v => set('javaCode', v)} rows={14}
        placeholder="public class MyAlgorithm {&#10;    // implementation&#10;}" mono />
      <TextAreaField label="Interview Tips (bullet points starting with •)" value={form.interviewTips} onChange={v => set('interviewTips', v)} rows={4}
        placeholder="• Always use mid = low + (high - low) / 2 to avoid overflow" />
      <TextAreaField label='Use Cases (JSON): [{"title":"...","desc":"..."}]' value={form.useCases} onChange={v => set('useCases', v)} rows={5}
        placeholder='[{"title":"DB Index","desc":"MySQL B-tree uses binary search to find rows in O(log n)."}]' mono />
      <TextAreaField label='Pitfalls (JSON): ["mistake 1", "mistake 2"]' value={form.pitfalls} onChange={v => set('pitfalls', v)} rows={4}
        placeholder='["Off-by-one: use low <= high not low < high","Integer overflow: use low + (high-low)/2"]' mono />
      <TextAreaField label='Variants (JSON): [{"name":"...","desc":"..."}]' value={form.variants} onChange={v => set('variants', v)} rows={3}
        placeholder='[{"name":"Lower Bound","desc":"Find first index where arr[i] >= target"}]' mono />

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? <><span className="spinner" />{isNew ? 'Creating…' : 'Saving…'}</> : isNew ? '✅ Create Algorithm' : '✅ Save Changes'}
        </button>
        <button className="btn btn-ghost" onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

/* ── Edit wrapper — loads algo by id ────────────────────────────────────────── */
function AlgoEditWrapper({ id, onDone }) {
  const { data: algorithms = [], isLoading } = useQuery({
    queryKey: ['algorithms'],
    queryFn:  algorithmAdminApi.getAll,
    staleTime: 60_000,
  });
  const algo = algorithms.find(a => a.id === id);
  if (isLoading) return <div className={styles.loading}><span className="spinner" />Loading…</div>;
  if (!algo) return <div style={{ color: 'var(--red)', padding: 20 }}>Algorithm not found</div>;
  return <AlgoFormPanel algo={algo} onDone={onDone} />;
}

/* ── 4. Manage (list + delete + edit) ──────────────────────────────────────── */
function AlgoManagePanel({ onEdit }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const { data: algorithms = [], isLoading, refetch } = useQuery({
    queryKey: ['algorithms'],
    queryFn:  algorithmAdminApi.getAll,
    staleTime: 30_000,
  });

  async function handleDelete(algo) {
    if (!window.confirm(`Delete "${algo.name}"? This cannot be undone.`)) return;
    setDeleting(algo.id);
    try {
      await algorithmAdminApi.delete(algo.id);
      toast.success(`Deleted "${algo.name}"`);
      qc.invalidateQueries({ queryKey: ['algorithms'] });
    } catch {
      toast.error('Delete failed');
    } finally { setDeleting(null); }
  }

  async function handleDeleteAll() {
    if (!window.confirm(`Delete ALL ${algorithms.length} algorithms? This cannot be undone.`)) return;
    try {
      await algorithmAdminApi.deleteAll();
      toast.success('All algorithms deleted');
      qc.invalidateQueries({ queryKey: ['algorithms'] });
    } catch {
      toast.error('Delete all failed');
    }
  }

  const filtered = algorithms.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
      || a.category.toLowerCase().includes(search.toLowerCase())
  );

  const diffColor = { BEGINNER: 'var(--success)', INTERMEDIATE: 'var(--yellow)', ADVANCED: 'var(--red)' };

  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <input
          className="input"
          style={{ flex: 1, maxWidth: 320 }}
          placeholder="🔍 Search algorithms…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {filtered.length} / {algorithms.length} algorithms
        </span>
        <button className="btn btn-ghost btn-sm" onClick={refetch}>↻</button>
        {algorithms.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑 Delete All</button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loading}><span className="spinner" />Loading algorithms…</div>
      ) : algorithms.length === 0 ? (
        <EmptyHint text="No algorithms in the database yet. Use Seed Files or Paste JSON to add some." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(algo => (
            <div key={algo.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', transition: 'border-color .15s',
            }}>
              <span style={{ fontSize: 18, width: 26, textAlign: 'center', flexShrink: 0 }}>{algo.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{algo.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8, marginTop: 1, flexWrap: 'wrap' }}>
                  <span>{algo.category}</span>
                  <span style={{ color: diffColor[algo.difficulty] }}>
                    {algo.difficulty?.charAt(0) + algo.difficulty?.slice(1).toLowerCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-code)' }}>{algo.timeComplexityAverage}</span>
                  <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-code)', fontSize: 10 }}>
                    slug: {algo.slug}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onEdit(algo)}>✏ Edit</button>
              <button
                className="btn btn-danger btn-sm"
                disabled={deleting === algo.id}
                onClick={() => handleDelete(algo)}
              >
                {deleting === algo.id ? <span className="spinner" /> : '🗑'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Small helpers ──────────────────────────────────────────────────────────── */
function Field({ label, hint, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 2, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--text3)', opacity: .7 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4, placeholder, mono }) {
  return (
    <Field label={label} style={{ marginBottom: 10 }}>
      <textarea
        className={styles.jsonInput}
        style={mono ? {} : { fontFamily: 'var(--font-ui)', fontSize: 13 }}
        rows={rows}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
      📭 {text}
    </div>
  );
}

function InfoBox({ children }) {
  return (
    <div style={{
      marginTop: 20, padding: '10px 14px',
      background: 'var(--adim2)', border: '1px solid rgba(99,102,241,.15)',
      borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
    }}>
      💡 {children}
    </div>
  );
}