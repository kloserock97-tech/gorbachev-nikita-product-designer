# Meadow → footer portal

The doorway is a Three.js object inside the portfolio's Meadow scene. The existing
renderer draws the destination hill into `sceneRT`, then the meadow into `altRT`.
The doorway samples the destination in projected screen coordinates. There is no
second WebGL context, DOM screenshot, iframe, or additional dependency.

`MeadowPortal.ts` owns the rounded destination surface, soft irregular glow,
and scroll-driven camera route. `PortalGarden.ts` replaces the rigid frame with
braided roots, textured moss clumps, hanging ivy, wind-animated leaves and 616
GPU-animated luminous spores (520 around the opening, 96 in the approach).
Foreground spores fade near the camera and late in the passage. Vegetation uses
instancing and merged root geometry; no image assets or extra lights are required.
`PortalGround.ts` fits a warm light-spill mesh to the terrain when the doorway anchors.
The terrain route is held during the approach;
wind continues. The camera lowers and approaches the stationary doorway, retraces
the same route on reverse scroll, and stays above the terrain. A gentle lateral arc
adds parallax without tilting the horizon. The destination initially frames the
chair and tree, then settles into the footer viewpoint. Subtle edge refraction
disappears before the passage completes so the destination stays continuous.

The footer ends at the threshold. The opening covers the viewport well before the
dolly finishes: at about 41 % of the passage on a phone (390×844), 51 % at 1024×768,
53 % at 1440×900 and 58 % at 1348×684. `layoutTimeline()` in `story.ts` estimates this
knee from the viewport aspect. The approach up to the knee keeps the original speed
(the full passage would span 3.9 desktop viewport heights, 3.5 on mobile). Everything
past it (framing settle, meadow-to-hill grade, focus) is packed into 0.35 viewport
height, and the page ends there. `portalAt(f)` maps footer progress to portal
progress for both the scene and the footer DOM. Chapter-local damping uses 3.6/s
instead of 6.5/s during the approach and returns to normal past the threshold
(`FOOTER.settle`). The exponential dolly eases both departure and arrival. Other
chapters and long navigation jumps retain their normal response; reduced motion and
`?walk=0` retain the shorter footer.

The real footer DOM is clipped to the projected rounded contour. Its copy
fades in late in the approach, leaving the scenery visible first. Preview controls are inert and hidden from assistive
technology. Once the opening covers all four viewport corners, contacts become
interactive. This is based on geometry, so portrait viewports can enter earlier.

Reduced motion and `?walk=0` use the existing transition without the camera flight.
Portal materials are included in Meadow's shader warm-up and disposed with it.

Run the local site on port 5191, then:

```sh
npm run check
node tools/portal-test.mjs
node tools/portal-test.mjs --mobile
node tools/portal-test.mjs --reduced
node tools/portal-test.mjs --no-walk
node tools/portal-test.mjs --motion
node tools/portal-test.mjs --mobile --motion
```

The browser check uses the real page scroll and checks forward/reverse camera
positions, the doorway anchor, footer interaction state, JavaScript errors and
WebGL errors. Screenshots and measurements go to `shots/portal/` (gitignored).
Mobile coverage is Chrome viewport emulation, not a physical-device benchmark.
The optional motion check scrolls continuously for eight seconds, verifies
monotonic story progress and finite camera positions, and records intermediate
screenshots. Its animation-frame trace is a correctness check, not an FPS benchmark.
