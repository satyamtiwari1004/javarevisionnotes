import { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function RevisionNotesLayout({
  pageKey,
  title,
  subtitle,
  categoryIcon,
  categoryColor = '#38bdf8',
  sections = [],
  tagMeta = {}
}) {
  const { isDark } = useTheme();
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const cardsRef = useRef(null);
  
  // UI states
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState({}); // key -> 'theory' | 'code' for annotations
  
  // Custom revision states
  const [mastered, setMastered] = useState(() => {
    try {
      const saved = localStorage.getItem(`rev_mastered_${pageKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(`rev_bookmarks_${pageKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`rev_notes_${pageKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Revision Modes
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [focusMode, setFocusMode] = useState(false);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem(`rev_mastered_${pageKey}`, JSON.stringify(mastered));
  }, [mastered, pageKey]);

  useEffect(() => {
    localStorage.setItem(`rev_bookmarks_${pageKey}`, JSON.stringify(bookmarks));
  }, [bookmarks, pageKey]);

  useEffect(() => {
    localStorage.setItem(`rev_notes_${pageKey}`, JSON.stringify(notes));
  }, [notes, pageKey]);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }

      // Stats cards animation
      if (statsRef.current) {
        gsap.from(statsRef.current.children, {
          scale: 0.9,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.2)',
          delay: 0.2
        });
      }

      // Topic cards animation on scroll
      if (cardsRef.current) {
        gsap.from(cardsRef.current.children, {
          y: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 85%',
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

  // Copy helper
  const copyCode = (code, key) => {
    navigator.clipboard?.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // Star / Hot topics or standard topics list mapping
  const normalizedSections = useMemo(() => {
    return sections.map(section => {
      // Handle both annotations (anns) and topics (topics)
      const list = section.anns || section.topics || [];
      return {
        ...section,
        items: list.map(item => ({
          ...item,
          // Unify name field
          name: item.n || item.name,
          description: item.description || item.desc || item.theory || '',
          summary: item.desc || '',
          theory: item.theory || item.description || item.desc || ''
        }))
      };
    });
  }, [sections]);

  // Categories list
  const categories = useMemo(() => {
    const cats = normalizedSections.map(s => s.cat);
    // Add "Bookmarks" if there are bookmarked items
    const hasBookmarks = Object.keys(bookmarks).some(k => bookmarks[k]);
    if (hasBookmarks) {
      return ['All', 'Bookmarks', ...cats];
    }
    return ['All', ...cats];
  }, [normalizedSections, bookmarks]);

  // Filter items
  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    
    return normalizedSections.map(section => {
      // Filter by active category
      if (activeCat !== 'All' && activeCat !== 'Bookmarks' && section.cat !== activeCat) {
        return null;
      }
      
      const matchedItems = section.items.filter(item => {
        // Filter bookmarks specifically
        const itemKey = `${section.cat}|${item.name}`;
        if (activeCat === 'Bookmarks' && !bookmarks[itemKey]) {
          return false;
        }

        if (!q) return true;
        
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.theory && item.theory.toLowerCase().includes(q)) ||
          (item.intent && item.intent.toLowerCase().includes(q)) ||
          (item.use && item.use.toLowerCase().includes(q)) ||
          (item.tag && item.tag.toLowerCase().includes(q))
        );
      });

      if (!matchedItems.length) return null;

      return {
        ...section,
        items: matchedItems
      };
    }).filter(Boolean);
  }, [normalizedSections, activeCat, search, bookmarks]);

  // Stats calculation
  const totalTopicsCount = useMemo(() => {
    return normalizedSections.reduce((acc, s) => acc + s.items.length, 0);
  }, [normalizedSections]);

  const masteredCount = useMemo(() => {
    return Object.values(mastered).filter(Boolean).length;
  }, [mastered]);

  const categoryStats = useMemo(() => {
    const stats = {};
    normalizedSections.forEach(sec => {
      const secItems = sec.items;
      const secMastered = secItems.filter(item => mastered[`${sec.cat}|${item.name}`]).length;
      stats[sec.cat] = {
        total: secItems.length,
        mastered: secMastered,
        percent: secItems.length ? Math.round((secMastered / secItems.length) * 100) : 0
      };
    });
    return stats;
  }, [normalizedSections, mastered]);

  // Toggle dynamic accordion
  const toggleItem = (cat, name) => {
    const key = `${cat}|${name}`;
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemExpanded = (cat, name) => !!expanded[`${cat}|${name}`];

  // Toggle mastered status
  const toggleMastered = (cat, name, e) => {
    e.stopPropagation();
    const key = `${cat}|${name}`;
    setMastered(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle bookmark status
  const toggleBookmark = (cat, name, e) => {
    e.stopPropagation();
    const key = `${cat}|${name}`;
    setBookmarks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Note updates
  const handleNoteChange = (cat, name, val) => {
    const key = `${cat}|${name}`;
    setNotes(prev => ({ ...prev, [key]: val }));
  };

  // Helper to highlight matches
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="highlight-match">{part}</mark>
        : part
    );
  };

  return (
    <div style={{
      background: 'var(--bg-app)',
      minHeight: '100vh',
      color: 'var(--text-primary)',
      transition: 'all 0.3s ease',
      paddingBottom: 60
    }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Focus Mode Overlay Button ── */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'var(--text-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>👁️</span> Exit Focus Mode
        </button>
      )}

      {/* ── Hero / Header Panel ── */}
      {!focusMode && (
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: isDark 
            ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.5), rgba(11, 17, 30, 0.45))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(241,245,249,0.6))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${categoryColor}08 1px, transparent 1px), linear-gradient(90deg, ${categoryColor}08 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            top: -100,
            right: -80,
            width: 380,
            height: 380,
            background: `radial-gradient(circle, ${categoryColor}18 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          <div ref={headerRef} style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 30px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>{categoryIcon}</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: categoryColor,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: `${categoryColor}15`,
                    border: `1px solid ${categoryColor}25`
                  }}>{pageKey} Revision Hub</span>
                </div>
                <h1 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'clamp(26px, 4vw, 36px)',
                  fontWeight: 800,
                  color: 'var(--text-title)',
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.5px'
                }}>
                  {title}
                </h1>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  maxWidth: 650
                }}>
                  {subtitle}
                </p>
              </div>

              {/* Mastered Progress Widget */}
              <div style={{
                background: isDark 
                  ? 'rgba(17, 24, 39, 0.5)' 
                  : 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '16px 20px',
                minWidth: 220,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Mastered topics</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: categoryColor }}>
                    {masteredCount} / {totalTopicsCount}
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(148, 163, 184, 0.2)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${categoryColor}, #10b981)`,
                    width: `${totalTopicsCount ? (masteredCount / totalTopicsCount) * 100 : 0}%`,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {Math.round(totalTopicsCount ? (masteredCount / totalTopicsCount) * 100 : 0)}% Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Controls Toolbar ── */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: focusMode ? '30px clamp(16px, 3vw, 24px) 10px' : '24px clamp(16px, 3vw, 24px) 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 260px)' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: categoryColor, fontSize: 15, fontWeight: 'bold' }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search concepts, code, definitions, or notes..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 16px 11px 40px',
              background: isDark 
                ? 'rgba(17, 24, 39, 0.5)' 
                : 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
            onFocus={e => e.target.style.borderColor = categoryColor}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Feature Switches */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Flashcard Toggle */}
          <button
            onClick={() => setFlashcardMode(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: flashcardMode ? `1px solid ${categoryColor}` : '1px solid rgba(255,255,255,0.1)',
              background: flashcardMode ? `${categoryColor}15` : isDark 
                ? 'rgba(17, 24, 39, 0.5)' 
                : 'rgba(255,255,255,0.7)',
              color: flashcardMode ? categoryColor : 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <span>📇</span>
            {flashcardMode ? 'Flashcard Mode: Active' : 'Self-Test (Flashcards)'}
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: focusMode ? `1px solid ${categoryColor}` : '1px solid rgba(255,255,255,0.1)',
              background: focusMode ? `${categoryColor}15` : isDark 
                ? 'rgba(17, 24, 39, 0.5)' 
                : 'rgba(255,255,255,0.7)',
              color: focusMode ? categoryColor : 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            <span>👁️</span>
            {focusMode ? 'Focus Mode Active' : 'Focus Mode'}
          </button>
        </div>
      </div>

      {/* ── Content Grid (Sidebar + Main Content) ── */}
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '16px clamp(16px, 3vw, 24px)',
        display: 'grid',
        gridTemplateColumns: (!focusMode && categories.length > 2 && typeof window !== 'undefined' && window.innerWidth > 900) ? '250px minmax(0, 1fr)' : '1fr',
        gap: 28,
        alignItems: 'start'
      }}>
        {/* Sticky Sidebar Navigation */}
        {!focusMode && categories.length > 2 && typeof window !== 'undefined' && window.innerWidth > 900 && (
          <aside style={{
            position: 'sticky',
            top: 90,
            background: isDark 
              ? 'rgba(17, 24, 39, 0.5)' 
              : 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '16px 12px',
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 10
          }}>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              margin: '0 0 14px 12px',
              letterSpacing: '1px'
            }}>Categories</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {categories.map(cat => {
                const isCatActive = activeCat === cat;
                const stat = categoryStats[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: isCatActive ? `${categoryColor}15` : 'transparent',
                      color: isCatActive ? categoryColor : 'var(--text-primary)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: isCatActive ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isCatActive) e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)';
                    }}
                    onMouseLeave={e => {
                      if (!isCatActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginRight: 8 }}>
                      {cat === 'Bookmarks' && '⭐ '}
                      {cat}
                    </span>
                    
                    {stat ? (
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 8,
                        background: isCatActive ? `${categoryColor}25` : 'rgba(148, 163, 184, 0.15)',
                        color: isCatActive ? categoryColor : 'var(--text-secondary)',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {stat.percent}%
                      </span>
                    ) : cat === 'Bookmarks' ? (
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        {Object.values(bookmarks).filter(Boolean).length}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>All</span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {filteredSections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 16,
              boxShadow: 'var(--card-shadow)'
            }}>
              <span style={{ fontSize: 40 }}>🔍</span>
              <h3 style={{ margin: '16px 0 8px 0', fontSize: 16 }}>No match found</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>
                We couldn't find anything matching "{search}". Try searching for another topic or term.
              </p>
            </div>
          ) : (
            filteredSections.map(section => {
              const accentColor = section.color || categoryColor;
              const accentDim = `${accentColor}12`;
              
              return (
                <div key={section.cat} style={{ marginBottom: 12 }}>
                  {/* Section Title Header */}
                  {!focusMode && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: `1px solid var(--border-color)`,
                      flexWrap: 'wrap'
                    }}>
                      {section.icon && <span style={{ fontSize: 20 }}>{section.icon}</span>}
                      <h2 style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--text-title)',
                        margin: 0
                      }}>
                        {section.cat}
                      </h2>
                      <span style={{
                        marginLeft: 'auto',
                        background: accentDim,
                        border: `1px solid ${accentColor}30`,
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontSize: 11,
                        color: accentColor,
                        fontWeight: 700
                      }}>
                        {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
                      </span>
                    </div>
                  )}

                  {section.desc && !focusMode && (
                    <p style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      margin: '-8px 0 16px 0',
                      lineHeight: 1.6
                    }}>
                      {section.desc}
                    </p>
                  )}

                  {/* List of Topic Cards */}
                  <div ref={cardsRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {section.items.map(item => {
                      const itemKey = `${section.cat}|${item.name}`;
                      const open = isItemExpanded(section.cat, item.name);
                      
                      // Checkbox state
                      const isMastered = !!mastered[itemKey];
                      const isBookmarked = !!bookmarks[itemKey];
                      
                      // Flashcard revealed state
                      const isRevealed = !!revealed[itemKey];
                      
                      // Custom tags color
                      const tagColor = tagMeta[item.tag] || { bg: 'rgba(148, 163, 184, 0.15)', text: 'var(--text-secondary)', border: 'var(--border-color)' };
                      
                      return (
                        <div
                          key={item.name}
                          style={{
                            background: isDark 
                              ? 'rgba(17, 24, 39, 0.5)' 
                              : 'rgba(255,255,255,0.7)',
                            border: open ? `1px solid ${accentColor}60` : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 14,
                            overflow: 'hidden',
                            boxShadow: open ? `0 10px 30px ${accentColor}10` : '0 4px 16px rgba(0,0,0,0.06)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {/* Card Header Section */}
                          <div
                            onClick={() => toggleItem(section.cat, item.name)}
                            style={{
                              padding: '16px 20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                              userSelect: 'none',
                              transition: 'background 0.2s ease',
                              background: open ? 'var(--card-hover-bg)' : 'transparent',
                              flexWrap: 'wrap'
                            }}
                            onMouseEnter={e => {
                              if (!open) e.currentTarget.style.background = 'var(--card-hover-bg)';
                            }}
                            onMouseLeave={e => {
                              if (!open) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            {/* Mastered Tick Box */}
                            <button
                              onClick={(e) => toggleMastered(section.cat, item.name, e)}
                              style={{
                                border: 'none',
                                background: isMastered ? '#10b981' : 'transparent',
                                border: isMastered ? '2px solid #10b981' : '2px solid var(--border-color)',
                                borderRadius: 6,
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 11,
                                cursor: 'pointer',
                                padding: 0,
                                flexShrink: 0,
                                transition: 'all 0.2s ease'
                              }}
                              title={isMastered ? 'Unmark mastered' : 'Mark as mastered'}
                            >
                              {isMastered && '✓'}
                            </button>

                            {/* Title & Tags */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: isMastered ? '#10b981' : 'var(--text-title)',
                                  textDecoration: isMastered ? 'line-through' : 'none',
                                  opacity: isMastered ? 0.75 : 1,
                                  transition: 'color 0.2s ease'
                                }}>
                                  {highlightMatch(item.name, search)}
                                </span>
                                
                                {item.tag && (
                                  <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: tagColor.bg,
                                    color: tagColor.text,
                                    border: `1px solid ${tagColor.border}`,
                                    letterSpacing: 0.5
                                  }}>{item.tag}</span>
                                )}

                                {item.star && (
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)'
                                  }}>🔥 HOT</span>
                                )}
                              </div>

                              {!open && (
                                <p style={{
                                  fontSize: 13,
                                  color: 'var(--text-secondary)',
                                  margin: 0,
                                  whiteSpace: 'normal',
                                  overflowWrap: 'anywhere',
                                  lineHeight: 1.4
                                }}>
                                  {item.description.split('\n\n')[0].replace(/[•·]\s[A-Z]+:.*/g, '').trim()}
                                </p>
                              )}
                            </div>

                            {/* Bookmark Button */}
                            <button
                              onClick={(e) => toggleBookmark(section.cat, item.name, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 16,
                                cursor: 'pointer',
                                padding: 4,
                                color: isBookmarked ? '#f59e0b' : 'var(--text-secondary)',
                                opacity: isBookmarked ? 1 : 0.4,
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                              }}
                              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this concept'}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => { if (!isBookmarked) e.currentTarget.style.opacity = '0.4'; }}
                            >
                              ★
                            </button>

                            {/* Accordion Arrow */}
                            <span style={{
                              fontSize: 12,
                              color: open ? accentColor : 'var(--text-secondary)',
                              fontWeight: 'bold',
                              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              padding: 4,
                              flexShrink: 0
                            }}>
                              ▼
                            </span>
                          </div>

                          {/* Card Content Details */}
                          {open && (
                            <div style={{
                              borderTop: '1px solid var(--border-color)',
                              background: 'var(--bg-app)',
                              padding: '20px'
                            }}>
                              {/* If Flashcard mode is active and not revealed yet */}
                              {flashcardMode && !isRevealed ? (
                                <div style={{
                                  textAlign: 'center',
                                  padding: '30px 10px',
                                  background: 'var(--bg-card)',
                                  borderRadius: 10,
                                  border: '1px dashed var(--border-color)'
                                }}>
                                  <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>❓</span>
                                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>Active Recall Revision</h4>
                                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px' }}>
                                    Try to recall the concepts, theory details, and syntax implementation for <strong>{item.name}</strong>.
                                  </p>
                                  <button
                                    onClick={() => setRevealed(prev => ({ ...prev, [itemKey]: true }))}
                                    style={{
                                      background: accentColor,
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 8,
                                      padding: '10px 20px',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      boxShadow: `0 4px 15px ${accentColor}30`
                                    }}
                                  >
                                    Reveal Theory & Code
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {/* Multi-Tab Switcher for annotations or complex properties */}
                                  {item.theory && item.desc && (
                                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                      {[['theory', '📖 Theory', '#38bdf8'], ['code', '💻 Code', '#10b981']].map(([t, label, tc]) => {
                                        const curTab = activeTab[itemKey] || 'theory';
                                        const isTabActive = curTab === t;
                                        return (
                                          <button
                                            key={t}
                                            onClick={() => setActiveTab(prev => ({ ...prev, [itemKey]: t }))}
                                            style={{
                                              flex: '0 0 auto',
                                              padding: '7px 12px',
                                              border: `1px solid ${isTabActive ? `${tc}55` : 'var(--border-color)'}`,
                                              cursor: 'pointer',
                                              fontFamily: "'DM Sans', sans-serif",
                                              fontSize: 11,
                                              fontWeight: 700,
                                              background: isTabActive ? `${tc}12` : 'transparent',
                                              color: isTabActive ? tc : 'var(--text-secondary)',
                                              borderBottom: `1px solid ${isTabActive ? `${tc}55` : 'var(--border-color)'}`,
                                              transition: 'all 0.15s ease',
                                              borderRadius: 999
                                            }}
                                          >
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Detailed Content rendering */}
                                  {/* Tab layout active for theory */}
                                  {((item.theory && item.desc && (activeTab[itemKey] || 'theory') === 'theory') || (!item.theory || !item.desc)) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                      {/* Render fields dynamically */}
                                      {/* 1. Description/Theory Paragraphs */}
                                      {item.summary && item.theory && item.summary !== item.theory && (
                                        <div style={{
                                          background: 'var(--bg-card)',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: 12,
                                          padding: '12px 16px'
                                        }}>
                                          <strong style={{ display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: accentColor, marginBottom: 6 }}>Quick Summary</strong>
                                          <span style={{ fontSize: 13, lineHeight: 1.6, display: 'block', color: 'var(--text-primary)' }}>
                                            {highlightMatch(item.summary, search)}
                                          </span>
                                        </div>
                                      )}

                                      <div style={{
                                        fontSize: 14,
                                        lineHeight: 1.8,
                                        color: 'var(--text-primary)',
                                        fontFamily: "'DM Sans', sans-serif"
                                      }}>
                                        {/* Render paragraph by paragraph */}
                                        {(item.theory || item.description || '').split('\n\n').filter(Boolean).map((para, idx) => {
                                          const isHeading = /^[A-Za-z0-9\s()/\-\+]+:/.test(para);
                                          return (
                                            <p
                                              key={idx}
                                              style={{
                                                margin: '0 0 12px 0',
                                                fontWeight: isHeading ? 600 : 400,
                                                color: isHeading ? 'var(--text-title)' : 'var(--text-primary)'
                                              }}
                                            >
                                              {highlightMatch(para, search)}
                                            </p>
                                          );
                                        })}
                                      </div>

                                      {/* 2. Intent */}
                                      {item.intent && (
                                        <div style={{
                                          background: 'var(--bg-card)',
                                          borderLeft: `3px solid ${accentColor}`,
                                          borderRadius: '0 10px 10px 0',
                                          padding: '12px 16px'
                                        }}>
                                          <strong style={{ display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: accentColor, marginBottom: 4 }}>Intent & Mechanics</strong>
                                          <span style={{ fontSize: 13, lineHeight: 1.6, display: 'block', color: 'var(--text-primary)' }}>
                                            {highlightMatch(item.intent, search)}
                                          </span>
                                        </div>
                                      )}

                                      {/* 3. Use Case */}
                                      {item.use && (
                                        <div style={{
                                          background: 'var(--bg-card)',
                                          borderLeft: `3px solid #10b981`,
                                          borderRadius: '0 10px 10px 0',
                                          padding: '12px 16px'
                                        }}>
                                          <strong style={{ display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#10b981', marginBottom: 4 }}>When to Use</strong>
                                          <span style={{ fontSize: 13, lineHeight: 1.6, display: 'block', color: 'var(--text-primary)' }}>
                                            {highlightMatch(item.use, search)}
                                          </span>
                                        </div>
                                      )}

                                      {/* 4. Anti-pattern */}
                                      {item.antipattern && (
                                        <div style={{
                                          background: 'rgba(239, 68, 68, 0.05)',
                                          borderLeft: `3px solid #ef4444`,
                                          borderRadius: '0 10px 10px 0',
                                          padding: '12px 16px'
                                        }}>
                                          <strong style={{ display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#ef4444', marginBottom: 4 }}>Antipattern / Gotchas</strong>
                                          <span style={{ fontSize: 13, lineHeight: 1.6, display: 'block', color: 'var(--text-primary)' }}>
                                            {highlightMatch(item.antipattern, search)}
                                          </span>
                                        </div>
                                      )}

                                      {/* 5. Related */}
                                      {item.related && (
                                        <div style={{
                                          background: 'var(--bg-card)',
                                          borderLeft: `3px solid #8b5cf6`,
                                          borderRadius: '0 10px 10px 0',
                                          padding: '12px 16px'
                                        }}>
                                          <strong style={{ display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 4 }}>Related Topics</strong>
                                          <span style={{ fontSize: 13, lineHeight: 1.6, display: 'block', color: 'var(--text-primary)' }}>
                                            {highlightMatch(item.related, search)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Code block rendering */}
                                  {item.code && ((item.theory && item.desc && (activeTab[itemKey] || 'theory') === 'code') || (!item.theory || !item.desc)) && (
                                    <CodeBlockWithAnimation 
                                      open={open}
                                      item={item}
                                      itemKey={itemKey}
                                      pageKey={pageKey}
                                      copied={copied}
                                      copyCode={copyCode}
                                      marginTop={item.theory && item.desc ? 0 : 16}
                                    />
                                  )}

                                  {/* Personal Notes Box */}
                                  <div style={{
                                    marginTop: 20,
                                    borderTop: '1px dashed var(--border-color)',
                                    paddingTop: 16
                                  }}>
                                    <details style={{ width: '100%' }}>
                                      <summary style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        📝 Personal Study Notes {notes[itemKey] ? '✏️' : ''}
                                      </summary>
                                      
                                      <textarea
                                        value={notes[itemKey] || ''}
                                        onChange={e => handleNoteChange(section.cat, item.name, e.target.value)}
                                        placeholder="Add your own revision notes, code gotchas, or interview tips here. Saved automatically..."
                                        style={{
                                          width: '100%',
                                          height: 80,
                                          boxSizing: 'border-box',
                                          marginTop: 10,
                                          borderRadius: 8,
                                          border: '1px solid var(--border-color)',
                                          background: 'var(--bg-card)',
                                          color: 'var(--text-primary)',
                                          fontFamily: "'DM Sans', sans-serif",
                                          fontSize: 13,
                                          padding: '10px',
                                          outline: 'none',
                                          resize: 'vertical',
                                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                                        }}
                                        onFocus={e => e.target.style.borderColor = accentColor}
                                        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                                      />
                                    </details>
                                  </div>

                                  {/* Hide Answer details inside Flashcards */}
                                  {flashcardMode && isRevealed && (
                                    <button
                                      onClick={() => setRevealed(prev => ({ ...prev, [itemKey]: false }))}
                                      style={{
                                        background: 'transparent',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 8,
                                        padding: '8px 16px',
                                        fontWeight: 600,
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        marginTop: 16
                                      }}
                                    >
                                      Hide details
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

// Separate component for code block with GSAP animation
function CodeBlockWithAnimation({ open, item, itemKey, pageKey, copied, copyCode, marginTop }) {
  const codeBlockRef = useRef(null);
  const shimmerRef = useRef(null);

  useEffect(() => {
    if (open && codeBlockRef.current) {
      // Float animation
      const floatTween = gsap.to(codeBlockRef.current, {
        y: '-10px',
        duration: 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });

      // Shimmer animation
      let shimmerTween;
      if (shimmerRef.current) {
        shimmerTween = gsap.fromTo(shimmerRef.current, 
          { backgroundPosition: '200% 0' },
          {
            backgroundPosition: '-200% 0',
            duration: 3,
            ease: 'none',
            repeat: -1
          }
        );
      }

      return () => {
        floatTween.kill();
        if (shimmerTween) shimmerTween.kill();
      };
    }
  }, [open]);

  return (
    <div 
      ref={codeBlockRef}
      style={{
        background: 'var(--bg-code)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        overflow: 'hidden',
        marginTop: marginTop,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.16)',
        position: 'relative'
      }}
    >
      <div 
        ref={shimmerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 65%, transparent 100%)',
          backgroundSize: '200% 100%'
        }} 
      />

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#f85149', '#d29922', '#3fb950'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 700,
            marginLeft: 4
          }}>{item.tag || pageKey}</span>
        </div>

        <button
          onClick={() => copyCode(item.code, itemKey)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: '4px 10px',
            color: copied === itemKey ? '#10b981' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            if (copied !== itemKey) e.currentTarget.style.borderColor = 'var(--text-accent)';
          }}
          onMouseLeave={e => {
            if (copied !== itemKey) e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {copied === itemKey ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code View */}
      <pre style={{
        margin: 0,
        padding: '16px',
        fontSize: 12.5,
        lineHeight: 1.7,
        color: 'var(--code-text)',
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        overflowX: 'auto'
      }}>
        <code>{item.code}</code>
      </pre>
    </div>
  );
}
