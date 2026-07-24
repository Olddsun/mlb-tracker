/* ============ MLB The Show Tracker — app logic ============ */

const PLAYERS = ['Scott', 'Alvin', 'Vincent'];

const MLB_IDS = {"Aaron Judge":592450,"Adolis García":666969,"Adrian Morejon":670970,"Agustín Ramírez":682663,"Alec Bohm":664761,"Alex Bregman":608324,"Alex Freeland":690976,"Andy Pages":681624,"Angel Martinez":682657,"Anthony Bender":669622,"Austin Riley":663586,"Austin Wells":669224,"Ben Williamson":810938,"Blake Treinen":595014,"Bo Naylor":666310,"Brad Keller":641745,"Brandon Marsh":669016,"Brandon Nimmo":607043,"Brayan Rocchio":677587,"Bryce Eldridge":805811,"Bryce Harper":547180,"Bryson Stott":681082,"Caleb Durbin":702332,"Carlos Narváez":665966,"Carson Kelly":608348,"Carson Williams":700246,"Ceddanne Rafaela":678882,"Cedric Mullins":656775,"Chandler Simpson":802415,"Chase DeLauter":800050,"Chris Martin":455119,"Chris Sale":519242,"Christopher Morel":666624,"Cody Bellinger":641355,"Colt Keith":690993,"Connor Norby":681393,"Corey Seager":608369,"Cristopher Sánchez":650911,"Daniel Palencia":694037,"Daniel Schneemann":682177,"Danny Jansen":643376,"Dansby Swanson":621020,"David Fry":681807,"Dillon Dingler":693307,"Dominic Smith":642086,"Drake Baldwin":686948,"Drew Rasmussen":656876,"Erik Sabrowski":681870,"Eury Pérez":691587,"Evan Carter":694497,"Fernando Tatis Jr.":665487,"Freddie Freeman":518692,"Freddy Fermin":666023,"Gabriel Arias":672356,"Garrett Crochet":676979,"Garrett Whitlock":676477,"Giancarlo Stanton":519317,"Gleyber Torres":650402,"Graham Pauley":688363,"Griffin Conine":665052,"Harrison Bader":664056,"Heliot Ramos":671218,"Ian Happ":664023,"Ian Seymour":693855,"J.T. Realmuto":592663,"Jackson Merrill":701538,"Jacob Latz":656641,"Jacob deGrom":594798,"Jake Burger":669394,"Jake Cronenworth":630105,"Jakob Marsee":805300,"Jalen Beeks":656222,"Jarren Duran":680776,"Javier Báez":595879,"Jazz Chisholm Jr.":665862,"Jeremiah Estrada":669093,"Joc Pederson":592626,"Jonathan Aranda":666018,"Jonny DeLuca":676356,"Josh Jung":673962,"Josh Smith":669701,"José Alvarado":621237,"José Caballero":676609,"José Ramírez":608070,"Jung Hoo Lee":808982,"Junior Caminero":691406,"Justin Crawford":702222,"Kerry Carpenter":681481,"Kevin McGonigle":805808,"Kyle Schwarber":656941,"Kyle Tucker":663656,"Logan Webb":657277,"Luis Arraez":650333,"Manny Machado":592518,"Marcelo Mayer":691785,"Matt Chapman":656305,"Matt Olson":621566,"Matthew Boyd":571510,"Mauricio Dubón":643289,"Max Fried":608331,"Max Muncy":571970,"Michael Busch":683737,"Michael Conforto":624424,"Michael Harris II":671739,"Miguel Andujar":609280,"Mike Yastrzemski":573262,"Moisés Ballesteros":694208,"Mookie Betts":605141,"Nick Fortes":663743,"Nick Pivetta":601713,"Nico Hoerner":663538,"Otto Lopez":672640,"Owen Caissie":683357,"Ozzie Albies":645277,"Parker Meadows":678009,"Patrick Bailey":672275,"Paul Goldschmidt":502671,"Pete Crow-Armstrong":691718,"Phil Maton":664208,"Rafael Devers":646240,"Raisel Iglesias":628452,"Ramón Laureano":657656,"Rhys Hoskins":656555,"Riley Greene":682985,"Roman Anthony":701350,"Ronald Acuña Jr.":660670,"Ryan Borucki":621366,"Ryan McMahon":641857,"Sam Haggerty":664059,"Shawn Armstrong":542888,"Shohei Ohtani":660271,"Spencer Torkelson":679529,"Steven Kwan":680757,"Tanner Bibee":676440,"Tarik Skubal":669373,"Teoscar Hernández":606192,"Trea Turner":607208,"Trent Grisham":663757,"Trevor Story":596115,"Ty France":664034,"Tyler Kinley":641755,"Will Smith":669257,"Willson Contreras":575929,"Willy Adames":642715,"Wilyer Abreu":677800,"Wyatt Langford":694671,"Xander Bogaerts":593428,"Xavier Edwards":669364,"Yandy Díaz":650490,"Yoshinobu Yamamoto":808967};

function mlbUrl(name) {
  const id = MLB_IDS[name];
  if (!id) return null;
  const slug = name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ /g, '-')
    .replace(/[^a-z0-9.\-]/g, '');
  return `https://www.mlb.com/player/${slug}-${id}`;
}

// 球隊代表色（在深色背景上看得清楚的版本）
const TEAM_COLORS = {
  'Phillies': '#ef3340', 'Yankees': '#6b8fd4', 'Dodgers': '#3b6fd4',
  'Mets': '#ff8c2b', 'Braves': '#d4264a', 'Red Sox': '#e0454f',
  'Cubs': '#4f86d6', 'Cardinals': '#e0454f', 'Giants': '#fd824a',
  'Padres': '#c8a24a', 'Astros': '#f4823a', 'Rangers': '#4f86d6',
  'Blue Jays': '#3b8fd4', 'Orioles': '#f4823a', 'Rays': '#3bb0c4',
  'Mariners': '#3bb08f', 'Angels': '#e0454f', 'Athletics': '#3b9f6f',
  'Tigers': '#5b8fd4', 'Twins': '#4f86d6', 'Guardians': '#e0454f',
  'White Sox': '#aab4c0', 'Royals': '#4f86d6', 'Brewers': '#c8a24a',
  'Reds': '#e0454f', 'Pirates': '#f4b023', 'Marlins': '#3bb0c4',
  'Nationals': '#e0454f', 'Rockies': '#9b6fc4', 'Diamondbacks': '#d44a5a'
};
const teamColor = (t) => TEAM_COLORS[t] || '#4f8ef7';

let DATA = { games: [] };

