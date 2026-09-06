/**
 * Every word on the homepage, in one file.
 *
 * Two reasons it lives here rather than inside the components: the copy will be
 * rewritten by people who do not read TSX, and the layouts have to survive that
 * rewrite. Nothing below is measured in characters — every container is built
 * to take a longer or shorter line than the one it has.
 *
 * ── On positioning ─────────────────────────────────────────────────────────
 *
 * Ekklesia Connect is a *technology consultancy* for churches and ministries —
 * diagnosis, integration, and proportional custom development. Not a platform,
 * not an app, not a church management system. The metaphor the film carries
 * belongs to that: the seed is a need, the roots are the church's own context,
 * and the tree is whatever solution that context actually justifies.
 *
 * ── On discipline ──────────────────────────────────────────────────────────
 *
 * Six ideas, six sections, and each idea appears exactly once. An earlier
 * version of this file said "technology should adapt to the church" in four
 * different places — as a proposition, as a problem, as an adaptation section
 * and as a philosophy. It is one idea. It now has one moment, in the section
 * built for it, and everything that only restated it was deleted rather than
 * rephrased.
 *
 * There is no About section: that becomes its own page. There are no cases,
 * no testimonials, no logos, no numbers — the company has not finished work it
 * can show yet, and a placeholder case study is worse than an absent one.
 *
 * ── On language ────────────────────────────────────────────────────────────
 *
 * Portuguese, because the document is `lang="pt-BR"` and the slogan reads as a
 * translation of "Tecnologia que conecta. Igreja que alcança." Everything is in
 * this one file, so changing that decision is a translation, not a rebuild.
 */

/* ─────────────────────────────────────────────────────────────── brand ── */

export const BRAND = {
  name: "Ekklesia",
  suffix: "Connect",
  /** Used once, at the very end. A slogan cannot explain a company to someone
   *  who does not yet know what it does. */
  slogan: "Tecnologia que conecta. Igreja que alcança.",
  descriptor:
    "Consultoria e desenvolvimento de tecnologia sob medida para igrejas e ministérios.",
} as const;

export const NAV = [
  { label: "O problema", href: "#problema" },
  { label: "Abordagem", href: "#abordagem" },
  { label: "O caminho", href: "#caminho" },
  { label: "O que fazemos", href: "#o-que-fazemos" },
  { label: "Diagnóstico", href: "#diagnostico" },
] as const;

export const ACTIONS = {
  primary: { label: "Agendar um diagnóstico", href: "#diagnostico" },
  secondary: { label: "Conte o que você precisa", href: "#diagnostico" },
} as const;

/* ─────────────────────────────────────────────── 01 over the final frame ── */

/**
 * The headline, and the page's `<h1>`. It lives inside the film, set over the
 * mature tree in the last shot — the emotional reading of what the visitor has
 * just watched happen, while it is still on screen.
 */
export const CINEMATIC_HEADLINE = {
  lines: ["Pequenos começos.", "Grandes frutos."],
} as const;

/* ─────────────────────────────────────────────────────────── 02 problem ── */

/**
 * The problem, in three states rather than three paragraphs.
 *
 * Each state carries its own diagram, and the diagrams are the argument: one
 * mark alone, then marks that do not meet, then marks that meet too many times.
 * The copy says what the picture cannot, and stops.
 */
export const PROBLEM = {
  eyebrow: "O problema",
  title: "A tecnologia não deveria ditar como sua igreja funciona.",
  lede: "Quando a ferramenta vira o limite, o problema raramente se resolve adicionando outra ferramenta.",
  states: [
    {
      id: "desconectado",
      label: "Desconectado",
      body: "Cada ferramenta resolve uma parte, e nenhuma conversa com a seguinte.",
    },
    {
      id: "fragmentado",
      label: "Fragmentado",
      body: "A mesma informação passa a existir em três lugares, com três respostas.",
    },
    {
      id: "complexo",
      label: "Complexo",
      body: "O processo passa a ser desenhado em volta do que o software permite.",
    },
  ],
} as const;

/* ────────────────────────────────────────────────────────── 03 approach ── */

/**
 * The method, and the reason the word "consultoria" is not decoration. Five
 * stages, one visible at a time — the visitor advances through it rather than
 * scanning it, which is closer to how the work itself goes.
 */
export const APPROACH = {
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
      body: "Identificar o problema real, em vez de tratar o sintoma visível.",
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
} as const;

