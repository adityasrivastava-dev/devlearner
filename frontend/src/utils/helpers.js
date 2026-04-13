// ─── Category helpers ─────────────────────────────────────────────────────────
export const CATEGORY_META = {
  DSA:             { label: 'DSA',    cls: 'badge-dsa',    color: '#60a5fa' },
  JAVA:            { label: 'Java',   cls: 'badge-java',   color: '#fbbf24' },
  ADVANCED_JAVA:   { label: 'Adv',    cls: 'badge-adv',    color: '#a78bfa' },
  SPRING:          { label: 'Spring', cls: 'badge-spring', color: '#4ade80' },
  SPRING_BOOT:     { label: 'Boot',   cls: 'badge-spring', color: '#4ade80' },
  SPRING_MVC:      { label: 'MVC',    cls: 'badge-spring', color: '#4ade80' },
  SPRING_SECURITY: { label: 'Sec',    cls: 'badge-spring', color: '#4ade80' },
  HIBERNATE:       { label: 'JPA',    cls: 'badge-sql',    color: '#fbbf24' },
  SPRING_DATA:     { label: 'Data',   cls: 'badge-spring', color: '#4ade80' },
  MICROSERVICES:   { label: 'μSvc',   cls: 'badge-adv',    color: '#a78bfa' },
  MYSQL:           { label: 'SQL',    cls: 'badge-sql',    color: '#fbbf24' },
  AWS:             { label: 'AWS',    cls: 'badge-aws',    color: '#fb923c' },
  JAVASCRIPT:      { label: 'JS',     cls: 'badge-js',     color: '#fbbf24' },
  SYSTEM_DESIGN:   { label: 'SysD',   cls: 'badge-adv',    color: '#f472b6' },
  TESTING:         { label: 'Test',   cls: 'badge-dsa',    color: '#34d399' },
};

export const CATEGORIES = [
  { key: 'ALL',             label: 'All' },
  { key: 'JAVA',            label: 'Java Core' },
  { key: 'ADVANCED_JAVA',   label: 'Adv Java' },
  { key: 'MYSQL',           label: 'SQL' },
  { key: 'DSA',             label: 'DSA' },
  { key: 'SPRING_BOOT',     label: 'Spring Boot' },
  { key: 'AWS',             label: 'AWS' },
  { key: 'SYSTEM_DESIGN',   label: 'System Design' },
  { key: 'TESTING',         label: 'Testing' },
];

export function getCategoryMeta(cat) {
  return CATEGORY_META[cat] || { label: cat || 'DSA', cls: 'badge-dsa', color: '#60a5fa' };
}

// ─── Difficulty ───────────────────────────────────────────────────────────────
export const DIFF_META = {
  EASY:   { cls: 'badge-easy',   label: 'Easy',   color: '#4ade80' },
  MEDIUM: { cls: 'badge-medium', label: 'Medium', color: '#fbbf24' },
  HARD:   { cls: 'badge-hard',   label: 'Hard',   color: '#f87171' },
};

export function getDiffMeta(diff) {
  return DIFF_META[diff?.toUpperCase()] || DIFF_META.MEDIUM;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMs(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ─── Default Java starter code ────────────────────────────────────────────────
export const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, DevLearn!");
    }
}`;

export const PROBLEM_STARTER_CODE = `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input and solve
        
    }
}`;
