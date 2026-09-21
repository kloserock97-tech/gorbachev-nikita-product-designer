# Case preview art direction — 2026-09-19

## Plan and concept

1. Review card framing and Awwwards reference treatments.
2. Generate six individual editorial still lifes, each tied to the product's purpose.
3. Export original brand marks separately; do not ask the model to reproduce trademarks.
4. Optimize images to 1120px WebP and integrate without changing case hero animations.
5. Check mobile/desktop, reduced motion, loading and build; deploy.

These are conceptual cover illustrations, not actual product screens. Shared visual language: glass, ceramic, brushed metal, soft directional light, strong silhouette, quiet space for a logo. Preserve actual interface screenshots inside the cases. Never use GRIF Draft screens.

## References

- [Palet, 3D header / Awwwards](https://www.awwwards.com/inspiration/main-3d-header-palet-ceramic-tiles): physical materials, sculptural product presentation.
- [Y2B, 3D logo / Awwwards](https://www.awwwards.com/inspiration/3d-logo-y2b-agency): bold object-led brand treatment.

Reference principles only; no reference artwork copied into this project.

## Production

Generated with the built-in image generation tool, one call per cover. Original PNGs retained locally in assets-src/case-covers (not deployed). WebP delivery assets in public/cases/covers. Logos rendered as independent HTML image layers, not modified by the generator.

## Brand provenance

- GRIF: exact SVG exported from user-provided [UI Kit, node 10134:1895](https://www.figma.com/design/tb2sUfZau2yD8EZlsSAVBa/Grif-UI-KIT?node-id=10134-1895).
- Community / Moderator: exact logo SVG from the supplied moderator Figma screen, node 2494:96432; child logo 2096:14560.
- Stop Spam: isolated PNG export of app icon instance 2625:15956 from supplied Figma file 6Xs2X1NbfhPaTe8T0ZwDG7.
- Sberbank: [Wikimedia original SVG attributed to Sberbank's official website](https://commons.wikimedia.org/wiki/File:Logo_Sberbank.svg). Official website was unavailable during retrieval.
- Electronic House: existing project logo asset docs/collage-v36/electronic-house/ui-logo.webp, reused unchanged. Not independently verified against the currently unavailable official site.

Brand marks remain the property of their respective owners and are not licensed under this repository's MIT code license. They identify the case studies and do not imply endorsement.

## Final generation prompts

### grif-ai

Use case: stylized-concept. Create a premium landscape 16:9 editorial 3D illustration for the portfolio card of GRIF, a proactive AI assistant that turns context into actions. A sculptural flowing fan of five aerodynamic polished cobalt-blue glass ribbons, feather-like but abstract, sweeping upward above three thin translucent action tiles. A purposeful light, precise, intelligent feeling. Pale ice-blue seamless studio background, soft directional shadow, physically convincing glass and brushed aluminium detailing, exceptionally clean high-end product photography rendering. One bold dominant silhouette, not a busy collection of widgets. Composition stays readable at 350px wide, subject within central 70%, leave upper left quiet for an official brand logo added later in HTML. No text, no lettering, no logo, no fake interface, no robot, no watermark. Wide image, sophisticated editorial art direction, tactile material contrasts, restrained reflections.

### ai-agents

Use case: stylized-concept. Wide 16:9 premium editorial 3D poster for AI agent risk management in enterprise banking. A precisely arranged network of five small frosted jade-glass cubes joined by fine brushed aluminium rods, orbiting one larger transparent emerald cube with a bright solid pearl core, visually conveying governed intelligent agents. Elegant physical desktop sculpture, not a diagram. Seamless very pale mint studio background, directional soft daylight, delicate caustics and grounded long shadow. Sophisticated photorealistic product render with tactile surfaces, restrained reflections. Central sculpture fills 65% width with wide breathing room; upper left empty for an exact official logo added later. Readable bold silhouette at small thumbnail size. No text, no lettering, no logo, no robot, no fake UI, no watermark.

### community

Use case: stylized-concept. Landscape 16:9 premium editorial 3D poster for a city stories community platform. A tiny architectural city block made of warm ivory ceramic, with three distinct simple midrise buildings, framed by two oversized overlapping sculptural speech bubbles made from translucent apricot glass and coral enamel. Sophisticated architectural maquette meets collectible industrial design. Warm pale peach seamless studio, soft sun from upper left, beautifully grounded long shadows and glass refraction. Cohesive tactile product render, calm optimistic human urban feeling. Strong simple central composition fills 65% width, upper left clear for brand mark overlay. Readable at 350px thumbnail. No people, no text, no typography, no logo, no fake screen, no watermark, no clutter, no toy-like faces.

### moderator-dashboard

Use case: stylized-concept. Premium landscape 16:9 editorial 3D product illustration for a content moderation workspace. One large beautiful clear smoked-lilac optical glass lens in a minimal brushed aluminum ring, leaning diagonally above an orderly stack of three thick pale lavender rounded document tiles. Through the lens a single small coral enamel checkmark on the top tile comes into crisp focus. Physical sculpture about careful review and clarity. Muted pale lavender seamless studio, directional soft daylight, exquisite controlled reflections, grounded shadow, photographic industrial design finish. Simple strong central silhouette fills 65% width, upper left negative space for official logo overlay. No text, no lettering, no fake UI, no logos, no watermark. Not clip art, not cartoon.

### stop-spam

Use case: stylized-concept. Landscape 16:9 premium editorial 3D product illustration for a mobile anti-spam app. One beautiful thick aquamarine optical-glass shield standing in front of a minimalist pearl-white telephone handset suspended diagonally, with three tiny muted graphite message tiles deflected to the far side of the shield. Strong feeling of calm protection, quiet instead of notification overload. Very pale cool cyan seamless studio background, directional daylight, elegant refraction, grounded shadows, satin aluminium details. Exquisite tactile industrial product photography quality. Bold simple central sculpture, 65% width, leave upper left quiet for official app icon overlay. No text, no lettering, no logo, no fake UI, no robots, no red warning symbols, no watermark.

### electronic-house

Use case: stylized-concept. Landscape 16:9 premium editorial 3D product illustration for Electronic House, an apartment building residents services app. A refined miniature white ceramic apartment building with warm softly lit square windows, encircled protectively by one large translucent amber glass key whose circular bow frames the building and whose short key blade rests diagonally on the studio surface. Sculptural architectural collectible, conveys access, home, belonging, digital services. Warm pale limestone seamless studio background, directional morning light, beautiful amber caustics and long grounded shadow, restrained brushed aluminium details. Exquisite tactile high-end product photography render. Simple central sculpture fills 65% width, clear breathing space in upper left for official brand overlay. No text, no typography, no logo, no screens, no people, no watermark.


## v64 (2026-09-21): objects without backgrounds

The rectangular covers are gone. Nikita liked the object-led direction but not a picture with a studio background inside a card, and asked to keep only the object. Each object is now cut out of its original PNG and placed on a light stage in the colour of its case (`src/data/cases.ts`, `look`), following Apple's "Get to know" card: label and title on top, one large object below, cropped by the card's edge.

- Matte: a neural background remover treats glass as transparent and hollows the object out. The final alpha is the maximum of the model's mask and a colour-difference matte against a plane fitted to the studio background, limited to the region the mask encloses (flood fill from the frame edges). Semi-transparent pixels are decontaminated from the background colour.
- Delivery: `public/cases/objects/<id>.avif` (32–65 KB) with `.webp` as a fallback, 900 px wide, trimmed to the object.
- Light stages only. On a dark background the glass keeps a pale fringe from the original studio light; on a stage close to the original background it disappears.
- A card with both the object and a UI screen was prototyped and rejected as crowded. The card has one hero; the real interface lives on the case page hero.
- Working files (masks, mattes, scripts) stay in `assets-src/`, outside the repository.
