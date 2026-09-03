/**
 * Every word on the site, in one file.
 *
 * Two reasons it lives here rather than inside the components: the copy will be
 * rewritten by people who do not read TSX, and the layouts have to survive that
 * rewrite. Nothing below is measured in characters — every container is built
 * to take a longer or shorter line than the one it has.
 *
 * ── On positioning ─────────────────────────────────────────────────────────
 *
 * The strategic document is the source of truth here, and it says something the
 * storyboard did not: Ekklesia Connect is a *technology consultancy* for
 * churches and ministries — diagnosis, integration, and proportional custom
 * development. Not a platform, not an app, not a church management system.
 *
 * That overrode an earlier version of this file, which had been written from
 * the storyboard and positioned the company as a content and formation
 * platform. The two are not reconcilable, and the strategic document wins.
 * What survived from the storyboard is the brand, the palette, the film, and
 * the metaphor — which turns out to fit the consultancy better than it fit the
 * platform: the seed is a need, the roots are the church's own context, and the
 * tree is whatever solution that context actually justifies.
 *
 * ── On language ────────────────────────────────────────────────────────────
 *
 * Portuguese, because the document is `lang="pt-BR"`, the storyboard is
 * Portuguese, and the slogan reads as a translation of "Tecnologia que conecta.
 * Igreja que alcança." The strategic brief arrived in English; that is the
 * brief's language, not the site's. Everything is in this one file, so changing
 * that decision is a translation rather than a rebuild.
 *
 * ── On claims ──────────────────────────────────────────────────────────────
 *
 * Nothing here asserts a client, a metric, a testimonial, a partnership or an
 * outcome, because the materials establish none. The one section that would
 * want them — the case study — is marked `placeholder: true` and is built to
 * hold a real record without being redesigned. Search for `placeholder`.
 */

export type Placeheld<T> = T & {
  /** True where the words are structural stand-ins, not project material. */
  placeholder?: true;
};

/* ─────────────────────────────────────────────────────────────── brand ── */

export const BRAND = {
  name: "Ekklesia",
  suffix: "Connect",
  /** The official slogan. Deliberately never used as the explanation of the
   *  company — a visitor has to know what the company *does* before a line
   *  like this can mean anything. It appears once, at the very end. */
  slogan: "Tecnologia que conecta. Igreja que alcança.",
  descriptor:
    "Consultoria e desenvolvimento de tecnologia sob medida para igrejas e ministérios.",
} as const;

export const NAV = [
  { label: "O problema", href: "#problema" },
  { label: "Abordagem", href: "#abordagem" },
  { label: "O que fazemos", href: "#o-que-fazemos" },
  { label: "Casos", href: "#casos" },
  { label: "Diagnóstico", href: "#diagnostico" },
] as const;

export const ACTIONS = {
  primary: { label: "Agendar um diagnóstico", href: "#diagnostico" },
  secondary: { label: "Conte o que você precisa", href: "#diagnostico" },
} as const;

/* ────────────────────────────────────────────── 01 over the final frame ── */

/**
 * The headline, and the page's `<h1>`.
 *
 * It lives *inside* the film — set over the mature tree in the last shot, not
 * in a section beneath it. That is the whole reason it reads: the sentence is
 * the emotional reading of what the visitor has just watched happen, and it
 * only means anything while the tree is still on screen.
 *
 * From the storyboard's own home frame, and kept deliberately. The strategic
 * headline about technology follows it, further down, where it can be a claim
 * rather than a first impression.
 */
export const CINEMATIC_HEADLINE = {
  lines: ["Pequenos começos.", "Grandes frutos."],
} as const;

/* ──────────────────────────────────────────────────── 02 the proposition ── */

/** The hand-over out of the film, and the whole positioning in four lines. */
export const PROPOSITION = {
  eyebrow: "Consultoria de tecnologia para igrejas",
  title: ["Sua igreja não precisa", "se adaptar à tecnologia."],
  counter: "A tecnologia deve se adaptar à sua igreja.",
  lede: BRAND.descriptor,
  body: "Diagnosticamos, integramos e desenvolvemos soluções adaptadas à identidade, aos processos e à missão da sua igreja.",
} as const;

/* ─────────────────────────────────────────────────────────── 03 problem ── */

