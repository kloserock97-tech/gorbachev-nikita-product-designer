/* v115: живые прототипы кейсов — каждый своим чанком, грузится, когда блок подъехал к экрану */
import type { LiveProto } from "./types";

export const LIVE: Record<string, () => Promise<{ default: LiveProto }>> = {
  "plati-chastyami": () => import("./plati"),
  "grif-ai": () => import("./grif"),
  "ai-agents": () => import("./agents"),
  community: () => import("./community"),
};
