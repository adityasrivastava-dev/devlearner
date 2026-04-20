import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { authApi, screenshotsApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './Login.module.css';

const GOOGLE_OAUTH_URL = `${import.meta.env.VITE_API_URL || ''}/oauth2/authorization/google`;

// ── Feature flashcard data ────────────────────────────────────────────────────
// key must match SLIDE_KEYS in LoginScreenshotsAdmin
const FEATURES = [
  { key:'overview',          icon:'⟨/⟩', accent:'#6366f1', tag:'What is this?',        title:'Interview Prep OS for Backend Engineers',       body:'Not another LeetCode clone. DevLearner is a structured system for developers with production experience who want to recall patterns, drill code under pressure, and walk into MAANG interviews with confidence.',    stat:['Java · DSA · Spring · System Design', null] },
  { key:'gate-system',       icon:'🎯',  accent:'#4ade80', tag:'Learning System',      title:'Gate-Based Topic Mastery',                       body:'Every topic has five stages: Theory → Easy → Medium → Hard → Mastered. You cannot skip stages. Write a 20-char theory note to unlock Easy. Solve 3 Easy to unlock Medium. Progress is locked-in, not self-reported.',  stat:['300+ topics across 8 categories', null] },
  { key:'interview-mode',    icon:'⏱',  accent:'#f59e0b', tag:'Interview Mode',        title:'Simulate a Real Technical Interview',            body:'Pick 20 / 35 / 45 min. Write your approach first — coding is locked until you explain your plan. No hints. Clock turns red in the last minute. Auto-submits on timeout.',                                               stat:['Approach-first', 'No hints available'] },
  { key:'spaced-repetition', icon:'🧠', accent:'#a78bfa', tag:'Memory Science',        title:'Spaced Repetition Built In',                     body:'The SM-2 algorithm schedules topics for review at the exact moment you are about to forget them. Rate each card: Forgot / Hard / Got it / Easy. The harder you found it, the sooner it comes back.',                          stat:['SM-2 algorithm', '50 years of research'] },
  { key:'analytics',         icon:'📊', accent:'#fb923c', tag:'Performance Analytics', title:'Know Exactly Where You Are Weak',                body:'Confidence scores per topic from your actual submissions — not self-assessment. Weak areas, error breakdown (WA / CE / TLE), and a mistake journal of every wrong submission.',                                        stat:['Real data from your submissions', null] },
  { key:'algorithms',        icon:'∑',  accent:'#38bdf8', tag:'Algorithm Library',     title:'70+ Algorithms with Story-Driven Theory',        body:'Every algorithm has a one-sentence analogy, a narrative story, step-by-step walkthrough, Java code, complexity analysis, real-world use cases, common pitfalls, and a visualizer. No dry definitions.',              stat:['18 categories', 'A01–A18 seed files'] },
  { key:'complexity',        icon:'⚡', accent:'#f472b6', tag:'Complexity Analyzer',   title:'Paste Java Code → Get Big-O Instantly',          body:'Static analysis reads your loop structure, recursion depth, and sorting calls to give you time and space complexity with a confidence score. Green O(1) to red O(2ⁿ) — see your bottleneck.',                  stat:['Real static analysis', 'HIGH / MEDIUM / LOW confidence'] },
  { key:'habit-engine',      icon:'🔥', accent:'#f87171', tag:'Habit Engine',          title:'Streak, XP, and Levels that Mean Something',    body:'Daily streak tracks actual learning activity, not logins. Earn pause days from long streaks to protect your count. XP flows from submissions and reviews. Level up from Beginner to Architect.',             stat:['Pause days protect your streak', 'Beginner → Architect'] },
  { key:'interview-qa',      icon:'📋', accent:'#34d399', tag:'Interview Q&A',         title:'Curated Q&A Bank + Timed Revision',              body:'Filter 500+ questions by category and difficulty. Each answer has key points and code examples. Revision Mode: set a timer, reveal-and-rate each answer, get a scored report.',                                        stat:['Java · DSA · Spring · SQL · AWS', 'Reveal-and-rate format'] },
  { key:'mastery-map',       icon:'◉',  accent:'#818cf8', tag:'Mastery Map',           title:'See Your Entire Knowledge at a Glance',         body:'A visual grid of every topic coloured by your gate stage. Grey = untouched, blue to green as you progress. Grouped by category with per-category stats. One click to open any topic.',                              stat:['All topics in one view', null] },
  { key:'daily-challenge',   icon:'🔥', accent:'#ef4444', tag:'Daily Challenge',       title:'One Problem. All Users. 24 Hours.',              body:'Every day a new coding challenge goes live for all users simultaneously. Solve it before midnight to extend your streak. See how fast you solved it vs. the community leaderboard.',                               stat:['Same problem for everyone', 'Shared leaderboard'] },
  { key:'timetable',         icon:'📅', accent:'#0ea5e9', tag:'Study Timetable',       title:'Day-by-Day Study Plan, Auto-Generated',          body:'Pick a template (Java Backend, DSA Intensive, 2-Week Refresh), set hours per day, and get a full calendar generated. Check off tasks daily. Rest days built in every 7 study days.',                       stat:['4 path templates', 'Day-by-day schedule'] },
  { key:'mcq-quiz',          icon:'🧠', accent:'#8b5cf6', tag:'MCQ Quiz System',       title:'Test Your Theory with Multiple-Choice Quizzes', body:'Topic-tagged quiz bank with Beginner / Intermediate / Advanced tiers. Each wrong answer reveals the correct explanation. Track your quiz accuracy over time.',                                                       stat:['Topic-tagged questions', 'Difficulty tiers'] },
  { key:'roadmap',           icon:'🗺', accent:'#10b981', tag:'Roadmap Builder',       title:'Follow a Guided Learning Path',                  body:'Create or follow structured roadmaps: Java Backend, DSA, Full Stack. Topics are ordered by phase. Your gate progress on each topic is shown inline. Navigate directly to any topic from the roadmap.',             stat:['Structured phases', 'Gate progress inline'] },
  { key:'quick-win',         icon:'⚡', accent:'#f59e0b', tag:'Quick Win',             title:'Build Confidence in 5-Minute Sessions',          body:"Short, focused coding sessions to rebuild confidence before an interview. Picks problems just below your current difficulty ceiling so you finish successfully every time and feel sharp.",              stat:['5-minute sessions', 'Below-ceiling difficulty'] },
  { key:'smart-interview',   icon:'🤖', accent:'#a78bfa', tag:'Smart AI Interviewer',  title:'Alex Reads Your Resume and Interviews You Live',  body:'Upload your resume PDF. Alex — an adaptive AI senior engineer — reads every line of your experience, then conducts a full 20-question interview that evolves in real time. Harder when you are strong, gentler when you struggle. Voice support built in.',  stat:['Adaptive difficulty', 'TTS + STT voice support'] },
  { key:'practice-set',      icon:'📝', accent:'#06b6d4', tag:'Practice Set',           title:'All Q&As Visible — Go as Deep as You Want',       body:'Upload your resume and get 30 personalised Q&As across Theory, Coding, Projects, Behavioral and System Design — all answers revealed at once. Click "Load More" on any topic to get 10 deeper sub-topic questions. Study mode, not quiz mode.',            stat:['30 questions from your resume', 'Unlimited topic deep-dives'] },
  { key:'mock-interview',    icon:'🎤', accent:'#f472b6', tag:'Mock Interview',          title:'Configurable AI Mock with Instant Feedback',      body:'Choose category, difficulty, and duration. The AI asks questions one by one, evaluates your answer immediately with a score and feedback, and gives you a full breakdown at the end. No resume needed — works for any topic.',                          stat:['Score per answer', 'Full session report'] },
  { key:'stories',           icon:'📖', accent:'#34d399', tag:'Story Builder',           title:'Nail Behavioral Questions with STAR Format',      body:'Write your real work stories in the Situation → Task → Action → Result format. AI polishes your language for clarity and impact. Save a library of stories you can pull from instantly in any behavioral interview.',                                     stat:['STAR format editor', 'AI polish with one click'] },
];

// ── CSS mockup screens — one per FEATURES entry (same index) ─────────────────
// If admin has uploaded a real screenshot for a key, it is shown instead.
const PREVIEWS = [
  // 0 overview
  (a) => <PvFrame url="devlearner · Dashboard"><div className={styles.pvBody}><div className={styles.pvRow}>{[['Streak','🔥 42d','#f87171'],['Level','Senior',a],['SRS','8 due','#fbbf24']].map(([l,v,c])=><div key={l} className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div className={styles.pvBig} style={{color:c,fontSize:13}}>{v}</div><div className={styles.pvLabel}>{l}</div></div>)}</div><div className={styles.pvCard} style={{marginTop:6}}><div className={styles.pvLabel}>Activity — 12 weeks</div><div className={styles.pvHeatmap}>{Array.from({length:84}).map((_,i)=><span key={i} className={styles.pvCell} style={{background:i%7===0?'transparent':i>60?a+'cc':i>40?a+'88':i>20?a+'44':'var(--border)'}}/>)}</div></div></div></PvFrame>,
  // 1 gate-system
  (a) => <PvFrame url="devlearner · HashMap · Theory"><div className={styles.pvBody}><div className={styles.pvGateRow}>{['THEORY','EASY','MEDIUM','HARD','MASTERED'].map((s,i)=><span key={s} className={styles.pvGateStep} style={i===0?{background:a+'22',color:a,borderColor:a+'44'}:{}}>{s}</span>)}</div><div className={styles.pvCard} style={{marginTop:6}}><div className={styles.pvLabel}>Memory Anchors</div><div className={styles.pvChipRow}>{[['O(1)','avg lookup'],['buckets','array of lists'],['load','0.75']].map(([k,v])=><span key={k} className={styles.pvChip} style={{borderColor:a+'44',color:a}}><b>{k}</b>: {v}</span>)}</div></div><div className={styles.pvCard} style={{marginTop:5}}><div className={styles.pvLabel}>Story</div><div className={styles.pvStory}>Imagine you are a librarian with 1M books. Instead of searching every shelf, you hash the title to a specific shelf number instantly…</div></div></div></PvFrame>,
  // 2 interview-mode
  (a) => <PvFrame url="devlearner · Interview Mode · 35min"><div className={styles.pvBody}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><div className={styles.pvBig} style={{color:a,fontSize:11}}>LRU Cache</div><div style={{background:'#f8717122',color:'#f87171',padding:'2px 10px',borderRadius:6,fontSize:11,fontWeight:700,border:'1px solid #f8717144',fontFamily:'monospace'}}>⏱ 32:17</div></div><div className={styles.pvCard} style={{background:'rgba(251,191,36,.07)',borderColor:'#fbbf2433'}}><div style={{color:'#fbbf24',fontSize:9,fontWeight:700,marginBottom:2}}>⚠ APPROACH FIRST — coding locked</div><div className={styles.pvStory}>Describe your plan before writing code. Be specific about data structures.</div></div><div className={styles.pvCard} style={{marginTop:5}}><div className={styles.pvLabel}>Your approach</div><div className={styles.pvStory} style={{color:'rgba(255,255,255,.7)'}}>Doubly linked list + HashMap. Map stores key→node for O(1) lookup, list maintains LRU order via move-to-front…</div></div><div style={{marginTop:6,display:'flex',gap:5}}><span style={{background:a,color:'#0d0f12',padding:'3px 10px',borderRadius:5,fontSize:9,fontWeight:700}}>Lock in Approach →</span><span style={{padding:'3px 8px',borderRadius:5,fontSize:9,border:'1px solid var(--border)',color:'var(--text3)'}}>No Hints</span></div></div></PvFrame>,
  // 3 spaced-repetition
  (a) => <PvFrame url="devlearner · Review Queue"><div className={styles.pvBody}><div className={styles.pvCard}><div className={styles.pvLabel}>Card 4 of 12 · Due today</div><div style={{color:'rgba(255,255,255,.85)',fontSize:11,fontWeight:700,marginTop:4,marginBottom:8}}>What is the time complexity of HashMap.get() in the worst case and why?</div><div style={{width:'100%',height:1,background:'var(--border)',marginBottom:8}}/><div className={styles.pvStory} style={{color:a}}>O(n) worst case — all keys hash to same bucket (degenerate linked list). Average O(1).</div></div><div style={{display:'flex',gap:5,marginTop:6}}>{[['Forgot','#f87171'],['Hard','#fbbf24'],['Got it',a],['Easy','#4ade80']].map(([l,c])=><span key={l} style={{flex:1,background:c+'18',color:c,border:`1px solid ${c}44`,borderRadius:5,padding:'4px 0',textAlign:'center',fontSize:8,fontWeight:700,cursor:'pointer'}}>{l}</span>)}</div><div className={styles.pvSub} style={{marginTop:5,textAlign:'center'}}>SM-2 · next review in 4 days if you click Got it</div></div></PvFrame>,
  // 4 analytics
  (a) => <PvFrame url="devlearner · Analytics"><div className={styles.pvBody}><div className={styles.pvRow}>{[['Solved','127',a],['Accuracy','78%','#4ade80'],['Avg Time','18m','#fbbf24']].map(([l,v,c])=><div key={l} className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div className={styles.pvBig} style={{color:c,fontSize:15}}>{v}</div><div className={styles.pvLabel}>{l}</div></div>)}</div><div className={styles.pvCard} style={{marginTop:6}}><div className={styles.pvLabel}>Confidence by Topic</div><div style={{display:'flex',flexDirection:'column',gap:4,marginTop:4}}>{[['HashMap','88%','#4ade80'],['Arrays','72%',a],['Trees','45%','#fbbf24'],['DP','31%','#f87171']].map(([t,p,c])=><div key={t} style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:44,fontSize:8,color:'rgba(255,255,255,.4)',flexShrink:0}}>{t}</span><div style={{flex:1,height:5,background:'rgba(255,255,255,.06)',borderRadius:3}}><div style={{width:p,height:'100%',background:c,borderRadius:3}}/></div><span style={{fontSize:8,color:c,width:22,textAlign:'right'}}>{p}</span></div>)}</div></div></div></PvFrame>,
  // 5 algorithms
  (a) => <PvFrame url="devlearner · Algorithms · BFS"><div className={styles.pvBody}><div style={{display:'flex',gap:5,marginBottom:5}}><span className={styles.pvBadge} style={{background:a+'20',color:a,border:`1px solid ${a}44`}}>INTERMEDIATE</span><span className={styles.pvBadge} style={{background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.4)',border:'1px solid rgba(255,255,255,.1)'}}>Graph · Traversal</span></div><div className={styles.pvBig} style={{color:'rgba(255,255,255,.9)',fontSize:12,marginBottom:4}}>Breadth-First Search</div><div className={styles.pvCard}><div className={styles.pvLabel}>One-sentence analogy</div><div className={styles.pvStory}>BFS is like dropping a stone in water — ripples spread out one ring at a time, visiting all nodes at distance 1, then 2, then 3.</div></div><div className={styles.pvRow} style={{marginTop:5}}>{[['Time','O(V+E)'],['Space','O(V)']].map(([k,v])=><div key={k} className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div style={{color:a,fontWeight:700,fontSize:10}}>{v}</div><div className={styles.pvLabel}>{k}</div></div>)}</div></div></PvFrame>,
  // 6 complexity
  (a) => <PvFrame url="devlearner · Complexity Analyzer"><div className={styles.pvBody}><div className={styles.pvCard}><div className={styles.pvLabel}>Paste Java code</div><div style={{background:'#0d1117',borderRadius:5,padding:'6px 8px',fontFamily:'monospace',fontSize:8.5,color:'#e2e8f0',lineHeight:1.7,marginTop:3}}><span style={{color:'#7c3aed'}}>for</span> (<span style={{color:'#7c3aed'}}>int</span> i=0; i&lt;n; i++) {'{'}<br/>&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>for</span> (<span style={{color:'#7c3aed'}}>int</span> j=0; j&lt;n; j++) {'{'}<br/>&nbsp;&nbsp;&nbsp;&nbsp;sum += arr[i][j];<br/>&nbsp;&nbsp;{'}'}<br/>{'}'}</div></div><div className={styles.pvRow} style={{marginTop:6}}><div className={styles.pvCard} style={{flex:1,borderColor:'#f8717144'}}><div className={styles.pvLabel}>Time</div><div style={{color:'#f87171',fontSize:18,fontWeight:800}}>O(n²)</div></div><div className={styles.pvCard} style={{flex:1,borderColor:'#4ade8044'}}><div className={styles.pvLabel}>Space</div><div style={{color:'#4ade80',fontSize:18,fontWeight:800}}>O(1)</div></div><div className={styles.pvCard} style={{flex:1}}><div className={styles.pvLabel}>Confidence</div><div style={{color:a,fontSize:10,fontWeight:700,marginTop:2}}>HIGH</div></div></div></div></PvFrame>,
  // 7 habit-engine
  (a) => <PvFrame url="devlearner · Profile · Habit Engine"><div className={styles.pvBody}><div className={styles.pvRow}>{[['🔥','42 day streak','#f87171'],['⚡','1840 XP',a],['⏸','3 pause days','#4ade80']].map(([ic,v,c])=><div key={v} className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div style={{fontSize:16}}>{ic}</div><div className={styles.pvBig} style={{color:c,fontSize:10,marginTop:2}}>{v}</div></div>)}</div><div className={styles.pvCard} style={{marginTop:5}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><div className={styles.pvLabel}>Level — Senior Dev</div><div style={{color:a,fontSize:9,fontWeight:700}}>1840 / 2500 XP</div></div><div className={styles.pvBar} style={{marginTop:5}}><div className={styles.pvBarFill} style={{width:'73%',background:a}}/></div></div><div className={styles.pvCard} style={{marginTop:5}}><div className={styles.pvLabel}>Activity Heatmap</div><div className={styles.pvHeatmap} style={{gridTemplateColumns:'repeat(14,1fr)'}}>{Array.from({length:56}).map((_,i)=><span key={i} className={styles.pvCell} style={{background:i>42?a+'cc':i>28?a+'77':i>14?a+'33':'rgba(255,255,255,.04)'}}/>)}</div></div></div></PvFrame>,
  // 8 interview-qa
  (a) => <PvFrame url="devlearner · Interview Q&A"><div className={styles.pvBody}><div style={{display:'flex',gap:4,marginBottom:5,flexWrap:'wrap'}}>{['Java','DSA','Spring','SQL','AWS'].map(t=><span key={t} className={styles.pvBadge} style={{background:t==='Java'?a+'22':'rgba(255,255,255,.05)',color:t==='Java'?a:'rgba(255,255,255,.4)',border:`1px solid ${t==='Java'?a+'44':'rgba(255,255,255,.1)'}`}}>{t}</span>)}</div><div className={styles.pvCard}><div style={{color:'rgba(255,255,255,.85)',fontSize:10,fontWeight:700,marginBottom:4}}>What happens when two keys hash to the same bucket in a HashMap?</div><div className={styles.pvStory} style={{color:a}}>This is a collision. Java resolves it using chaining (linked list / tree at each bucket). From Java 8+, if chain length exceeds 8, it converts to a red-black tree for O(log n) lookup.</div></div><div className={styles.pvSub} style={{marginTop:5,textAlign:'center'}}>500+ questions · Java · DSA · Spring · SQL · AWS</div></div></PvFrame>,
  // 9 mastery-map
  (a) => <PvFrame url="devlearner · Mastery Map"><div className={styles.pvBody}><div className={styles.pvLabel} style={{marginBottom:4}}>DSA — 14 topics</div><div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:6}}>{['#4ade80','#4ade80','#fbbf24','#fbbf24','#60a5fa','#60a5fa',a,'rgba(255,255,255,.1)','rgba(255,255,255,.1)','rgba(255,255,255,.1)','rgba(255,255,255,.1)','rgba(255,255,255,.1)','rgba(255,255,255,.1)','rgba(255,255,255,.1)'].map((c,i)=><span key={i} style={{aspectRatio:'1',borderRadius:4,background:c,display:'block'}}/>)}</div><div className={styles.pvLabel} style={{marginBottom:4}}>Java Core — 32 topics</div><div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:3}}>{Array.from({length:32}).map((_,i)=><span key={i} style={{aspectRatio:'1',borderRadius:4,background:i<12?'#4ade80':i<20?a:i<24?'#fbbf24':'rgba(255,255,255,.07)',display:'block'}}/>)}</div><div style={{display:'flex',gap:8,marginTop:7,justifyContent:'center'}}>{[['MASTERED','#4ade80'],['IN PROGRESS',a],['THEORY','#fbbf24'],['LOCKED','rgba(255,255,255,.1)']].map(([l,c])=><span key={l} style={{display:'flex',alignItems:'center',gap:3,fontSize:7,color:'rgba(255,255,255,.4)'}}><span style={{width:8,height:8,borderRadius:2,background:c,display:'inline-block'}}/>{l}</span>)}</div></div></PvFrame>,
  // 10 daily-challenge
  (a) => <PvFrame url="devlearner · Daily Challenge"><div className={styles.pvBody}><div style={{textAlign:'center',marginBottom:6}}><div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:2}}>Today's Challenge resets in</div><div style={{fontSize:20,fontWeight:800,fontFamily:'monospace',color:a,letterSpacing:2}}>08:42:17</div></div><div className={styles.pvCard}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{color:'rgba(255,255,255,.85)',fontSize:10,fontWeight:700}}>Trapping Rain Water</div><span className={styles.pvBadge} style={{background:'#f8717122',color:'#f87171',border:'1px solid #f8717144'}}>HARD</span></div><div className={styles.pvStory} style={{marginTop:4}}>Given n non-negative integers representing elevation map, compute how much water it can trap.</div></div><div className={styles.pvRow} style={{marginTop:5}}><div className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div style={{color:'#4ade80',fontSize:13,fontWeight:800}}>1,247</div><div className={styles.pvLabel}>Solved today</div></div><div className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div style={{color:a,fontSize:13,fontWeight:800}}>Top 8%</div><div className={styles.pvLabel}>Your rank</div></div></div></div></PvFrame>,
  // 11 timetable
  (a) => <PvFrame url="devlearner · Study Timetable · Day 3"><div className={styles.pvBody}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}><div style={{color:'rgba(255,255,255,.8)',fontSize:10,fontWeight:700}}>Day 3 — Wed Apr 17</div><span className={styles.pvBadge} style={{background:a+'22',color:a,border:`1px solid ${a}44`}}>TODAY</span></div>{[['📖','THEORY','HashMap — Study theory, memory anchors','45m',true],['🟢','EASY','HashMap — Solve 3 easy problems','1h',false],['🔄','REVIEW','Q&A flashcards + spaced repetition','20m',false]].map(([ic,type,desc,time,done])=><div key={type} className={styles.pvCard} style={{marginBottom:4,opacity:done?.5:1}}><div style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" readOnly checked={done} style={{accentColor:a,width:11,height:11}}/><span style={{fontSize:9}}>{ic}</span><div style={{flex:1}}><div style={{color:done?'rgba(255,255,255,.3)':'rgba(255,255,255,.8)',fontSize:9,fontWeight:600,textDecoration:done?'line-through':'none'}}>{desc}</div></div><span style={{color:'rgba(255,255,255,.3)',fontSize:8}}>{time}</span></div></div>)}</div></PvFrame>,
  // 12 mcq-quiz
  (a) => <PvFrame url="devlearner · MCQ Quiz · Java Core"><div className={styles.pvBody}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:9,color:'rgba(255,255,255,.4)'}}>Question 4 / 10</span><span style={{fontSize:9,color:a,fontWeight:700}}>INTERMEDIATE</span></div><div className={styles.pvCard} style={{marginBottom:5}}><div style={{color:'rgba(255,255,255,.85)',fontSize:10,fontWeight:700}}>Which collection maintains insertion order and allows duplicate values?</div></div>{[['A','HashSet — unordered, no duplicates',false],['B','ArrayList — ordered, allows duplicates',true],['C','TreeSet — sorted, no duplicates',false],['D','HashMap — key-value, no dup keys',false]].map(([opt,text,correct])=><div key={opt} className={styles.pvCard} style={{marginBottom:3,borderColor:correct?a+'66':'',background:correct?a+'0d':''}}><div style={{display:'flex',gap:6,alignItems:'center'}}><span style={{color:correct?a:'rgba(255,255,255,.3)',fontSize:9,fontWeight:700,flexShrink:0}}>{opt}.</span><span style={{fontSize:8.5,color:correct?a:'rgba(255,255,255,.55)'}}>{text}</span></div></div>)}</div></PvFrame>,
  // 13 roadmap
  (a) => <PvFrame url="devlearner · Roadmap · Java Backend Path"><div className={styles.pvBody}><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.8)',marginBottom:5}}>Java Backend Path</div>{[['Java Core','B01–B32 · 32 topics','#4ade80',100],['Spring Boot','S01–S06 · 6 topics',a,60],['MySQL','M01–M06 · 6 topics','#fbbf24',20],['AWS','A01–A04 · 4 topics','rgba(255,255,255,.2)',0]].map(([phase,sub,c,pct])=><div key={phase} className={styles.pvCard} style={{marginBottom:4}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{color:c,fontSize:9,fontWeight:700}}>{phase}</div><div style={{fontSize:7.5,color:'rgba(255,255,255,.3)',marginTop:1}}>{sub}</div></div><span style={{fontSize:8,color:c,fontWeight:700}}>{pct}%</span></div><div className={styles.pvBar} style={{marginTop:4}}><div className={styles.pvBarFill} style={{width:`${pct}%`,background:c}}/></div></div>)}</div></PvFrame>,
  // 14 quick-win
  (a) => <PvFrame url="devlearner · Quick Win Session"><div className={styles.pvBody}><div style={{textAlign:'center',marginBottom:6}}><div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:2}}>5-minute confidence builder</div><div style={{fontSize:13,fontWeight:800,color:a}}>You can do this ⚡</div></div><div className={styles.pvCard} style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{color:'rgba(255,255,255,.85)',fontSize:10,fontWeight:700}}>Valid Parentheses</div><span className={styles.pvBadge} style={{background:'#4ade8022',color:'#4ade80',border:'1px solid #4ade8044'}}>EASY</span></div><div className={styles.pvStory} style={{marginTop:3}}>Given a string of brackets, return true if every open bracket is closed in the correct order.</div></div><div style={{display:'flex',gap:5,marginTop:4,justifyContent:'center'}}><span style={{background:a,color:'#0d0f12',padding:'4px 16px',borderRadius:6,fontSize:9,fontWeight:700}}>Start Session →</span></div><div className={styles.pvSub} style={{textAlign:'center',marginTop:5}}>Picks problems just below your ceiling — finish strong every time</div></div></PvFrame>,
  // 15 smart-interview
  (a) => <PvFrame url="devlearner · AI Interviewer · Live"><div className={styles.pvBody}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:5,padding:'5px 8px',background:'var(--bg)',borderRadius:6,border:'1px solid var(--border)'}}><span style={{width:22,height:22,borderRadius:'50%',background:a+'33',color:a,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>A</span><div style={{flex:1}}><div style={{fontSize:8.5,fontWeight:700,color:'rgba(255,255,255,.85)'}}>Alex · Senior Engineer · MAANG</div><div style={{fontSize:7,color:'rgba(255,255,255,.3)'}}>AI Adaptive Interviewer</div></div><div style={{display:'flex',gap:3}}>{['INTRO','THEORY','CODING'].map((p,i)=><span key={p} style={{width:6,height:6,borderRadius:'50%',background:i===0?a:'rgba(255,255,255,.12)',display:'block'}}/>)}</div></div><div className={styles.pvCard} style={{borderLeft:`2px solid ${a}`,marginBottom:5}}><div style={{fontSize:8.5,color:'rgba(255,255,255,.8)',lineHeight:1.55}}>Tell me about the Payment Gateway on your resume — what was the biggest technical challenge and how did you resolve it?</div></div><div style={{background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:6,padding:'5px 8px'}}><div style={{fontSize:7.5,color:'rgba(255,255,255,.22)',marginBottom:3}}>Your answer…</div><div style={{display:'flex',justifyContent:'flex-end',gap:4,marginTop:3}}><span style={{fontSize:7,padding:'2px 7px',borderRadius:4,background:'rgba(255,255,255,.06)',color:'rgba(255,255,255,.3)',border:'1px solid var(--border)'}}>🎤 Speak</span><span style={{fontSize:7,padding:'2px 8px',borderRadius:4,background:a,color:'#0d0f12',fontWeight:700}}>Submit →</span></div></div></div></PvFrame>,
  // 16 practice-set
  (a) => <PvFrame url="devlearner · Practice Set"><div className={styles.pvBody}><div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:5}}>{[['All',''],['Theory',a],['Coding','#4ade80'],['Project','#f59e0b']].map(([l,c])=><span key={l} style={{fontSize:7,padding:'2px 8px',borderRadius:10,background:l==='Theory'?a+'18':'var(--bg)',color:l==='Theory'?a:'rgba(255,255,255,.35)',border:`1px solid ${l==='Theory'?a+'44':'rgba(255,255,255,.08)'}`}}>{l}</span>)}</div><div style={{fontSize:8.5,fontWeight:700,color:'rgba(255,255,255,.55)',borderBottom:'1px solid var(--border)',paddingBottom:4,marginBottom:4}}>HashMap Internals <span style={{fontSize:7,color:'rgba(255,255,255,.2)',marginLeft:4}}>4 questions</span></div>{[['How does HashMap handle collisions in Java 8+?',a],['Implement LRU Cache using HashMap','#4ade80']].map(([q,c],i)=><div key={i} className={styles.pvCard} style={{marginBottom:4,borderLeft:`2px solid ${c}`,padding:'5px 8px'}}><div style={{fontSize:8,color:'rgba(255,255,255,.8)',fontWeight:600,marginBottom:2}}>{q}</div><div style={{fontSize:7.5,color:'rgba(255,255,255,.45)',lineHeight:1.5}}>From Java 8+, when bucket chain exceeds 8, it converts to a red-black tree: O(n) → O(log n) worst case…</div></div>)}<div style={{marginTop:2}}><span style={{fontSize:7.5,padding:'3px 10px',borderRadius:10,border:`1px dashed ${a}44`,background:'transparent',color:a}}>+ Load More on "HashMap Internals"</span></div></div></PvFrame>,
  // 17 mock-interview
  (a) => <PvFrame url="devlearner · Mock Interview · Java Core"><div className={styles.pvBody}><div className={styles.pvRow} style={{marginBottom:5}}>{[['Category','Java Core',a],['Level','Medium','#fbbf24'],['Time','⏱ 18:42','#f87171']].map(([l,v,c])=><div key={l} className={styles.pvCard} style={{flex:1,textAlign:'center'}}><div style={{color:c,fontWeight:700,fontSize:9,marginBottom:1}}>{v}</div><div className={styles.pvLabel}>{l}</div></div>)}</div><div className={styles.pvCard} style={{marginBottom:5}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{fontSize:8,color:'rgba(255,255,255,.4)'}}>Q3 / 8</span><span className={styles.pvBadge} style={{background:a+'18',color:a,border:`1px solid ${a}33`}}>THEORY</span></div><div style={{fontSize:9,color:'rgba(255,255,255,.8)',lineHeight:1.5}}>Explain the difference between HashMap and ConcurrentHashMap. When would you use each?</div></div><div style={{background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:5,padding:'4px 8px',marginBottom:5}}><div style={{fontSize:7.5,color:'rgba(255,255,255,.2)'}}>Your answer…</div></div><div style={{display:'flex',justifyContent:'flex-end',gap:5}}><span style={{fontSize:8,padding:'3px 12px',borderRadius:5,background:a,color:'#0d0f12',fontWeight:700}}>Submit →</span></div></div></PvFrame>,
  // 18 stories
  (a) => <PvFrame url="devlearner · Story Builder · STAR"><div className={styles.pvBody}><div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.75)',marginBottom:5}}>Describe a time you resolved a production incident</div>{[['S','Situation','Payment service down, 50K users affected during peak'],['T','Task','Restore within SLA, zero data loss'],['A','Action','Rolled back deploy, patched DB pool, added circuit breaker'],['R','Result','Restored in 18 min, 0 data loss, runbook created']].map(([k,label,text])=><div key={k} className={styles.pvCard} style={{marginBottom:3,borderLeft:`2px solid ${a}`,padding:'4px 8px'}}><div style={{display:'flex',gap:5,alignItems:'baseline'}}><span style={{color:a,fontWeight:800,fontSize:9,flexShrink:0}}>{k}</span><span style={{fontSize:7,color:'rgba(255,255,255,.3)'}}>{label}</span></div><div style={{fontSize:7.5,color:'rgba(255,255,255,.65)',marginTop:1,lineHeight:1.45}}>{text}</div></div>)}<div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}><span style={{fontSize:7.5,padding:'3px 10px',borderRadius:5,background:a+'18',color:a,border:`1px solid ${a}44`}}>✨ Polish with AI</span></div></div></PvFrame>,
];

