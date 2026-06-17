import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

export function PullToRefresh({ onRefresh }: { onRefresh: () => void | Promise<void> }) {
  const { pull, refreshing, threshold } = usePullToRefresh(onRefresh);
  if (pull === 0 && !refreshing) return null;
  const progress = Math.min(1, pull / threshold);
  return (
    <div
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{
        top: "calc(env(safe-area-inset-top) + 56px)",
        transform: `translateY(${refreshing ? 12 : pull * 0.6}px)`,
        opacity: refreshing ? 1 : progress,
        transition: refreshing ? "transform 0.2s" : "none",
      }}
    >
      <div className="grid place-items-center h-10 w-10 rounded-full bg-surface shadow-[var(--shadow-md)] border">
        <Loader2
          className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)`, transition: "transform 80ms" }}
        />
      </div>
    </div>
  );
}