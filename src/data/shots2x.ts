/* Собирается tools/shot-tiers.mjs --manifest. Руками не править.
   Здесь перечислены экраны, у которых рядом лежит файл @2x: по нему строится srcset. */
export const shots2x = new Set<string>([
  "cases/figma/moderator-confirm.webp",
  "cases/figma/moderator-profile.webp",
  "cases/figma/moderator-queue.webp",
]);