export const PROBLEM = {
  eyebrow: "O problema",
  title: "A tecnologia não deveria ditar como sua igreja funciona.",
  lede: "Quando a ferramenta vira o limite, o problema raramente se resolve adicionando outra ferramenta.",
  /**
   * The fragments. Rendered as a set that starts misaligned and settles into a
   * column as it is read — the section argues about disconnection, so the
   * layout is the argument rather than a diagram of it.
   */
  fragments: [
    "Uma planilha que virou sistema.",
    "Formulários que ninguém consegue cruzar.",
    "Três ferramentas guardando a mesma informação.",
    "Um processo desenhado em volta do que o software permite.",
    "Uma plataforma que entrega muito mais — ou muito menos — do que se precisa.",
  ],
  close: "Nada disso é falta de esforço. É falta de encaixe.",
} as const;

/* ────────────────────────────────────────────────────────── 04 approach ── */

/**
 * The methodology, and the reason the word "consultoria" is not decoration.
 * Set on the dark ground: this is the part of the work that happens below the
 * surface, and the film spends its widest beat down there for the same reason.
 */
export const APPROACH = {
  eyebrow: "A abordagem",
  title: "Antes de construir, entender.",
  lede: "Uma solução digital forte não começa pela tecnologia. Começa por entender o que precisa crescer.",
  stages: [
    {
      index: "01",
      label: "Entender",
      body: "A igreja, as pessoas, a missão, os processos, a metodologia e a tecnologia que já existe.",
    },
    {
      index: "02",
      label: "Diagnosticar",
      body: "Identificar o problema real, em vez de tratar o sintoma visível.",
    },
    {
      index: "03",
      label: "Aconselhar",
      body: "Avaliar os caminhos possíveis e recomendar a direção mais adequada.",
    },
    {
      index: "04",
      label: "Construir",
      body: "Construir apenas o que realmente precisa ser construído.",
    },
    {
      index: "05",
      label: "Evoluir",
      body: "Sustentar, manter, melhorar e adaptar a solução ao longo do tempo.",
    },
  ],
} as const;

/* ───────────────────────────────────────────────────────── 05 the paths ── */

/**
 * The differentiator. Four outcomes of one decision, not four services —
 * rendered as branches off a single stem, which is the same shape the film
 * shows underground.
 */
export const PATHS = {
  eyebrow: "O caminho",
  title: "Nem todo problema precisa de um software novo.",
  lede: "Às vezes a resposta é comprar. Às vezes é integrar. Às vezes é adaptar. E às vezes precisa ser construído do zero.",
  options: [
    {
      label: "Comprar",
      body: "Já existe algo bom o suficiente no mercado. O trabalho é escolher bem e implantar direito.",
    },
    {
      label: "Integrar",
      body: "As ferramentas certas já estão na casa — só não conversam entre si.",
    },
    {
      label: "Adaptar",
      body: "O que existe chega perto. Falta ajustá-lo ao jeito da igreja.",
    },
    {
      label: "Construir",
      body: "Nada disponível sustenta o processo. Aí sim vale construir — e só o necessário.",
    },
  ],
  close:
    "Não temos um produto para defender. A recomendação é a que serve à igreja, inclusive quando ela não passa por nós.",
} as const;

/* ──────────────────────────────────────────────────────── 06 capability ── */

/**
 * The services, and deliberately downstream of the method. They are the
 * consequence of the approach, not the identity of the company, so they are set
 * as a hairline index rather than given a section of their own weight.
 */
export const CAPABILITIES = {
  eyebrow: "O que fazemos",
  title: "As frentes de trabalho.",
  lede: "Consequência do método, não o contrário. O diagnóstico é que diz qual delas se aplica.",
  items: [
    {
      label: "Estratégia de tecnologia",
      body: "Diagnóstico, avaliação do que já existe e direção estratégica.",
    },
    {
      label: "Integrações e automação",
      body: "Conectar ferramentas em uso, sincronizar dados e reduzir trabalho manual.",
    },
    {
      label: "Soluções digitais sob medida",
      body: "Aplicações, portais, sistemas internos e experiências digitais — quando o que existe não dá conta.",
    },
    {
      label: "IA em contexto",
      body: "Assistentes, conteúdo, busca e análise sobre fontes definidas, com limites, metodologia, privacidade e revisão humana.",
    },
    {
      label: "Implementação e evolução",
      body: "Implantação, manutenção, segurança, monitoramento, hospedagem, suporte e melhoria contínua.",
    },
  ],
} as const;

/* ─────────────────────────────────────────────────────────── 07 adapts ── */

export const ADAPTS = {
  eyebrow: "Personalização real",
  title: "Cada igreja tem seu próprio jeito de fazer as coisas.",
  counter: "Sua tecnologia deveria entender isso.",
  lede: "Personalizar não é trocar cores, logo e textos. É o sistema aceitar o modo como o ministério já funciona.",
  dimensions: [
    "metodologia do ministério",
    "contexto teológico",
    "linguagem e terminologia",
    "processos e fluxos de trabalho",
    "estrutura ministerial",
    "papéis e permissões",
    "integrações",
    "jornadas de uso",
    "critérios e governança de IA",
  ],
  close: "A infraestrutura pode ser compartilhada. O contexto ministerial, não.",
} as const;

