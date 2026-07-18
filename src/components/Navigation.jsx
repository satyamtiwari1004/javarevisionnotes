import { Link } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import heapnotesLogo from '/heapnotes-logo.svg';

const Navigation = () => {
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, searchResults } = useSearch();
  const { isDark, toggleTheme } = useTheme();
  const searchRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.45,
          ease: 'power2.out',
          clearProps: 'opacity'
        }
      );
    }
  }, []);

  return (
    <nav ref={navRef} style={{ 
      background: isDark 
        ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.5), rgba(30, 41, 59, 0.5))' 
        : 'linear-gradient(135deg, rgba(255,255,255,0.5), rgba(248,250,252,0.5))',
      backdropFilter: "blur(24px) saturate(155%)",
      WebkitBackdropFilter: "blur(24px) saturate(155%)",
      borderBottom: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(148, 163, 184, 0.28)",
      padding: "calc(13px + env(safe-area-inset-top, 0px)) clamp(14px, 2.4vw, 24px) calc(13px + 0.9375rem)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: isDark ? "0 14px 34px rgba(2, 6, 23, 0.22)" : "0 14px 30px rgba(148, 163, 184, 0.14)",
      transition: "all 0.3s ease"
    }}>
      <div className="app-nav-inner" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", alignContent: "center", minHeight: 40, gap: 12, flexWrap: "nowrap" }}>
        <Link 
          to="/" 
          className="app-nav-brand"
          style={{ 
            fontFamily: "'Sora', 'DM Sans', sans-serif",
            fontSize: 17, 
            fontWeight: 700, 
            color: isDark ? "var(--text-title)" : "#0f172a", 
            textDecoration: "none",
            letterSpacing: "-0.4px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            transition: "opacity 0.2s ease",
            minWidth: 0
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <img
            src={heapnotesLogo}
            alt="HeapNotes"
            className="app-nav-logo"
            style={{ height: 28, width: 'auto', flexShrink: 0 }}
          />
          <span className="app-nav-brand-copy" style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.02 }}>
            <span>HeapNotes</span>
            <span className="app-nav-brand-sub" style={{ fontSize: 10, fontWeight: 600, color: isDark ? "var(--text-secondary)" : "#475569", letterSpacing: 0 }}>Developer revision notes</span>
          </span>
        </Link>
        
        {/* Search Bar & Theme Switcher */}
        <div className="app-nav-actions" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", minWidth: 0, flex: 1 }}>
          <div ref={searchRef} className="app-nav-search" style={{ position: "relative", width: "100%", maxWidth: 290, minWidth: 0, flex: 1 }}>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={(e) => {
                setIsSearchOpen(true);
                e.target.style.borderColor = "var(--text-accent)";
                e.target.style.boxShadow = "0 0 0 2px rgba(56, 189, 248, 0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-color)";
                e.target.style.boxShadow = "none";
              }}
              placeholder="Search all topics…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "7px 52px 7px 32px",
                background: isDark 
                  ? 'rgba(11, 17, 30, 0.4)' 
                  : 'rgba(255,255,255,0.5)',
                border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(148, 163, 184, 0.28)",
                borderRadius: 9,
                color: isDark ? "var(--text-primary)" : "#0f172a",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                outline: "none",
                transition: "all 0.2s ease",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)"
              }}
            />
            <span style={{ 
              position: "absolute", 
              left: 13, 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: isDark ? "var(--text-secondary)" : "#64748b", 
              fontSize: 14,
              pointerEvents: "none"
            }}>⌕</span>
            <span style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isDark ? 'var(--text-secondary)' : '#475569',
              fontSize: 10.5,
              fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.78)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: 6,
              padding: '2px 6px',
              pointerEvents: 'none'
            }}>⌘K</span>
            
            {/* Search Results Dropdown */}
            {isSearchOpen && searchQuery && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 8,
                background: isDark 
                  ? 'rgba(17, 24, 39, 0.95)' 
                  : 'rgba(255,255,255,0.95)',
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                maxHeight: 400,
                overflowY: "auto",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                zIndex: 1000
              }}>
                {searchResults.length === 0 ? (
                  <div style={{ 
                    padding: "20px", 
                    color: "var(--text-secondary)", 
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    textAlign: "center"
                  }}>
                    No results found
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <Link
                      key={result.id}
                      to={result.path}
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      style={{
                        display: "block",
                        padding: "12px 16px",
                        textDecoration: "none",
                        color: "var(--text-primary)",
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--card-hover-bg)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{result.categoryIcon}</span>
                        <span style={{ 
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 11,
                          color: result.categoryColor || "var(--text-accent)",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>{result.category}</span>
                        <span style={{ 
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 10,
                          color: "var(--text-secondary)",
                          marginLeft: "auto",
                          background: "rgba(148, 163, 184, 0.15)",
                          padding: "2px 6px",
                          borderRadius: 4
                        }}>{result.source}</span>
                      </div>
                      <div style={{ 
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--text-title)",
                        marginBottom: 4
                      }}>
                        {result.topicName}
                      </div>
                      <div style={{ 
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5
                      }}>
                        {result.topicDesc}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme Toggler Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: isDark 
                ? 'rgba(11, 17, 30, 0.4)' 
                : 'rgba(255,255,255,0.5)',
              border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(148, 163, 184, 0.24)",
              color: isDark ? "var(--text-primary)" : "#0f172a",
              width: 32,
              height: 32,
              borderRadius: 9,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
              outline: "none"
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = isDark ? "var(--border-hover)" : "rgba(14, 165, 233, 0.35)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? "var(--border-color)" : "rgba(148, 163, 184, 0.24)"}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
