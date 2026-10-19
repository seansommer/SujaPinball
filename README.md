# SUJA PINBALL!

Fresh juice. Full tilt.

Golden Factory Orders add an escalating route through the table: harvest fruit,
spin the press, make a conveyor loop, and tour distinct shots. Fill three orders
to light a Delivery Jackpot at the bottle. Claim it for 20,000+ points, a second
ball, and 20 seconds of Factory Frenzy with 1,000-point base bumper hits. Orders
carry progress across balls, relight kickback on completion, and pause with the
game. Gold beacons, moving shot arrows, an integrated countdown display, and
procedural countdown/fanfare/pressure sounds make the progression readable.
New mode statistics appear in the run recap; the shared saved-score format and
Firebase rules are unchanged.

The cabinet update fills the phone play area, places rolling score digits and
animated shot displays inside the machine, and offers a perspective cabinet
camera plus an 85° near-overhead option. Fruit toys, moving conveyor slats,
gears, reactive light chases, electric slingshots, expanding impact rings,
and score bursts connect hits to visible reactions.

Timed flipper shots reach the upper table. A juice spinner, linked-shot
combos, a 12-second Power Press double-score mode, and a one-use outlane
kickback add shot choices and longer rallies. Original Pinball music and
cabinet callouts replace the shared Sujalaga recordings; rolling and layered
mechanical sounds respond to actual play.

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
CC0 mechanical recordings by Kenney. The original Pinball soundtrack and cabinet callouts have their full masters and provenance in `art/audio/`.

Build: `npm ci && npm test && npm run build`. The Game Center workflow checks
out a pinned revision of this repository and publishes `dist/` beneath
`/sujagamecenter/games/suja-pinball/`, keeping the installed hub app in scope.
