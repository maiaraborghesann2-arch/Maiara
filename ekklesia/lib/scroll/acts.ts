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
  id: BeatId;
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
  semente: { id: "semente", start: 0.0, end: 0.24 },
  despertar: { id: "despertar", start: 0.2, end: 0.5 },
  queda: { id: "queda", start: 0.48, end: 0.74 },
  home: { id: "home", start: 0.7, end: 1.0 },
};

/** Height of the Act I scroll track, in viewport heights. */
export const ACT_ONE_TRACK_VH = 520;

/** Remaps global track progress into a beat's own 0..1 timeline. */
export function beatProgress(beat: Beat, p: number): number {
  const t = (p - beat.start) / (beat.end - beat.start);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