/* ---------- helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const app = () => document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const avg = (h, ab) => ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.000';

// 投球局數運算（7.1 = 7又1/3局）
const ipToOuts = (ip) => { const [w, f] = String(ip).split('.'); return (+w) * 3 + (+(f || 0)); };
const outsToIp = (o) => `${Math.floor(o / 3)}.${o % 3}`;
const era = (er, outs) => outs > 0 ? (er * 27 / outs).toFixed(2) : '0.00';

const sideOf = (g, player) => g.sides.find(s => s.player === player);
const fmtDate = (d) => { const [y, m, day] = d.split('-'); return `${y} / ${m} / ${day}`; };

/* ---------- aggregations ---------- */
function headToHead() {
  const base = DATA.baseline?.wins || {};
  const wins = {};
  PLAYERS.forEach(p => wins[p] = base[p] || 0);
  DATA.games.forEach(g => { if (wins[g.winner] != null) wins[g.winner]++; });
  const total = (DATA.baseline?.games || 0) + DATA.games.length;
  return { wins, total };
}

function recentForm(player, n = 5) {
  return DATA.games.slice(0, n).map(g => g.winner === player ? 'w' : 'l');
}

// 每位玩家的累積數據（只計有逐場數據的比賽）
function playerTotals() {
  const t = {};
  PLAYERS.forEach(p => t[p] = { h: 0, hr: 0, so: 0, runs: 0, games: 0, er: 0, outs: 0 });
  DATA.games.forEach(g => g.sides.forEach(s => {
    const x = t[s.player]; if (!x) return;
    x.games++; x.runs += s.runs;
    s.batting.forEach(b => { x.h += b.h || 0; x.hr += b.hr || 0; });
    s.pitching.forEach(p => { x.so += p.so || 0; x.er += p.er || 0; x.outs += ipToOuts(p.ip); });
  }));
  return t;
}

// 隊伍戰績：依「玩家 + 隊伍」分開計算，Scott 的洋基 ≠ Alvin 的洋基
function teamRecordsByPlayer() {
  const rec = {};
  DATA.games.forEach(g => g.sides.forEach(s => {
    const opp = g.sides.find(o => o !== s);
    const key = s.player + '|' + s.team;
    const r = rec[key] || (rec[key] = { player: s.player, team: s.team, gp: 0, w: 0, l: 0, rs: 0, ra: 0 });
    r.gp++; r.rs += s.runs; r.ra += opp.runs;
    if (g.winner === s.player) r.w++; else r.l++;
  }));
  const byPlayer = {};
  PLAYERS.forEach(p => byPlayer[p] = []);
  Object.values(rec).forEach(r => (byPlayer[r.player] = byPlayer[r.player] || []).push(r));
  Object.values(byPlayer).forEach(arr => arr.sort((a, b) => (b.w / b.gp) - (a.w / a.gp) || b.gp - a.gp));
  return byPlayer;
}

// 球員打擊：依「玩家 + 球員」分開
function battingByOwner() {
  const m = {};
  DATA.games.forEach(g => g.sides.forEach(s => s.batting.forEach(b => {
    const key = s.player + '|' + b.name;
    const p = m[key] || (m[key] = { owner: s.player, name: b.name, team: s.team, g: 0, ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0, hr: 0 });
    p.team = s.team;
    p.g++; p.ab += b.ab || 0; p.r += b.r || 0; p.h += b.h || 0;
    p.rbi += b.rbi || 0; p.bb += b.bb || 0; p.so += b.so || 0; p.hr += b.hr || 0;
  })));
  const byOwner = {};
  PLAYERS.forEach(p => byOwner[p] = []);
  Object.values(m).forEach(p => (byOwner[p.owner] = byOwner[p.owner] || []).push(p));
  Object.values(byOwner).forEach(arr => arr.sort((a, b) => {
    const avgA = a.ab > 0 ? a.h / a.ab : 0, avgB = b.ab > 0 ? b.h / b.ab : 0;
    return avgB - avgA || b.h - a.h || b.rbi - a.rbi;
  }));
  return byOwner;
}

// 球員投球：依「玩家 + 球員」分開
function pitchingByOwner() {
  const m = {};
  DATA.games.forEach(g => g.sides.forEach(s => s.pitching.forEach(p => {
    const key = s.player + '|' + p.name;
    const x = m[key] || (m[key] = { owner: s.player, name: p.name, g: 0, outs: 0, w: 0, l: 0, h: 0, r: 0, er: 0, bb: 0, so: 0 });
    x.g++; x.outs += ipToOuts(p.ip); x.h += p.h || 0; x.r += p.r || 0;
    x.er += p.er || 0; x.bb += p.bb || 0; x.so += p.so || 0;
    if (p.decision === 'W') x.w++; if (p.decision === 'L') x.l++;
  })));
  const byOwner = {};
  PLAYERS.forEach(p => byOwner[p] = []);
  Object.values(m).forEach(p => (byOwner[p.owner] = byOwner[p.owner] || []).push(p));
  Object.values(byOwner).forEach(arr => arr.sort((a, b) => b.so - a.so || a.er - b.er));
  return byOwner;
}

