/**
 * The narrative registry.
 *
 * `STORYBOARD` transcribes all fifteen frames of the Fase 1 storyboard so the
 * whole arc is legible in one place, even though only the first chapter is
 * built. `ACT_ONE` gives those first four beats a concrete slice of the scroll
 * track; later chapters get their own act table and their own track, and the
 * driver below does not change.
 */

export type BeatStatus = "built" | "planned";

export type StoryboardFrame = {
  index: number;
  id: string;
  /** Title as it appears on the storyboard card. */
  label: string;
  /** Italic caption beneath the frame, kept verbatim. */
  caption?: readonly string[];
  status: BeatStatus;
};

export const STORYBOARD: readonly StoryboardFrame[] = [
  {
    index: 1,
    id: "semente",
    label: "Semente",
    caption: ["A semente existe.", "Pequena. Silenciosa. Cheia de potencial."],
    status: "built",
  },
  {
    index: 2,
    id: "despertar",
    label: "Despertar",
    caption: ["Um giro suave revela", "sua forma e sua essência."],
    status: "built",
  },
  {
    index: 3,
    id: "queda",
    label: "Queda",
    caption: ["Ela se solta.", "E começa a descer."],
    status: "built",
  },
  { index: 4, id: "home", label: "Home", status: "built" },
  {
    index: 5,
    id: "plantio",
    label: "Plantio",
    caption: ["Ela encontra o solo.", "E é aqui que tudo começa."],
    status: "planned",
  },
  {
    index: 6,
    id: "imersao",
    label: "Imersão",
    caption: ["A câmera atravessa a superfície", "e mergulha no invisível."],
    status: "planned",
  },
  {
    index: 7,
    id: "raiz",
    label: "Raiz",
    caption: ["A primeira raiz nasce.", "O início do que ninguém vê."],
    status: "planned",
  },
  {
    index: 8,
    id: "profundidade",
    label: "Profundidade",
    caption: ["Raízes que descem.", "Fundamentos que sustentam."],
    status: "planned",
  },
  { index: 9, id: "silencio", label: "Silêncio", status: "planned" },
  {
    index: 10,
    id: "virada",
    label: "Virada",
    caption: ["Aquilo que desce…", "começa a se transformar."],
    status: "planned",
  },
  {
    index: 11,
    id: "ascensao",
    label: "Ascensão",
    caption: ["A direção muda.", "Agora, subimos."],
    status: "planned",
  },
  {
    index: 12,
    id: "folhas",
    label: "Folhas",
    caption: ["A vida se revela.", "Folhas, luz e novos começos."],
    status: "planned",
  },
  {
    index: 13,
    id: "arvore",
    label: "Árvore",
    caption: ["Ela cresce.", "Forte. Viva. Propósito."],
    status: "planned",
  },
  {
    index: 14,
    id: "proposito",
    label: "Propósito",
    caption: ["O que começou pequeno,", "agora pode transformar."],
    status: "planned",
  },
  { index: 15, id: "ekklesia", label: "Ekklesia", status: "planned" },
] as const;

export type BeatId = "semente" | "despertar" | "queda" | "home";

export type Beat = {
  id: BeatId | ActTwoBeatId | ActThreeBeatId;
  /** Start of the beat on the Act I track, 0..1. */
  start: number;
  /** End of the beat on the Act I track, 0..1. */
  end: number;
};

/**
 * Beats deliberately overlap. The seed is already turning while the first
 * caption is still fading, and the hero starts assembling before the fall has
 * fully settled — that overlap is what makes the sequence read as one
 * continuous shot instead of four clips laid end to end.
 */
export const ACT_ONE: Record<BeatId, Beat> = {
  semente: { id: "semente", start: 0.0, end: 0.22 },
  despertar: { id: "despertar", start: 0.18, end: 0.48 },
  queda: { id: "queda", start: 0.46, end: 0.8 },
  home: { id: "home", start: 0.76, end: 1.0 },
};

