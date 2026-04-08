import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { roadmapsApi, topicsApi } from '../../api';
import styles from './OnboardingFlow.module.css';

const LEVELS = [
  { key: 'BEGINNER',     label: 'Beginner',      sub: '0 – 6 months',   icon: '🌱' },
  { key: 'INTERMEDIATE', label: 'Intermediate',   sub: '6 months – 2 yr', icon: '⚡' },
  { key: 'ADVANCED',     label: 'Advanced',       sub: '2+ years',       icon: '🚀' },
];

const GOALS = [
  {
    key: 'DSA',
    icon: '🎯',
    title: 'Crack DSA Interviews',
    sub: 'Arrays, Trees, DP, Graphs, System Design',
    topics: ['Arrays','HashMap','Two Pointer','Sliding Window','Binary Search',
              'Recursion','Linked List','Stack','Queue','Sorting'],
    roadmapName: 'DSA Interview Prep',
  },
  {
    key: 'JAVA_BACKEND',
    icon: '⚡',
    title: 'Master Java Backend',
    sub: 'Core Java, OOP, Collections, Concurrency, Spring',
    topics: ['JVM / JRE / JDK Architecture','Data Types & Variables','Class & Object in Java',
              'Inheritance in Java','Polymorphism in Java','Java Collections Framework',
              'Streams API & Functional Interfaces','Concurrency & Threads','Design Patterns in Java'],
    roadmapName: 'Java Backend Mastery',
  },
  {
    key: 'FULL_STACK',
    icon: '🚀',
    title: 'Full Stack + System Design',
    sub: 'Java + DSA + Spring Boot + SQL + AWS',
    topics: ['Arrays','HashMap','Class & Object in Java','Java Collections Framework',
              'Exception Handling in Java','Concurrency & Threads','Design Patterns in Java'],
    roadmapName: 'Full Stack Engineering',
  },
];

export default function OnboardingFlow({ onComplete }) {
  const [step,  setStep]  = useState(1); // 1, 2, 3(generating)
  const [level, setLevel] = useState(null);
  const [goal,  setGoal]  = useState(null);
  const navigate = useNavigate();

  const createRoadmap = useMutation({
    mutationFn: async (goalDef) => {
      // 1. Create the roadmap record
      const roadmap = await roadmapsApi.create({ name: goalDef.roadmapName });

      // 2. Fetch all topics to find IDs by title
      const allTopics = await topicsApi.getAll('ALL');
      const topicMap  = Object.fromEntries(allTopics.map((t) => [t.title, t.id]));

      // 3. Add matching topics to the roadmap (best-effort, skip missing)
      const topicIds = goalDef.topics
        .map((title) => topicMap[title])
        .filter(Boolean);

      if (topicIds.length > 0) {
        await roadmapsApi.update(roadmap.id, {
          name: goalDef.roadmapName,
          topicIds,
        });
      }

      return { roadmapId: roadmap.id, firstTopicId: topicIds[0] ?? null };
    },
    onSuccess: ({ roadmapId, firstTopicId }) => {
      // Mark onboarded so we never show this again
      localStorage.setItem('devlearn_onboarded', '1');
      localStorage.setItem('devlearn_level', level);
      localStorage.setItem('devlearn_goal', goal);
      onComplete?.();
      // Navigate to roadmap or first topic
      if (firstTopicId) {
        navigate(`/?topic=${firstTopicId}`);
      } else {
        navigate('/roadmap');
      }
    },
  });

  function handleGoalSelect(g) {
    setGoal(g.key);
    setStep(3);
    createRoadmap.mutate(g);
  }

  return (
    <div className={styles.shell}>
      {/* Background glow */}
      <div className={styles.glow} />

      <div className={styles.card}>
        {/* Progress dots */}
        <div className={styles.progress}>
          {[1, 2].map((n) => (
            <div key={n} className={`${styles.dot} ${step >= n ? styles.dotActive : ''}`} />
          ))}
        </div>

        {/* ── Step 1 — Who are you? ─────────────────────────────────── */}
        {step === 1 && (
          <div className={styles.stepWrap}>
            <div className={styles.badge}>Welcome to DevLearn 👋</div>
            <h1 className={styles.title}>Where are you right now?</h1>
            <p className={styles.sub}>We'll personalise your learning path based on your experience.</p>
            <div className={styles.optionGrid}>
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  className={`${styles.option} ${level === l.key ? styles.optionActive : ''}`}
                  onClick={() => { setLevel(l.key); setStep(2); }}
                >
                  <span className={styles.optionIcon}>{l.icon}</span>
                  <div>
                    <div className={styles.optionTitle}>{l.label}</div>
                    <div className={styles.optionSub}>{l.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 — What's your goal? ────────────────────────────── */}
        {step === 2 && (
          <div className={styles.stepWrap}>
            <button className={styles.backLink} onClick={() => setStep(1)}>← Back</button>
            <div className={styles.badge}>Step 2 of 2</div>
            <h1 className={styles.title}>What's your main goal?</h1>
            <p className={styles.sub}>We'll build you a personalised roadmap and start you on the right topics.</p>
            <div className={styles.goalGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  className={styles.goalCard}
                  onClick={() => handleGoalSelect(g)}
                >
                  <span className={styles.goalIcon}>{g.icon}</span>
                  <div className={styles.goalBody}>
                    <div className={styles.goalTitle}>{g.title}</div>
                    <div className={styles.goalSub}>{g.sub}</div>
                  </div>
                  <span className={styles.goalArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3 — Generating ───────────────────────────────────── */}
        {step === 3 && (
          <div className={styles.generating}>
            {createRoadmap.isError ? (
              <>
                <div className={styles.genIcon}>⚠️</div>
                <div className={styles.genTitle}>Something went wrong</div>
                <div className={styles.genSub}>
                  {createRoadmap.error?.response?.data?.message || 'Could not create roadmap.'}
                </div>
                <button className="btn btn-primary" onClick={() => {
                  localStorage.setItem('devlearn_onboarded', '1');
                  onComplete?.();
                  navigate('/');
                }}>
                  Continue anyway →
                </button>
              </>
            ) : (
              <>
                <div className={styles.spinner} />
                <div className={styles.genTitle}>Building your roadmap…</div>
                <div className={styles.genSub}>Finding the best topics for your goal</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}