/* ---------- views ---------- */
function standingsCard() {
  const { wins } = headToHead();
  const losses = {}, rs = {}, ra = {}, homeW = {}, homeL = {}, awayW = {}, awayL = {};
  PLAYERS.forEach(p => {
    losses[p] = DATA.baseline?.losses?.[p] || 0;
    rs[p] = 0; ra[p] = 0; homeW[p] = 0; homeL[p] = 0; awayW[p] = 0; awayL[p] = 0;
  });
  DATA.games.forEach(g => {
    g.sides.forEach(s => {
      const p = s.player;
      if (!(p in rs)) return;
      if (g.winner !== p) losses[p]++;
      rs[p] += s.runs;
      ra[p] += g.sides.find(x => x.player !== p)?.runs || 0;
      const won = g.winner === p;
      if (s.homeAway === 'home') { won ? homeW[p]++ : homeL[p]++; }
      else { won ? awayW[p]++ : awayL[p]++; }
    });
  });

  const rows = PLAYERS.map(p => {
    const w = wins[p], l = losses[p];
    const pct = (w + l) > 0 ? w / (w + l) : null;
    return { p, w, l, pct };
  }).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.w - a.w || a.l - b.l);

  const leader = rows[0];
  const gbStr = (r) => {
    if (r.p === leader.p) return '-';
    const d = ((leader.w - r.w) + (r.l - leader.l)) / 2;
    return d <= 0 ? '-' : d % 1 === 0 ? String(d) : d.toFixed(1);
  };
  const streakStr = (p) => {
    let count = 0, type = null;
    for (const g of DATA.games) {
      if (!g.sides.some(s => s.player === p)) continue;
      const won = g.winner === p;
      if (type === null) { type = won; count = 1; }
      else if (won === type) count++;
      else break;
    }
    return count > 0 ? (type ? 'W' : 'L') + count : '-';
  };

  const P_CLR = { Scott: 'scott', Alvin: 'alvin', Vincent: 'vincent' };
  const fmtPct = (v) => v == null ? '-' : v.toFixed(3).replace(/^0/, '');
  const fmtDiff = (p) => { const d = rs[p] - ra[p]; return d > 0 ? `+${d}` : String(d); };
  const diffCls = (p) => { const d = rs[p] - ra[p]; return d > 0 ? 'diff-pos' : d < 0 ? 'diff-neg' : ''; };
  const recStr = (w, l) => (w + l) > 0 ? `${w}-${l}` : '-';

  return `<div class="card standings-card">
    <div class="standings-scroll">
    <table class="standings-tbl">
      <thead><tr>
        <th class="sl">玩家</th>
        <th>W</th><th>L</th><th>PCT</th><th>GB</th><th>STRK</th>
        <th>RS</th><th>RA</th><th>DIFF</th><th>HOME</th><th>AWAY</th>
      </tr></thead>
      <tbody>
        ${rows.map(r => {
          const strk = streakStr(r.p);
          return `<tr>
          <td class="sl"><div class="pl-row"><span class="s-dot ${P_CLR[r.p] || ''}"></span>${esc(r.p)}</div></td>
          <td>${r.w}</td><td>${r.l}</td>
          <td class="mono">${fmtPct(r.pct)}</td>
          <td class="mono gb">${gbStr(r)}</td>
          <td class="mono strk ${strk.startsWith('W') ? 'strk-w' : strk.startsWith('L') ? 'strk-l' : ''}">${strk}</td>
          <td class="mono">${rs[r.p]}</td>
          <td class="mono">${ra[r.p]}</td>
          <td class="mono ${diffCls(r.p)}">${fmtDiff(r.p)}</td>
          <td class="mono rec">${recStr(homeW[r.p], homeL[r.p])}</td>
          <td class="mono rec">${recStr(awayW[r.p], awayL[r.p])}</td>
        </tr>`;}).join('')}
      </tbody>
    </table>
    </div>
  </div>`;
}

/* ---------- 戰報卡（近況洞察 + 賽程建議，純數據、不用 AI） ---------- */
const RECENT_N = 3;                              // 近況取每人最近 N 場
let lastReportPick = {};                          // 記住每人上一則，避免連按洗牌跳出同一句
const fmtAvg = (v) => v.toFixed(3).replace(/^0/, '');
const lc = (p) => p.toLowerCase();               // 玩家名 → 顏色 class（scott/alvin/vincent）

// 某玩家最近 n 場（他有出賽的），DATA.games 為新到舊
function recentGamesOf(player, n = RECENT_N) {
  const out = [];
  for (const g of DATA.games) {
    if (g.sides.some(s => s.player === player)) { out.push(g); if (out.length >= n) break; }
  }
  return out;
}

// 某玩家近 n 場的彙總（打擊與投手數據分開累計）
function recentAgg(player, n = RECENT_N) {
  const gs = recentGamesOf(player, n);
  const a = { games: gs.length, hr: 0, ab: 0, h: 0, rbi: 0, bb: 0, batSo: 0,
              pso: 0, er: 0, outs: 0, ph: 0, pbb: 0, runs: 0, hrPerGame: [], wl: [] };
  gs.forEach(g => {
    const s = sideOf(g, player);
    let ghr = 0;
    s.batting.forEach(b => { a.ab += b.ab || 0; a.h += b.h || 0; a.rbi += b.rbi || 0; a.bb += b.bb || 0; a.batSo += b.so || 0; ghr += b.hr || 0; });
    a.hr += ghr; a.hrPerGame.push(ghr);
    s.pitching.forEach(p => { a.pso += p.so || 0; a.er += p.er || 0; a.outs += ipToOuts(p.ip); a.ph += p.h || 0; a.pbb += p.bb || 0; });
    a.runs += s.runs;
    a.wl.push(g.winner === player ? 'w' : 'l');   // 新到舊
  });
  a.avg = a.ab > 0 ? a.h / a.ab : 0;
  a.kRate = a.ab > 0 ? a.batSo / a.ab : 0;
  a.era = a.outs > 0 ? a.er * 27 / a.outs : null;
  a.whip = a.outs > 0 ? (a.ph + a.pbb) / (a.outs / 3) : null;
  a.soPerGame = a.games ? a.pso / a.games : 0;
  a.bbPerGame = a.games ? a.pbb / a.games : 0;
  return a;
}

// ---- 進階資料（戰報規則庫用） ----
// 生涯累積：勝場、全壘打、投手三振、救援、中繼、單場 MVP 次數
function careerStats() {
  const c = {};
  PLAYERS.forEach(p => c[p] = { wins: 0, games: 0, hr: 0, pso: 0, sv: 0, hld: 0, mvp: 0 });
  DATA.games.forEach(g => {
    if (c[g.winner]) c[g.winner].wins++;
    if (g.playerOfGame) {
      const owner = g.sides.find(s => s.team === g.playerOfGame.team)?.player;   // MVP 歸屬於該隊持有者
      if (owner && c[owner]) c[owner].mvp++;
    }
    g.sides.forEach(s => {
      const x = c[s.player]; if (!x) return; x.games++;
      s.batting.forEach(b => x.hr += b.hr || 0);
      s.pitching.forEach(p => { x.pso += p.so || 0; if (p.decision === 'SV') x.sv++; if (p.decision === 'HLD') x.hld++; });
    });
  });
  return c;
}

// 各玩家對每位對手的勝敗 + 目前連勝/連敗（新到舊取領先段）
function h2hAll() {
  const res = {};
  PLAYERS.forEach(p => { res[p] = {}; });
  PLAYERS.forEach(p => PLAYERS.forEach(o => {
    if (p === o) return;
    let w = 0, l = 0, streak = 0, type = null, done = false;
    for (const g of DATA.games) {
      if (!g.sides.some(s => s.player === p) || !g.sides.some(s => s.player === o)) continue;
      const r = g.winner === p ? 'w' : 'l';
      if (r === 'w') w++; else l++;
      if (!done) {
        if (type === null) { type = r; streak = 1; }
        else if (r === type) streak++;
        else done = true;
      }
    }
    res[p][o] = { w, l, streak, type };
  }));
  return res;
}

