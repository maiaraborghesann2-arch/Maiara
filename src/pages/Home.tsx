import { HeroSection } from '../components/HeroSection';
import {
  ContactCta,
  FeaturedProjects,
  ServicesSection,
  TestimonialsSection,
} from '../components/HomeSections';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';

export function Home() {
  return (
    <PageShell className="home">
      <Seo title="Lyken Agency — Intelligent Strategy. Unforgettable Brands." path="/" />
      <HeroSection />
      <ServicesSection />
      <FeaturedProjects />
      <TestimonialsSection />
      <ContactCta />
    </PageShell>
  );
}
