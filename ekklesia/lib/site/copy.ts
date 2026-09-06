/**
 * Every word on the homepage, in both languages, in one file.
 *
 * English is the default and Portuguese is the second language. Neither is a
 * translation of the other in the machine sense: each was written to be read,
 * and where a literal rendering would have been stiff the sentence was rebuilt
 * rather than transliterated. The two are kept the same *length* wherever
 * Portuguese allows it, because the layouts are shared and a paragraph that
 * grows by half in one language turns a composition into a compromise.
 *
 * ── On structure ───────────────────────────────────────────────────────────
 *
 * `COPY.en` is the shape; `Copy` is derived from it, so Portuguese cannot drift
 * out of sync without the typechecker saying so. Adding a key means adding it
 * twice — which is the point.
 *
 * ── On positioning ─────────────────────────────────────────────────────────
 *
 * Ekklesia Connect is a technology consultancy for churches and ministries —
 * diagnosis, integration, and proportional custom development. Six ideas, six
 * sections, each idea appearing exactly once. No About (its own page), no case
 * studies, no testimonials, no numbers: the company has not finished work it
 * can show, and a placeholder case is worse than an absent one.
 */

export type Locale = "en" | "pt";

export const LOCALES: readonly Locale[] = ["en", "pt"];

/**
 * The three states of the problem diagram.
 *
 * Declared here rather than in the component because the copy is what names
 * them: this keeps the union attached to the data, so a fourth state cannot be
 * added to the words without the diagram being asked to draw it.
 */
export type ProblemStateId = "disconnected" | "fragmented" | "complex";

/** The tag that goes on `<html lang>` for each. */
export const HTML_LANG: Record<Locale, string> = { en: "en", pt: "pt-BR" };