// 某玩家某場的戲劇性事件（用逐局得分推算）
function playerGameEvent(g, player) {
  const s = sideOf(g, player);
  const opp = g.sides.find(x => x !== s);
  const val = (v) => (v === 'X' || v == null) ? 0 : (+v || 0);
  const n = Math.max(s.innings.length, opp.innings.length);
  let cum = 0, oppCum = 0, maxDef = 0;
  for (let i = 0; i < n; i++) { cum += val(s.innings[i]); oppCum += val(opp.innings[i]); maxDef = Math.max(maxDef, oppCum - cum); }
  return {
    won: g.winner === player,
    margin: s.runs - opp.runs,
    shutout: opp.runs === 0 && s.runs > 0,
    extra: s.innings.length > 9,
    walkoff: g.winner === player && s.homeAway === 'home' && s.innings.length > 9,
    comeback: g.winner === player && maxDef >= 3,
    maxDef,
    bigInning: Math.max(0, ...s.innings.map(val)),
    multiHit: Math.max(0, ...s.batting.map(b => b.h || 0)),
    multiHR: Math.max(0, ...s.batting.map(b => b.hr || 0)),
    errors: s.errors,
    blowup: Math.max(0, ...s.pitching.map(p => p.er || 0)),
    opp: opp.player,
  };
}

// 整體連勝/連敗（跨全部比賽，新到舊）
function streakOf(player) {
  let streak = 0, type = null;
  for (const g of DATA.games) {
    if (!g.sides.some(s => s.player === player)) continue;
    const r = g.winner === player ? 'w' : 'l';
    if (type === null) { type = r; streak = 1; }
    else if (r === type) streak++;
    else break;
  }
  return { streak, type };
}

// 依勝率排名
function rankMap() {
  const wins = headToHead().wins;
  const gp = {}; PLAYERS.forEach(p => gp[p] = 0);
  DATA.games.forEach(g => g.sides.forEach(s => { if (gp[s.player] != null) gp[s.player]++; }));
  const arr = PLAYERS.map(p => ({ p, pct: gp[p] ? wins[p] / gp[p] : 0 })).sort((a, b) => b.pct - a.pct);
  const r = {}; arr.forEach((x, i) => r[x.p] = i + 1);
  return r;
}

// 產生某玩家所有觸發的戰報候選，依突出分數排序（cat 供橫向反重複用）
function insightCandidates(player, ctx) {
  const { aggs, career, h2h, teamRec, rank } = ctx;
  const a = aggs[player];
  if (a.games === 0) return [{ cat: 'neutral', html: '近期無出賽', score: 0, neutral: true }];
  const others = PLAYERS.map(p => aggs[p]);
  const isMax = (val, sel) => val === Math.max(...others.map(sel));
  const isMin = (val, sel) => val === Math.min(...others.map(sel));
  const cands = [];
  const push = (cat, html, score) => cands.push({ cat, html, score });
  const lastG = recentGamesOf(player, 1)[0];
  const ev = lastG ? playerGameEvent(lastG, player) : null;

  /* A 打擊 */
  let hrStreak = 0; for (const v of a.hrPerGame) { if (v >= 1) hrStreak++; else break; }
  if (hrStreak >= 2) push('bat-hr', `近 ${hrStreak} 場場場開轟，長打火力全開 🔥`, 92 + hrStreak);
  if (ev && ev.multiHR >= 2) push('bat-hr', `上場單場 ${ev.multiHR} 響炮，轟炸機`, 86);
  if (ev && ev.multiHit >= 3) push('bat-hit', `上場敲出 ${ev.multiHit} 支安打，猛打賞`, 72);
  if (a.rbi >= 6 && isMax(a.rbi, x => x.rbi)) push('bat-rbi', `近況 ${a.rbi} 分打點，清壘機器`, 70);
  if (a.ab >= 8) {
    if (a.avg < 0.230 && isMin(a.avg, x => x.ab >= 8 ? x.avg : Infinity)) push('bat-avg', `團隊打擊 ${fmtAvg(a.avg)}，該練打囉`, 66);
    else if (a.avg > 0.300 && isMax(a.avg, x => x.ab >= 8 ? x.avg : -1)) push('bat-avg', `團隊打擊 ${fmtAvg(a.avg)}，棒子發燙`, 64);
    if (a.kRate > 0.28 && isMax(a.kRate, x => x.ab >= 8 ? x.kRate : -1)) push('bat-k', `三振率 ${(a.kRate * 100).toFixed(0)}%，揮空有點多`, 58);
  }
  if (a.bb >= 4 && isMax(a.bb, x => x.bb)) push('bat-bb', `近況 ${a.bb} 次保送，選球一流`, 56);

  /* B 投手 */
  if (a.games >= 2 && a.soPerGame >= 6 && isMax(a.soPerGame, x => x.soPerGame)) push('pit-k', `場均 ${a.soPerGame.toFixed(1)} 次三振，投球火燙`, 71);
  if (a.era != null && a.era < 3 && isMin(a.era, x => x.era ?? Infinity)) push('pit-era', `防禦率 ${a.era.toFixed(2)}，穩如泰山`, 69);
  if (a.whip != null && a.whip < 1.05 && isMin(a.whip, x => x.whip ?? Infinity)) push('pit-whip', `被上壘率 ${a.whip.toFixed(2)}，難越雷池`, 63);
  if (a.games >= 2 && a.bbPerGame < 1 && isMin(a.bbPerGame, x => x.bbPerGame ?? Infinity)) push('pit-bb', `場均不到 1 次四壞，控球精準`, 55);
  if (ev && ev.blowup >= 5) push('pit-bad', `上場被打 ${ev.blowup} 分自責，投手丘惡夢`, 60);
  if (career[player].sv >= 2) push('pit-sv', `累積 ${career[player].sv} 次關門成功`, 52);

  /* C 戲劇性（最近一場） */
  if (ev && ev.comeback) push('drama', `上場落後 ${ev.maxDef} 分後大逆轉，超狂`, 85);
  if (ev && ev.walkoff) push('drama', `上場延長賽再見勝出`, 80);
  else if (ev && ev.extra && ev.won) push('drama', `上場延長賽驚險帶走`, 74);
  if (ev && ev.shutout) push('drama', `上場完封對手，送出鴨蛋`, 78);
  if (ev && ev.won && ev.margin >= 7) push('drama', `上場海放對手 ${ev.margin} 分`, 72);
  if (ev && ev.bigInning >= 5) push('drama', `上場單一局灌進 ${ev.bigInning} 分`, 62);
  if (ev && ev.errors >= 3) push('drama-bad', `上場 ${ev.errors} 次失誤，手套漏風`, 59);

  /* D/E/F 關係・選隊・里程碑 */
  for (const o of PLAYERS) {
    if (o === player) continue;
    const rec = h2h[player][o];
    if (rec && rec.type === 'w' && rec.streak >= 3) push('h2h', `是 ${o} 的苦主，對戰 ${rec.streak} 連勝`, 76);
    else if (rec && rec.w >= 2 && rec.w === rec.l) push('h2h', `與 ${o} 交手 ${rec.w + rec.l} 場各半，難分高下`, 50);
  }
  (teamRec[player] || []).forEach(tr => {
    if (tr.gp >= 2 && tr.w === tr.gp) push('team', `用 ${tr.team} ${tr.gp} 戰全勝，勝利方程式`, 67);
    else if (tr.gp >= 2 && tr.w === 0) push('team', `用 ${tr.team} 老是輸，考慮換隊`, 57);
  });
  const st = streakOf(player);
  if (st.streak >= 3) push('streak', st.type === 'w' ? `${st.streak} 連勝，氣勢正旺` : `${st.streak} 連敗，需要止血`, 54 + st.streak);
  if (career[player].mvp >= 2) push('mvp', `已 ${career[player].mvp} 次獲選單場 MVP`, 48);
  if (rank[player] === 1 && career[player].games >= 3) push('rank', `目前戰績龍頭，三人之首`, 46);
  if (career[player].hr >= 20) push('milestone', `生涯累積轟破 ${Math.floor(career[player].hr / 10) * 10} 發`, 44);

  if (!cands.length) {
    const w = a.wl.filter(x => x === 'w').length;
    return [{ cat: 'neutral', html: `近 ${a.games} 場 ${w} 勝 ${a.games - w} 敗，打擊 ${fmtAvg(a.avg)}`, score: 0, neutral: true }];
  }
  cands.sort((x, y) => y.score - x.score);
  return cands;
}

