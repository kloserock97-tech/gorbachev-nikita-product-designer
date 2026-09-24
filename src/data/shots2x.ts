/* Собирается tools/shot-tiers.mjs --manifest. Руками не править.
   Экраны, у которых рядом лежит файл @2x, и настоящая ширина обычного файла: по ней строится srcset.
   Она не всегда совпадает с шириной, записанной у картинки в данных кейса, — там ширина задаёт пропорцию. */
export const shots2x = new Map<string, number>([
  ["cases/figma/agents-review.webp", 1520],
  ["cases/figma/moderator-confirm.webp", 1440],
  ["cases/figma/moderator-profile.webp", 1440],
  ["cases/figma/moderator-queue.webp", 1440],
]);