/* ───────────────────────────────────────────────────────── 04 the paths ── */

/**
 * The decision, not the menu. Four answers to one question, and the question is
 * set larger than the answers because it is the thing being sold.
 */
export const PATHS = {
  eyebrow: "O caminho",
  question: "O que a sua igreja realmente precisa?",
  lede: "Nem todo problema precisa de um software novo. O diagnóstico é que diz qual destes quatro é o caminho.",
  options: [
    {
      id: "comprar",
      label: "Comprar",
      claim: "A solução certa já existe.",
      body: "Já existe algo bom o suficiente no mercado. O trabalho é escolher bem e implantar direito.",
    },
    {
      id: "integrar",
      label: "Integrar",
      claim: "Os sistemas precisam conversar.",
      body: "As ferramentas certas já estão na casa — só não trocam informação entre si.",
    },
    {
      id: "adaptar",
      label: "Adaptar",
      claim: "O que existe precisa caber.",
      body: "A solução chega perto. Falta ajustá-la à realidade específica da igreja.",
    },
    {
      id: "construir",
      label: "Construir",
      claim: "Quando não existe, a gente constrói.",
      body: "Nada disponível sustenta o processo. Aí sim vale construir — e só o necessário.",
    },
  ],
} as const;

/* ────────────────────────────────────────────────────── 05 capabilities ── */

/**
 * Where the work happens, once the decision is made. Consequence of the method,
 * never the identity of the company — which is why this is the shortest section
 * on the page and the last one to speak before the close.
 */
export const CAPABILITIES = {
  eyebrow: "O que fazemos",
  title: "As frentes de trabalho.",
  items: [
    {
      id: "estrategia",
      label: "Estratégia",
      claim: "Direção antes de execução.",
      body: "Diagnóstico, avaliação do que já existe e recomendação técnica.",
    },
    {
      id: "integracao",
      label: "Integração",
      claim: "O que existe, conectado.",
      body: "Ferramentas em uso passam a trocar dados, e o trabalho manual diminui.",
    },
    {
      id: "sob-medida",
      label: "Sob medida",
      claim: "Construído para o processo real.",
      body: "Aplicações, portais e sistemas internos, quando o que existe não dá conta.",
    },
    {
      id: "ia",
      label: "IA em contexto",
      claim: "Com fontes, limites e revisão.",
      body: "Assistentes, busca e análise sobre fontes definidas, com governança e revisão humana.",
    },
    {
      id: "evolucao",
      label: "Evolução",
      claim: "Depois da entrega.",
      body: "Implantação, segurança, monitoramento, suporte e melhoria contínua.",
    },
  ],
} as const;

/* ─────────────────────────────────────────────────────── 06 philosophy ── */

/**
 * The one moment of difference, and the only place the central idea is stated
 * outright. It is a swap: the question most suppliers start from, struck
 * through, and the question this one starts from underneath it.
 */
export const PHILOSOPHY = {
  eyebrow: "A diferença",
  title: "Começamos pela igreja, não pela tecnologia.",
  wrong: "Que software vamos construir?",
  right: "Que problema estamos tentando resolver?",
  body: "A infraestrutura pode ser compartilhada. O contexto ministerial, não. É por isso que a pergunta vem antes da ferramenta — e às vezes a resposta é não construir nada.",
} as const;

/* ────────────────────────────────────────────────────── 07 the diagnosis ── */

export const DIAGNOSIS = {
  eyebrow: "Próximo passo",
  title: "Vamos encontrar o caminho certo.",
  lede: "Conte o que você está tentando resolver. A gente ajuda a entender o que deve vir depois — inclusive quando isso não passa por nós.",
  slogan: BRAND.slogan,
} as const;

/* ──────────────────────────────────────────────────────────────── footer ── */

export const FOOTER = {
  note: BRAND.descriptor,
  columns: [
    { title: "Navegar", links: NAV },
    {
      title: "Ekklesia",
      links: [
        { label: "Contato", href: "#diagnostico" },
        { label: "Privacidade", href: "#" },
      ],
    },
  ],
  /*
   * Written out rather than computed. `new Date()` here would be evaluated once
   * when the page is prerendered and again when it hydrates, and across a new
   * year those two disagree — which React reports as a hydration mismatch.
   */
  legal: "© 2026 Ekklesia Connect",
} as const;
