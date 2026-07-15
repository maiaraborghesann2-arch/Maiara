import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { AmbientAudioProvider } from './components/AmbientAudio';
import { LanguageProvider } from './i18n/LanguageContext';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <AmbientAudioProvider>
          <App />
        </AmbientAudioProvider>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>,
);