// 賽程建議：挑目前場次最少的一對；平手時「距上次最久」優先
function scheduleSuggestion() {
  const pairs = [];
  for (let i = 0; i < PLAYERS.length; i++)
    for (let j = i + 1; j < PLAYERS.length; j++) pairs.push([PLAYERS[i], PLAYERS[j]]);
  const key = (x, y) => [x, y].sort().join('|');
  const count = {}, lastIdx = {};
  pairs.forEach(([x, y]) => { count[key(x, y)] = 0; lastIdx[key(x, y)] = Infinity; });
  DATA.games.forEach((g, idx) => {
    if (g.sides.length !== 2) return;
    const k = key(g.sides[0].player, g.sides[1].player);
    if (count[k] == null) return;
    count[k]++;
    if (idx < lastIdx[k]) lastIdx[k] = idx;        // 新到舊：越小越近
  });
  // 場次少優先；平手時最近一次對戰越久遠（lastIdx 越大 / 未打過=Infinity）越優先
  const ranked = pairs.map(([x, y]) => ({ x, y, k: key(x, y), c: count[key(x, y)], last: lastIdx[key(x, y)] }))
    .sort((a, b) => a.c - b.c || b.last - a.last);
  return { best: ranked[0], pairs: pairs.map(([x, y]) => ({ x, y, c: count[key(x, y)], k: key(x, y) })) };
}

function reportCard() {
  const aggs = {};
  PLAYERS.forEach(p => aggs[p] = recentAgg(p));
  const ctx = { aggs, career: careerStats(), h2h: h2hAll(), teamRec: teamRecordsByPlayer(), rank: rankMap() };

  // 每人算出所有候選，加權隨機挑一則（分數越高越常出現），橫向反重複＋避免與上次相同
  const candsBy = {};
  PLAYERS.forEach(p => candsBy[p] = insightCandidates(p, ctx));
  const picked = {};
  const fam = c => (c.cat || '').split('-')[0];   // 大類：bat/pit/drama/h2h/team/streak…
  const weightedPick = (list) => {
    const total = list.reduce((s, c) => s + Math.max(c.score, 1), 0);
    let r = Math.random() * total;
    for (const c of list) { r -= Math.max(c.score, 1); if (r <= 0) return c; }
    return list[list.length - 1];
  };
  const usedFam = new Set();
  [...PLAYERS].sort((p1, p2) => (candsBy[p2][0]?.score || 0) - (candsBy[p1][0]?.score || 0)).forEach(p => {
    let pool = candsBy[p].filter(c => !usedFam.has(fam(c)));
    if (!pool.length) pool = candsBy[p];
    const real = pool.filter(c => !c.neutral);
    if (real.length) pool = real;
    if (pool.length > 1 && lastReportPick[p]) {                 // 避免連按跳出同一則
      const fresh = pool.filter(c => c.html !== lastReportPick[p]);
      if (fresh.length) pool = fresh;
    }
    const choice = pool.length ? weightedPick(pool) : candsBy[p][0];
    picked[p] = choice;
    lastReportPick[p] = choice.html;
    if (choice && !choice.neutral) usedFam.add(fam(choice));
  });

  const insights = PLAYERS.map(p => {
    const ins = picked[p];
    return `<div class="ri">
        <span class="dot ${lc(p)}"></span>
        <span class="txt"><span class="nm ${lc(p)}">${esc(p)}</span><span class="msg${ins.neutral ? ' neutral' : ''}">${ins.html}</span></span>
      </div>`;
  }).join('');

  const s = scheduleSuggestion();
  const bal = s.pairs.map(pr =>
    `<span class="${pr.k === s.best.k ? 'hl' : ''}">${pr.x[0]}-${pr.y[0]} ${pr.c}</span>`
  ).join(' · ');
  const evenNote = s.pairs.every(pr => pr.c === s.best.c)
    ? '大家場次已很平均，隨便打都行'
    : '打這場能拉平大家的場次';

  return `<div class="card report-card" id="report-card" onclick="shuffleReport()">
      <div class="report-head"><span class="t">戰報<span class="sub">近 ${RECENT_N} 場</span></span><span class="report-shuffle">↻ 換一則</span></div>
      <div class="report-insights">${insights}</div>
      <div class="report-div"></div>
      <div class="report-sched">
        <div class="sched-label">下一場建議</div>
        <div class="sched-match"><span class="nm ${lc(s.best.x)}">${esc(s.best.x)}</span><span class="vs">vs</span><span class="nm ${lc(s.best.y)}">${esc(s.best.y)}</span></div>
        <div class="sched-bal">目前場次　${bal}</div>
        <div class="sched-note">${evenNote}</div>
      </div>
    </div>`;
}

// 點戰報卡片：純前端重算，只換卡片那塊 DOM（不連網）
function shuffleReport() {
  const el = document.getElementById('report-card');
  if (el) el.outerHTML = reportCard();
}

