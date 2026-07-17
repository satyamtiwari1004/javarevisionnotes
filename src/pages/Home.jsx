import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heapnotesLogo from '/heapnotes-logo.svg';

gsap.registerPlugin(ScrollTrigger);

import { DATA as SPRING_DATA } from '../SpringAnnotations';
import { SECTIONS as MULTITHREADING_SECTIONS } from '../javamultithreading';
import { SECTIONS as DESIGN_PATTERNS_SECTIONS } from '../java_design_patterns';
import { SECTIONS as STREAMS_SECTIONS } from '../javastreams';
import { SECTIONS as COLLECTIONS_SECTIONS } from '../javacollection';
import { SECTIONS as DSA_SECTIONS } from '../javadsa';
import { SECTIONS as SQL_SECTIONS } from '../sqlquestion';
import { SECTIONS as KAFKA_SECTIONS } from '../kafka_reference';
import { SECTIONS as INTERVIEW_SECTIONS } from '../java_previous_interview';
import { SECTIONS as SYSTEM_DESIGN_SECTIONS } from '../systemdesign';

export default function Home() {
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const codeCardRef = useRef(null);
  const codeWrapRef = useRef(null);
  const progressRef = useRef(null);
  const libraryRef = useRef(null);

  const topics = useMemo(() => [
    {
      title: 'Spring Boot',
      description: 'Annotations, configuration, MVC, security, JPA, testing, actuator, and messaging in one place.',
      path: '/java',
      key: 'java',
      icon: '☕',
      color: '#F97316',
      eyebrow: 'Framework',
      totalCount: SPRING_DATA.reduce((acc, s) => acc + s.anns.length, 0)
    },
    {
      title: 'Multithreading',
      description: 'Concurrency fundamentals, synchronization, executors, locks, and thread safety patterns.',
      path: '/multithreading',
      key: 'multithreading',
      icon: '🧵',
      color: '#8B5CF6',
      eyebrow: 'Core Java',
      totalCount: MULTITHREADING_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'Design Patterns',
      description: 'Creational, structural, and behavioral patterns with intent, usage, and code-level examples.',
      path: '/design-patterns',
      key: 'design-patterns',
      icon: '🎨',
      color: '#EC4899',
      eyebrow: 'Architecture',
      totalCount: DESIGN_PATTERNS_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'Streams',
      description: 'Intermediate and terminal operations, collectors, transformations, and stream pipelines.',
      path: '/streams',
      key: 'streams',
      icon: '🌊',
      color: '#06B6D4',
      eyebrow: 'Core Java',
      totalCount: STREAMS_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'Collections',
      description: 'List, Set, Map, queue internals, usage tradeoffs, and common interview comparisons.',
      path: '/collections',
      key: 'collections',
      icon: '📦',
      color: '#10B981',
      eyebrow: 'Core Java',
      totalCount: COLLECTIONS_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'DSA',
      description: 'Data structures, algorithms, complexity, and implementation-focused revision for interviews.',
      path: '/dsa',
      key: 'dsa',
      icon: '🔢',
      color: '#F59E0B',
      eyebrow: 'Interview Prep',
      totalCount: DSA_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'SQL',
      description: 'DDL, DML, joins, indexing, transactions, and advanced querying with practical examples.',
      path: '/sql',
      key: 'sql',
      icon: '🗄️',
      color: '#3B82F6',
      eyebrow: 'Database',
      totalCount: SQL_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'Kafka',
      description: 'Kafka concepts, configuration, message flow, reliability, and event-driven system patterns.',
      path: '/kafka',
      key: 'kafka',
      icon: '📨',
      color: '#EF4444',
      eyebrow: 'Messaging',
      totalCount: KAFKA_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'Interview Q&A',
      description: 'Previous Java and Spring interview questions distilled into fast-revision notes.',
      path: '/previous-interview',
      key: 'previous-interview',
      icon: '💡',
      color: '#EAB308',
      eyebrow: 'Interview Prep',
      totalCount: INTERVIEW_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    },
    {
      title: 'System Design',
      description: 'Scalability, consistency, caching, partitioning, CAP theorem, and architecture decisions.',
      path: '/system-design',
      key: 'system-design',
      icon: '🏗️',
      color: '#6366F1',
      eyebrow: 'Architecture',
      totalCount: SYSTEM_DESIGN_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
    }
  ], []);

  const [progress, setProgress] = useState({});

  const loadProgress = () => {
    const counts = {};
    topics.forEach((t) => {
      try {
        const saved = localStorage.getItem(`rev_mastered_${t.key}`);
        counts[t.key] = saved ? Object.values(JSON.parse(saved)).filter(Boolean).length : 0;
      } catch {
        counts[t.key] = 0;
      }
    });
    setProgress(counts);
  };

  useEffect(() => {
    loadProgress();
    window.addEventListener('storage', loadProgress);
    return () => window.removeEventListener('storage', loadProgress);
  }, [topics]);

  useEffect(() => {
    let handleMove;
    let handleLeave;
    let wrap;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.from(heroRef.current.querySelectorAll('.heap-hero-badge, .heap-hero-heading, .heap-hero-sub, .heap-hero-ctas, .heap-hero-stats'), {
          opacity: 0,
          y: 18,
          duration: 0.55,
          stagger: 0.12,
          ease: 'power3.out'
        });
      }

      if (codeCardRef.current) {
        gsap.set(codeCardRef.current, { transformPerspective: 1000 });
        gsap.fromTo(
          codeCardRef.current,
          {
            opacity: 0,
            y: 30,
            rotate: 8,
          },
          {
            opacity: 1,
            y: 0,
            rotate: -3,
            duration: 0.85,
            ease: 'power3.out',
            delay: 0.2
          }
        );
      }

      if (codeWrapRef.current && codeCardRef.current) {
        wrap = codeWrapRef.current;
        const card = codeCardRef.current;

        handleMove = (event) => {
          const rect = wrap.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          gsap.to(card, {
            rotateY: px * 10,
            rotateX: -py * 8,
            rotate: -3 + px * 2,
            duration: 0.5,
            ease: 'power2.out'
          });
        };

        handleLeave = () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            rotate: window.innerWidth > 640 ? -3 : 0,
            duration: 0.6,
            ease: 'power3.out'
          });
        };

        wrap.addEventListener('mousemove', handleMove);
        wrap.addEventListener('mouseleave', handleLeave);
      }

      if (statsRef.current) {
        gsap.from(statsRef.current.children, {
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          delay: 0.3
        });
      }

      if (progressRef.current) {
        gsap.from(progressRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: progressRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        });
      }

      if (libraryRef.current) {
        gsap.from(libraryRef.current.children, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: libraryRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    return () => {
      if (wrap && handleMove) wrap.removeEventListener('mousemove', handleMove);
      if (wrap && handleLeave) wrap.removeEventListener('mouseleave', handleLeave);
      ctx.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  const overallStats = useMemo(() => {
    let totalTopics = 0;
    let totalMastered = 0;
    topics.forEach((t) => {
      totalTopics += t.totalCount;
      totalMastered += progress[t.key] || 0;
    });
    return {
      total: totalTopics,
      mastered: totalMastered,
      percent: totalTopics ? Math.round((totalMastered / totalTopics) * 100) : 0,
    };
  }, [progress, topics]);

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all revision progress? This will clear all mastered checks.')) {
      topics.forEach((t) => {
        localStorage.removeItem(`rev_mastered_${t.key}`);
        localStorage.removeItem(`rev_bookmarks_${t.key}`);
      });
      loadProgress();
    }
  };

  const syntax = {
    annotation: isDark ? '#fb923c' : '#ea580c',
    keyword: isDark ? '#c4b5fd' : '#7c3aed',
    type: isDark ? '#93c5fd' : '#2563eb',
    method: isDark ? '#fcd34d' : '#ca8a04',
    string: isDark ? '#4ade80' : '#16a34a',
    comment: isDark ? '#64748b' : '#94a3b8',
    plain: isDark ? '#e2e8f0' : '#0f172a',
  };

  const heroCode = [
    [{ text: '// boot the study workspace', color: syntax.comment }],
    [{ text: '@SpringBootApplication', color: syntax.annotation }],
    [
      { text: 'public class', color: syntax.keyword },
      { text: ' ', color: syntax.plain },
      { text: 'HeroSection', color: syntax.type },
      { text: ' {', color: syntax.plain },
    ],
    [
      { text: '    public static void', color: syntax.keyword },
      { text: ' ', color: syntax.plain },
      { text: 'main', color: syntax.method },
      { text: '(String[] args) {', color: syntax.plain },
    ],
    [
      { text: '        System.out.println', color: syntax.method },
      { text: '(', color: syntax.plain },
      { text: '"HeapNotes"', color: syntax.string },
      { text: ');', color: syntax.plain },
    ],
    [{ text: '    }', color: syntax.plain }],
    [
      { text: '    SpringApplication.run', color: syntax.method },
      { text: '(HeroSection.', color: syntax.plain },
      { text: 'class', color: syntax.type },
      { text: ', args);', color: syntax.plain },
    ],
    [{ text: '}', color: syntax.plain }],
  ];

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'IBM Plex Sans', sans-serif",
        background: 'var(--bg-app)',
        minHeight: '100vh',
        padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 24px) 80px',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease',
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 10, left: '-6%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.14), transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 360, right: '-8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none' }} />
        <section
          ref={heroRef}
          style={{
            position: 'relative',
            overflow: 'visible',
            padding: 'clamp(20px, 4vw, 44px) 0 clamp(16px, 2vw, 22px)',
            marginBottom: 12,
          }}
        >
          <div className="heap-glow" />

          <div className="heap-hero-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <img src={heapnotesLogo} alt="HeapNotes" style={{ height: 34, width: 'auto' }} />
                <div
                  className="heap-hero-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: 0.8,
                    color: isDark ? '#93c5fd' : '#2563eb',
                    background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
                    border: isDark ? '1px solid rgba(59,130,246,0.22)' : '1px solid rgba(59,130,246,0.18)',
                    borderRadius: 999,
                    padding: '6px 12px',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? '#60a5fa' : '#3b82f6', display: 'inline-block' }} />
                  HEAPNOTES · {overallStats.total} TOPICS
                </div>
              </div>

              <h1
                className="heap-hero-heading"
                style={{
                  fontSize: 'clamp(36px, 6vw, 64px)',
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  margin: '0 0 20px 0',
                  maxWidth: 680,
                }}
              >
                Revision notes for
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  serious Java prep.
                </span>
              </h1>

              <p
                className="heap-hero-sub"
                style={{
                  color: isDark ? '#94a3b8' : '#475569',
                  fontSize: 15,
                  lineHeight: 1.75,
                  maxWidth: 460,
                  margin: '0 0 32px 0',
                }}
              >
                {overallStats.total} topics across Spring Boot, concurrency, Streams, Kafka and DSA — structured for interview revision, not scrolling.
              </p>

              <div className="heap-hero-ctas" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
                <Link
                  to="/java"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(90deg, #3b82f6, #7c3aed)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '12px 20px',
                    borderRadius: 12,
                    boxShadow: '0 16px 36px rgba(30, 64, 175, 0.28)',
                  }}
                >
                  Open Spring Boot notes →
                </Link>
                <a
                  href="#library"
                  style={{
                    textDecoration: 'none',
                    color: isDark ? '#cbd5e1' : '#334155',
                    fontSize: 14,
                    fontWeight: 500,
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  Browse library
                </a>
              </div>

              <div
                ref={statsRef}
                className="heap-hero-stats"
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: 20,
                  maxWidth: 430,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { label: 'Topics', value: overallStats.total },
                  { label: 'Tracks', value: topics.length },
                  { label: 'Progress', value: `${overallStats.percent}%` },
                ].map((item, index) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ padding: index === 0 ? '0 24px 0 0' : '0 24px', minWidth: 92 }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>{item.label}</div>
                    </div>
                    {index < 2 && <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />}
                  </div>
                ))}
              </div>
            </div>

            <div ref={codeWrapRef} className="heap-code-wrap" style={{ perspective: '1000px' }}>
              <div ref={codeCardRef} className="heap-code-card" style={{
                background: isDark ? 'rgba(20,25,38,0.55)' : 'rgba(255,255,255,0.52)',
                backdropFilter: 'blur(18px) saturate(140%)',
                WebkitBackdropFilter: 'blur(18px) saturate(140%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.36)' : '0 26px 52px rgba(148,163,184,0.22)',
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
                      <span key={color} style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    ))}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 11, color: isDark ? '#94a3b8' : '#475569', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 8px' }}>
                    ☕ HeroSection.java
                  </div>
                </div>

                <div style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 12.5, lineHeight: '24px', padding: '16px 20px' }}>
                  {heroCode.map((parts, index) => (
                    <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                      {parts.map((part, partIndex) => (
                        <span key={partIndex} style={{ color: part.color }}>{part.text}</span>
                      ))}
                      {index === heroCode.length - 1 && <span className="hero-cursor">▍</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={progressRef}
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            background: isDark ? 'rgba(17, 24, 39, 0.64)' : 'rgba(255,255,255,0.82)',
            boxShadow: 'var(--card-shadow)',
            padding: 'clamp(20px, 3vw, 28px)',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 8 }}>Study progress</div>
              <h3 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--text-title)' }}>Your current revision snapshot</h3>
            </div>
            <button
              onClick={handleResetProgress}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Progress
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Overall completion</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-accent)' }}>{overallStats.mastered} / {overallStats.total}</span>
            </div>
            <div style={{ width: '100%', height: 12, borderRadius: 999, background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallStats.percent}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--text-accent), #10b981)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
            {topics.map((topic) => {
              const masteredCount = progress[topic.key] || 0;
              const percent = topic.totalCount ? Math.round((masteredCount / topic.totalCount) * 100) : 0;

              return (
                <div key={topic.key} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '12px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.64)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 16 }}>{topic.icon}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: 13 }}>{topic.title}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: topic.color }}>{percent}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(148, 163, 184, 0.15)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: topic.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{masteredCount} of {topic.totalCount} completed</div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="library">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 8 }}>Library</div>
              <h3 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', color: 'var(--text-title)' }}>Choose a track and keep moving</h3>
            </div>
            <p style={{ margin: 0, maxWidth: 420, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              Each section is organized for revision first: fast scanning, concept recall, code examples, and progress tracking.
            </p>
          </div>

          <div ref={libraryRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
            {topics.map((topic) => {
              const masteredCount = progress[topic.key] || 0;
              const percent = topic.totalCount ? Math.round((masteredCount / topic.totalCount) * 100) : 0;

              return (
                <Link
                  key={topic.path}
                  to={topic.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    background: isDark ? 'rgba(17, 24, 39, 0.62)' : 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 22,
                    padding: '16.5px',
                    boxShadow: 'var(--card-shadow)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1.02,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      boxShadow: 'var(--card-shadow)',
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${topic.color}, ${topic.color}55)` }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ fontSize: 22, lineHeight: 1, padding: 8, borderRadius: 12, background: `${topic.color}18`, border: `1px solid ${topic.color}30` }}>
                        {topic.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.1, color: topic.color, fontWeight: 800, marginBottom: 5 }}>{topic.eyebrow}</div>
                        <h4 style={{ margin: 0, fontSize: 16, color: 'var(--text-title)' }}>{topic.title}</h4>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{topic.totalCount} items</span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{topic.description}</p>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                      <span style={{ color: topic.color, fontWeight: 800 }}>{percent}% · {masteredCount}/{topic.totalCount}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(148, 163, 184, 0.15)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: topic.color, borderRadius: 999 }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div style={{ 
          marginTop: 64, 
          textAlign: 'center', 
          padding: '30px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <p style={{ 
            fontSize: 13, 
            color: 'var(--text-secondary)', 
            margin: 0
          }}>
            Built with ❤️ for developers · Keep track of your path.
          </p>
          <button
            onClick={handleResetProgress}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Clear Mastered Progress
          </button>
        </div>
      </div>
    </div>
  );
}
