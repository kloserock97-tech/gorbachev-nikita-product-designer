/* v115: живые прототипы кейсов — каждый своим чанком, грузится, когда блок подъехал к экрану */
import type { LiveProto } from "./types";

export const LIVE: Record<string, () => Promise<{ default: LiveProto }>> = {
  "plati-chastyami": () => import("./plati"),
  "ai-agents": () => import("./agents"),
  community: () => import("./community"),
  /* 24.10: GRIF на финальных экранах из Figma — три сценария */
  "grif-chat": () => import("./grif2/flows").then((m) => ({ default: m.grifChat })),
  "grif-feed": () => import("./grif2/flows").then((m) => ({ default: m.grifFeed })),
  "grif-memory": () => import("./grif2/flows").then((m) => ({ default: m.grifMemory })),
};