function viewHome() {
  if (!DATA.games.length) return `<div class="empty">還沒有任何對戰紀錄，貼 box score 給 Claude 就會出現在這。</div>`;
  return `
    ${reportCard()}
    ${standingsCard()}
    ${compareCard()}
    <div class="section-title">近期對戰</div>
    ${DATA.games.slice(0, 4).map(gameCard).join('')}
  `;
}

function compareCard() {
  const t = playerTotals();
  const eraNum = (p) => t[p].outs > 0 ? t[p].er * 27 / t[p].outs : null;
  const avgRun = (p) => t[p].games ? t[p].runs / t[p].games : 0;
  const P_CLR = ['s', 'a', 'v'];

  const stats = [
    { lab: '累積安打', vals: PLAYERS.map(p => t[p].h) },
    { lab: '累積全壘打', vals: PLAYERS.map(p => t[p].hr) },
    { lab: '累積三振（投手）', vals: PLAYERS.map(p => t[p].so) },
    { lab: '平均得分', vals: PLAYERS.map(p => avgRun(p)), dp: 1 },
    { lab: '團隊 ERA', vals: PLAYERS.map(p => eraNum(p)), dp: 2, lowerBetter: true }
  ];

  const rows = stats.map(st => {
    const fmt = (v) => v == null ? '—' : (st.dp != null ? v.toFixed(st.dp) : v);

    // 找領先者（有效值中最佳，不並列才標色）
    const valid = st.vals.map((v, i) => v != null ? { v, i } : null).filter(Boolean);
    let leaderIdx = -1;
    if (valid.length > 0) {
      const best = st.lowerBetter
        ? valid.reduce((b, c) => c.v < b.v ? c : b)
        : valid.reduce((b, c) => c.v > b.v ? c : b);
      if (valid.filter(x => x.v === best.v).length === 1) leaderIdx = best.i;
    }

    // 長條比例（lowerBetter 用倒數加權）
    const barW = st.vals.map(v => v == null ? 0 : st.lowerBetter ? (v > 0 ? 1 / v : 0) : v);
    const total = barW.reduce((s, v) => s + v, 0);
    const pcts = total > 0 ? barW.map(v => v / total * 100) : barW.map(() => 100 / PLAYERS.length);

    const cols = PLAYERS.map((p, i) => `
      <div class="cmp-col${leaderIdx === i ? ' lead-' + P_CLR[i] : ''}">
        <span class="v">${fmt(st.vals[i])}</span>
        <span class="pname ${P_CLR[i]}">${p}</span>
      </div>`).join('');

    const segs = PLAYERS.map((p, i) =>
      `<span class="seg-${P_CLR[i]}" style="width:${pcts[i].toFixed(1)}%"></span>`
    ).join('');

    return `<div class="cmp-stat">
        <div class="cmp-lab">${st.lab}</div>
        <div class="cmp-cols">${cols}</div>
        <div class="cmp-bar">${segs}</div>
      </div>`;
  }).join('');

  return `<div class="card compare">
      <div class="cmp-title">數據對比</div>
      ${rows}
    </div>`;
}

function gameCard(g) {
  const sideHtml = (s) => {
    const won = g.winner === s.player;
    return `<div class="gc-side ${won ? 'win' : ''}">
        <span class="tcolor" style="background:${teamColor(s.team)}"></span>
        <span class="who"><span class="pl">${esc(s.player)}</span><span class="tm">${esc(s.team)}</span></span>
        <span class="score mono">${s.runs}</span>
      </div>`;
  };
  // away 在上、home 在下
  const ordered = [...g.sides].sort((a, b) => a.homeAway === 'away' ? -1 : 1);
  return `<div class="card game-card" onclick="location.hash='#/game/${g.id}'">
      <div class="gc-date">${fmtDate(g.date)}</div>
      ${ordered.map(sideHtml).join('')}
    </div>`;
}

let gamesFilter = null; // null = 全部，或 ['Scott','Alvin'] 等

function viewGames() {
  if (!DATA.games.length) return `<div class="empty">還沒有任何對戰紀錄。</div>`;

  // 找出實際存在的對戰組合
  const pairs = [
    ['Scott','Alvin'], ['Scott','Vincent'], ['Alvin','Vincent']
  ].filter(([a, b]) => DATA.games.some(g => {
    const ps = g.sides.map(s => s.player);
    return ps.includes(a) && ps.includes(b);
  }));

  const filtered = gamesFilter
    ? DATA.games.filter(g => {
        const ps = g.sides.map(s => s.player);
        return ps.includes(gamesFilter[0]) && ps.includes(gamesFilter[1]);
      })
    : DATA.games;

  const chips = `<div class="filter-chips">
    <button class="chip${!gamesFilter ? ' active' : ''}" onclick="setGamesFilter(null)">全部</button>
    ${pairs.map(([a, b]) => {
      const active = gamesFilter && gamesFilter[0] === a && gamesFilter[1] === b;
      return `<button class="chip${active ? ' active' : ''}" onclick="setGamesFilter(['${a}','${b}'])">${a} vs ${b}</button>`;
    }).join('')}
  </div>`;

  return `${chips}<div class="section-title">對戰（${filtered.length} 場）</div>${filtered.map(gameCard).join('')}`;
}
function setGamesFilter(f) { gamesFilter = f; render(); }

