import {
  ACT_ONE_TRACK_VH,
  ACT_THREE_TRACK_VH,
  ACT_TWO_TRACK_VH,
  STORYBOARD,
} from "@/lib/scroll/acts";
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

      {/*
        One track per chapter, laid end to end. Scrolling them *is* the
        timeline; `stageProgress()` sums them into the single continuous clock
        the camera follows across every boundary.
      */}
      <ScrollDriver heightVh={ACT_ONE_TRACK_VH} chapter="one" />
      <ScrollDriver heightVh={ACT_TWO_TRACK_VH} chapter="two" />
      <ScrollDriver heightVh={ACT_THREE_TRACK_VH} chapter="three" />

      {/*
        Handoff. Act II ends with the camera at rest inside the soil and the
        root system fully out; frame 10 picks up from there.
      */}
      <section className="handoff">
        <p className="handoff__eyebrow">Fase 1 · Atos I, II e III</p>
        <h2 className="handoff__title">Agora, subimos.</h2>
        <p className="handoff__body">
          O protótipo cobre os quadros 01 a 11 do storyboard. Termina com o
          broto recém-saído da terra e as duas primeiras folhas se abrindo — é
          daqui que o crescimento da planta continua, sem corte e sem recarregar
          a cena.
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
