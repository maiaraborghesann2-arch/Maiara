import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ParticleField } from './components/ParticleField';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/LoadingScreen';
import { SmoothScroll } from './components/SmoothScroll';
import { Home } from './pages/Home';

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
        <ParticleField />
        <CustomCursor />

        {!booted && <LoadingScreen onComplete={handleLoaded} />}

        {booted && (
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Phase 2: /about /projects /insights /contact */}
          </Routes>
        )}
      </SmoothScroll>
    </BrowserRouter>
  );
}