function viewGame(id) {
  const g = DATA.games.find(x => x.id === id);
  if (!g) return `<div class="empty">找不到這場比賽。</div>`;
  const ordered = [...g.sides].sort((a, b) => a.homeAway === 'away' ? -1 : 1);

  const headLine = (s) => `<div class="dh-line ${g.winner === s.player ? 'win' : ''}">
      <span class="tcolor" style="background:${teamColor(s.team)}"></span>
      <span class="lbl"><span class="pl">${esc(s.player)}</span><span class="tm">${esc(s.teamFull || s.team)}</span></span>
      <span class="runs mono">${s.runs}</span>
    </div>`;

  // 逐局比分
  const innCount = Math.max(...ordered.map(s => s.innings.length), 9);
  const lsHead = `<tr><th class="team"></th>${Array.from({ length: innCount }, (_, i) => `<th>${i + 1}</th>`).join('')}<th class="sep">R</th><th>H</th><th>E</th></tr>`;
  const lsRow = (s) => `<tr>
      <td class="team">${esc(s.team)}</td>
      ${Array.from({ length: innCount }, (_, i) => `<td>${s.innings[i] ?? ''}</td>`).join('')}
      <td class="rhe sep">${s.runs}</td><td class="rhe">${s.hits}</td><td class="rhe">${s.errors}</td>
    </tr>`;

  const battingTable = (s) => {
    const t = s.batting.reduce((a, b) => ({ ab: a.ab + b.ab, r: a.r + b.r, h: a.h + b.h, hr: a.hr + (b.hr || 0), rbi: a.rbi + b.rbi, bb: a.bb + b.bb, so: a.so + b.so }), { ab: 0, r: 0, h: 0, hr: 0, rbi: 0, bb: 0, so: 0 });
    return `<div class="box-team">
      <h3><span class="tcolor" style="background:${teamColor(s.team)}"></span>${esc(s.team)} 打擊</h3>
      <div class="tbl-scroll"><table class="stats">
        <thead><tr><th class="l">球員</th><th class="n">AB</th><th class="n">R</th><th class="n">H</th><th class="n">HR</th><th class="n">RBI</th><th class="n">BB</th><th class="n">SO</th><th class="n">AVG</th></tr></thead>
        <tbody>
        ${s.batting.map(b => `<tr>
          <td class="l player">${esc(b.name)}<span class="pos">${esc(b.pos || '')}</span></td>
          <td class="n">${b.ab}</td><td class="n">${b.r}</td><td class="n ${b.h ? 'hl' : ''}">${b.h}</td>
          <td class="n ${b.hr ? 'hl' : ''}">${b.hr || 0}</td>
          <td class="n">${b.rbi}</td><td class="n">${b.bb}</td><td class="n">${b.so}</td>
          <td class="n">${avg(b.h, b.ab)}</td></tr>`).join('')}
        <tr class="totals"><td class="l">合計</td><td class="n">${t.ab}</td><td class="n">${t.r}</td><td class="n">${t.h}</td><td class="n">${t.hr || ''}</td><td class="n">${t.rbi}</td><td class="n">${t.bb}</td><td class="n">${t.so}</td><td class="n"></td></tr>
        </tbody>
      </table></div>
    </div>`;
  };

  const pitchingTable = (s) => `<div class="box-team">
      <h3><span class="tcolor" style="background:${teamColor(s.team)}"></span>${esc(s.team)} 投手</h3>
      <div class="tbl-scroll"><table class="stats">
        <thead><tr><th class="l">投手</th><th class="n">IP</th><th class="n">H</th><th class="n">R</th><th class="n">ER</th><th class="n">BB</th><th class="n">SO</th><th class="n">ERA</th></tr></thead>
        <tbody>
        ${s.pitching.map(p => `<tr>
          <td class="l player">${esc(p.name)}${p.decision ? `<span class="pos">(${p.decision}${p.record ? ', ' + p.record : ''})</span>` : ''}</td>
          <td class="n">${p.ip}</td><td class="n">${p.h}</td><td class="n">${p.r}</td><td class="n">${p.er}</td>
          <td class="n">${p.bb}</td><td class="n ${p.so ? 'hl' : ''}">${p.so}</td>
          <td class="n">${era(p.er, ipToOuts(p.ip))}</td></tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;

  const n = g.notes || {};
  const notesBits = [];
  if (n.hr?.length) notesBits.push(`<b>全壘打</b> ${n.hr.map(esc).join('、')}`);
  if (n.sb?.length) notesBits.push(`<b>盜壘</b> ${n.sb.map(x => esc(x.name) + (x.count > 1 ? ` ×${x.count}` : '')).join('、')}`);
  if (n.errors?.length) notesBits.push(`<b>失誤</b> ${n.errors.map(esc).join('、')}`);

  return `
    <div class="back" onclick="history.back()">← 返回</div>
    <div class="card detail-head">
      ${ordered.map(headLine).join('')}
      ${g.playerOfGame ? `<div class="pog">★ 單場最佳：${esc(g.playerOfGame.name)}（${esc(g.playerOfGame.team)}）</div>` : ''}
    </div>
    <div class="linescore-wrap"><table class="linescore">${lsHead}${ordered.map(lsRow).join('')}</table></div>
    <div class="scroll-hint">← 表格可左右滑動看完整數據 →</div>
    ${ordered.map(battingTable).join('')}
    ${ordered.map(pitchingTable).join('')}
    ${notesBits.length ? `<div class="notes-line">${notesBits.join(' &nbsp;·&nbsp; ')}</div>` : ''}
  `;
}

const P_DOT_CLS = { Scott: 'scott', Alvin: 'alvin', Vincent: 'vincent' };
const chevronSvg = `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

function viewTeams() {
  const byPlayer = teamRecordsByPlayer();
  const hasAny = PLAYERS.some(p => byPlayer[p]?.length);
  if (!hasAny) return `<div class="empty">還沒有隊伍資料，記錄比賽後就會出現。</div>`;

  const section = (player, idx) => {
    const recs = byPlayer[player] || [];
    const dotCls = P_DOT_CLS[player] || '';
    const content = recs.length
      ? `<div class="tbl-card"><div class="tbl-scroll"><table class="rank">
          <thead><tr><th class="l">隊伍</th><th>場次</th><th>勝</th><th>敗</th><th>勝率</th><th>得分</th><th>失分</th></tr></thead>
          <tbody>${recs.map(r => `<tr>
            <td class="l name"><span class="tcolor" style="background:${teamColor(r.team)}"></span>${esc(r.team)}</td>
            <td class="num">${r.gp}</td><td class="num">${r.w}</td><td class="num">${r.l}</td>
            <td class="num">${(r.w / r.gp).toFixed(3).replace(/^0/, '')}</td>
            <td class="num">${r.rs}</td><td class="num">${r.ra}</td></tr>`).join('')}
          </tbody>
        </table></div></div>`
      : `<div class="empty">還沒有 ${esc(player)} 的比賽。</div>`;

    return `<details class="player-section" ${idx === 0 ? 'open' : ''}>
      <summary class="player-section-hd">
        <span class="s-dot ${dotCls}"></span>${esc(player)}${chevronSvg}
      </summary>
      ${content}
    </details>`;
  };

  return PLAYERS.map((p, i) => section(p, i)).join('');
}

let playerTab = 'bat';
function viewPlayers() {
  const bat = battingByOwner(), pit = pitchingByOwner();
  const hasAny = PLAYERS.some(p => bat[p]?.length || pit[p]?.length);
  if (!hasAny) return `<div class="empty">還沒有球員資料。</div>`;

  const playerLink = (name) => {
    const url = mlbUrl(name);
    if (!url) return `<span class="player-link missing">${esc(name)}</span>`;
    return `<a class="player-link" href="${url}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`;
  };

  const batTable = (rows) => `<div class="tbl-card"><div class="tbl-scroll"><table class="rank">
      <thead><tr><th class="l">球員</th><th>G</th><th>AB</th><th>H</th><th>HR</th><th>RBI</th><th>R</th><th>BB</th><th>SO</th><th>AVG</th></tr></thead>
      <tbody>${rows.map(p => `<tr>
        <td class="l name">${playerLink(p.name)}<span class="team-tag">${esc(p.team)}</span></td>
        <td class="num">${p.g}</td><td class="num">${p.ab}</td><td class="num">${p.h}</td>
        <td class="num">${p.hr}</td><td class="num">${p.rbi}</td><td class="num">${p.r}</td>
        <td class="num">${p.bb}</td><td class="num">${p.so}</td><td class="num">${avg(p.h, p.ab)}</td></tr>`).join('')}
      </tbody></table></div></div>`;

  const pitTable = (rows) => `<div class="tbl-card"><div class="tbl-scroll"><table class="rank">
      <thead><tr><th class="l">投手</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SO</th><th>BB</th><th>H</th><th>ER</th><th>ERA</th></tr></thead>
      <tbody>${rows.map(p => `<tr>
        <td class="l name">${playerLink(p.name)}</td>
        <td class="num">${p.g}</td><td class="num">${outsToIp(p.outs)}</td><td class="num">${p.w}</td>
        <td class="num">${p.l}</td><td class="num">${p.so}</td><td class="num">${p.bb}</td>
        <td class="num">${p.h}</td><td class="num">${p.er}</td><td class="num">${era(p.er, p.outs)}</td></tr>`).join('')}
      </tbody></table></div></div>`;

  const section = (player, idx) => {
    const rows = playerTab === 'bat' ? (bat[player] || []) : (pit[player] || []);
    const dotCls = P_DOT_CLS[player] || '';
    const content = rows.length
      ? (playerTab === 'bat' ? batTable(rows) : pitTable(rows))
      : `<div class="empty">還沒有 ${esc(player)} 的${playerTab === 'bat' ? '打擊' : '投球'}資料。</div>`;

    return `<details class="player-section" ${idx === 0 ? 'open' : ''}>
      <summary class="player-section-hd">
        <span class="s-dot ${dotCls}"></span>${esc(player)}${chevronSvg}
      </summary>
      ${content}
    </details>`;
  };

  return `<div class="toggle">
      <button class="${playerTab === 'bat' ? 'active' : ''}" onclick="setPlayerTab('bat')">打擊</button>
      <button class="${playerTab === 'pit' ? 'active' : ''}" onclick="setPlayerTab('pit')">投球</button>
    </div>
    ${PLAYERS.map((p, i) => section(p, i)).join('')}`;
}
function setPlayerTab(t) { playerTab = t; render(); }

