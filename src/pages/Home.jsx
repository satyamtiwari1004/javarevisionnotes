import { Link } from 'react-router-dom';

const Home = () => {
  const topics = [
    {
      title: 'SpringBoot',
      description: 'Spring Boot annotations reference with working code examples',
      path: '/java',
      icon: '☕',
      color: '#F97316',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'Multithreading',
      description: 'Java concurrency, thread management, and synchronization patterns',
      path: '/multithreading',
      icon: '🧵',
      color: '#8B5CF6',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      title: 'Design Patterns',
      description: 'Creational, Structural, Behavioral patterns with intent and code examples',
      path: '/design-patterns',
      icon: '🎨',
      color: '#EC4899',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Streams',
      description: 'Java Stream API reference with intermediate, terminal, and collector operations',
      path: '/streams',
      icon: '🌊',
      color: '#06B6D4',
      gradient: 'from-cyan-500 to-blue-500'
    },
     {
      title: 'Collections',
      description: 'The Java Collections Framework (JCF) is a unified architecture for storing and manipulating groups of objects',
      path: '/collections',
      icon: '📦',
      color: '#10B981',
      gradient: 'from-emerald-500 to-green-500'
    },
    {
      title: 'DSA',
      description: 'Data Structures & Algorithms reference with complexity analysis and Java implementations',
      path: '/dsa',
      icon: '🔢',
      color: '#F59E0B',
      gradient: 'from-amber-500 to-yellow-500'
    },
    {
      title: 'SQL',
      description: 'Complete SQL reference from DDL to advanced features with PostgreSQL examples',
      path: '/sql',
      icon: '🗄️',
      color: '#3B82F6',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Kafka',
      description: 'Apache Kafka theory, concepts, configuration, and patterns reference',
      path: '/kafka',
      icon: '📨',
      color: '#EF4444',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      title: 'Interview Q&A',
      description: 'Java interview questions and answers from past rounds, covering Spring Boot, DSA, and more',
      path: '/previous-interview',
      icon: '💡',
      color: '#EAB308',
      gradient: 'from-yellow-400 to-amber-500'
    },
    {
      title: 'System Design',
      description: 'ACID, SOLID, CAP theorem, scalability patterns, caching, sharding, consensus algorithms',
      path: '/system-design',
      icon: '🏗️',
      color: '#6366F1',
      gradient: 'from-indigo-500 to-purple-500'
    }
  ];

  return (
    <div style={{ 
      fontFamily: "'IBM Plex Sans', sans-serif", 
      background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)", 
      minHeight: "100vh", 
      padding: "40px 20px", 
      color: "#c9d1d9"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 12, 
            marginBottom: 16,
            padding: "8px 16px",
            background: "rgba(88, 166, 255, 0.1)",
            borderRadius: "20px",
            border: "1px solid rgba(88, 166, 255, 0.2)"
          }}>
            <span style={{ fontSize: 20 }}>📚</span>
            <span style={{ 
              fontFamily: "'IBM Plex Sans', sans-serif", 
              fontSize: 13, 
              color: "#58a6ff", 
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}>Learning Hub</span>
          </div>
          <h1 style={{ 
            fontFamily: "'IBM Plex Mono', monospace", 
            fontSize: "clamp(32px, 5vw, 48px)", 
            fontWeight: 700, 
            color: "#f0f6fc", 
            margin: "0 0 16px 0",
            background: "linear-gradient(135deg, #58a6ff 0%, #06B6D4 50%, #10B981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Java Revision Notes
          </h1>
          <p style={{ 
            fontFamily: "'IBM Plex Sans', sans-serif", 
            fontSize: 16, 
            color: "#8b949e", 
            margin: 0,
            maxWidth: 600,
            lineHeight: 1.6
          }}>
            Comprehensive guides for Java, Multithreading, Design Patterns, Streams, DSA, SQL, and Kafka 
            <span style={{ color: "#58a6ff" }}>✨</span>
          </p>
        </div>

        {/* Topics Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: 20 
        }}>
          {topics.map((topic) => (
            <Link
              key={topic.path}
              to={topic.path}
              style={{
                display: "block",
                background: "linear-gradient(145deg, rgba(22, 27, 34, 0.8) 0%, rgba(13, 17, 23, 0.9) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(48, 54, 61, 0.5)",
                borderRadius: 16,
                padding: "24px",
                textDecoration: "none",
                color: "#c9d1d9",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = topic.color;
                e.currentTarget.style.boxShadow = `0 8px 32px ${topic.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(48, 54, 61, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${topic.color}, ${topic.color}66)`,
                opacity: 0.8
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                <div style={{ 
                  fontSize: 36,
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
                  lineHeight: 1
                }}>
                  {topic.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    fontFamily: "'IBM Plex Mono', monospace", 
                    fontSize: 18, 
                    fontWeight: 600, 
                    color: "#f0f6fc", 
                    margin: "0 0 8px 0",
                    lineHeight: 1.3
                  }}>
                    {topic.title}
                  </h2>
                </div>
              </div>
              <p style={{ 
                fontFamily: "'IBM Plex Sans', sans-serif", 
                fontSize: 14, 
                color: "#8b949e", 
                margin: 0, 
                lineHeight: 1.6
              }}>
                {topic.description}
              </p>
              <div style={{ 
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: topic.color,
                fontSize: 13,
                fontWeight: 600
              }}>
                <span>Explore</span>
                <span style={{ fontSize: 16 }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 48, 
          textAlign: "center", 
          padding: "24px",
          borderTop: "1px solid rgba(48, 54, 61, 0.3)"
        }}>
          <p style={{ 
            fontFamily: "'IBM Plex Sans', sans-serif", 
            fontSize: 13, 
            color: "#6e7681", 
            margin: 0
          }}>
            Built with ❤️ for Java developers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
