import { motion } from 'framer-motion';
import { LiquidText } from '../components/LiquidText';
import './PlaceholderPage.css';

/** Temporary route shell — real pages arrive in Phase 3. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.main
      className="placeholder-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <LiquidText as="h1" className="placeholder-title">
        {title}
      </LiquidText>
      <p className="u-label">Coming in Phase 3</p>
    </motion.main>
  );
}
