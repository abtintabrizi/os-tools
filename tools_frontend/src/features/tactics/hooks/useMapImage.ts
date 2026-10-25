import { useEffect, useState } from "react";
import { TACTICS_MAPS } from "../constants";
import { loadImage } from "../images";

export function useMapImage(src: string, onError: () => void) {
  const [displayedMap, setDisplayedMap] = useState("");
  const [failedMap, setFailedMap] = useState("");

  useEffect(() => {
    let active = true;

    loadImage(src).then(
      () => {
        if (active) setDisplayedMap(src);
      },
      () => {
        if (active) {
          setFailedMap(src);
          onError();
        }
      },
    );

    return () => {
      active = false;
    };
  }, [src, onError]);

  useEffect(() => {
    if (!displayedMap) return;
    let active = true;

    // Fetch/decode one map at a time after the first background is ready.
    // Selected maps use the same cache and do not wait for this queue.
    const preload = async () => {
      for (const map of TACTICS_MAPS) {
        if (!active) break;

        try {
          await loadImage(map.image);
        } catch {
          // A selected map reports its own error and can retry a failed preload.
        }
      }
    };

    void preload();

    return () => {
      active = false;
    };
  }, [displayedMap]);

  return {
    displayedMap,
    loading: displayedMap !== src && failedMap !== src,
    failed: failedMap === src && displayedMap !== src,
  };
}