/* ────────────────────────────────────────────────────── 08 the problems ── */

/**
 * Situations rather than services. Each is a sentence a church leader would
 * actually say, followed by the direction it points to — and none of them
 * promises that the direction is something we build.
 */
export const SITUATIONS = {
  eyebrow: "Situações",
  title: "Talvez você reconheça alguma destas.",
  items: [
    {
      quote: "Nossas equipes fazem o mesmo trabalho em três sistemas diferentes.",
      answer: "Costuma ser um problema de integração, não de plataforma nova.",
    },
    {
      quote: "As ferramentas funcionam — mas não conversam entre si.",
      answer: "Aqui o trabalho é conectar e sincronizar o que já está pago e em uso.",
    },
    {
      quote: "Temos um processo ministerial que nenhuma plataforma existente sustenta.",
      answer: "Este é um dos poucos casos em que construir do zero se justifica.",
    },
    {
      quote: "Queremos usar IA sem perder o controle dos dados e do contexto teológico.",
      answer: "Fontes definidas, limites claros, governança e revisão humana — antes do modelo.",
    },
    {
      quote: "Não sabemos se devemos comprar, integrar, adaptar ou construir.",
      answer: "Essa é exatamente a pergunta que o diagnóstico responde.",
    },
  ],
} as const;

/* ──────────────────────────────────────────────────────────── 09 a case ── */

/**
 * Built to hold a real record, holding none yet.
 *
 * The strategic document names the EBD project as a future case study, and
 * there are no EBD assets in this repository — no brief, no numbers, no
 * screenshots. So the structure is here and the content is honestly empty:
 * every field says what belongs in it. Filling them in is an edit to this
 * object, and the section is designed to take several of these.
 */
export const CASES: Placeheld<{
  eyebrow: string;
  title: string;
  lede: string;
  entries: readonly {
    name: string;
    fields: readonly { label: string; body: string }[];
  }[];
}> = {
  placeholder: true,
  eyebrow: "Casos",
  title: "O trabalho, registrado.",
  lede: "Cada caso é publicado com o problema, o contexto e — principalmente — as decisões. Inclusive as de não construir.",
  entries: [
    {
      name: "EBD",
      fields: [
        { label: "Problema", body: "A descrever a partir do material do projeto." },
        { label: "Contexto", body: "A descrever a partir do material do projeto." },
        { label: "Abordagem", body: "A descrever a partir do material do projeto." },
        { label: "Tecnologia", body: "A descrever a partir do material do projeto." },
        { label: "Decisões", body: "A descrever a partir do material do projeto." },
        { label: "Resultado", body: "A registrar quando houver resultado verificado." },
      ],
    },
  ],
};

/* ───────────────────────────────────────────────────── 10 responsibility ── */

export const RESPONSIBILITY = {
  eyebrow: "Tecnologia responsável",
  title: "Nem todo pedido vira entrega.",
  lede: "Quando algo é desnecessário, desproporcional, inseguro, antiético ou prejudicial, dizemos — e apresentamos alternativas. É para isso que se contrata um parceiro, e não um executor.",
  principles: [
    "Integridade",
    "Simplicidade",
    "Segurança",
    "Transparência",
    "Responsabilidade",
    "Excelência",
    "Inovação com propósito",
    "Cuidado com as pessoas",
  ],
} as const;

/* ──────────────────────────────────────────────────────── 11 diagnosis ── */

export const DIAGNOSIS = {
  eyebrow: "Próximo passo",
  title: "Comece por um diagnóstico.",
  lede: "Conte o que você está tentando resolver. A gente ajuda a entender o que deve vir depois.",
  steps: [
    { index: "01", body: "Você conta o que está acontecendo." },
    { index: "02", body: "Entendemos o seu contexto." },
    { index: "03", body: "Revisamos a necessidade." },
    { index: "04", body: "Recomendamos a direção adequada." },
    { index: "05", body: "Você decide o que vem depois." },
  ],
  note: "O diagnóstico é o começo de uma conversa. Não é a porta de entrada de um produto já decidido.",
} as const;

/* ─────────────────────────────────────────────────────────── 12 mission ── */

export const MISSION = {
  title: ["A tecnologia não é o destino."],
  body: "É o que ajuda a missão a avançar.",
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
