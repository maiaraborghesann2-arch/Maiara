/**
 * Sitewide UI copy — EN (default) + PT-BR dictionaries.
 *
 * Lorem-ipsum BODY copy (project descriptions, article bodies, testimonial
 * quotes) intentionally stays untranslated placeholder text; only real,
 * user-facing UI language lives here. Emphasis headlines are stored as
 * segment arrays so each language controls which word carries the gold
 * italic treatment (word order differs between EN and PT).
 */

export type Lang = 'en' | 'pt';

export interface HeadlineSegment {
  text: string;
  gold?: boolean;
}

const en = {
  nav: {
    home: 'Lyken Agency — Home',
    about: 'About',
    projects: 'Projects',
    insights: 'Insights',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: 'Menu',
    primary: 'Primary',
  },
  audio: {
    unmute: 'Unmute ambient sound',
    mute: 'Mute ambient sound',
  },
  langToggle: 'Switch language',
  loading: {
    label: 'Lyken Agency is loading',
    tagline: 'STRATEGIC DESIGN STUDIO',
    skip: 'Skip',
    enter: 'Enter',
    enterMuted: 'Enter without audio',
    enterAria: 'Enter the site with ambient audio',
    enterMutedAria: 'Enter the site without audio',
  },
  hero: {
    line1: 'Intelligent Strategy.',
    line2: [{ text: 'Unforgettable', gold: true }, { text: ' Brands.' }] as HeadlineSegment[],
    subline:
      'Brand identity, digital experience, and AI-integrated design for ambitious companies.',
    cta: 'View Our Work',
    pillars: [
      { title: 'Strategic', text: 'Every decision starts with positioning, not decoration.' },
      { title: 'Considered', text: 'Restraint is a design choice. We use it deliberately.' },
      { title: 'Enduring', text: 'Brands built to outlast trends, not chase them.' },
    ],
  },
  services: {
    label: 'What We Do',
    headline: [{ text: 'Capabilities with' }, { text: ' intent.', gold: true }] as HeadlineSegment[],
    items: [
      {
        title: 'Brand Identity',
        text: 'Naming, visual systems, and brand worlds engineered to be recognized — not just seen.',
      },
      {
        title: 'Digital Experience',
        text: 'Websites and products where craft, motion, and performance carry the brand story.',
      },
      {
        title: 'AI-Integrated Design',
        text: 'Intelligent interfaces and generative workflows woven into the brand, responsibly.',
      },
      {
        title: 'Strategic Positioning',
        text: 'Research, narrative, and market positioning that make every design decision defensible.',
      },
    ],
  },
  featured: {
    label: 'Selected Work',
    headline: [{ text: 'Work that' }, { text: ' endures.', gold: true }] as HeadlineSegment[],
    viewAll: 'View All Work',
  },
  testimonials: {
    label: 'Client Voices',
    headline: [{ text: 'In their' }, { text: ' words.', gold: true }] as HeadlineSegment[],
    navLabel: 'Testimonials navigation',
    itemLabel: 'Testimonial',
  },
  cta: {
    headline: "Let's build something unforgettable.",
    button: 'Start a Conversation',
  },
  footer: {
    tagline: 'Branding · UI/UX · AI-Integrated Design',
    email: 'Email',
    ariaLabel: 'Contact and social',
    copyright: 'Lyken Agency © 2026',
  },
  contact: {
    label: 'Get in Touch',
    name: 'Name',
    email: 'Email',
    company: 'Company (optional)',
    message: 'Message',
    send: 'Send Message',
    success: "Thank you — we'll be in touch shortly.",
    asideLabel: 'Contact details',
  },
  pages: {
    aboutLabel: 'About Lyken',
    milestonesLabel: 'Milestones',
    projectsLabel: 'Selected Work',
    insightsLabel: 'Insights',
  },
};

export type Dict = typeof en;

const pt: Dict = {
  nav: {
    home: 'Lyken Agency — Início',
    about: 'Sobre',
    projects: 'Projetos',
    insights: 'Insights',
    contact: 'Contato',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    menu: 'Menu',
    primary: 'Principal',
  },
  audio: {
    unmute: 'Ativar som ambiente',
    mute: 'Silenciar som ambiente',
  },
  langToggle: 'Trocar idioma',
  loading: {
    label: 'Lyken Agency está carregando',
    tagline: 'ESTÚDIO DE DESIGN ESTRATÉGICO',
    skip: 'Pular',
    enter: 'Entrar',
    enterMuted: 'Entrar sem áudio',
    enterAria: 'Entrar no site com áudio ambiente',
    enterMutedAria: 'Entrar no site sem áudio',
  },
  hero: {
    line1: 'Estratégia Inteligente.',
    line2: [{ text: 'Marcas ' }, { text: 'Inesquecíveis.', gold: true }],
    subline:
      'Identidade de marca, experiência digital e design integrado a IA para empresas ambiciosas.',
    cta: 'Veja Nosso Trabalho',
    pillars: [
      { title: 'Estratégico', text: 'Toda decisão parte de posicionamento, não de decoração.' },
      { title: 'Intencional', text: 'Contenção é uma escolha de design. Usamos de propósito.' },
      { title: 'Duradouro', text: 'Marcas feitas para atravessar tendências, não segui-las.' },
    ],
  },
  services: {
    label: 'O Que Fazemos',
    headline: [{ text: 'Capacidades com' }, { text: ' intenção.', gold: true }],
    items: [
      {
        title: 'Identidade de Marca',
        text: 'Naming, sistemas visuais e universos de marca construídos para serem reconhecidos — não apenas vistos.',
      },
      {
        title: 'Experiência Digital',
        text: 'Sites e produtos em que artesania, movimento e performance carregam a história da marca.',
      },
      {
        title: 'Design Integrado a IA',
        text: 'Interfaces inteligentes e fluxos generativos tecidos à marca, com responsabilidade.',
      },
      {
        title: 'Posicionamento Estratégico',
        text: 'Pesquisa, narrativa e posicionamento de mercado que tornam cada decisão de design defensável.',
      },
    ],
  },
  featured: {
    label: 'Trabalhos Selecionados',
    headline: [{ text: 'Trabalho que' }, { text: ' permanece.', gold: true }],
    viewAll: 'Ver Todos',
  },
  testimonials: {
    label: 'Vozes de Clientes',
    headline: [{ text: 'Nas palavras' }, { text: ' deles.', gold: true }],
    navLabel: 'Navegação de depoimentos',
    itemLabel: 'Depoimento',
  },
  cta: {
    headline: 'Vamos construir algo inesquecível.',
    button: 'Iniciar uma Conversa',
  },
  footer: {
    tagline: 'Branding · UI/UX · Design Integrado a IA',
    email: 'E-mail',
    ariaLabel: 'Contato e redes sociais',
    copyright: 'Lyken Agency © 2026',
  },
  contact: {
    label: 'Fale Conosco',
    name: 'Nome',
    email: 'E-mail',
    company: 'Empresa (opcional)',
    message: 'Mensagem',
    send: 'Enviar Mensagem',
    success: 'Obrigado — retornaremos em breve.',
    asideLabel: 'Dados de contato',
  },
  pages: {
    aboutLabel: 'Sobre a Lyken',
    milestonesLabel: 'Marcos',
    projectsLabel: 'Trabalhos Selecionados',
    insightsLabel: 'Insights',
  },
};

export const translations: Record<Lang, Dict> = { en, pt };
