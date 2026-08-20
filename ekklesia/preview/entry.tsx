/**
 * Standalone entry for the shareable preview build.
 *
 * Mirrors `app/page.tsx`, minus Next: the fonts come from a stylesheet link in
 * the host page instead of `next/font`, and the tree mounts into a plain div.
 * Everything below `SmoothScroll` is the same code the dev server runs.
 */
import { createRoot } from "react-dom/client";

import { ACT_ONE_TRACK_VH, ACT_TWO_TRACK_VH, STORYBOARD } from "@/lib/scroll/acts";
import { ExperienceCanvas } from "@/components/experience/ExperienceCanvas";
import { Overlay } from "@/components/stage/Overlay";
import { ScrollDriver } from "@/components/scroll/ScrollDriver";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";

const remaining = STORYBOARD.filter((frame) => frame.status === "planned");

function App() {
  return (
    <SmoothScroll>
      <ExperienceCanvas />
      <Overlay />
      <ScrollDriver heightVh={ACT_ONE_TRACK_VH} chapter="one" />
      <ScrollDriver heightVh={ACT_TWO_TRACK_VH} chapter="two" />

      <section className="handoff">
        <p className="handoff__eyebrow">Fase 1 · Atos I e II</p>
        <h2 className="handoff__title">Aquilo que desce…</h2>
        <p className="handoff__body">
          O protótipo cobre os quadros 01 a 09 do storyboard. A câmera termina
          parada dentro do solo, com as raízes desenvolvidas — é daqui que a
          virada do quadro 10 continua, sem corte e sem recarregar a cena.
        </p>

        <ol className="handoff__list">
          {remaining.map((frame) => (
            <li key={frame.id}>
              <span className="handoff__index">
                {String(frame.index).padStart(2, "0")}
              </span>
              <span className="handoff__label">{frame.label}</span>
            </li>
          ))}
        </ol>
      </section>
    </SmoothScroll>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