/* ---------- Player detail modal ---------- */
function showPlayer(name) {
  const bat = battingByOwner(), pit = pitchingByOwner();
  const P_CLR = { Scott: 'scott', Alvin: 'alvin', Vincent: 'vincent' };

  const batRows = PLAYERS.map(p => ({ owner: p, d: bat[p]?.find(b => b.name === name) })).filter(x => x.d);
  const pitRows = PLAYERS.map(p => ({ owner: p, d: pit[p]?.find(b => b.name === name) })).filter(x => x.d);
  if (!batRows.length && !pitRows.length) return;

  const team = batRows[0]?.d.team || pitRows[0]?.d.team || '';
  const url  = mlbUrl(name);
  const id   = MLB_IDS[name];
  const photo = id ? `<img class="pm-photo" src="https://img.mlb.com/headshots/current/60x60/${id}@2x.jpg" onerror="this.style.display='none'" alt="" />` : '';

  const ownerBlock = (owner, stats, fields) => `
    <div class="pm-owner-block">
      <div class="pm-owner-label"><span class="s-dot ${P_CLR[owner] || ''}"></span>${esc(owner)}</div>
      <div class="pm-stats-grid">
        ${fields.map(f => `<div class="pm-stat"><span class="pm-v">${f.v(stats)}</span><span class="pm-l">${f.l}</span></div>`).join('')}
      </div>
    </div>`;

  const batFields = [
    { l:'G',   v: d => d.g },
    { l:'AB',  v: d => d.ab },
    { l:'H',   v: d => d.h },
    { l:'HR',  v: d => d.hr || 0 },
    { l:'RBI', v: d => d.rbi },
    { l:'AVG', v: d => avg(d.h, d.ab) },
  ];
  const pitFields = [
    { l:'G',   v: d => d.g },
    { l:'IP',  v: d => outsToIp(d.outs) },
    { l:'W',   v: d => d.w },
    { l:'L',   v: d => d.l },
    { l:'SO',  v: d => d.so },
    { l:'ERA', v: d => era(d.er, d.outs) },
  ];

  let html = `
    <div class="pm-handle"></div>
    <div class="pm-header">
      ${photo}
      <div>
        <div class="pm-name">${esc(name)}</div>
        <div class="pm-team">${esc(team)}</div>
      </div>
    </div>`;

  if (batRows.length) {
    html += `<div class="pm-section-title">打擊數據</div>`;
    html += batRows.map(({ owner, d }) => ownerBlock(owner, d, batFields)).join('');
  }
  if (pitRows.length) {
    html += `<div class="pm-section-title">投球數據</div>`;
    html += pitRows.map(({ owner, d }) => ownerBlock(owner, d, pitFields)).join('');
  }
  if (url) html += `<a class="pm-mlb-btn" href="${url}" target="_blank" rel="noopener">查看 MLB 官網 →</a>`;

  document.getElementById('pm-sheet').innerHTML = html;
  document.getElementById('pm-modal').classList.add('open');
}

function closePlayer() {
  document.getElementById('pm-modal').classList.remove('open');
}

/* ---------- router ---------- */
function render() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/');
  let html, route = 'home';
  if (parts[0] === 'game' && parts[1]) { html = viewGame(parts[1]); route = 'games'; }
  else if (parts[0] === 'games') { html = viewGames(); route = 'games'; }
  else if (parts[0] === 'teams') { html = viewTeams(); route = 'teams'; }
  else if (parts[0] === 'players') { html = viewPlayers(); route = 'players'; }
  else { html = viewHome(); route = 'home'; }

  app().innerHTML = html;
  document.querySelectorAll('nav a[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  window.scrollTo(0, 0);
}

async function refreshApp() {
  const btn = document.querySelector('.refresh-btn');
  if (btn) btn.classList.add('spinning');
  try {
    const res = await fetch('/api/games');
    DATA = await res.json();
    render();
  } catch (e) {
    app().innerHTML = `<div class="empty">資料載入失敗：${esc(e.message)}</div>`;
  }
  if (btn) setTimeout(() => btn.classList.remove('spinning'), 500);
}

async function boot() {
  try {
    const res = await fetch('/api/games');
    DATA = await res.json();
  } catch (e) {
    app().innerHTML = `<div class="empty">資料載入失敗：${esc(e.message)}</div>`;
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}
boot();
