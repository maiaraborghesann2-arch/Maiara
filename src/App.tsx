import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ParticleField } from './components/ParticleField';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/LoadingScreen';
import { SmoothScroll } from './components/SmoothScroll';
import { ScrollToTop } from './components/ScrollToTop';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { PlaceholderPage } from './pages/PlaceholderPage';

const SESSION_KEY = 'lyken:loaded';

export default function App() {
  const [booted, setBooted] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  const handleLoaded = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setBooted(true);
  }, []);

  return (
    <BrowserRouter>
      <SmoothScroll>
        {/* Persistent layers: emerald radial pulse + particle field.
            Mounted once — they run through the loading screen and never reset. */}
        <div className="app-bg" aria-hidden="true" />
        <ParticleField density={1.3} />
        <CustomCursor />

        {!booted && <LoadingScreen onComplete={handleLoaded} />}

        {booted && (
          <>
            <ScrollToTop />
            <NavBar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<PlaceholderPage title="About" />} />
              <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
              <Route path="/insights" element={<PlaceholderPage title="Insights" />} />
              <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
            </Routes>
            <Footer />
          </>
        )}
      </SmoothScroll>
    </BrowserRouter>
  );
}
