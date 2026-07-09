import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ParticleField } from './components/ParticleField';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/LoadingScreen';
import { SmoothScroll } from './components/SmoothScroll';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Insights } from './pages/Insights';
import { ArticleDetail } from './pages/ArticleDetail';
import { Contact } from './pages/Contact';

const SESSION_KEY = 'lyken:loaded';

function AppInner() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleLoaded = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setBooted(true);
  }, []);

  return (
    <SmoothScroll>
      {/* Persistent layers: emerald radial pulse + particle field.
          Mounted once — they run through the loading screen, page
          transitions, and never reset. Home gets the denser hero field. */}
      <div className="app-bg" aria-hidden="true" />
      <ParticleField density={isHome ? 1.3 : 0.8} />
      <CustomCursor />

      {!booted && <LoadingScreen onComplete={handleLoaded} />}

      {booted && (
        <>
          <NavBar />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/insights/:slug" element={<ArticleDetail />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </>
      )}
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
