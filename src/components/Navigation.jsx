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
        ? 'rgba(17, 24, 39, 0.75)' 
        : 'rgba(255,255,255,0.85)',
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      padding: "calc(22px + env(safe-area-inset-top, 0px)) clamp(16px, 3vw, 24px) 22px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      transition: "all 0.3s ease"
    }}>
      <div className="app-nav-inner" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Link 
          to="/" 
          className="app-nav-brand"
          style={{ 
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 18, 
            fontWeight: 800, 
            color: "var(--text-title)", 
            textDecoration: "none",
            letterSpacing: "-0.5px",
            display: "flex",
            alignItems: "center",
            gap: 10,
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
            style={{ height: 36, width: 'auto', flexShrink: 0 }}
          />
          <span className="app-nav-brand-copy" style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.1 }}>
            <span>HeapNotes</span>
            <span className="app-nav-brand-sub" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: 0 }}>Developer revision notes</span>
          </span>
        </Link>
        
        {/* Search Bar & Theme Switcher */}
        <div className="app-nav-actions" style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, justifyContent: "flex-end", maxWidth: 600, minWidth: 0, flexWrap: "wrap" }}>
          <div ref={searchRef} className="app-nav-search" style={{ position: "relative", width: "100%", maxWidth: 380, minWidth: "min(100%, 240px)" }}>
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
              placeholder="Search all topics..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 16px 9px 36px",
                background: isDark 
                  ? 'rgba(11, 17, 30, 0.6)' 
                  : 'rgba(255,255,255,0.8)',
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "var(--text-primary)",
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
              color: "var(--text-secondary)", 
              fontSize: 14,
              pointerEvents: "none"
            }}>⌕</span>
            
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
                ? 'rgba(11, 17, 30, 0.6)' 
                : 'rgba(255,255,255,0.8)',
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-primary)",
              width: 38,
              height: 38,
              borderRadius: 10,
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
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color)"}
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
