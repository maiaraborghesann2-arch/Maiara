import { Suspense, lazy, useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ParticleField } from './components/ParticleField';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/LoadingScreen';
import { SmoothScroll } from './components/SmoothScroll';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Logo } from './components/Logo';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() =>
  import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })),
);
const Insights = lazy(() => import('./pages/Insights').then((m) => ({ default: m.Insights })));
const ArticleDetail = lazy(() =>
  import('./pages/ArticleDetail').then((m) => ({ default: m.ArticleDetail })),
);
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));

const SESSION_KEY = 'lyken:loaded';

/** Minimal branded fallback while a route chunk loads (NOT the full loading screen). */
function RouteFallback() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
      }}
      role="status"
      aria-label="Loading page"
    >
      <Logo size={40} monogramOnly />
    </div>
  );
}

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
          {/* Route "camera pivot" transition lives in <PageShell /> (framer),
              which each page renders as its root — no extra wrapper here.
              A persistent transformed wrapper around the routes would break
              ScrollTrigger pinning (fixed-position containing block). */}
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
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
