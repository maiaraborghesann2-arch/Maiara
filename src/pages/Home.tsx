import { HeroSection } from '../components/HeroSection';
import { PageShell } from '../components/PageShell';

export function Home() {
  return (
    <PageShell className="home">
      <HeroSection />
    </PageShell>
  );
}
