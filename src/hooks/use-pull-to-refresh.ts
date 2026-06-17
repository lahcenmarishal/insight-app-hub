import { useEffect, useRef, useState } from "react";

/**
 * Pull-to-refresh natif sur mobile.
 * Activé uniquement si scrollTop === 0. Threshold par défaut : 70px.
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, threshold = 70) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Résistance progressive
        const damped = Math.min(dy * 0.5, threshold * 1.4);
        setPull(damped);
      }
    };
    const onTouchEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pull >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, threshold, onRefresh]);

  return { pull, refreshing, threshold };
}