// 上傳解析的硬性驗證回歸測試：node scripts/test-submit-validate.mjs（npm test 會一起跑）
// 真值是 2026-09-24 海盜 vs 紅襪（4-3、11 局）五張截圖逐格抄的；fixture 是 Haiku 當時整列錯位的實際輸出
import { validateGame, reconcileInnings, prepareParsed } from '../functions/api/submit-game.js'
import { readFileSync } from 'node:fs'

const clone = o => JSON.parse(JSON.stringify(o))
let pass = 0, fail = 0
const check = (label, cond, detail = '') => { if (cond) { pass++; console.log('  ✅', label, detail) } else { fail++; console.log('  ❌', label, detail) } }

const truth = {
  sport: 'mlb', home_team: 'Pirates', away_team: 'Red Sox', home_score: 3, away_score: 4,
  player_of_game: { name: 'Mickey Gasper', team: 'Red Sox' },
  last_inning_number: 11,
  line_score: { home: { r: 3, h: 5, e: 0 }, away: { r: 4, h: 6, e: 0 } },
  innings: { home: ['0','0','0','0','2','1','0','0','0'], away: ['0','0','0','1','0','0','0','0','1'] },
  batting: {
    away: [
      { name: 'Roman Anthony', pos: 'LF', ab: 5, r: 0, h: 2, rbi: 0, bb: 0, so: 1, hr: 0 },
      { name: 'Mickey Gasper', pos: 'DH', ab: 5, r: 2, h: 1, rbi: 1, bb: 0, so: 1, hr: 1 },
      { name: 'Adley Rutschman', pos: 'C', ab: 5, r: 1, h: 1, rbi: 2, bb: 0, so: 2, hr: 1 },
      { name: 'Willson Contreras', pos: '1B', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, so: 2, hr: 0 },
      { name: 'Wilyer Abreu', pos: 'RF', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, so: 1, hr: 0 },
      { name: 'Trevor Story', pos: 'SS', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, so: 3, hr: 0 },
      { name: 'Jarren Duran', pos: 'CF', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, so: 1, hr: 0 },
      { name: 'Caleb Durbin', pos: '3B', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 2, hr: 0 },
      { name: 'Nick Sogard', pos: '2B', ab: 4, r: 0, h: 1, rbi: 1, bb: 0, so: 2, hr: 0 },
    ],
    home: [
      { name: 'Konnor Griffin', pos: 'SS', ab: 5, r: 0, h: 0, rbi: 0, bb: 0, so: 2, hr: 0 },
      { name: 'Brandon Lowe', pos: '2B', ab: 5, r: 1, h: 2, rbi: 1, bb: 0, so: 1, hr: 1 },
      { name: 'Billy Cook', pos: 'LF', ab: 5, r: 0, h: 0, rbi: 0, bb: 0, so: 3, hr: 0 },
      { name: 'Oneil Cruz', pos: 'CF', ab: 3, r: 0, h: 0, rbi: 0, bb: 1, so: 2, hr: 0 },
      { name: "Ryan O'Hearn", pos: 'DH', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 1, hr: 0 },
      { name: 'Nick Gonzales', pos: '3B', ab: 4, r: 1, h: 1, rbi: 0, bb: 0, so: 0, hr: 0 },
      { name: 'Rafael Flores', pos: 'C', ab: 4, r: 0, h: 1, rbi: 2, bb: 0, so: 2, hr: 0 },
      { name: 'Spencer Horwitz', pos: '1B', ab: 3, r: 0, h: 0, rbi: 0, bb: 1, so: 0, hr: 0 },
      { name: 'Jake Mangum', pos: 'RF', ab: 4, r: 0, h: 0, rbi: 0, bb: 0, so: 0, hr: 0 },
    ],
  },
  batting_totals: { away: { ab: 39, r: 4, h: 6, rbi: 4, bb: 0, so: 15 }, home: { ab: 37, r: 3, h: 5, rbi: 3, bb: 2, so: 11 } },
  pitching: {
    away: [
      { name: 'Sonny Gray', decision: null, record: null, ip: '7.0', h: 4, r: 2, er: 2, bb: 1, so: 6 },
      { name: 'Garrett Whitlock', decision: 'BS', record: '4', ip: '2.1', h: 1, r: 1, er: 1, bb: 1, so: 3 },
      { name: 'Aroldis Chapman', decision: 'W', record: '5-3', ip: '1.2', h: 0, r: 0, er: 0, bb: 0, so: 2 },
    ],
    home: [
      { name: 'Paul Skenes', decision: null, record: null, ip: '8.1', h: 5, r: 3, er: 3, bb: 0, so: 13 },
      { name: 'Luke Weaver', decision: 'L', record: '4-4', ip: '2.2', h: 1, r: 1, er: 0, bb: 0, so: 2 },
    ],
  },
  pitching_totals: { away: { ip: '11.0', h: 5, r: 3, er: 3, bb: 2, so: 11 }, home: { ip: '11.0', h: 6, r: 4, er: 3, bb: 0, so: 15 } },
  notes: { hr: ['Mickey Gasper', 'Adley Rutschman', 'Brandon Lowe'] },
  needsReview: false, uncertainties: [], fatalError: false,
}

