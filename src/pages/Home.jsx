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
import { SECTIONS as REACT_INTERVIEW_SECTIONS } from '../reactinterview';
import { SECTIONS as SYSTEM_DESIGN_SECTIONS } from '../systemdesign';
import { SECTIONS as MICROSERVICES_SECTIONS } from '../microservices';

export default function Home() {
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const codeCardRef = useRef(null);
  const codeWrapRef = useRef(null);
  const copyLineRef = useRef(null);
  const copyPillRef = useRef(null);
  const fakeCursorRef = useRef(null);
  const copiedToastRef = useRef(null);
  const progressRef = useRef(null);
  const libraryRef = useRef(null);
  const statTopicsRef = useRef(null);
  const statTracksRef = useRef(null);

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
      title: 'React Interview',
      description: 'Hooks, reconciliation, rendering, state, performance, and coding questions for frontend interviews.',
      path: '/react-interview',
      key: 'react-interview',
      icon: '⚛️',
      color: '#06B6D4',
      eyebrow: 'Frontend',
      totalCount: REACT_INTERVIEW_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
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
    },
    {
      title: 'Microservices',
      description: 'Service discovery, API gateway, load balancing, resilience patterns, and distributed data consistency.',
      path: '/microservices',
      key: 'microservices',
      icon: '⚡',
      color: '#0EA5E9',
      eyebrow: 'Architecture',
      totalCount: MICROSERVICES_SECTIONS.reduce((acc, s) => acc + s.topics.length, 0)
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

  useEffect(() => {
    let handleMove;
    let handleLeave;
    let wrap;
    let copyDemoTimeline;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from(heroRef.current.querySelectorAll('.heap-hero-badge'), { opacity: 0, y: 14, duration: 0.5 })
          .from(heroRef.current.querySelectorAll('.heap-hero-heading'), { opacity: 0, y: 22, duration: 0.6 }, '-=0.25')
          .from(heroRef.current.querySelectorAll('.heap-hero-sub'), { opacity: 0, y: 16, duration: 0.5 }, '-=0.3')
          .from(heroRef.current.querySelectorAll('.heap-step-chip, .heap-step-arrow'), { opacity: 0, x: -10, duration: 0.3, stagger: 0.08 }, '-=0.25')
          .from(heroRef.current.querySelectorAll('.heap-hero-ctas, .heap-hero-note'), { opacity: 0, y: 16, duration: 0.5 }, '-=0.2')
          .from(heroRef.current.querySelectorAll('.heap-hero-stats'), { opacity: 0, y: 16, duration: 0.5 }, '-=0.3');

        if (codeCardRef.current) {
          tl.from(codeCardRef.current, { opacity: 0, y: 30, rotate: 8, duration: 0.8 }, '-=0.7')
            .to(codeCardRef.current, { rotate: -3, duration: 0.6, ease: 'power2.out' }, '-=0.2');
        }

        tl.from(heroRef.current.querySelectorAll('.heap-floating-toast'), { opacity: 0, y: -10, duration: 0.5 }, '-=0.3')
          .from(heroRef.current.querySelectorAll('.heap-keyword-tag'), { opacity: 0, scale: 0.85, duration: 0.4, stagger: 0.08 }, '-=0.2')
          .add(() => {
            if (statTopicsRef.current) {
              gsap.to({ value: 0 }, {
                value: overallStats.total,
                duration: 1.1,
                ease: 'power1.out',
                onUpdate() {
                  if (statTopicsRef.current) {
                    statTopicsRef.current.textContent = Math.round(this.targets()[0].value);
                  }
                }
              });
            }
            if (statTracksRef.current) {
              gsap.to({ value: 0 }, {
                value: topics.length,
                duration: 1.1,
                ease: 'power1.out',
                onUpdate() {
                  if (statTracksRef.current) {
                    statTracksRef.current.textContent = Math.round(this.targets()[0].value);
                  }
                }
              });
            }
          }, '-=0.4');
      }

      if (codeCardRef.current) {
        gsap.set(codeCardRef.current, { transformPerspective: 1000 });
      }

      if (
        codeWrapRef.current &&
        codeCardRef.current &&
        copyLineRef.current &&
        copyPillRef.current &&
        fakeCursorRef.current &&
        copiedToastRef.current
      ) {
        wrap = codeWrapRef.current;
        const card = codeCardRef.current;
        const cursor = fakeCursorRef.current;
        const pill = copyPillRef.current;
        const toast = copiedToastRef.current;
        const copyLine = copyLineRef.current;

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
            rotate: -3,
            duration: 0.6,
            ease: 'power3.out'
          });
        };

        wrap.addEventListener('mousemove', handleMove);
        wrap.addEventListener('mouseleave', handleLeave);

        const runCopyDemo = () => {
          const cardBox = card.getBoundingClientRect();
          const lineBox = copyLine.getBoundingClientRect();
          if (!cardBox.width || !lineBox.width) {
            gsap.delayedCall(0.2, runCopyDemo);
            return;
          }

          const startX = lineBox.left - cardBox.left + 40;
          const startY = lineBox.top - cardBox.top - 40;
          const targetX = lineBox.right - cardBox.left - 30;
          const targetY = lineBox.top - cardBox.top + 8;

          gsap.set(cursor, { x: startX, y: startY, opacity: 0, scale: 1, transformOrigin: 'center center' });
          gsap.set(toast, { x: targetX + 10, y: targetY - 26, opacity: 0 });
          gsap.set(pill, { opacity: 0 });

          copyDemoTimeline = gsap.timeline({ repeat: -1, repeatDelay: 2.2 });
          copyDemoTimeline
            .to(cursor, { opacity: 1, duration: 0.2 })
            .to(cursor, { x: targetX, y: targetY, duration: 0.7, ease: 'power2.inOut' })
            .to(pill, { opacity: 1, duration: 0.2 })
            .to(cursor, { scale: 0.85, duration: 0.1, yoyo: true, repeat: 1 })
            .to(toast, { opacity: 1, y: targetY - 34, duration: 0.3 }, '-=0.05')
            .to(toast, { opacity: 0, duration: 0.3, delay: 0.9 })
            .to(pill, { opacity: 0, duration: 0.2 }, '-=0.3')
            .to(cursor, { opacity: 0, duration: 0.3 }, '-=0.1');
        };

        gsap.delayedCall(1.6, runCopyDemo);
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
            start: 'top 95%',
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
            start: 'top 95%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    return () => {
      if (wrap && handleMove) wrap.removeEventListener('mousemove', handleMove);
      if (wrap && handleLeave) wrap.removeEventListener('mouseleave', handleLeave);
      if (copyDemoTimeline) copyDemoTimeline.kill();
      gsap.killTweensOf([fakeCursorRef.current, copyPillRef.current, copiedToastRef.current]);
      ctx.revert();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [overallStats.total, topics.length]);

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

  const heroKeywords = ['volatile', 'B+ Tree', 'Kafka Producer', 'happens-before'];

  return (
    <div
      className="home-page-shell"
      style={{
        fontFamily: "'DM Sans', 'IBM Plex Sans', sans-serif",
        background: 'var(--bg-app)',
        minHeight: '100vh',
        padding: 'clamp(12px, 3vw, 32px) clamp(14px, 3vw, 24px) 80px',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease',
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet" />

      <div className="home-page-inner" style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 10, left: '-6%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.14), transparent 70%)', filter: 'blur(10px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 360, right: '-8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none' }} />
        <section
          ref={heroRef}
          className="heap-hero-section"
          style={{
            position: 'relative',
            overflow: 'visible',
            padding: 'clamp(8px, 1.5vw, 16px) 0 clamp(20px, 3vw, 28px)',
            marginBottom: 12,
          }}
        >
          <div className="heap-grid-fade" />
          <div className="heap-glow heap-glow-a" />
          <div className="heap-glow heap-glow-b" />
          <div className="heap-glow heap-glow-c" />

          <div className="heap-hero-grid">
            <div className="heap-hero-copy-wrap">
              <div
                className="heap-hero-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 0.8,
                  color: '#67e8f9',
                  background: 'rgba(6,182,212,0.1)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: 999,
                  padding: '6px 12px',
                  marginBottom: 28,
                }}
              >
                <span className="heap-badge-dot-wrap">
                  <span className="heap-badge-dot-ping" />
                  <span className="heap-badge-dot" />
                </span>
                HEAPNOTES · {overallStats.total} TOPICS
              </div>

              <h1
                className="heap-hero-heading"
                style={{
                  fontFamily: "'Sora', 'DM Sans', sans-serif",
                  fontSize: 'clamp(42px, 6vw, 58px)',
                  fontWeight: 800,
                  color: isDark ? '#fff' : '#0f172a',
                  lineHeight: 1.06,
                  letterSpacing: '-0.03em',
                  margin: '0 0 24px 0',
                  maxWidth: 780,
                }}
              >
                Not just <span style={{ color: isDark ? '#64748b' : '#475569', fontWeight: 500 }}>what</span> it does.
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #67e8f9, #38bdf8, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Why, how, and when.
                </span>
              </h1>

              <p
                className="heap-hero-sub"
                style={{
                  color: isDark ? '#94a3b8' : '#475569',
                  fontSize: 15.5,
                  lineHeight: 1.75,
                  maxWidth: 580,
                  margin: '0 0 28px 0',
                }}
              >
                Every topic goes from plain-English definition to internal mechanics to the trade-off that decides whether you'd actually reach for it — the depth interviewers probe for.
              </p>

              <div className="heap-hero-stepper" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, maxWidth: 620, flexWrap: 'wrap' }}>
                {['Definition', 'Internals', 'Trade-offs', 'Real usage'].map((item, index) => (
                  <div key={item} style={{ display: 'contents' }}>
                    <span
                      className="heap-step-chip"
                      style={{
                        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
                        fontSize: 11.5,
                        color: item === 'Real usage' ? '#67e8f9' : isDark ? '#cbd5e1' : '#334155',
                        background: item === 'Real usage' ? 'rgba(6,182,212,0.1)' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.58)',
                        border: item === 'Real usage' ? '1px solid rgba(6,182,212,0.2)' : isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148, 163, 184, 0.28)',
                        borderRadius: 8,
                        padding: '6px 10px'
                      }}
                    >
                      {item}
                    </span>
                    {index < 3 && <span className="heap-step-arrow" style={{ color: '#334155', fontSize: 12 }}>→</span>}
                  </div>
                ))}
              </div>

              <div className="heap-hero-ctas" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                <Link
                  to="/java"
                  className="heap-cta-button heap-cta-primary"
                  style={{
                    textDecoration: 'none',
                    background: 'linear-gradient(90deg, #22d3ee, #8b5cf6)',
                    color: '#020617',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '12px 20px',
                    borderRadius: 12,
                    boxShadow: '0 16px 36px rgba(6,182,212,0.18)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease'
                  }}
                >
                  Open Spring Boot notes →
                </Link>
                <a
                  href="#library"
                  className="heap-cta-button heap-cta-secondary"
                  style={{
                    textDecoration: 'none',
                    color: isDark ? '#cbd5e1' : '#1e293b',
                    fontSize: 14,
                    fontWeight: 500,
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148, 163, 184, 0.28)',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.58)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease'
                  }}
                >
                  Browse library
                </a>
              </div>

              <div className="heap-hero-note" style={{ fontSize: 12, color: '#64748b', marginBottom: 36 }}>
                No signup — jump straight into the notes.
              </div>

              <div
                ref={statsRef}
                className="heap-hero-stats"
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148, 163, 184, 0.22)',
                  paddingTop: 20,
                  maxWidth: 430,
                  flexWrap: 'nowrap',
                }}
              >
                {[
                  { label: 'Topics', value: overallStats.total },
                  { label: 'Tracks', value: topics.length },
                  { label: 'Progress', value: `${overallStats.percent}%` },
                ].map((item, index) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ padding: index === 0 ? '0 24px 0 0' : '0 24px', minWidth: 92 }}>
                        <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", fontSize: 28, fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>{item.label === 'Topics' ? <span ref={statTopicsRef}>0</span> : item.label === 'Tracks' ? <span ref={statTracksRef}>0</span> : item.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.label}</div>
                    </div>
                    {index < 2 && <div style={{ width: 1, height: 36, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(148, 163, 184, 0.22)' }} />}
                  </div>
                ))}
              </div>
            </div>

            <div ref={codeWrapRef} className="heap-code-wrap heap-code-wrap-offset" style={{ perspective: '1000px' }}>
              <div className="heap-code-stack" />
              <div className="heap-floating-toast">
                <span className="heap-toast-dot" />
                <span style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 11, color: '#cbd5e1' }}>ConcurrentHashMap — just added</span>
              </div>

              {heroKeywords.map((tag, index) => (
                <div key={tag} className={`heap-keyword-tag heap-keyword-tag-${index + 1}`}>{tag}</div>
              ))}

              <svg ref={fakeCursorRef} width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ position: 'absolute', zIndex: 40, left: 0, top: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', opacity: 0, pointerEvents: 'none', overflow: 'visible' }}>
                <path d="M4 2 L4 18 L8.5 14.5 L11 21 L13.5 20 L11 13.5 L17 13.5 Z" stroke="black" strokeWidth="1" />
              </svg>
              <div ref={copiedToastRef} style={{ position: 'absolute', left: 0, top: 0, zIndex: 40, opacity: 0, pointerEvents: 'none', fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 11, color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '6px 10px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                ✓ Copied — ⌘C
              </div>
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
                  {heroCode.map((parts, index) => {
                    if (index === 4) {
                      return (
                        <div key={index} ref={copyLineRef} style={{ whiteSpace: 'pre-wrap', position: 'relative', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                          <span>
                            {parts.map((part, partIndex) => (
                              <span key={partIndex} style={{ color: part.color }}>{part.text}</span>
                            ))}
                          </span>
                          <span ref={copyPillRef} style={{ opacity: 0, fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 11, color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 6px' }}>Copy</span>
                        </div>
                      );
                    }

                    return (
                      <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
                        {parts.map((part, partIndex) => (
                          <span key={partIndex} style={{ color: part.color }}>{part.text}</span>
                        ))}
                        {index === heroCode.length - 1 && <span className="hero-cursor">▍</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="heap-code-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', marginLeft: 4 }}>
                      <span className="heap-avatar-dot heap-avatar-dot-a" />
                      <span className="heap-avatar-dot heap-avatar-dot-b" />
                      <span className="heap-avatar-dot heap-avatar-dot-c" />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>500+ engineers revising</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace", fontSize: 11, color: '#6ee7b7', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 8px' }}>● live</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={progressRef}
          className="home-progress-section"
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
              className="heap-cta-button heap-outline-button"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease'
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

          <div className="home-progress-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
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

        <section id="library" className="home-library-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 8 }}>Library</div>
              <h3 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 34px)', color: 'var(--text-title)' }}>Choose a track and keep moving</h3>
            </div>
            <p style={{ margin: 0, maxWidth: 420, fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              Each section is organized for revision first: fast scanning, concept recall, code examples, and progress tracking.
            </p>
          </div>

          <div ref={libraryRef} className="home-library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
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
            className="heap-cta-button heap-outline-danger"
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
