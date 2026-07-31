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
    button: 'Start your journey',
    briefingLink: 'Or start a project brief with Lykos',
    briefingAria: 'Start a project brief with Lykos, our AI intake strategist',
  },
  footer: {
    tagline: 'Branding · UI/UX · AI-Integrated Design',
    email: 'Email',
    ariaLabel: 'Contact and social',
    copyright: 'Lyken Agency © 2026',
    legalLabel: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
  consent: {
    ariaLabel: 'Storage notice',
    text: 'This site stores a few preferences in your browser — your language and ambient audio choices. No tracking, no advertising.',
    accept: 'Accept',
    learnMore: 'Privacy Policy',
  },
  legal: {
    label: 'Legal',
    lastUpdated: 'Last updated',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    disclaimerLabel: 'Draft — not legal advice',
    disclaimer:
      'This is a draft template and has not been reviewed by a lawyer. Consult a qualified data protection professional before relying on this policy in production.',
    /** Only shown in languages the documents are not maintained in. */
    langNote: '',
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
  briefing: {
    label: 'Project Briefing',
    headline: 'Tell Lykos about your project.',
    intro:
      'A short guided conversation — about five minutes. Lykos gathers the essentials and hands the brief to our team.',
    withLykos: 'Chatting with Lykos',
    role: 'AI intake strategist',
    avatarAlt: 'Lykos',
    notice: {
      label: 'Before you start',
      title: 'How this conversation is handled',
      points: [
        'Lykos is an AI assistant. Your messages are processed by Claude, made by Anthropic, to run the conversation and to prepare a summary for our team.',
        'What you write — including your name, contact details, and project details — is stored and read by the Lyken Agency team.',
        'Please do not share confidential third-party information or anyone else’s personal data here.',
      ],
      privacyPrefix: 'Full detail in our',
      privacyLink: 'Privacy Policy',
      accept: 'I understand — start briefing',
    },
    inputLabel: 'Your message',
    placeholder: 'Type your answer…',
    send: 'Send',
    thinking: 'Lykos is thinking',
    logLabel: 'Conversation with Lykos',
    error: "Something went wrong on our side. Nothing was lost — try sending that again.",
    retry: 'Try again',
    summaryLabel: 'Brief received',
    summaryHeadline: 'Your brief is with the team.',
    summaryIntro:
      'Here is what Lykos captured. A strategist will review it and follow up by email.',
    summaryPending: 'Preparing your brief',
    summaryFields: {
      client_name: 'Name',
      company: 'Company',
      email: 'Email',
      project_type: 'Project type',
      goals: 'Goals',
      audience: 'Audience',
      brand_personality: 'Brand personality',
      budget: 'Budget',
      timeline: 'Timeline',
      existing_assets: 'Existing assets',
      other_context: 'Other context',
    },
    backHome: 'Back to home',
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
    button: 'Comece sua jornada',
    briefingLink: 'Ou comece um briefing de projeto com o Lykos',
    briefingAria: 'Comece um briefing de projeto com o Lykos, nosso estrategista de IA',
  },
  footer: {
    tagline: 'Branding · UI/UX · Design Integrado a IA',
    email: 'E-mail',
    ariaLabel: 'Contato e redes sociais',
    copyright: 'Lyken Agency © 2026',
    legalLabel: 'Jurídico',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço',
  },
  consent: {
    ariaLabel: 'Aviso sobre armazenamento local',
    text: 'Este site guarda algumas preferências no seu navegador — idioma e som ambiente. Sem rastreamento, sem publicidade.',
    accept: 'Aceitar',
    learnMore: 'Política de Privacidade',
  },
  legal: {
    label: 'Jurídico',
    lastUpdated: 'Atualizado em',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço',
    disclaimerLabel: 'Rascunho — não é aconselhamento jurídico',
    disclaimer:
      'Este é um modelo em rascunho e não foi revisado por um advogado. Consulte um profissional qualificado em proteção de dados antes de utilizá-lo em produção.',
    langNote:
      'Os documentos jurídicos são mantidos em inglês para evitar divergências de interpretação entre versões. A versão em inglês é a que prevalece.',
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
  briefing: {
    label: 'Briefing de Projeto',
    headline: 'Conte ao Lykos sobre seu projeto.',
    intro:
      'Uma conversa guiada e curta — cerca de cinco minutos. O Lykos reúne o essencial e entrega o briefing ao nosso time.',
    withLykos: 'Conversando com o Lykos',
    role: 'Estrategista de IA',
    avatarAlt: 'Lykos',
    notice: {
      label: 'Antes de começar',
      title: 'Como esta conversa é tratada',
      points: [
        'O Lykos é um assistente de IA. Suas mensagens são processadas pelo Claude, da Anthropic, para conduzir a conversa e preparar um resumo para o nosso time.',
        'O que você escrever — incluindo nome, contato e detalhes do projeto — é armazenado e lido pelo time da Lyken Agency.',
        'Por favor, não compartilhe aqui informações confidenciais de terceiros nem dados pessoais de outras pessoas.',
      ],
      privacyPrefix: 'Detalhes completos na nossa',
      privacyLink: 'Política de Privacidade',
      accept: 'Entendi — começar o briefing',
    },
    inputLabel: 'Sua mensagem',
    placeholder: 'Escreva sua resposta…',
    send: 'Enviar',
    thinking: 'O Lykos está pensando',
    logLabel: 'Conversa com o Lykos',
    error: 'Algo falhou do nosso lado. Nada foi perdido — tente enviar novamente.',
    retry: 'Tentar de novo',
    summaryLabel: 'Briefing recebido',
    summaryHeadline: 'Seu briefing já está com o time.',
    summaryIntro:
      'Isto é o que o Lykos registrou. Um estrategista vai revisar e responder por e-mail.',
    summaryPending: 'Preparando seu briefing',
    summaryFields: {
      client_name: 'Nome',
      company: 'Empresa',
      email: 'E-mail',
      project_type: 'Tipo de projeto',
      goals: 'Objetivos',
      audience: 'Público',
      brand_personality: 'Personalidade da marca',
      budget: 'Orçamento',
      timeline: 'Prazo',
      existing_assets: 'Materiais existentes',
      other_context: 'Outros pontos',
    },
    backHome: 'Voltar ao início',
  },
  pages: {
    aboutLabel: 'Sobre a Lyken',
    milestonesLabel: 'Marcos',
    projectsLabel: 'Trabalhos Selecionados',
    insightsLabel: 'Insights',
  },
};

export const translations: Record<Lang, Dict> = { en, pt };
