/**
 * Phase 3 placeholder content. Body copy is Lorem Ipsum by design —
 * labels, headings structure, and UI microcopy are final English.
 * Swap this module's data for real content later without touching layout.
 */

export const LOREM = {
  short: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  medium:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
  long: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  paragraphs: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt, neque porro quisquam est.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
  ],
  pullQuote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.',
};

export type ProjectCategory = 'Branding' | 'UI/UX' | 'AI Integration';

export interface Project {
  slug: string;
  title: string;
  category: ProjectCategory;
  ratio: string; // CSS aspect-ratio value
  span: number; // desktop grid column span (of 6)
  client: string;
  year: string;
  services: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'lorem-ipsum-dolor',
    title: 'Lorem ipsum dolor',
    category: 'Branding',
    ratio: '4 / 5',
    span: 3,
    client: 'Lorem Ipsum Co.',
    year: '2026',
    services: 'Lorem, ipsum, dolor',
  },
  {
    slug: 'sit-amet-consectetur',
    title: 'Sit amet consectetur',
    category: 'UI/UX',
    ratio: '16 / 9',
    span: 3,
    client: 'Consectetur Ltd.',
    year: '2025',
    services: 'Ipsum, sed, tempor',
  },
  {
    slug: 'adipiscing-elit',
    title: 'Adipiscing elit',
    category: 'AI Integration',
    ratio: '1 / 1',
    span: 2,
    client: 'Elit Systems',
    year: '2026',
    services: 'Dolor, magna, aliqua',
  },
  {
    slug: 'sed-do-eiusmod',
    title: 'Sed do eiusmod',
    category: 'Branding',
    ratio: '16 / 9',
    span: 4,
    client: 'Eiusmod Group',
    year: '2024',
    services: 'Lorem, veniam, quis',
  },
  {
    slug: 'tempor-incididunt',
    title: 'Tempor incididunt',
    category: 'UI/UX',
    ratio: '4 / 5',
    span: 2,
    client: 'Incididunt SA',
    year: '2025',
    services: 'Nostrud, ullamco, nisi',
  },
  {
    slug: 'labore-et-dolore',
    title: 'Labore et dolore',
    category: 'AI Integration',
    ratio: '1 / 1',
    span: 4,
    client: 'Dolore Partners',
    year: '2026',
    services: 'Aliquip, commodo, duis',
  },
];

export interface Article {
  slug: string;
  category: string;
  date: string;
  title: string;
}

export const ARTICLES: Article[] = [
  { slug: 'lorem-ipsum-dolor-sit', category: 'Strategy', date: 'Jan 2026', title: 'Lorem ipsum dolor sit amet consectetur' },
  { slug: 'sed-do-eiusmod-tempor', category: 'Design', date: 'Mar 2026', title: 'Sed do eiusmod tempor incididunt ut labore' },
  { slug: 'ut-enim-ad-minim', category: 'AI', date: 'Apr 2026', title: 'Ut enim ad minim veniam quis nostrud' },
  { slug: 'duis-aute-irure', category: 'Craft', date: 'May 2026', title: 'Duis aute irure dolor in reprehenderit' },
  { slug: 'excepteur-sint-occaecat', category: 'Strategy', date: 'Jun 2026', title: 'Excepteur sint occaecat cupidatat non proident' },
];

export interface Milestone {
  year: string;
  title: string;
  text: string;
}

export const MILESTONES: Milestone[] = [
  { year: '2022', title: 'Lorem ipsum', text: 'Dolor sit amet, consectetur adipiscing elit sed do.' },
  { year: '2023', title: 'Tempor incididunt', text: 'Ut labore et dolore magna aliqua, enim ad minim.' },
  { year: '2024', title: 'Veniam quis', text: 'Nostrud exercitation ullamco laboris nisi ut aliquip.' },
  { year: '2025', title: 'Commodo consequat', text: 'Duis aute irure dolor in reprehenderit in voluptate.' },
  { year: '2026', title: 'Velit esse', text: 'Cillum dolore eu fugiat nulla pariatur, excepteur sint.' },
];