console.log('[1] Haiku 整列錯位的實際輸出（fixture）必須被擋')
{
  const p = JSON.parse(readFileSync(new URL('./fixtures/haiku-misread-2026-09-24.json', import.meta.url), 'utf8'))
  const err = validateGame(p)
  check('被擋下', !!err, '→ ' + err)
}

console.log('[2] 真值 ＋ 延長賽（畫面只顯示 3–11 局）')
{
  const p = clone(truth); const err = prepareParsed(p)
  check('通過驗證', err === null, err ? '→ ' + err : '')
  check('局數補成 11', p.innings.home.length === 11 && p.innings.away.length === 11, JSON.stringify(p.innings.away))
  check('客隊差額 2 分補在第 1 局', p.innings.away[0] === '2')
  check('主隊沒有差額', p.innings.home[0] === '0')
  check('needsReview ＋ 說明文字', p.needsReview === true && /第 1–2 局不在畫面上/.test(p.uncertainties[0]), p.uncertainties[0])
}

console.log('[3] 舊格式輸出（沒有 totals / line_score / last_inning_number）：檢查要能跳過')
{
  const p = clone(truth); delete p.batting_totals; delete p.pitching_totals; delete p.line_score; delete p.last_inning_number
  const err = prepareParsed(p)
  check('通過驗證', err === null, err ? '→ ' + err : '')
  check('局數維持 9', p.innings.home.length === 9)
}

console.log('[4] 只上傳一隊投手表（部分上傳）')
{
  const p = clone(truth); p.pitching.home = []; delete p.pitching_totals.home
  const err = prepareParsed(p); check('通過驗證', err === null, err ? '→ ' + err : '')
}

console.log('[5] 主隊漏掉 "X"（兩隊欄數不同）：不能硬補位，只提醒')
{
  const p = clone(truth); p.last_inning_number = 9
  p.innings = { home: ['0','0','0','0','2','1','0','0'], away: ['0','0','0','1','0','0','0','0','3'] }   // 主隊 8 欄、客隊 9 欄
  const err = prepareParsed(p)
  check('主隊維持 8 欄（沒被往右推）', p.innings.home.length === 8 && p.innings.home[0] === '0', JSON.stringify(p.innings.home))
  check('客隊維持 9 欄', p.innings.away.length === 9)
  check('提醒欄數不同', p.needsReview && p.uncertainties.some(u => /欄數不同/.test(u)), p.uncertainties.join(' | '))
  check('其餘驗證通過', err === null, err ? '→ ' + err : '')
}

console.log('[6] 同一位投手 BS＋W：decision 填 W 要能通過')
{
  const p = clone(truth); p.pitching.away[1].decision = 'W'; p.pitching.away[1].record = '5-3'; p.pitching.away[2].decision = null
  const err = prepareParsed(p); check('通過驗證', err === null, err ? '→ ' + err : '')
}

console.log('[7] 這次實際出現過的錯誤逐一注入真值，每一種都要被擋')
const cases = [
  ['Contreras 拿到 Rutschman 那列', p => { p.batting.away[3] = { ...p.batting.away[3], ab: 5, r: 1, h: 1, rbi: 2 } }],
  ['Whitlock 的 BS 被讀成 W（兩位 W）', p => { p.pitching.away[1].decision = 'W' }],
  ['Weaver ER 拿到 Skenes 的 3（ER > R）', p => { p.pitching.home[1].er = 3 }],
  ['Whitlock SO 拿到 Gray 的 6', p => { p.pitching.away[1].so = 6 }],
  ['Sogard 打點漏掉（RBI 對不上 TOTALS）', p => { p.batting.away[8].rbi = 0 }],
  ['Durbin 安打漏掉（H 對不上逐局表）', p => { p.batting.away[7].h = 0; delete p.batting_totals }],
  ['打者沒拍全（少一列、沒有 TOTALS）', p => { p.batting.away.pop(); delete p.batting_totals }],
  ['逐局表 R 跟總分不同', p => { p.line_score.home.r = 4 }],
  ['Skenes IP 讀成 7.1（IP 對不上 TOTALS）', p => { p.pitching.home[0].ip = '7.1' }],
  ['主隊 9 局贏球（X）但主客標反：客隊投手 9.0 > 主隊投手 8.0', p => {
    const b = p.batting, pi = p.pitching
    p.batting = { home: b.away, away: b.home }; p.batting_totals = { home: p.batting_totals.away, away: p.batting_totals.home }
    p.line_score = { home: p.line_score.away, away: p.line_score.home }
    p.pitching = { home: pi.away, away: pi.home }; p.pitching_totals = { home: p.pitching_totals.away, away: p.pitching_totals.home }
    p.home_team = 'Red Sox'; p.away_team = 'Pirates'; p.home_score = 4; p.away_score = 3
    p.pitching.away[1].ip = '3.0'; p.pitching_totals.away.ip = '11.1'
  }],
]
for (const [label, mutate] of cases) {
  const p = clone(truth); mutate(p); const err = prepareParsed(p)
  check(label, !!err, '→ ' + err)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
