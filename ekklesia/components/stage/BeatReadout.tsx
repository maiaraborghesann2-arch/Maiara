"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ACT_FOUR,
  ACT_ONE,
  ACT_THREE,
  ACT_TWO,
  CHECKPOINTS,
  beatProgress,
  type Beat,
} from "@/lib/scroll/acts";
import { useProgressElement } from "@/lib/scroll/useProgressElement";
import { sceneState } from "@/lib/scene/sharedState";
import { LANDING_Y } from "@/lib/scroll/choreography";

const BEATS: Beat[] = [
  ACT_ONE.semente,
  ACT_ONE.despertar,
  ACT_ONE.queda,
  ACT_ONE.home,
  ACT_TWO.plantio,
  ACT_TWO.imersao,
  ACT_TWO.germinacao,
  ACT_TWO.raizes,
  ACT_TWO.silencio,
  ACT_THREE.descida,
  ACT_THREE.eixo,
  ACT_THREE.subida,
  ACT_THREE.superficie,
  ACT_THREE.broto,
  ACT_FOUR.alongamento,
  ACT_FOUR.primeira,
  ACT_FOUR.segunda,
  ACT_FOUR.ramos,
  ACT_FOUR.jovem,
];

const LABELS = [
  "01 semente",
  "02 despertar",
  "03 queda",
  "04 home",
  "05 plantio",
  "06 imersão",
  "07 germinação",
  "08 raízes",
  "09 silêncio",
  "10 descida",
  "11 eixo",
  "12 subida",
  "13 superfície",
  "14 broto",
  "15 alongar",
  "16 folha",
  "17 segunda",
  "18 ramos",
  "19 jovem",
];

/**
 * Tuning aid, shown only with `?debug` in the URL. Retiming a beat means
 * editing numbers in `choreography.ts`, and doing that blind is miserable —
 * this prints the stage clock and the local progress each keyframe track is
 * being sampled at, across both chapters.
 */
export function BeatReadout() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  const apply = useCallback((element: HTMLDivElement, progress: number) => {
    const global = element.querySelector<HTMLElement>("[data-global]");
    if (global) global.textContent = progress.toFixed(3);

    const depth = element.querySelector<HTMLElement>("[data-depth]");
    if (depth) depth.textContent = (LANDING_Y - sceneState.cameraY).toFixed(2);

    // Highlight whichever review checkpoint the clock is nearest.
    let nearest = 0;
    for (let i = 1; i < CHECKPOINTS.length; i++) {
      if (Math.abs(CHECKPOINTS[i].at - progress) < Math.abs(CHECKPOINTS[nearest].at - progress)) {
        nearest = i;
      }
    }
    element.querySelectorAll<HTMLElement>("[data-checkpoint]").forEach((row, index) => {
      row.dataset.active = index === nearest && Math.abs(CHECKPOINTS[index].at - progress) < 0.05
        ? "true"
        : "false";
    });

    const rows = element.querySelectorAll<HTMLElement>("[data-beat]");
    rows.forEach((row, index) => {
      const local = beatProgress(BEATS[index], progress);
      const bar = row.querySelector<HTMLElement>("[data-bar]");
      const value = row.querySelector<HTMLElement>("[data-value]");
      if (bar) bar.style.transform = `scaleX(${local})`;
      if (value) value.textContent = local.toFixed(2);
      row.style.opacity = local > 0 && local < 1 ? "1" : "0.4";
    });
  }, []);

  /*
   * Always rendered, hidden with CSS when off. Returning `null` first and the
   * panel later would leave `useProgressElement` having run its effect against
   * a ref that was still empty — it would never subscribe, and the panel would
   * sit at zero for the whole session.
   */
  const ref = useProgressElement<HTMLDivElement>(apply);

  /**
   * Jumping to a checkpoint means computing where on the *page* a given value
   * of the stage clock lives — the two chapter tracks are adjacent, so it is
   * the first track's scrollable length, then a fraction of the second's.
   */
  const jump = useCallback((at: number) => {
    const tracks = document.querySelectorAll<HTMLElement>("[data-scroll-track]");
    if (tracks.length < 4) return;
    const vh = window.innerHeight;
    const oneEnd = tracks[0].getBoundingClientRect().height - vh;
    const twoEnd = oneEnd + tracks[1].getBoundingClientRect().height;
    const threeEnd = twoEnd + tracks[2].getBoundingClientRect().height;
    const fourEnd = threeEnd + tracks[3].getBoundingClientRect().height;
    const y =
      at <= 1
        ? at * oneEnd
        : at <= 2
          ? oneEnd + (at - 1) * (twoEnd - vh - oneEnd)
          : at <= 3
            ? twoEnd - vh + (at - 2) * (threeEnd - twoEnd)
            : threeEnd - vh + (at - 3) * (fourEnd - threeEnd);
    window.scrollTo({ top: Math.round(y), behavior: "smooth" });
  }, []);

  return (
    <div ref={ref} className="readout" style={{ display: enabled ? undefined : "none" }}>
      <div className="readout__global">
        stage <span data-global>0.000</span> / 4 · abaixo{" "}
        <span data-depth>0.00</span>
      </div>
      <div className="readout__checkpoints">
        {CHECKPOINTS.map((checkpoint) => (
          <button
            key={checkpoint.id}
            type="button"
            className="readout__checkpoint"
            data-checkpoint
            data-active="false"
            onClick={() => jump(checkpoint.at)}
            title={checkpoint.note}
          >
            <span>{checkpoint.label}</span>
            <span className="readout__at">{checkpoint.at.toFixed(2)}</span>
          </button>
        ))}
      </div>

      {LABELS.map((label) => (
        <div key={label} className="readout__row" data-beat>
          <span className="readout__label">{label}</span>
          <span className="readout__track">
            <span className="readout__bar" data-bar />
          </span>
          <span className="readout__value" data-value>
            0.00
          </span>
        </div>
      ))}
    </div>
  );
}
