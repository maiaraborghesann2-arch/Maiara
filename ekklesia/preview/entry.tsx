/**
 * Standalone entry for the shareable preview build.
 *
 * Mirrors `app/page.tsx`, minus Next: the fonts come from a stylesheet link in
 * the host page instead of `next/font`, and the tree mounts into a plain div.
 * Everything below `SmoothScroll` is the same code the dev server runs.
 */
import { createRoot } from "react-dom/client";

import { ACT_ONE_TRACK_VH, STORYBOARD } from "@/lib/scroll/acts";
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
      <ScrollDriver heightVh={ACT_ONE_TRACK_VH} />

      <section className="handoff">
        <p className="handoff__eyebrow">Fase 1 · Ato I</p>
        <h2 className="handoff__title">Ela encontra o solo.</h2>
        <p className="handoff__body">
          O protótipo cobre os quadros 01 a 04 do storyboard. A câmera termina o
          ato já descendo em direção ao solo — é daqui que os próximos quadros
          continuam, sem corte e sem recarregar a cena.
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
