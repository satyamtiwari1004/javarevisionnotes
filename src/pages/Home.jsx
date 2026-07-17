import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
    const ctx = gsap.context(() => {
      // Hero animation
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out'
        });
      }

      // Stats boxes animation
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

      // Progress section animation
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

      // Library grid animation
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
    annotation: isDark ? '#fda4af' : '#be123c',
    keyword: isDark ? '#93c5fd' : '#1d4ed8',
    type: isDark ? '#c4b5fd' : '#6d28d9',
    method: isDark ? '#86efac' : '#15803d',
    string: isDark ? '#fcd34d' : '#b45309',
    comment: isDark ? '#94a3b8' : '#64748b',
    plain: isDark ? '#e5eefc' : '#0f172a',
  };

  const heroCode = [
    [{ text: '// Boot the study workspace', color: syntax.comment }],
    [{ text: '@SpringBootApplication', color: syntax.annotation }],
    [
      { text: 'public', color: syntax.keyword },
      { text: ' class ', color: syntax.plain },
      { text: 'HeroSection', color: syntax.type },
      { text: ' {', color: syntax.plain },
    ],
    [
      { text: '    public', color: syntax.keyword },
      { text: ' static ', color: syntax.keyword },
      { text: 'void', color: syntax.keyword },
      { text: ' ', color: syntax.plain },
      { text: 'main', color: syntax.method },
      { text: '(String[] args) {', color: syntax.plain },
    ],
    [
      { text: '        System.out.println', color: syntax.method },
      { text: '(', color: syntax.plain },
      { text: '"Java Learning Hub"', color: syntax.string },
      { text: ');', color: syntax.plain },
    ],
    [
      { text: '        SpringApplication', color: syntax.type },
      { text: '.', color: syntax.plain },
      { text: 'run', color: syntax.method },
      { text: '(HeroSection.class, args);', color: syntax.plain },
    ],
    [{ text: '    }', color: syntax.plain }],
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
            padding: 'clamp(8px, 1.5vw, 16px) 0 clamp(10px, 2vw, 18px)',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-4% -4% 0 -4%',
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 32%), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.16), transparent 24%), linear-gradient(135deg, rgba(249, 115, 22, 0.08), transparent 44%)'
                : 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 35%), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.08), transparent 28%), linear-gradient(135deg, rgba(249, 115, 22, 0.08), transparent 44%)',
              pointerEvents: 'none',
              filter: 'blur(10px)',
            }}
          />

          <div className="hero-shell" style={{ position: 'relative' }}>
            <div className="hero-copy" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.38)', marginBottom: 18, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', color: '#fff', fontSize: 13 }}>⚡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Java Learning Hub
                </span>
              </div>

              <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.02, letterSpacing: '-1.2px', margin: '0 0 12px 0', color: 'var(--text-title)', maxWidth: 640 }}>
                Revision notes for
                <br />
                <span style={{ color: 'var(--text-accent)' }}>serious Java prep.</span>
              </h1>

              <p style={{ maxWidth: 520, margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                Learn faster. Revise smarter.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, marginBottom: 14 }}>
                <Link
                  to="/java"
                  style={{
                    textDecoration: 'none',
                    background: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255,255,255,0.32)',
                    color: 'var(--text-title)',
                    padding: '12px 18px',
                    borderRadius: 14,
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: '0 12px 26px rgba(56, 189, 248, 0.14)',
                  }}
                >
                  Open Spring Boot Notes
                </Link>
                <a
                  href="#library"
                  style={{
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'var(--text-primary)',
                    padding: '12px 18px',
                    borderRadius: 14,
                    fontWeight: 700,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.28)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  Browse Library
                </a>
              </div>

              <div
                ref={statsRef}
                className="hero-stat-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: 12,
                  maxWidth: 520,
                }}
              >
                {[
                  { label: 'Topics', value: overallStats.total },
                  { label: 'Mastered', value: overallStats.mastered },
                  { label: 'Progress', value: `${overallStats.percent}%` },
                  { label: 'Tracks', value: topics.length },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 16,
                      padding: '12px 12px',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.34)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                    }}
                  >
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 'clamp(17px, 3.5vw, 22px)', fontWeight: 800, color: 'var(--text-title)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-editor-wrap">
              <div
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: isDark ? 'rgba(9, 14, 24, 0.56)' : 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: isDark
                    ? '0 26px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)'
                    : '0 24px 70px rgba(148,163,184,0.28), inset 0 1px 0 rgba(255,255,255,0.55)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.16)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
                      <span
                        key={color}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45), ${color} 65%)`,
                          boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.22)',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>☕</span>
                    <span>HeroSection.java</span>
                  </div>

                  <div style={{ width: 44 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', minHeight: 360 }}>
                  <div
                    style={{
                      padding: '18px 10px 18px 0',
                      textAlign: 'right',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.12)',
                      color: isDark ? 'rgba(148,163,184,0.72)' : 'rgba(100,116,139,0.82)',
                      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                      fontSize: 12,
                      lineHeight: 1.95,
                    }}
                  >
                    {heroCode.map((_, index) => (
                      <div key={index + 1}>{index + 1}</div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: '18px 18px 18px 16px',
                      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                      fontSize: 12.5,
                      lineHeight: 1.95,
                      color: syntax.plain,
                      background: isDark ? 'rgba(7,12,22,0.22)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {heroCode.map((parts, index) => (
                      <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                        {parts.map((part, partIndex) => (
                          <span key={partIndex} style={{ color: part.color }}>{part.text}</span>
                        ))}
                        {index === heroCode.length - 1 && <span className="hero-cursor">|</span>}
                      </div>
                    ))}
                  </div>
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
