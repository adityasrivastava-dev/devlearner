import { useEffect, useRef, useState } from 'react';
import styles from './FlowchartViewer.module.css';

/**
 * FlowchartViewer — renders a Mermaid diagram string.
 *
 * Props:
 *   definition : string  — raw Mermaid syntax (e.g. "graph TD\n  A-->B")
 *   title      : string  — optional label above the chart
 */
let mermaidReady = false;

async function ensureMermaid() {
  if (mermaidReady) return;
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.getAttribute('data-theme') === 'light'
      ? 'default'
      : 'dark',
    fontFamily: 'inherit',
    securityLevel: 'loose',
  });
  mermaidReady = true;
  return mermaid;
}

let idCounter = 0;

export default function FlowchartViewer({ definition, title }) {
  const containerRef = useRef(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!definition || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const mermaid = await ensureMermaid()
          ?? (await import('mermaid')).default;

        const id  = `mermaid-${++idCounter}`;
        const { svg } = await mermaid.render(id, definition.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.removeAttribute('height');
            svgEl.style.maxWidth = '100%';
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Mermaid render error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [definition]);

  if (!definition) return null;

  return (
    <div className={styles.flowchart}>
      {title && <div className={styles.label}>📊 {title}</div>}
      {loading && <div className={styles.loading}><span className="spinner" /> Rendering…</div>}
      {error   && <div className={styles.error}>⚠ {error}</div>}
      <div ref={containerRef} className={styles.diagram} />
    </div>
  );
}
