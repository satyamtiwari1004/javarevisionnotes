import { createContext, useContext, useState, useMemo } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

// Import all section data from different files
import { SECTIONS as JAVA_PREV_SECTIONS } from '../java_previous_interview';
import { SECTIONS as DESIGN_PATTERNS_SECTIONS } from '../java_design_patterns';
import { SECTIONS as DSA_SECTIONS } from '../javadsa';
import { SECTIONS as MULTITHREADING_SECTIONS } from '../javamultithreading';
import { SECTIONS as STREAMS_SECTIONS } from '../javastreams';
import { SECTIONS as COLLECTIONS_SECTIONS } from '../javacollection';
import { SECTIONS as REACT_INTERVIEW_SECTIONS } from '../reactinterview';
import { SECTIONS as SYSTEM_DESIGN_SECTIONS } from '../systemdesign';

const ALL_DATA = [
  { source: 'Interview Q&A', path: '/previous-interview', sections: JAVA_PREV_SECTIONS },
  { source: 'Design Patterns', path: '/design-patterns', sections: DESIGN_PATTERNS_SECTIONS },
  { source: 'DSA', path: '/dsa', sections: DSA_SECTIONS },
  { source: 'Multithreading', path: '/multithreading', sections: MULTITHREADING_SECTIONS },
  { source: 'Streams', path: '/streams', sections: STREAMS_SECTIONS },
  { source: 'Collections', path: '/collections', sections: COLLECTIONS_SECTIONS },
  { source: 'React Interview', path: '/react-interview', sections: REACT_INTERVIEW_SECTIONS },
  { source: 'System Design', path: '/system-design', sections: SYSTEM_DESIGN_SECTIONS },
];

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const calculateMatchScore = (text, query) => {
    let score = 0;
    const queryWords = query.split(' ').filter(w => w.length > 0);
    
    queryWords.forEach(word => {
      if (text.includes(word)) {
        score += word.length * 10;
        if (text.startsWith(word)) score += 20;
        if (text.includes(` ${word}`)) score += 5;
      }
    });
    
    return score;
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results = [];

    ALL_DATA.forEach(({ source, path, sections }) => {
      sections.forEach(section => {
        section.topics.forEach(topic => {
          const searchableText = [
            topic.n,
            topic.desc,
            topic.code,
            topic.tag,
            topic.intent,
            topic.theory,
            topic.use,
            topic.antipattern,
            topic.related
          ].filter(Boolean).join(' ').toLowerCase();

          if (searchableText.includes(query)) {
            results.push({
              id: `${path}-${section.cat}-${topic.n}`,
              source,
              path,
              category: section.cat,
              categoryIcon: section.icon,
              categoryColor: section.color,
              topicName: topic.n,
              topicDesc: topic.desc?.substring(0, 150) + (topic.desc?.length > 150 ? '...' : ''),
              tag: topic.tag,
              matchScore: calculateMatchScore(searchableText, query)
            });
          }
        });
      });
    });

    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
  }, [searchQuery]);

  const value = {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchResults
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
