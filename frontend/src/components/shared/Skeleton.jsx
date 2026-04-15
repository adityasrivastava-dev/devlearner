import styles from './Skeleton.module.css';

/**
 * Base skeleton block — use width/height/borderRadius to shape it.
 */
export function Skeleton({ width = '100%', height = '14px', borderRadius = '4px', className = '', style = {} }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

/**
 * Multi-line text skeleton — last line is shorter to look natural.
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`${styles.skeletonTextBlock} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '55%' : '100%'}
          height="12px"
          style={{ marginBottom: i < lines - 1 ? '8px' : 0 }}
        />
      ))}
    </div>
  );
}

/**
 * A card-shaped skeleton — header + body lines.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.skeletonCard} ${className}`}>
      <Skeleton width="40%" height="16px" style={{ marginBottom: '12px' }} />
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * A single table row skeleton — pass columns as an array of widths.
 * e.g. columns={[32, 32, 44, '100%', 100, 130, 120]}
 */
export function SkeletonTableRow({ columns = [32, 32, 44, '100%', 100, 130, 120], className = '' }) {
  return (
    <tr className={`${styles.skeletonRow} ${className}`}>
      {columns.map((w, i) => (
        <td key={i} style={{ width: typeof w === 'number' ? w : undefined }}>
          <Skeleton
            width={typeof w === 'number' ? `${Math.round(w * 0.6)}px` : '80%'}
            height="12px"
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Full-page generic loading skeleton — header + 6 cards.
 * Use this as the fallback while a page's primary data is loading.
 */
export function PageSkeleton({ rows = 6 }) {
  return (
    <div className={styles.pageSkeleton}>
      <div className={styles.pageSkeletonHeader}>
        <Skeleton width="120px" height="20px" />
        <Skeleton width="200px" height="28px" />
        <Skeleton width="80px"  height="20px" />
      </div>
      <div className={styles.pageSkeletonGrid}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
