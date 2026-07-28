import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Java from './pages/Java';
import Multithreading from './pages/Multithreading';
import DesignPatterns from './pages/DesignPatterns';
import Streams from './pages/Streams';
import DSA from './pages/DSA';
import Collections from './pages/Collections';
import SQL from './pages/SQL';
import Kafka from './pages/Kafka';
import PreviousInterview from './pages/PreviousInterview';
import ReactInterview from './pages/ReactInterview';
import SystemDesign from './systemdesign';
import Microservices from './microservices';

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/java" element={<Java />} />
          <Route path="/multithreading" element={<Multithreading />} />
          <Route path="/design-patterns" element={<DesignPatterns />} />
          <Route path="/streams" element={<Streams />} />
          <Route path="/dsa" element={<DSA />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/sql" element={<SQL />} />
          <Route path="/kafka" element={<Kafka />} />
          <Route path="/previous-interview" element={<PreviousInterview />} />
          <Route path="/react-interview" element={<ReactInterview />} />
          <Route path="/system-design" element={<SystemDesign />} />
          <Route path="/microservices" element={<Microservices />} />
        </Routes>
      </main>
    </div>
  );
}

export default App
