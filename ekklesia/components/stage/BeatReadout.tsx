"use client";

import { useCallback, useEffect, useState } from "react";

import { ACT_ONE, ACT_TWO, beatProgress, type Beat } from "@/lib/scroll/acts";
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

  return (
    <div ref={ref} className="readout" style={{ display: enabled ? undefined : "none" }}>
      <div className="readout__global">
        stage <span data-global>0.000</span> / 2 · abaixo{" "}
        <span data-depth>0.00</span>
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
