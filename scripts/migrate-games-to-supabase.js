// Phase 2：將 data/games.json 的 8 場資料匯入 Supabase
// 執行：node scripts/migrate-games-to-supabase.js
// 需要：SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 環境變數

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('缺少環境變數：SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 玩家名稱 → DB id 對照
const PLAYER_ID_MAP = {
  'Scott':   'scott',
  'Alvin':   'alvin',
  'Vincent': 'vincent',
}

function toPlayerId(name) {
  const id = PLAYER_ID_MAP[name]
  if (!id) throw new Error(`未知玩家：${name}`)
  return id
}

// innings 轉成 JSONB（保留 "X"）
function parseInnings(innings) {
  return innings.map(v => String(v))
}

async function migrateGame(game) {
  console.log(`\n→ 處理 ${game.id}`)

  // ── 1. 檢查是否已存在（可重跑）
  const { data: existing } = await supabase
    .from('games')
    .select('id')
    .eq('legacy_id', game.id)
    .single()

  if (existing) {
    console.log(`  已存在，跳過`)
    return
  }

  // ── 2. 插入 games
  const { data: insertedGame, error: gameErr } = await supabase
    .from('games')
    .insert({
      legacy_id:           game.id,
      played_at:           game.date,
      sport:               'mlb',
      winner_player_id:    toPlayerId(game.winner),
      player_of_game_name: game.playerOfGame?.name ?? null,
      player_of_game_team: game.playerOfGame?.team ?? null,
      submitted_by:        null,
      source:              'manual_migration',
    })
    .select('id')
    .single()

  if (gameErr) throw new Error(`games 插入失敗：${gameErr.message}`)
  const gameId = insertedGame.id
  console.log(`  games 插入成功：${gameId}`)

  // ── 3. 每一隊
  for (const side of game.sides) {
    // 插入 game_sides
    const { data: insertedSide, error: sideErr } = await supabase
      .from('game_sides')
      .insert({
        game_id:   gameId,
        player_id: toPlayerId(side.player),
        team_name: side.team,
        team_full: side.teamFull,
        home_away: side.homeAway,
        runs:      side.runs,
        hits:      side.hits,
        errors:    side.errors,
        innings:   parseInnings(side.innings),
      })
      .select('id')
      .single()

    if (sideErr) throw new Error(`game_sides 插入失敗：${sideErr.message}`)
    const sideId = insertedSide.id

    // 插入 batting_lines
    const battingRows = side.batting.map((b, i) => ({
      game_side_id:  sideId,
      batting_order: i + 1,
      name:          b.name,
      pos:           b.pos ?? null,
      ab:            b.ab ?? 0,
      r:             b.r  ?? 0,
      h:             b.h  ?? 0,
      rbi:           b.rbi ?? 0,
      bb:            b.bb  ?? 0,
      so:            b.so  ?? 0,
      hr:            b.hr  ?? 0,
    }))
    const { error: battingErr } = await supabase.from('batting_lines').insert(battingRows)
    if (battingErr) throw new Error(`batting_lines 插入失敗：${battingErr.message}`)

    // 插入 pitching_lines
    const pitchingRows = side.pitching.map((p, i) => ({
      game_side_id:   sideId,
      pitching_order: i + 1,
      name:           p.name,
      decision:       p.decision || null,
      record:         p.record   || null,
      ip:             p.ip,
      h:              p.h  ?? 0,
      r:              p.r  ?? 0,
      er:             p.er ?? 0,
      bb:             p.bb ?? 0,
      so:             p.so ?? 0,
    }))
    const { error: pitchingErr } = await supabase.from('pitching_lines').insert(pitchingRows)
    if (pitchingErr) throw new Error(`pitching_lines 插入失敗：${pitchingErr.message}`)

    console.log(`  ${side.player} (${side.team}) 插入完成`)
  }

  // ── 4. game_notes
  const noteRows = []
  const notes = game.notes ?? {}

  // hr：每個名字 count = 1
  for (const name of (notes.hr ?? [])) {
    noteRows.push({ game_id: gameId, note_type: 'hr', player_name: name, count: 1 })
  }
  // sb：有 count 欄位
  for (const sb of (notes.sb ?? [])) {
    noteRows.push({ game_id: gameId, note_type: 'sb', player_name: sb.name, count: sb.count ?? 1 })
  }
  // errors：每個名字 count = 1
  for (const name of (notes.errors ?? [])) {
    noteRows.push({ game_id: gameId, note_type: 'error', player_name: name, count: 1 })
  }

  if (noteRows.length > 0) {
    const { error: notesErr } = await supabase.from('game_notes').insert(noteRows)
    if (notesErr) throw new Error(`game_notes 插入失敗：${notesErr.message}`)
    console.log(`  notes 插入 ${noteRows.length} 筆`)
  }

  console.log(`  ✓ ${game.id} 完成`)
}

async function main() {
  const gamesJson = JSON.parse(
    readFileSync(join(__dirname, '../data/games.json'), 'utf-8')
  )
  const games = gamesJson.games

  console.log(`開始遷移，共 ${games.length} 場`)

  for (const game of games) {
    await migrateGame(game)
  }

  console.log('\n全部完成！')

  // 驗收：印出 DB 裡的場次數
  const { count } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('sport', 'mlb')

  console.log(`Supabase games 表共 ${count} 場`)
}

main().catch(err => {
  console.error('遷移失敗：', err.message)
  process.exit(1)
})
