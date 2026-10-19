# SUJA Pinball project instructions

## Media costs and provider preferences

The user requires all image creation and editing to use ChatGPT's native image
generator. Do not use Runway for images. Runway credits are scarce: obtain the
user's explicit approval before any future Runway generation. For new audio,
discuss and set up the user's direct ElevenLabs access before paid generation.
Procedural in-game sound and work on layout, graphics, and physics can proceed.

Shared Firebase rules belong only in `seansommer/sujagamecenter` on the latest
`main` branch. Before changing score persistence or permissions, fetch and read:

- https://github.com/seansommer/sujagamecenter/blob/main/FIREBASE_RULES.md
- https://github.com/seansommer/sujagamecenter/blob/main/firebase-database.rules.json
- https://github.com/seansommer/sujagamecenter/blob/main/firebase-rules-status.json

Do not create or deploy a separate Pinball-only rules file. Preserve every
other game's rules. Source commits and Firebase deployment evidence are tracked
separately in the hub. Publishing game files does not publish database rules.

Keep original artwork in `art/` and optimized game assets in `assets/`.
Run `npm test` and `npm run build` before publishing. The Game Center publishes
the game beneath its own origin and pins this repository to a release commit.
