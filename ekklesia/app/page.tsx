import { ACT_ONE_TRACK_VH, STORYBOARD } from "@/lib/scroll/acts";
import { ExperienceCanvas } from "@/components/experience/ExperienceCanvas";
import { Overlay } from "@/components/stage/Overlay";
import { ScrollDriver } from "@/components/scroll/ScrollDriver";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";

const remaining = STORYBOARD.filter((frame) => frame.status === "planned");

export default function Page() {
  return (
    <SmoothScroll>
      {/* Mounted once, never torn down — the camera move is continuous. */}
      <ExperienceCanvas />
      <Overlay />

      {/* Scrolling this invisible column *is* the timeline. */}
      <ScrollDriver heightVh={ACT_ONE_TRACK_VH} />

      {/*
        Handoff. Act I ends with the camera already descending toward the soil;
        this section is the placeholder for what frame 05 onwards will occupy.
      */}
      <section className="handoff">
        <p className="handoff__eyebrow">Fase 1 · Ato I concluído</p>
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
