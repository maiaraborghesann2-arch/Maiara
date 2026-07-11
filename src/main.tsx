import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { AmbientAudioProvider } from './components/AmbientAudio';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AmbientAudioProvider>
        <App />
      </AmbientAudioProvider>
    </HelmetProvider>
  </StrictMode>,
);