const en = {
  /* ─────────────────────────────────────────────────────────────── brand ── */
  brand: {
    /** Not translated: it is a name. */
    name: "Ekklesia",
    suffix: "Connect",
    descriptor: "Custom technology consulting and development for churches and ministries.",
    /** Used once, at the very end. A slogan cannot explain a company to someone
     *  who does not yet know what it does. */
    slogan: "Technology that connects. Church that reaches.",
  },

  /* ───────────────────────────────────────────────────────── interface ── */
  ui: {
    skip: "Skip to content",
    menu: "Menu",
    close: "Close",
    nav: "Main navigation",
    home: "home",
    language: "Language",
    /** Full names, for the switch's assistive labels. */
    languageNames: { en: "English", pt: "Português" },
  },

  nav: [
    { label: "The problem", href: "#problema" },
    { label: "Approach", href: "#abordagem" },
    { label: "The path", href: "#caminho" },
    { label: "What we do", href: "#o-que-fazemos" },
    { label: "Diagnosis", href: "#diagnostico" },
  ],

  actions: {
    primary: { label: "Schedule a diagnosis", href: "#diagnostico" },
    secondary: { label: "Tell us what you need", href: "#diagnostico" },
  },

  /* ──────────────────────────────────────────── 01 over the final frame ── */

  /**
   * The page's `<h1>`, set over the mature tree in the film's last shot. The
   * English keeps the metaphor rather than the words — "great fruit" is the
   * same allusion the Portuguese carries, and "large fruits" would not be.
   */
  headline: ["Small beginnings.", "Great fruit."],

  /* ───────────────────────────────────────────────────────── 02 problem ── */
  problem: {
    eyebrow: "The problem",
    title: "Technology shouldn't dictate how your church works.",
    lede: "When the tool becomes the limit, the problem is rarely solved by adding another tool.",
    states: [
      {
        id: "disconnected" as ProblemStateId,
        label: "Disconnected",
        body: "Each tool solves one part, and none of them talks to the next.",
      },
      {
        id: "fragmented" as ProblemStateId,
        label: "Fragmented",
        body: "The same information starts existing in three places, with three answers.",
      },
      {
        id: "complex" as ProblemStateId,
        label: "Complex",
        body: "The process ends up designed around whatever the software allows.",
      },
    ],
  },

  /* ──────────────────────────────────────────────────────── 03 approach ── */
  approach: {
    eyebrow: "The approach",
    title: "Before we build, we understand.",
    stages: [
      {
        index: "01",
        label: "Understand",
        body: "The church, its people, its mission, its processes and the technology already in place.",
      },
      {
        index: "02",
        label: "Diagnose",
        body: "Find the real problem instead of treating the visible symptom.",
      },
      {
        index: "03",
        label: "Recommend",
        body: "Weigh the possible paths and point to the most appropriate direction.",
      },
      {
        index: "04",
        label: "Implement",
        body: "Carry out what was decided — and only what needs doing.",
      },
      {
        index: "05",
        label: "Evolve",
        body: "Support, maintain and adapt the solution over time.",
      },
    ],
  },

  /* ─────────────────────────────────────────────────────── 04 the paths ── */
  paths: {
    eyebrow: "The path",
    question: "What does your church actually need?",
    lede: "Not every problem needs new software. The diagnosis is what tells you which of these four is the way.",
    options: [
      {
        id: "buy",
        label: "Buy",
        claim: "The right solution already exists.",
        body: "Something good enough is already on the market. The work is choosing well and implementing properly.",
      },
      {
        id: "integrate",
        label: "Integrate",
        claim: "The systems need to talk.",
        body: "The right tools are already in the building — they just don't exchange information.",
      },
      {
        id: "adapt",
        label: "Adapt",
        claim: "What exists needs to fit.",
        body: "The solution comes close. What's missing is fitting it to how the church actually works.",
      },
      {
        id: "build",
        label: "Build",
        claim: "When it doesn't exist, we build it.",
        body: "Nothing available supports the process. That is when building is worth it — and only what's necessary.",
      },
    ],
  },

  /* ───────────────────────────────────────────────────── 05 capabilities ── */
  capabilities: {
    eyebrow: "What we do",
    title: "The areas we work in.",
    items: [
      {
        id: "strategy",
        label: "Strategy",
        claim: "Direction before execution.",
        body: "Diagnosis, an assessment of what is already there, and a technical recommendation.",
      },
      {
        id: "integration",
        label: "Integration",
        claim: "What exists, connected.",
        body: "Tools already in use start exchanging data, and manual work goes down.",
      },
      {
        id: "custom",
        label: "Custom built",
        claim: "Built for the real process.",
        body: "Applications, portals and internal systems, for when what exists is not enough.",
      },
      {
        id: "ai",
        label: "AI in context",
        claim: "With sources, limits and review.",
        body: "Assistants, search and analysis over defined sources, with governance and human review.",
      },
      {
        id: "evolution",
        label: "Evolution",
        claim: "After the handover.",
        body: "Deployment, security, monitoring, support and continuous improvement.",
      },
    ],
  },

  /* ────────────────────────────────────────────────────── 06 philosophy ── */
  philosophy: {
    eyebrow: "The difference",
    title: "We start with the church, not the technology.",
    wrong: "What software should we build?",
    right: "What problem are we actually solving?",
    body: "Infrastructure can be shared. Ministry context cannot. That is why the question comes before the tool — and sometimes the answer is to build nothing at all.",
  },

  /* ─────────────────────────────────────────────────────── 07 diagnosis ── */
  diagnosis: {
    eyebrow: "Next step",
    title: "Let's find the right way forward.",
    lede: "Tell us what you are trying to solve. We will help you understand what should come next — including when that does not run through us.",
  },

  /* ─────────────────────────────────────────────────────────────── footer ── */
  footer: {
    columns: [
      { title: "Navigate", useNav: true, links: [] as { label: string; href: string }[] },
      {
        title: "Ekklesia",
        useNav: false,
        links: [
          { label: "Contact", href: "#diagnostico" },
          { label: "Privacy", href: "#" },
        ],
      },
    ],
    /*
     * Written out rather than computed. `new Date()` here would be evaluated
     * once when the page is prerendered and again when it hydrates, and across
     * a new year those two disagree — which React reports as a mismatch.
     */
    legal: "© 2026 Ekklesia Connect",
  },
};

/**
 * The shape both languages must satisfy.
 *
 * `en` is deliberately declared *without* `as const`: that would freeze every
 * string into its own literal type and make `Copy` demand the English words
 * themselves, so Portuguese could not satisfy it. Widened, it describes the
 * structure — which is the thing the two languages have to agree on.
 */
export type Copy = typeof en;

