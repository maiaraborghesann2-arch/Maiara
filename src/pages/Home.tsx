import { motion } from 'framer-motion';
import { LiquidText } from '../components/LiquidText';
import { Logo } from '../components/Logo';
import './Home.css';

/**
 * Phase 1 placeholder — verifies the design system, fonts, particle field,
 * cursor, and liquid-text systems before the Phase 2 hero is built.
 */
export function Home() {
  return (
    <motion.main
      className="home-placeholder"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Logo size={72} monogramOnly className="home-placeholder-mark" data-magnetic />
      <LiquidText as="h1" className="home-placeholder-title">
        LYKEN — Phase 1 Foundation Complete
      </LiquidText>
      <p className="u-label home-placeholder-note">Design system · Particles · Cursor · Loader</p>
    </motion.main>
  );
}
