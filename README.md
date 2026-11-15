# IRON MERIDIAN: Relay Yard

An offline Three.js relay-assault FPS. Deploy into an industrial yard, eliminate the defending operators or hold E at the west relay for three seconds and protect the uplink for 35 seconds. Round rewards fund the next deployment.

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/dinnpacak/projectmakefun/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/dinnpacak/projectmakefun/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

Run `python3 -m http.server 8080 --directory game`, then open http://localhost:8080 in desktop Chrome. No CDN, account, build step or network asset is required.

WASD moves, mouse aims, left click fires, R reloads, Space jumps, Ctrl crouches. Buy with 1–3 before deploying. G throws a grenade; E arms the relay. Esc releases the pointer and pauses combat; Resume requests pointer lock again. Defenders remain eliminated until the next round.

The HUD shows health, credits, kills, round record, objective and time. Stationary shots are more accurate than moving shots. Headshots eliminate in one hit. Grenades consume $450 and simulate in the same paused fixed-step clock as combat.

Validation: round-economy, paused-clock, held-plant, objective-completion, lethal-damage and no-mid-round-respawn tests pass. Real browser captures accompany the dossier. Screenshot query modes are illustrative staged views, not proof of a played victory.

Built for [make.fun's tactical FPS bounty](https://make.fun/bounty/threejs-fps-02). MIT licensed.