const pt: Copy = {
  brand: {
    name: "Ekklesia",
    suffix: "Connect",
    descriptor: "Consultoria e desenvolvimento de tecnologia sob medida para igrejas e ministérios.",
    slogan: "Tecnologia que conecta. Igreja que alcança.",
  },

  ui: {
    skip: "Ir para o conteúdo",
    menu: "Menu",
    close: "Fechar",
    nav: "Navegação principal",
    home: "início",
    language: "Idioma",
    languageNames: { en: "English", pt: "Português" },
  },

  nav: [
    { label: "O problema", href: "#problema" },
    { label: "Abordagem", href: "#abordagem" },
    { label: "O caminho", href: "#caminho" },
    { label: "O que fazemos", href: "#o-que-fazemos" },
    { label: "Diagnóstico", href: "#diagnostico" },
  ],

  actions: {
    primary: { label: "Agendar um diagnóstico", href: "#diagnostico" },
    secondary: { label: "Conte o que você precisa", href: "#diagnostico" },
  },

  headline: ["Pequenos começos.", "Grandes frutos."],

  problem: {
    eyebrow: "O problema",
    title: "A tecnologia não deveria ditar como sua igreja funciona.",
    lede: "Quando a ferramenta vira o limite, o problema raramente se resolve adicionando outra ferramenta.",
    states: [
      {
        id: "disconnected",
        label: "Desconectado",
        body: "Cada ferramenta resolve uma parte, e nenhuma conversa com a seguinte.",
      },
      {
        id: "fragmented",
        label: "Fragmentado",
        body: "A mesma informação passa a existir em três lugares, com três respostas.",
      },
      {
        id: "complex",
        label: "Complexo",
        body: "O processo passa a ser desenhado em volta do que o software permite.",
      },
    ],
  },

  approach: {
    eyebrow: "A abordagem",
    title: "Antes de construir, entender.",
    stages: [
      {
        index: "01",
        label: "Entender",
        body: "A igreja, as pessoas, a missão, os processos e a tecnologia que já existe.",
      },
      {
        index: "02",
        label: "Diagnosticar",
        body: "Encontrar o problema real, em vez de tratar o sintoma visível.",
      },
      {
        index: "03",
        label: "Recomendar",
        body: "Avaliar os caminhos possíveis e indicar a direção mais adequada.",
      },
      {
        index: "04",
        label: "Implementar",
        body: "Executar o que foi decidido — e apenas o que precisa ser feito.",
      },
      {
        index: "05",
        label: "Evoluir",
        body: "Sustentar, manter e adaptar a solução ao longo do tempo.",
      },
    ],
  },

  paths: {
    eyebrow: "O caminho",
    question: "O que a sua igreja realmente precisa?",
    lede: "Nem todo problema precisa de um software novo. O diagnóstico é que diz qual destes quatro é o caminho.",
    options: [
      {
        id: "buy",
        label: "Comprar",
        claim: "A solução certa já existe.",
        body: "Já existe algo bom o suficiente no mercado. O trabalho é escolher bem e implantar direito.",
      },
      {
        id: "integrate",
        label: "Integrar",
        claim: "Os sistemas precisam conversar.",
        body: "As ferramentas certas já estão na casa — só não trocam informação entre si.",
      },
      {
        id: "adapt",
        label: "Adaptar",
        claim: "O que existe precisa caber.",
        body: "A solução chega perto. Falta ajustá-la ao jeito como a igreja realmente funciona.",
      },
      {
        id: "build",
        label: "Construir",
        claim: "Quando não existe, a gente constrói.",
        body: "Nada disponível sustenta o processo. Aí sim vale construir — e só o necessário.",
      },
    ],
  },

  capabilities: {
    eyebrow: "O que fazemos",
    title: "As frentes de trabalho.",
    items: [
      {
        id: "strategy",
        label: "Estratégia",
        claim: "Direção antes de execução.",
        body: "Diagnóstico, avaliação do que já existe e uma recomendação técnica.",
      },
      {
        id: "integration",
        label: "Integração",
        claim: "O que existe, conectado.",
        body: "Ferramentas em uso passam a trocar dados, e o trabalho manual diminui.",
      },
      {
        id: "custom",
        label: "Sob medida",
        claim: "Construído para o processo real.",
        body: "Aplicações, portais e sistemas internos, quando o que existe não dá conta.",
      },
      {
        id: "ai",
        label: "IA em contexto",
        claim: "Com fontes, limites e revisão.",
        body: "Assistentes, busca e análise sobre fontes definidas, com governança e revisão humana.",
      },
      {
        id: "evolution",
        label: "Evolução",
        claim: "Depois da entrega.",
        body: "Implantação, segurança, monitoramento, suporte e melhoria contínua.",
      },
    ],
  },

  philosophy: {
    eyebrow: "A diferença",
    title: "Começamos pela igreja, não pela tecnologia.",
    wrong: "Que software vamos construir?",
    right: "Que problema estamos tentando resolver?",
    body: "A infraestrutura pode ser compartilhada. O contexto ministerial, não. É por isso que a pergunta vem antes da ferramenta — e às vezes a resposta é não construir nada.",
  },

  diagnosis: {
    eyebrow: "Próximo passo",
    title: "Vamos encontrar o caminho certo.",
    lede: "Conte o que você está tentando resolver. A gente ajuda a entender o que deve vir depois — inclusive quando isso não passa por nós.",
  },

  footer: {
    columns: [
      { title: "Navegar", useNav: true, links: [] },
      {
        title: "Ekklesia",
        useNav: false,
        links: [
          { label: "Contato", href: "#diagnostico" },
          { label: "Privacidade", href: "#" },
        ],
      },
    ],
    legal: "© 2026 Ekklesia Connect",
  },
};

export const COPY: Record<Locale, Copy> = { en, pt };
