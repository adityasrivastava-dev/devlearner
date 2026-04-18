import styles from './EmptyState.module.css';

/**
 * Consistent empty / zero-state UI.
 *
 * Props:
 *   icon     — emoji or character (default '📭')
 *   title    — primary message     (required)
 *   hint     — secondary helper text
 *   action   — onClick handler for CTA button
 *   actionLabel — button label (default 'Try again')
 *   tips     — string[] bullet list shown below hint
 *   compact  — smaller variant (no min-height)
 */
export default function EmptyState({ icon = '📭', title, hint, action, actionLabel = 'Try again', tips, compact = false }) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <p className={styles.title}>{title}</p>
      {hint  && <p className={styles.hint}>{hint}</p>}
      {tips?.length > 0 && (
        <ul className={styles.tips}>
          {tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      )}
      {action && (
        <button className={styles.action} onClick={action}>{actionLabel}</button>
      )}
    </div>
  );
}
