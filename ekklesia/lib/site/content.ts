/**
 * Every word on the site, in one file.
 *
 * Two reasons it lives here rather than inside the components: the copy is
 * going to be rewritten by people who do not read TSX, and the layouts have to
 * survive that rewrite. Nothing below is measured in characters — every
 * container is built to take a longer or shorter line than the one it has.
 *
 * ── On provenance ──────────────────────────────────────────────────────────
 *
 * The project materials are the storyboard (`docs/storyboard.png`) and the film.
 * Between them they establish the brand, the palette, the hero, the closing
 * call to action and fifteen narrative lines. They establish *nothing* about
 * what Ekklesia Connect offers as a product — no feature list, no resource
 * types, no pricing, no numbers.
 *
 * So anything not in those materials is marked `placeholder: true` and reads as
 * structure rather than as a claim. Those blocks are deliberately written to be
 * true of the shape of the thing without asserting specifics: they say a
 * section exists and what it is for, and they wait. Search this file for
 * `placeholder` to find everything awaiting real copy.
 */

export type Placeheld<T> = T & {
  /** True where the words are structural stand-ins, not project material. */
  placeholder?: true;
};

/* ─────────────────────────────────────────────────────────── navigation ── */

export const NAV = [
  { label: "Quem somos", href: "#quem-somos" },
  { label: "Ecossistema", href: "#ecossistema" },
  { label: "Recursos", href: "#recursos" },
  { label: "Comunidade", href: "#comunidade" },
  { label: "Como funciona", href: "#como-funciona" },
] as const;

export const BRAND = {
  name: "Ekklesia",
  suffix: "Connect",
  /** The storyboard's own description of the piece. */
  tagline: "A jornada de uma semente que se torna árvore.",
} as const;

/* ────────────────────────────────────────────────────────────── sections ── */

/** Frame 04 of the storyboard: the Home the seed lands in. All of it is real. */
export const MANIFESTO = {
  eyebrow: "Jornada de fé e conhecimento",
  title: ["Pequenos começos.", "Grandes frutos."],
  lede: "Conteúdo que transforma vidas e gera crescimento real.",
  action: { label: "Explorar recursos", href: "#recursos" },
} as const;

/**
 * What the organisation is. Held to what the materials actually say — the
 * storyboard asserts the metaphor and the promise, and no more than that, so
 * neither does this.
 */
export const ABOUT = {
  eyebrow: "Quem somos",
  lead: "Ekklesia Connect existe para que o crescimento tenha raiz.",
  body: [
    "A imagem que abre esta página não é ilustração. É o modo como entendemos formação: uma semente que desce antes de subir, um processo que acontece longe dos olhos muito antes de dar fruto.",
    "Conteúdo que transforma vidas e gera crescimento real — para quem constrói a igreja no dia a dia.",
  ],
} as const;

/**
 * The pause. Every line here is project material: the first two are storyboard
 * frames 09 and 08, the third is the copy already written for the
 * contemplation beat of the earlier build.
 */
export const DEPTH = {
  lead: "Nem todo crescimento é imediatamente visível.",
  body: "Antes de romper a superfície, existe um processo silencioso acontecendo por baixo.",
  note: "Raízes que descem. Fundamentos que sustentam.",
} as const;

/**
 * The platform. Structural — the three columns describe the *shape* of an
 * ecosystem for formation without claiming what is inside it. Replace the
 * bodies; the headings are safe.
 */
export const ECOSYSTEM: Placeheld<{
  eyebrow: string;
  title: string;
  lede: string;
  items: readonly { index: string; label: string; body: string }[];
}> = {
  placeholder: true,
  eyebrow: "O ecossistema",
  title: "Um lugar para o que sustenta.",
  lede: "Formação, comunidade e prática reunidas — para que cada etapa do crescimento tenha onde se apoiar.",
  items: [
    {
      index: "01",
      label: "Formação",
      body: "Trilhas de estudo pensadas para profundidade, não para volume.",
    },
    {
      index: "02",
      label: "Prática",
      body: "O que se aprende encontra onde ser aplicado, na vida da comunidade.",
    },
    {
      index: "03",
      label: "Acompanhamento",
      body: "Crescimento acompanhado ao longo do tempo, e não medido num único momento.",
    },
  ],
};

/**
 * Resources. The hero's call to action points here, so the section has to
 * exist and has to be navigable. The four kinds below are structural.
 */
export const RESOURCES: Placeheld<{
  eyebrow: string;
  title: string;
  lede: string;
  items: readonly { label: string; body: string }[];
}> = {
  placeholder: true,
  eyebrow: "Recursos",
  title: "O que fica disponível.",
  lede: "Material para estudar, para ensinar e para conduzir — organizado por onde você está, não por formato.",
  items: [
    { label: "Estudos", body: "Conteúdo em profundidade, para leitura e para preparo." },
    { label: "Encontros", body: "Material para conduzir conversas em grupo." },
    { label: "Ferramentas", body: "Apoio prático para o trabalho da semana." },
    { label: "Acervo", body: "O que já foi publicado, sempre acessível." },
  ],
};

/** Community. Structural, but built on the metaphor the materials establish. */
export const COMMUNITY: Placeheld<{
  eyebrow: string;
  quote: string;
  body: string;
}> = {
  placeholder: true,
  eyebrow: "Comunidade",
  quote: "Nenhuma árvore cresce sozinha.",
  body: "Pessoas, igrejas e histórias que se encontram em torno da mesma jornada — porque o que sustenta o crescimento raramente é individual.",
};

/** How it works. Three steps, structural. */
export const HOW: Placeheld<{
  eyebrow: string;
  title: string;
  steps: readonly { index: string; label: string; body: string }[];
}> = {
  placeholder: true,
  eyebrow: "Como funciona",
  title: "Três passos, e o resto é caminho.",
  steps: [
    { index: "01", label: "Você entra", body: "Cria seu acesso e diz de onde está partindo." },
    { index: "02", label: "Você encontra", body: "Recebe o que faz sentido para o momento em que está." },
    { index: "03", label: "Você cresce", body: "Avança no seu tempo, com a comunidade por perto." },
  ],
};

/** The closing panel of the storyboard. Real. */
export const CLOSING = {
  title: ["Sua jornada de fé e conhecimento", "começa aqui."],
  action: { label: "Começar jornada", href: "#" },
} as const;

export const FOOTER = {
  /** The storyboard's own summary of the piece. */
  note: "Cada etapa desta página é conduzida pelo scroll — uma jornada, e não uma sequência de telas.",
  columns: [
    { title: "Navegar", links: NAV },
    {
      title: "Ekklesia",
      links: [
        { label: "Contato", href: "#" },
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