/** Height of the Act I scroll track, in viewport heights. */
export const ACT_ONE_TRACK_VH = 520;

/**
 * Act II is longer than Act I because its beats ask to be *watched* rather than
 * followed: germination and root growth have to unfold slowly enough that the
 * eye can rest on each stage, and a short track would make them read as an
 * animation playing rather than something happening.
 */
export const ACT_TWO_TRACK_VH = 900;

export type ActTwoBeatId = "plantio" | "imersao" | "germinacao" | "raizes" | "silencio";

/**
 * Act II beats, expressed on the stage clock (1 → 2). They overlap for the same
 * reason Act I's do: the camera is already through the surface while the last
 * grains are still settling, and the roots are already reaching while the seed
 * is still opening.
 */
export const ACT_TWO: Record<ActTwoBeatId, Beat> = {
  plantio: { id: "plantio", start: 1.0, end: 1.3 },
  imersao: { id: "imersao", start: 1.22, end: 1.52 },
  germinacao: { id: "germinacao", start: 1.5, end: 1.72 },
  raizes: { id: "raizes", start: 1.66, end: 1.94 },
  silencio: { id: "silencio", start: 1.88, end: 2.0 },
};

/**
 * Act III is the longest track of the three. It carries a camera move that
 * reverses direction mid-way, and the whole illusion depends on that reversal
 * being slow enough to read as the shot settling rather than as a change of
 * mind — which is a thing you buy with scroll length and cannot fake with
 * easing.
 */
export const ACT_THREE_TRACK_VH = 1000;

export type ActThreeBeatId = "descida" | "eixo" | "subida" | "superficie" | "broto";

export const ACT_THREE: Record<ActThreeBeatId, Beat> = {
  descida: { id: "descida", start: 2.0, end: 2.3 },
  eixo: { id: "eixo", start: 2.24, end: 2.58 },
  subida: { id: "subida", start: 2.52, end: 2.84 },
  superficie: { id: "superficie", start: 2.78, end: 2.94 },
  broto: { id: "broto", start: 2.88, end: 3.0 },
};

/** Remaps global track progress into a beat's own 0..1 timeline. */
export function beatProgress(beat: Beat, p: number): number {
  const t = (p - beat.start) / (beat.end - beat.start);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * Named stops on the stage clock, for review.
 *
 * These are not part of the choreography — nothing samples them. They exist so
 * a specific moment in Act II can be named, jumped to and argued about, instead
 * of being described as "somewhere around two thirds of the way down". The
 * `?debug` panel lists them and scrolls to them on click.
 */
export type Checkpoint = {
  id: string;
  label: string;
  note: string;
  /** Where on the stage clock (0 → 2) this moment sits. */
  at: number;
};

export const CHECKPOINTS: readonly Checkpoint[] = [
  { id: "cp1", label: "01 superfície", note: "A semente toca a terra.", at: 1.26 },
  { id: "cp2", label: "02 entrando", note: "A lente atravessa a superfície.", at: 1.31 },
  { id: "cp3", label: "03 subterrâneo", note: "Ambiente completo, semente intacta.", at: 1.46 },
  { id: "cp4", label: "04 germinação", note: "A casca abre, a primeira raiz.", at: 1.66 },
  { id: "cp5", label: "05 sistema", note: "Principal + ramificações.", at: 1.88 },
  { id: "cp6", label: "06 pausa", note: "Sistema completo e a frase.", at: 2.0 },
  { id: "cp7", label: "07 descida", note: "A lente desce pela raiz principal.", at: 2.22 },
  { id: "cp8", label: "08 eixo", note: "Junto ao eixo — a direção se inverte.", at: 2.46 },
  { id: "cp9", label: "09 subida", note: "Subindo pelo caule, a luz volta.", at: 2.74 },
  { id: "cp10", label: "10 superfície", note: "O broto rompe a terra.", at: 2.9 },
  { id: "cp11", label: "11 broto", note: "Pausa: as duas primeiras folhas.", at: 3.0 },
] as const;
