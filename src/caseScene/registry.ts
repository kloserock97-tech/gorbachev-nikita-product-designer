/* v78: какие кейсы показывают живую сцену и откуда её грузить. Каждая сцена — свой маленький модуль,
   загружается, только когда глава «Кейсы» вот-вот появится. */
import type { CaseScene, SceneHost } from "./kit";

export const SCENES = {
  community: () => import("./community").then((m) => m.createCommunityScene),
  moderator: () => import("./moderator").then((m) => m.createModeratorScene),
  "ai-agents": () => import("./aiAgents").then((m) => m.createAiAgentsScene),
  "grif-ai": () => import("./grif").then((m) => m.createGrifScene),
  "plati-chastyami": () => import("./plati").then((m) => m.createPlatiScene),
  "restaurant-guru": () => import("./guru").then((m) => m.createGuruScene),
  "design-lead": () => import("./lead").then((m) => m.createLeadScene),
} satisfies Record<string, () => Promise<(h: SceneHost) => CaseScene>>;
export type SceneId = keyof typeof SCENES;
