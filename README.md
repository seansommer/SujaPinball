# SUJA PINBALL!

Fresh juice. Full tilt.

[Play in SUJA Game Center](https://seansommer.github.io/sujagamecenter/pinball.html)

A complete portrait-friendly pinball arcade with an original juice-factory
table, real moving flippers, reflective chrome balls, sculpted fruit bumpers,
slingshots, stand-up targets, rollover lanes, a raised Cold Press conveyor,
and a central translucent bottle that fills, caps, and changes juice colors.

Collect all three bumper ingredients, then shoot the bottle. Completing Green
Glow, Citrus Spark, Carrot Crush, and Berry Brilliant unlocks 45 seconds of
Rainbow Rush: three balls, triple points, and central bottle jackpots.
Target banks and conveyor shots raise the multiplier to 4×. Skill shots,
opening ball save, relit saves, limited nudges/tilt, extra balls, and visible
combo rewards give each shot a purpose. Arcade has three balls; Practice has
unlimited balls and stays out of crew standings.

Touch either side of the table or the large flipper controls. Hold LAUNCH and
release to plunge. Keyboard: arrows or A/D for flippers, Space for the
plunger, ↑ to nudge, Escape to pause. Before launch, flippers change the lit
skill-shot lane. Every pause, background switch, and new game releases input
and stops audio immediately; stale music downloads cannot restart playback.

Three.js renders the live 3D cabinet with reflected metal, shadows, glass,
animated juice, fruit models, emissive light, bloom, ball trails, and hit
particles. A polished Canvas compatibility renderer shares the identical
physics. Balanced, Extra Sparkle, Battery Saver, reduced-motion, independent
music/effects/voice levels, optional haptics, full screen, and offline caching
are included. The recap puts Play Again and Return Home at the top.

Identity, player cards, Hall of Fame, and moderation use the existing SUJA
community. Runs are saved locally under the player who started them, queued
for retry, and synced idempotently to `sujaV1/pinballRuns` when the matching
player and crew connection are available. The corresponding owner-scoped
database rules live in the `sujagamecenter` repository; they must be deployed
to enable crew records. Local arcade and practice work independently.

Original artwork, generation briefs, and masters: [Art Bible](art/README.md).
Music and sound provenance: [audio credits](assets/audio/CREDITS.txt).
Original pinball geometry, physics, interface, and audio synthesis accompany
CC0 recordings by Juhani Junkala and Kenney. No paid video generation is used.

Build: `npm ci && npm test && npm run build`. The Game Center workflow checks
out a pinned revision of this repository and publishes `dist/` beneath
`/sujagamecenter/games/suja-pinball/`, keeping the installed hub app in scope.
