import "./MapLoading.css";

import { CORE_CROP } from "../constants";

export default function MapLoading() {
  return (
    <div
      className="tactics-map-loading pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-tools-void/40 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-28 w-28 items-center justify-center" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-tools-gold [animation-duration:2.4s] motion-reduce:animate-none" />
        <div className="absolute inset-3 animate-spin rounded-full border-2 border-transparent border-l-tools-blue border-r-tools-red [animation-direction:reverse] [animation-duration:3.6s] motion-reduce:animate-none" />
        <div className="absolute inset-6 rounded-full bg-tools-gold/15 blur-xl" />
        <svg
          className="tactics-map-loading-core relative h-10 w-10 drop-shadow-[0_0_12px_#f59e0b66]"
          viewBox={`${CORE_CROP.x} ${CORE_CROP.y} ${CORE_CROP.size} ${CORE_CROP.size}`}
        >
          <image href="/other/Core.png" width={1920} height={1080} />
        </svg>
      </div>
      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/70" aria-hidden="true">
        Preparing arena
      </span>
      <span className="sr-only">Loading map</span>
    </div>
  );
}
