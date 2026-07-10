import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://lyken.agency';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_DESCRIPTION =
  'Strategic design studio specializing in branding, UI/UX, and AI-integrated design for ambitious companies.';

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
}

/** Per-route title, description, Open Graph and Twitter Card tags. */
export function Seo({ title, description = DEFAULT_DESCRIPTION, path = '/' }: SeoProps) {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Lyken Agency" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={OG_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
