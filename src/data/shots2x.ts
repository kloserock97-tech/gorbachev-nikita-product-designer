/* Собирается tools/shot-tiers.mjs --manifest. Руками не править.
   Экраны, у которых рядом лежит файл @2x, и настоящая ширина обычного файла: по ней строится srcset.
   Она не всегда совпадает с шириной, записанной у картинки в данных кейса, — там ширина задаёт пропорцию. */
export const shots2x = new Map<string, number>([
  ["cases/figma/agents-review.webp", 1520],
  ["cases/figma/moderator-confirm.webp", 1440],
  ["cases/figma/moderator-profile.webp", 1440],
  ["cases/figma/moderator-queue.webp", 1440],
  ["cases/figma/spam-sms-setup.webp", 804],
  ["cases/figma/spam-welcome.webp", 804],
  ["cases/grif-ai/01.webp", 1440],
  ["cases/grif-ai/03.webp", 1436],
  ["cases/grif-ai/04.webp", 1440],
  ["cases/grif-ai/05.webp", 1440],
  ["cases/grif-ai/06.webp", 1438],
  ["cases/grif-ai/07.webp", 1440],
  ["cases/grif-ai/t-chat-attach.webp", 1440],
  ["cases/grif-ai/t-chat-reasoning-steps.webp", 1380],
]);
