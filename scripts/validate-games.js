#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'games.json');
const VALID_HOME_AWAY = new Set(['home', 'away']);
const VALID_DECISIONS = new Set(['', 'W', 'L', 'SV', 'HLD', 'BS']);
const REQUIRED_BATTING = ['name', 'ab', 'r', 'h', 'rbi', 'bb', 'so'];
const REQUIRED_PITCHING = ['name', 'ip', 'h', 'r', 'er', 'bb', 'so'];

const errors = [];
const warnings = [];

function loc(gameId, detail) {
  return gameId ? `${gameId}: ${detail}` : detail;
}

function error(gameId, detail) {
  errors.push(loc(gameId, detail));
}

function warn(gameId, detail) {
  warnings.push(loc(gameId, detail));
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function numberField(gameId, label, value, opts = {}) {
  const ok = opts.allowStringNumber
    ? (isNonNegativeInteger(value) || (typeof value === 'string' && /^\d+$/.test(value)))
    : isNonNegativeInteger(value);
  if (!ok) error(gameId, `${label} must be a non-negative integer`);
}

function parseInningRun(value) {
  if (value === 'X') return 0;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function ipToOuts(ip) {
  const text = String(ip);
  const match = text.match(/^(\d+)\.([012])$/);
  if (!match) return null;
  return Number(match[1]) * 3 + Number(match[2]);
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + (Number(row[field]) || 0), 0);
}

function readData() {
  let raw;
  try {
    raw = fs.readFileSync(DATA_PATH, 'utf8');
  } catch (err) {
    errors.push(`Unable to read ${DATA_PATH}: ${err.message}`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    errors.push(`data/games.json is not valid JSON: ${err.message}`);
    return null;
  }
}

function validateRoot(data) {
  if (!isObject(data)) {
    errors.push('Root must be an object');
    return false;
  }
  if (!Array.isArray(data.players) || data.players.length < 2) {
    errors.push('players must be an array with at least 2 names');
  }
  if (!Array.isArray(data.games)) {
    errors.push('games must be an array');
    return false;
  }
  return true;
}

function validateBaseline(data, playerSet) {
  if (data.baseline == null) return;
  if (!isObject(data.baseline)) {
    errors.push('baseline must be an object when present');
    return;
  }
  for (const bucket of ['wins', 'losses']) {
    if (data.baseline[bucket] == null) continue;
    if (!isObject(data.baseline[bucket])) {
      errors.push(`baseline.${bucket} must be an object`);
      continue;
    }
    for (const [player, value] of Object.entries(data.baseline[bucket])) {
      if (!playerSet.has(player)) errors.push(`baseline.${bucket}.${player} is not listed in players`);
      numberField(null, `baseline.${bucket}.${player}`, value);
    }
  }
  if (data.baseline.games != null) numberField(null, 'baseline.games', data.baseline.games);
}

function validateBatting(gameId, side) {
  if (!Array.isArray(side.batting) || side.batting.length === 0) {
    error(gameId, `${side.player} ${side.team} batting must be a non-empty array`);
    return;
  }

  side.batting.forEach((row, index) => {
    if (!isObject(row)) {
      error(gameId, `${side.player} batting row ${index + 1} must be an object`);
      return;
    }
    REQUIRED_BATTING.forEach(field => {
      if (!(field in row)) error(gameId, `${side.player} batting row ${index + 1} missing ${field}`);
    });
    if (!row.name) error(gameId, `${side.player} batting row ${index + 1} missing player name`);
    ['ab', 'r', 'h', 'rbi', 'bb', 'so', 'hr'].forEach(field => {
      if (field in row) numberField(gameId, `${side.player} ${row.name || `batting row ${index + 1}`} ${field}`, row[field]);
    });
    if (isNonNegativeInteger(row.h) && isNonNegativeInteger(row.ab) && row.h > row.ab) {
      error(gameId, `${side.player} ${row.name} has more hits than at-bats`);
    }
  });

  const battingHits = sum(side.batting, 'h');
  const battingRuns = sum(side.batting, 'r');
  if (battingHits !== side.hits) {
    error(gameId, `${side.player} ${side.team} batting hits total ${battingHits}, but side.hits is ${side.hits}`);
  }
  if (battingRuns !== side.runs) {
    error(gameId, `${side.player} ${side.team} batting runs total ${battingRuns}, but side.runs is ${side.runs}`);
  }
}

function validatePitching(gameId, side) {
  if (!Array.isArray(side.pitching) || side.pitching.length === 0) {
    error(gameId, `${side.player} ${side.team} pitching must be a non-empty array`);
    return;
  }

  let outs = 0;
  side.pitching.forEach((row, index) => {
    if (!isObject(row)) {
      error(gameId, `${side.player} pitching row ${index + 1} must be an object`);
      return;
    }
    REQUIRED_PITCHING.forEach(field => {
      if (!(field in row)) error(gameId, `${side.player} pitching row ${index + 1} missing ${field}`);
    });
    if (!row.name) error(gameId, `${side.player} pitching row ${index + 1} missing player name`);
    ['h', 'r', 'er', 'bb', 'so'].forEach(field => {
      if (field in row) numberField(gameId, `${side.player} ${row.name || `pitching row ${index + 1}`} ${field}`, row[field]);
    });
    const rowOuts = ipToOuts(row.ip);
    if (rowOuts == null) {
      error(gameId, `${side.player} ${row.name || `pitching row ${index + 1}`} ip must use baseball format like 7.1 or 9.0`);
    } else {
      outs += rowOuts;
    }
    if (row.decision != null && !VALID_DECISIONS.has(row.decision)) {
      warn(gameId, `${side.player} ${row.name} has uncommon decision "${row.decision}"`);
    }
    if (isNonNegativeInteger(row.er) && isNonNegativeInteger(row.r) && row.er > row.r) {
      error(gameId, `${side.player} ${row.name} has ER greater than R`);
    }
  });

  if (outs < 24) {
    warn(gameId, `${side.player} ${side.team} pitching outs total ${outs}, expected at least 24 for a full MLB The Show game`);
  }
}

function validateGame(game, index, playerSet, seenIds) {
  const gameId = game && game.id ? game.id : `game at index ${index}`;
  if (!isObject(game)) {
    error(null, `Game at index ${index} must be an object`);
    return;
  }

  if (!game.id || typeof game.id !== 'string') error(gameId, 'missing string id');
  if (seenIds.has(game.id)) error(gameId, 'duplicate game id');
  seenIds.add(game.id);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(game.date || '')) {
    error(gameId, 'date must use YYYY-MM-DD');
  }
  if (game.id && game.date && !game.id.startsWith(game.date)) {
    warn(gameId, `id does not start with date ${game.date}`);
  }

  if (!Array.isArray(game.sides) || game.sides.length !== 2) {
    error(gameId, 'sides must contain exactly 2 teams');
    return;
  }

  const sidePlayers = game.sides.map(side => side.player);
  const uniqueSidePlayers = new Set(sidePlayers);
  if (uniqueSidePlayers.size !== game.sides.length) error(gameId, 'side players must be unique');
  sidePlayers.forEach(player => {
    if (!playerSet.has(player)) error(gameId, `${player} is not listed in players`);
  });
  if (!sidePlayers.includes(game.winner)) error(gameId, `winner ${game.winner} is not one of the side players`);

  const homeAway = game.sides.map(side => side.homeAway);
  if (homeAway.filter(v => v === 'home').length !== 1 || homeAway.filter(v => v === 'away').length !== 1) {
    error(gameId, 'sides must include exactly one home team and one away team');
  }

  game.sides.forEach(side => {
    if (!isObject(side)) {
      error(gameId, 'each side must be an object');
      return;
    }
    ['player', 'team', 'teamFull', 'homeAway'].forEach(field => {
      if (!side[field] || typeof side[field] !== 'string') error(gameId, `${side.player || 'side'} missing string ${field}`);
    });
    if (!VALID_HOME_AWAY.has(side.homeAway)) error(gameId, `${side.player} homeAway must be home or away`);
    ['runs', 'hits', 'errors'].forEach(field => numberField(gameId, `${side.player} ${field}`, side[field]));

    if (!Array.isArray(side.innings) || side.innings.length < 9) {
      error(gameId, `${side.player} innings must contain at least 9 entries`);
    } else {
      let inningTotal = 0;
      side.innings.forEach((value, inningIndex) => {
        const parsed = parseInningRun(value);
        if (parsed == null) {
          error(gameId, `${side.player} inning ${inningIndex + 1} must be a non-negative run value or X`);
        } else {
          inningTotal += parsed;
        }
      });
      if (inningTotal !== side.runs) {
        error(gameId, `${side.player} innings total ${inningTotal}, but side.runs is ${side.runs}`);
      }
      if (side.homeAway === 'away' && side.innings.includes('X')) {
        error(gameId, `${side.player} is away but has X in innings`);
      }
    }

    validateBatting(gameId, side);
    validatePitching(gameId, side);
  });

  const [a, b] = game.sides;
  if (a && b && isNonNegativeInteger(a.runs) && isNonNegativeInteger(b.runs)) {
    if (a.runs === b.runs) error(gameId, 'game cannot end in a tie');
    const actualWinner = a.runs > b.runs ? a.player : b.player;
    if (game.winner !== actualWinner) {
      error(gameId, `winner is ${game.winner}, but score winner is ${actualWinner}`);
    }

    for (const side of game.sides) {
      const opponent = game.sides.find(other => other !== side);
      const pitchingRuns = sum(side.pitching || [], 'r');
      if (pitchingRuns !== opponent.runs) {
        error(gameId, `${side.player} pitching runs allowed ${pitchingRuns}, but opponent runs is ${opponent.runs}`);
      }
    }
  }

  if (game.notes != null && !isObject(game.notes)) error(gameId, 'notes must be an object when present');
}

const data = readData();
if (data && validateRoot(data)) {
  const playerSet = new Set(data.players);
  validateBaseline(data, playerSet);

  const seenIds = new Set();
  data.games.forEach((game, index) => validateGame(game, index, playerSet, seenIds));
}

if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach(item => console.log(`  - ${item}`));
  console.log('');
}

if (errors.length) {
  console.error('Validation failed:');
  errors.forEach(item => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(`games.json valid: ${data.games.length} games checked`);
