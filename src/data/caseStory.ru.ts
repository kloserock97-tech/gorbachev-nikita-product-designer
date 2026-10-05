/* v41: рассказы кейсов, русская версия. Структура повторяет caseStory.en.ts один в один.
   Тексты — из русских страниц кейсов на Tilda (Main cases/*.html) и презентации «Open to lead roles»,
   переписаны без машинного почерка; цифры и факты не менялись. Разборы в глубину — из caseTracks.ru.ts.
   v56: тексты переписаны простым языком. Термин остаётся рядом с объяснением, факты и цифры те же.
   v71: рассказ переписан так, как рассказывают историю другу: на «ты», короткими фразами, с бытовыми примерами. */
import type { StorySet } from "./caseStory";
import { ru as agents } from "./stories/ai-agents.ru";
import { ru as grif } from "./stories/grif-ai.ru";
import { ru as community } from "./stories/community.ru";
import { ru as moderator } from "./stories/moderator-dashboard.ru";
import { ru as spam } from "./stories/stop-spam.ru";
import { ru as plati } from "./stories/plati-chastyami.ru";
import { ru as guru } from "./stories/restaurant-guru.ru";
import { ru as lead } from "./stories/design-lead.ru";

const stories: StorySet = {
  "ai-agents": agents,
  "grif-ai": grif,
  community,
  "moderator-dashboard": moderator,
  "stop-spam": spam,
  "plati-chastyami": plati,
  "restaurant-guru": guru,
  "design-lead": lead,
};

export default stories;
