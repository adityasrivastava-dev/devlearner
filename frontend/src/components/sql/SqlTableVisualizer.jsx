import { useId } from 'react';
import styles from './SqlTableVisualizer.module.css';

/**
 * SqlTableVisualizer — renders table data from seed examples visually.
 *
 * tableData (string or object) supports these `type` values:
 *   "join"      — left table + right table + matched rows + result
 *   "select"    — single table with highlighted columns/rows + result
 *   "groupby"   — table grouped with aggregate result
 *   "normalize" — before/after normalization tables
 *   "subquery"  — outer query + inner result used as filter
 */
export default function SqlTableVisualizer({ data }) {
  let parsed;
  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return <div className={styles.error}>Invalid table data</div>;
  }

  if (!parsed) return null;

  switch (parsed.type) {
    case 'join':      return <JoinVisualizer data={parsed} />;
    case 'select':    return <SelectVisualizer data={parsed} />;
    case 'groupby':   return <GroupByVisualizer data={parsed} />;
    case 'normalize': return <NormalizeVisualizer data={parsed} />;
    case 'subquery':  return <SubqueryVisualizer data={parsed} />;
    default:          return <GenericTableVisualizer data={parsed} />;
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SqlTable({ table, highlightRows = [], excludedRows = [], highlightCols = [], label, badge }) {
  if (!table) return null;
  return (
    <div className={styles.tableBox}>
      <div className={styles.tableHeader}>
        <span className={styles.tableName}>{table.name}</span>
        {badge && <span className={styles.tableBadge}>{badge}</span>}
        {label && <span className={styles.tableLabel}>{label}</span>}
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.sqlTable}>
          <thead>
            <tr>
              {table.columns.map((col, ci) => (
                <th
                  key={ci}
                  className={`${styles.th} ${highlightCols.includes(col) ? styles.colHighlight : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr
                key={ri}
                className={
                  excludedRows.includes(ri)
                    ? styles.rowExcluded
                    : highlightRows.includes(ri)
                    ? styles.rowMatched
                    : ''
                }
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`${styles.td} ${highlightCols.includes(table.columns[ci]) ? styles.colHighlight : ''}`}
                  >
                    {cell === null ? <span className={styles.nullVal}>NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(highlightRows.length > 0 || excludedRows.length > 0) && (
        <div className={styles.legend}>
          {highlightRows.length > 0 && <span className={styles.legendMatch}>● Matched / included</span>}
          {excludedRows.length > 0  && <span className={styles.legendExcl}>● Excluded</span>}
        </div>
      )}
    </div>
  );
}

function ResultTable({ result, label = 'Result' }) {
  if (!result) return null;
  return (
    <div className={`${styles.tableBox} ${styles.resultBox}`}>
      <div className={styles.tableHeader}>
        <span className={styles.tableName}>{label}</span>
        <span className={styles.rowCount}>{result.rows.length} row{result.rows.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.sqlTable}>
          <thead>
            <tr>{result.columns.map((col, i) => <th key={i} className={styles.th}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {result.rows.map((row, ri) => (
              <tr key={ri} className={styles.rowResult}>
                {row.map((cell, ci) => (
                  <td key={ci} className={styles.td}>
                    {cell === null ? <span className={styles.nullVal}>NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── JOIN Visualizer ───────────────────────────────────────────────────────────

function JoinVisualizer({ data }) {
  const { joinType = 'INNER', leftTable, rightTable, matchedRows = [], result,
          leftUnmatched = [], rightUnmatched = [] } = data;

  const leftHighlight  = matchedRows.map(([l]) => l);
  const rightHighlight = matchedRows.map(([, r]) => r);

  const joinColors = {
    INNER: { bg: '#1a3a5c', label: 'Only rows with a match on BOTH sides' },
    LEFT:  { bg: '#1a3a2c', label: 'All left rows + matching right rows (NULL if no match)' },
    RIGHT: { bg: '#3a2c1a', label: 'All right rows + matching left rows (NULL if no match)' },
    FULL:  { bg: '#3a1a3a', label: 'All rows from both sides (NULL where no match)' },
  };
  const info = joinColors[joinType] || joinColors.INNER;

  return (
    <div className={styles.vizRoot}>
      {/* Join type banner */}
      <div className={styles.joinBanner} style={{ background: info.bg }}>
        <span className={styles.joinTypePill}>{joinType} JOIN</span>
        <span className={styles.joinDesc}>{info.label}</span>
      </div>

      {/* Venn diagram hint */}
      <VennDiagram
        type={joinType}
        leftTable={leftTable}
        rightTable={rightTable}
        matchedRows={matchedRows}
        leftUnmatched={leftUnmatched}
        rightUnmatched={rightUnmatched}
      />

      {/* Input tables */}
      <div className={styles.inputTablesRow}>
        <SqlTable
          table={leftTable}
          highlightRows={leftHighlight}
          excludedRows={joinType === 'INNER' ? leftUnmatched : []}
          label="LEFT table"
        />
        <div className={styles.joinArrow}>
          <div className={styles.joinArrowLine} />
          <div className={styles.joinArrowLabel}>ON {data.joinKey?.left} = {data.joinKey?.right}</div>
          <div className={styles.joinArrowLine} />
        </div>
        <SqlTable
          table={rightTable}
          highlightRows={rightHighlight}
          excludedRows={joinType === 'INNER' ? rightUnmatched : []}
          label="RIGHT table"
        />
      </div>

      {/* Arrow down */}
      <div className={styles.resultArrow}>↓ JOIN produces</div>

      {/* Result */}
      <ResultTable result={result} label={`${joinType} JOIN result`} />

      {/* Row count explanation */}
      {data.explanation && (
        <div className={styles.vizNote}>{data.explanation}</div>
      )}
    </div>
  );
}

function VennDiagram({ type, leftTable, rightTable, matchedRows = [], leftUnmatched = [], rightUnmatched = [] }) {
  const uid = useId();
  const clipId = `vc-${uid.replace(/:/g, '')}`;

  const leftOnlyCount  = leftUnmatched.length;
  const matchedCount   = matchedRows.length;
  const rightOnlyCount = rightUnmatched.length;

  const includes = {
    INNER: { left: false, center: true,  right: false },
    LEFT:  { left: true,  center: true,  right: false },
    RIGHT: { left: false, center: true,  right: true  },
    FULL:  { left: true,  center: true,  right: true  },
  };
  const inc = includes[type] || includes.INNER;

  const leftName  = leftTable?.name  || 'Table A';
  const rightName = rightTable?.name || 'Table B';

  const TEAL   = '#22d3ee';
  const ORANGE = '#fb923c';
  const GREEN  = '#4ade80';
  const PURPLE = '#a78bfa';

  const typeColor = { INNER: GREEN, LEFT: TEAL, RIGHT: ORANGE, FULL: PURPLE }[type] || GREEN;

  const resultCount =
    type === 'INNER' ? matchedCount :
    type === 'LEFT'  ? leftOnlyCount + matchedCount :
    type === 'RIGHT' ? matchedCount + rightOnlyCount :
    leftOnlyCount + matchedCount + rightOnlyCount;

  const resultHint = {
    INNER: 'Only rows with a match on both sides',
    LEFT:  'All left rows + matched right (NULL if none)',
    RIGHT: 'All right rows + matched left (NULL if none)',
    FULL:  'All rows from both sides (NULLs for gaps)',
  }[type] || '';

  const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

  return (
    <div className={styles.vennWrapper}>
      {/* ── Diagram ── */}
      <div className={styles.vennDiagramSection}>
        <svg viewBox="0 0 310 130" className={styles.vennSvgLarge}>
          <defs>
            {/* clip left circle shape so we can fill only the intersection */}
            <clipPath id={clipId}>
              <ellipse cx="128" cy="65" rx="68" ry="50" />
            </clipPath>
          </defs>

          {/* ── Left circle ── */}
          <ellipse cx="128" cy="65" rx="68" ry="50"
            fill={inc.left ? 'rgba(34,211,238,0.22)' : 'rgba(34,211,238,0.06)'}
            stroke={TEAL} strokeWidth="2" />

          {/* ── Right circle ── */}
          <ellipse cx="192" cy="65" rx="68" ry="50"
            fill={inc.right ? 'rgba(251,146,60,0.22)' : 'rgba(251,146,60,0.06)'}
            stroke={ORANGE} strokeWidth="2" />

          {/* ── Intersection (right circle clipped to left circle shape) ── */}
          <ellipse cx="192" cy="65" rx="68" ry="50"
            fill={inc.center ? 'rgba(74,222,128,0.50)' : 'rgba(120,120,120,0.10)'}
            stroke="none"
            clipPath={`url(#${clipId})`} />

          {/* ── Table name labels ── */}
          <text x="97"  y="16" textAnchor="middle" fill={TEAL}   fontSize="9.5" fontWeight="700" fontFamily="monospace">
            {truncate(leftName.toUpperCase(), 11)}
          </text>
          <text x="223" y="16" textAnchor="middle" fill={ORANGE} fontSize="9.5" fontWeight="700" fontFamily="monospace">
            {truncate(rightName.toUpperCase(), 11)}
          </text>

          {/* ── Left-only count ── */}
          <text x="95" y="62" textAnchor="middle"
            fill={inc.left ? '#f1f5f9' : '#374151'} fontSize="22" fontWeight="800">
            {leftOnlyCount}
          </text>
          <text x="95" y="78" textAnchor="middle"
            fill={inc.left ? TEAL : '#374151'} fontSize="8" fontWeight="600">
            {inc.left ? 'included' : 'excluded'}
          </text>

          {/* ── Intersection count ── */}
          <text x="160" y="62" textAnchor="middle"
            fill={inc.center ? '#f1f5f9' : '#374151'} fontSize="22" fontWeight="800">
            {matchedCount}
          </text>
          <text x="160" y="78" textAnchor="middle"
            fill={inc.center ? GREEN : '#374151'} fontSize="8" fontWeight="600">
            matched
          </text>

          {/* ── Right-only count ── */}
          <text x="225" y="62" textAnchor="middle"
            fill={inc.right ? '#f1f5f9' : '#374151'} fontSize="22" fontWeight="800">
            {rightOnlyCount}
          </text>
          <text x="225" y="78" textAnchor="middle"
            fill={inc.right ? ORANGE : '#374151'} fontSize="8" fontWeight="600">
            {inc.right ? 'included' : 'excluded'}
          </text>

          {/* ── Bottom legend ── */}
          <text x="97"  y="112" textAnchor="middle" fill={TEAL}   fontSize="8">{leftName}</text>
          <text x="223" y="112" textAnchor="middle" fill={ORANGE} fontSize="8">{rightName}</text>
        </svg>
      </div>

      {/* ── = RESULT box ── */}
      <div className={styles.vennResultSection}>
        <div className={styles.vennEqSign}>=</div>
        <div className={styles.vennResultBox} style={{ borderColor: typeColor }}>
          <div className={styles.vennResultType} style={{ color: typeColor, background: `${typeColor}18` }}>
            {type} JOIN
          </div>
          <div className={styles.vennResultCount}>{resultCount}</div>
          <div className={styles.vennResultRows}>rows</div>
          <div className={styles.vennResultHint}>{resultHint}</div>
        </div>
      </div>
    </div>
  );
}

// ── SELECT Visualizer ─────────────────────────────────────────────────────────

function SelectVisualizer({ data }) {
  const { table, selectedColumns = [], filteredRows = [], result, whereCondition, note } = data;

  const allRows     = table?.rows.map((_, i) => i) ?? [];
  const excludedRows = allRows.filter(i => !filteredRows.includes(i));

  return (
    <div className={styles.vizRoot}>
      <div className={styles.selectBanner}>
        <code className={styles.inlineSQL}>
          SELECT {selectedColumns.length ? selectedColumns.join(', ') : '*'}
          {whereCondition ? ` WHERE ${whereCondition}` : ''}
        </code>
      </div>

      <div className={styles.selectStep}>
        <div className={styles.stepLabel}>① Input Table</div>
        <SqlTable
          table={table}
          highlightRows={filteredRows}
          excludedRows={excludedRows}
          highlightCols={selectedColumns}
        />
      </div>

      {whereCondition && (
        <div className={styles.filterNote}>
          <span className={styles.filterIcon}>⚙</span>
          WHERE filter: <strong>{whereCondition}</strong>
          {' — '}green rows pass, grey rows are excluded
        </div>
      )}

      <div className={styles.resultArrow}>↓ SELECT produces</div>

      <div className={styles.selectStep}>
        <div className={styles.stepLabel}>② Result Set</div>
        <ResultTable result={result} />
      </div>

      {note && <div className={styles.vizNote}>{note}</div>}
    </div>
  );
}

// ── GROUP BY Visualizer ───────────────────────────────────────────────────────

function GroupByVisualizer({ data }) {
  const { table, groupByCol, aggregates = [], groups = [], result } = data;

  return (
    <div className={styles.vizRoot}>
      <div className={styles.selectBanner}>
        <code className={styles.inlineSQL}>
          GROUP BY {groupByCol}
          {aggregates.length ? ' → ' + aggregates.join(', ') : ''}
        </code>
      </div>

      <div className={styles.groupLayout}>
        <div className={styles.selectStep}>
          <div className={styles.stepLabel}>① Full Table</div>
          <SqlTable table={table} highlightCols={[groupByCol]} />
        </div>

        <div className={styles.groupBuckets}>
          <div className={styles.stepLabel}>② Grouped Buckets</div>
          {groups.map((g, i) => (
            <div key={i} className={styles.groupBucket} style={{ borderColor: groupColor(i) }}>
              <div className={styles.groupBucketLabel} style={{ background: groupColor(i) }}>
                {groupByCol} = {g.key}
              </div>
              <div className={styles.groupBucketRows}>
                {g.rowIndices.map(ri => (
                  <div key={ri} className={styles.groupRow}>
                    {table.rows[ri].join(' | ')}
                  </div>
                ))}
              </div>
              {g.aggregateResult && (
                <div className={styles.groupAggregate}>→ {g.aggregateResult}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.resultArrow}>↓ GROUP BY produces</div>
      <ResultTable result={result} />
    </div>
  );
}

const GROUP_COLORS = ['#1a4a6b', '#1a5a3a', '#5a2a1a', '#3a1a5a', '#5a4a1a'];
function groupColor(i) { return GROUP_COLORS[i % GROUP_COLORS.length]; }

// ── NORMALIZE Visualizer ──────────────────────────────────────────────────────

function NormalizeVisualizer({ data }) {
  const { normalForm, before, after = [], issues = [], gains = [] } = data;

  return (
    <div className={styles.vizRoot}>
      <div className={styles.normBanner}>
        <span className={styles.normPill}>Normalization → {normalForm}</span>
      </div>

      <div className={styles.normLayout}>
        {/* Before */}
        <div className={styles.normBefore}>
          <div className={styles.stepLabel}>❌ Before ({before?.name})</div>
          <SqlTable table={before} />
          {issues.length > 0 && (
            <div className={styles.issueList}>
              {issues.map((issue, i) => (
                <div key={i} className={styles.issue}>⚠ {issue}</div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.normArrow}>
          <div className={styles.normArrowLine} />
          <div className={styles.normArrowLabel}>{normalForm}</div>
          <div className={styles.normArrowLine} />
        </div>

        {/* After */}
        <div className={styles.normAfter}>
          <div className={styles.stepLabel}>✅ After (decomposed)</div>
          {after.map((t, i) => (
            <SqlTable key={i} table={t} />
          ))}
          {gains.length > 0 && (
            <div className={styles.gainList}>
              {gains.map((gain, i) => (
                <div key={i} className={styles.gain}>✓ {gain}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUBQUERY Visualizer ───────────────────────────────────────────────────────

function SubqueryVisualizer({ data }) {
  const { outerTable, subqueryResult, filteredRows = [], result, subquerySQL, note } = data;
  const allRows = outerTable?.rows.map((_, i) => i) ?? [];
  const excluded = allRows.filter(i => !filteredRows.includes(i));

  return (
    <div className={styles.vizRoot}>
      <div className={styles.subBanner}>
        <div className={styles.subStep}>
          <span className={styles.subStepNum}>① Subquery runs first:</span>
          <code className={styles.inlineSQL}>{subquerySQL}</code>
        </div>
      </div>

      <div className={styles.subLayout}>
        <div className={styles.selectStep}>
          <div className={styles.stepLabel}>Subquery Result</div>
          <ResultTable result={subqueryResult} label="Subquery output" />
        </div>

        <div className={styles.subArrow}>② Used as filter ↓</div>

        <div className={styles.selectStep}>
          <div className={styles.stepLabel}>Outer Table filtered by subquery</div>
          <SqlTable table={outerTable} highlightRows={filteredRows} excludedRows={excluded} />
        </div>
      </div>

      <div className={styles.resultArrow}>↓ Final result</div>
      <ResultTable result={result} />
      {note && <div className={styles.vizNote}>{note}</div>}
    </div>
  );
}

// ── Generic fallback ──────────────────────────────────────────────────────────

function GenericTableVisualizer({ data }) {
  const tables = data.tables || (data.table ? [data.table] : []);
  return (
    <div className={styles.vizRoot}>
      <div className={styles.genericRow}>
        {tables.map((t, i) => <SqlTable key={i} table={t} />)}
      </div>
      {data.result && (
        <>
          <div className={styles.resultArrow}>↓</div>
          <ResultTable result={data.result} />
        </>
      )}
    </div>
  );
}
