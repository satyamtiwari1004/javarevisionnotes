import { Link } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';
import { useState, useEffect, useRef } from 'react';

const Navigation = () => {
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, searchResults } = useSearch();
  const searchRef = useRef(null);

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

  return (
    <nav style={{ 
      background: "linear-gradient(135deg, rgba(22, 27, 34, 0.8) 0%, rgba(13, 17, 23, 0.9) 100%)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(48, 54, 61, 0.5)",
      padding: "16px 24px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link 
          to="/" 
          style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 20, 
            fontWeight: 700, 
            color: "#f0f6fc", 
            textDecoration: "none",
            letterSpacing: "0.5px",
            background: "linear-gradient(135deg, #58a6ff 0%, #06B6D4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}
        >
          ✨ Java Revision Notes
        </Link>
        
        {/* Search Bar */}
        <div ref={searchRef} style={{ position: "relative", maxWidth: 400, flex: 1, marginLeft: 32 }}>
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={(e) => {
              setIsSearchOpen(true);
              e.target.style.borderColor = "#58a6ff";
            }}
            placeholder="Search all topics..."
            style={{
              width: "100%",
              padding: "10px 16px 10px 40px",
              background: "rgba(13, 17, 23, 0.8)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(48, 54, 61, 0.5)",
              borderRadius: 8,
              color: "#c9d1d9",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
          />
          <span style={{ 
            position: "absolute", 
            left: 14, 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "#58a6ff", 
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
              background: "rgba(22, 27, 34, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(48, 54, 61, 0.5)",
              borderRadius: 8,
              maxHeight: 500,
              overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              zIndex: 1000
            }}>
              {searchResults.length === 0 ? (
                <div style={{ 
                  padding: "20px", 
                  color: "#8b949e", 
                  fontFamily: "'IBM Plex Sans', sans-serif",
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
                      color: "#c9d1d9",
                      borderBottom: "1px solid rgba(48, 54, 61, 0.3)",
                      transition: "background 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(33, 38, 45, 0.5)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{result.categoryIcon}</span>
                      <span style={{ 
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: 12,
                        color: result.categoryColor,
                        fontWeight: 600
                      }}>{result.category}</span>
                      <span style={{ 
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: 11,
                        color: "#8b949e",
                        marginLeft: "auto"
                      }}>{result.source}</span>
                    </div>
                    <div style={{ 
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 4
                    }}>
                      {result.topicName}
                    </div>
                    <div style={{ 
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 12,
                      color: "#8b949e",
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
      </div>
    </nav>
  );
};

export default Navigation;
