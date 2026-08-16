"use client";

import { useCallback, useEffect, useState } from "react";

import { ACT_ONE, beatProgress, type Beat } from "@/lib/scroll/acts";
import { useProgressElement } from "@/lib/scroll/useProgressElement";

const BEATS: Beat[] = [ACT_ONE.semente, ACT_ONE.despertar, ACT_ONE.queda, ACT_ONE.home];
const LABELS = ["01 semente", "02 despertar", "03 queda", "04 home"];

/**
 * Tuning aid, shown only with `?debug` in the URL. Retiming a beat means
 * editing numbers in `choreography.ts`, and doing that blind is miserable —
 * this prints the exact progress value each keyframe track is being sampled at.
 */
export function BeatReadout() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  const apply = useCallback((element: HTMLDivElement, progress: number) => {
    const rows = element.querySelectorAll<HTMLElement>("[data-beat]");
    element.style.setProperty("--p", progress.toFixed(4));

    const global = element.querySelector<HTMLElement>("[data-global]");
    if (global) global.textContent = progress.toFixed(3);

    rows.forEach((row, index) => {
      const beat = BEATS[index];
      const local = beatProgress(beat, progress);
      const bar = row.querySelector<HTMLElement>("[data-bar]");
      const value = row.querySelector<HTMLElement>("[data-value]");
      if (bar) bar.style.transform = `scaleX(${local})`;
      if (value) value.textContent = local.toFixed(2);
      row.style.opacity = local > 0 && local < 1 ? "1" : "0.4";
    });
  }, []);

  const ref = useProgressElement<HTMLDivElement>(apply);

  if (!enabled) return null;

  return (
    <div ref={ref} className="readout">
      <div className="readout__global">
        track <span data-global>0.000</span>
      </div>
      {LABELS.map((label, index) => (
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
