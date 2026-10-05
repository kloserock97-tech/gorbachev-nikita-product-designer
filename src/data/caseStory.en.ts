/* v41: case stories, English. Same structure as caseStory.ru.ts, key for key.
   Texts come from the English case pages on Tilda (Main cases/EN/*.en.html) and the "Open to lead roles"
   deck, rewritten without the machine accent; facts and numbers untouched. Deep dives come from caseTracks.en.ts.
   v56: rewritten in plain language. A term stays next to its explanation, facts and numbers are the same. */
import type { StorySet } from "./caseStory";
import { en as agents } from "./stories/ai-agents.en";
import { en as grif } from "./stories/grif-ai.en";
import { en as community } from "./stories/community.en";
import { en as moderator } from "./stories/moderator-dashboard.en";
import { en as spam } from "./stories/stop-spam.en";
import { en as plati } from "./stories/plati-chastyami.en";
import { en as guru } from "./stories/restaurant-guru.en";
import { en as lead } from "./stories/design-lead.en";

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
