# AI Agent Instructions

This repo is a static E-Sport League tracker for Scott's friends' MLB The Show matches.

## Language

- Use Traditional Chinese when talking to Scott.
- Keep explanations practical: say what changed, why it matters, and what command was used.

## Project Shape

- `index.html`: single-page app shell with hash routing.
- `css/styles.css`: mobile-first broadcast-style dark UI.
- `js/app.js`: renders pages and calculates standings from JSON data.
- `data/games.json`: the match database and the main file updated after each game.
- `scripts/validate-games.js`: validation for imported match data.
- `sw.js`: service worker cache.

## Screenshot Import Workflow

When Scott provides MLB The Show box score screenshots, treat the task as a data import.

Expected screenshot set:

1. Overall score / line score
2. Player A batting
3. Player A pitching
4. Player B batting
5. Player B pitching

Before editing, identify:

- Game date
- Players
- Teams
- Home / away side
- Winner
- Final score
- Player of the game, if visible

## Data Editing Rules

- For a new completed game, update only `data/games.json` unless Scott asks for UI or logic changes.
- Add the new game using an id like `YYYY-MM-DD-01`, incrementing the suffix when multiple games share the same date.
- Keep `games` as valid JSON.
- Each game must have exactly 2 `sides`.
- Each `side` needs `player`, `team`, `teamFull`, `homeAway`, `runs`, `hits`, `errors`, `innings`, `batting`, and `pitching`.
- Track stats by player owner. Scott's Yankees and Alvin's Yankees are different records in the app.
- Use baseball IP format for pitching innings: `9.0`, `7.1`, `0.2`, etc.
- Do not invent stats that are not visible. If a screenshot is unreadable, ask Scott for a clearer image or confirmation.

## Required Validation

After every edit to `data/games.json`, run:

```bash
npm run validate
```

Only commit or push after validation passes.

The validator checks common AI import mistakes:

- Invalid JSON
- Duplicate game ids
- Winner not matching the score
- Innings total not matching final runs
- Batting hits / runs not matching team totals
- Pitching runs allowed not matching opponent runs
- Invalid pitching IP format
- Missing players, home / away, or required fields

## Service Worker Rule

- If only `data/games.json` changes, do not update `sw.js`.
- If `index.html`, `css/styles.css`, `js/app.js`, `manifest.json`, or assets change, increment `CACHE_VERSION` in `sw.js`.

## Git / Publish Rule

Scott has authorized direct repo updates for this project after he says changes are okay.

For data imports or small maintenance changes:

1. Make the scoped edit.
2. Run `npm run validate`.
3. Commit with a short message.
4. Push to `main`.

Do not open a PR unless Scott specifically asks for one.