// ── Browser-frame wrapper for mockups ─────────────────────────────────────────
function PvFrame({ url, children }) {
  return (
    <div className={styles.pvScreen}>
      <div className={styles.pvTopBar}>
        <span className={styles.pvWinDot} style={{background:'#f87171'}}/>
        <span className={styles.pvWinDot} style={{background:'#fbbf24'}}/>
        <span className={styles.pvWinDot} style={{background:'#4ade80'}}/>
        <span className={styles.pvUrl}>{url}</span>
      </div>
      {children}
    </div>
  );
}

// ── Flashcard panel ───────────────────────────────────────────────────────────
function FeaturePanel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [paused, setPaused]   = useState(false);
  const [pvAnim, setPvAnim]   = useState(false);

  // Fetch real screenshots from DB (public endpoint — no auth required)
  const { data: screenshotsRaw = [] } = useQuery({
    queryKey: ['login-screenshots'],
    queryFn:  screenshotsApi.getAll,
    staleTime: 10 * 60 * 1000,
  });
  // Build key→imageData map
  const screenshots = Object.fromEntries(
    screenshotsRaw.map(s => [s.slideKey, s.imageData]).filter(([,v]) => !!v)
  );

  const goTo = useCallback((idx, dir = 'next') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setPvAnim(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
      setTimeout(() => setPvAnim(false), 50);
    }, 280);
  }, [animating]);

  const next = useCallback(() => goTo((active + 1) % FEATURES.length, 'next'), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + FEATURES.length) % FEATURES.length, 'prev'), [active, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  }, [active, paused, next]);

  const f = FEATURES[active];
  const realScreenshot = screenshots[f.key];

  return (
    <div
      className={styles.featurePanel}
      style={{ '--card-accent': f.accent }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Brand */}
      <div className={styles.fpBrand}>
        <span className={styles.fpBrandIcon}>⟨/⟩</span>
        <span className={styles.fpBrandName}>devlearn</span>
      </div>

      {/* App preview — real screenshot if available, else CSS mockup */}
      <div className={styles.pvWrap}>
        <div className={`${styles.pvSlide} ${pvAnim ? styles.pvSlideOut : styles.pvSlideIn}`}>
          {realScreenshot
            ? <div className={styles.pvScreen} style={{overflow:'hidden'}}>
                <div className={styles.pvTopBar}>
                  <span className={styles.pvWinDot} style={{background:'#f87171'}}/>
                  <span className={styles.pvWinDot} style={{background:'#fbbf24'}}/>
                  <span className={styles.pvWinDot} style={{background:'#4ade80'}}/>
                  <span className={styles.pvUrl}>{f.tag} · devlearner</span>
                </div>
                <img
                  src={realScreenshot}
                  alt={f.tag}
                  style={{width:'100%',display:'block',maxHeight:200,objectFit:'cover',objectPosition:'top'}}
                />
              </div>
            : PREVIEWS[active]?.(f.accent)
          }
        </div>
      </div>

      {/* Card text */}
      <div className={styles.fpContent}>
        <div
          className={`${styles.fpCard} ${
            animating
              ? direction === 'next' ? styles.exitLeft : styles.exitRight
              : styles.enterActive
          }`}
        >
          <div
            className={styles.fpTag}
            style={{ color: f.accent, borderColor: f.accent + '44', background: f.accent + '14' }}
          >
            {f.tag}
          </div>
          <h2 className={styles.fpTitle} style={{fontSize:22}}>{f.title}</h2>
          <p className={styles.fpBody} style={{fontSize:12}}>{f.body}</p>
          {(f.stat[0] || f.stat[1]) && (
            <div className={styles.fpStats}>
              {f.stat.filter(Boolean).map((s) => (
                <span key={s} className={styles.fpStat} style={{ borderColor: f.accent + '33', color: f.accent, background: f.accent + '0e' }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className={styles.fpFooter}>
        <div className={styles.fpControls}>
          <button className={styles.fpArrow} onClick={prev} aria-label="previous">‹</button>
          <div className={styles.fpDots}>
            {FEATURES.map((_, i) => (
              <button
                key={i}
                className={`${styles.fpDot} ${i === active ? styles.fpDotActive : ''}`}
                style={i === active ? { background: f.accent } : {}}
                onClick={() => goTo(i, i > active ? 'next' : 'prev')}
                aria-label={`Feature ${i + 1}`}
              />
            ))}
          </div>
          <span className={styles.fpCounter}>{active + 1} / {FEATURES.length}</span>
          <button className={styles.fpArrow} onClick={next} aria-label="next">›</button>
        </div>
        {!paused && (
          <div className={styles.fpProgress}>
            <div key={active} className={styles.fpProgressFill} style={{ background: f.accent }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Google SVG ────────────────────────────────────────────────────────────────
function GoogleSVG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/';
  const oauthHandled = useRef(false);

  useEffect(() => {
    if (oauthHandled.current) return;
    const oauthToken = searchParams.get('token');
    const oauthError = searchParams.get('error');
    if (oauthError) { oauthHandled.current = true; toast.error('Google login failed. Please try again.'); return; }
    if (!oauthToken) return;
    oauthHandled.current = true;

    const prevToken = localStorage.getItem('devlearn_token');
    localStorage.setItem('devlearn_token', oauthToken);

    authApi.check()
      .then((data) => {
        saveAuth(oauthToken, {
          id: data.id, name: data.name, email: data.email,
          role: data.role, roles: data.roles || [],
          avatar: data.avatarUrl || data.avatar || '',
          streak: data.streakDays ?? 0, solved: data.problemsSolved ?? 0,
        });
        toast.success(`Welcome, ${data.name}!`);
        navigate('/', { replace: true });
      })
      .catch(() => {
        if (prevToken) localStorage.setItem('devlearn_token', prevToken);
        else localStorage.removeItem('devlearn_token');
        toast.error('Google login failed — please try again.');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await authApi.login(form.email, form.password);
      saveAuth(data.token, {
        id: data.id, name: data.name, email: data.email,
        role: data.role, roles: data.roles || [], avatar: data.avatarUrl || '',
        streak: data.streakDays || 0, solved: data.problemsSolved || 0,
      });
      toast.success(`Welcome back, ${data.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!form.name)               { toast.error('Name required'); return; }
    if (!form.email)              { toast.error('Email required'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await authApi.register(form.name, form.email, form.password);
      saveAuth(data.token, {
        id: data.id, name: data.name, email: data.email,
        role: data.role, roles: data.roles || [], avatar: data.avatarUrl || '',
        streak: 0, solved: 0,
      });
      toast.success(`Account created! Welcome, ${data.name}!`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.shell}>
      {/* Left — feature showcase */}
      <FeaturePanel />

      {/* Right — auth */}
      <div className={styles.authPanel}>
        <div className={styles.card}>

          {/* Mobile logo — only shown when left panel is hidden */}
          <div className={styles.mobileLogoWrap}>
            <div className={styles.logoIcon}>⟨/⟩</div>
            <div className={styles.logoText}>dev<span>learn</span></div>
            <div className={styles.logoSub}>Master Java · DSA · System Design</div>
          </div>

          {/* Auth heading */}
          <h1 className={styles.authHeading}>
            {tab === 'login' ? 'Welcome back' : 'Get started free'}
          </h1>
          <p className={styles.authSub}>
            {tab === 'login'
              ? 'Sign in to continue your prep'
              : 'Create your account to start learning'}
          </p>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${tab === 'login' ? styles.active : ''}`}
              onClick={() => setTab('login')}
            >Sign In</button>
            <button
              className={`${styles.tabBtn} ${tab === 'register' ? styles.active : ''}`}
              onClick={() => setTab('register')}
            >Create Account</button>
          </div>

          {/* Stat pills */}
          <div className={styles.pills}>
            {['300+ Topics', '1200+ Problems', 'Live Code Judge', 'SM-2 Reviews'].map((p) => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>

          {/* Login form */}
          {tab === 'login' && (
            <form className={styles.form} onSubmit={handleLogin}>
              <a href={GOOGLE_OAUTH_URL} className={styles.googleBtn}>
                <GoogleSVG />
                Continue with Google
              </a>
              <div className={styles.divider}><span>or sign in with email</span></div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" className="input" placeholder="you@example.com"
                  value={form.email} onChange={set('email')}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                  autoComplete="email" />
              </div>
              <div className={styles.field}>
                <label>Password</label>
                <input type="password" className="input" placeholder="Enter your password"
                  value={form.password} onChange={set('password')}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                  autoComplete="current-password" />
              </div>
              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form className={styles.form} onSubmit={handleRegister}>
              <a href={GOOGLE_OAUTH_URL} className={styles.googleBtn}>
                <GoogleSVG />
                Sign up with Google
              </a>
              <div className={styles.divider}><span>or create with email</span></div>
              <div className={styles.field}>
                <label>Full Name</label>
                <input type="text" className="input" placeholder="Your name"
                  value={form.name} onChange={set('name')} autoComplete="name" />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" className="input" placeholder="you@example.com"
                  value={form.email} onChange={set('email')} autoComplete="email" />
              </div>
              <div className={styles.field}>
                <label>Password</label>
                <input type="password" className="input" placeholder="At least 6 characters"
                  value={form.password} onChange={set('password')}
                  autoComplete="new-password" />
                {form.password && (
                  <div className={styles.strength}>
                    <div className={styles.strengthBar} data-level={
                      form.password.length < 6 ? 'weak'
                      : form.password.length >= 8 && /[A-Z]/.test(form.password) && /\d/.test(form.password)
                        ? 'strong' : 'medium'
                    } />
                  </div>
                )}
              </div>
              <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
                {loading ? <><span className="spinner" />Creating account…</> : 'Create Account →'}
              </button>
            </form>
          )}

          <div className={styles.footer}>
            <a href="/">← Back to app</a>
            <span>·</span>
            <span>No spam, ever</span>
          </div>
        </div>
      </div>
    </div>
  );
}
