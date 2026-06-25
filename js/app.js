/* ============ MLB The Show Tracker — app logic ============ */

const PLAYERS = ['Scott', 'Alvin', 'Vincent'];

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
  const losses = {};
  PLAYERS.forEach(p => losses[p] = DATA.baseline?.losses?.[p] || 0);
  DATA.games.forEach(g => PLAYERS.forEach(p => {
    if (g.sides.some(s => s.player === p) && g.winner !== p) losses[p]++;
  }));

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

  return `<div class="card standings-card">
    <table class="standings-tbl">
      <thead><tr>
        <th class="sl">玩家</th>
        <th>W</th><th>L</th><th>PCT</th><th>GB</th><th>STRK</th>
      </tr></thead>
      <tbody>
        ${rows.map(r => `<tr>
          <td class="sl"><div class="pl-row"><span class="s-dot ${P_CLR[r.p] || ''}"></span>${esc(r.p)}</div></td>
          <td>${r.w}</td><td>${r.l}</td>
          <td class="mono">${fmtPct(r.pct)}</td>
          <td class="mono gb">${gbStr(r)}</td>
          <td class="mono strk ${streakStr(r.p).startsWith('W') ? 'strk-w' : streakStr(r.p).startsWith('L') ? 'strk-l' : ''}">${streakStr(r.p)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function viewHome() {
  if (!DATA.games.length) return `<div class="empty">還沒有任何對戰紀錄，貼 box score 給 Claude 就會出現在這。</div>`;
  return `
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

function viewGames() {
  if (!DATA.games.length) return `<div class="empty">還沒有任何對戰紀錄。</div>`;
  return `<div class="section-title">全部對戰（${DATA.games.length} 場）</div>${DATA.games.map(gameCard).join('')}`;
}

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
    const t = s.batting.reduce((a, b) => ({ ab: a.ab + b.ab, r: a.r + b.r, h: a.h + b.h, rbi: a.rbi + b.rbi, bb: a.bb + b.bb, so: a.so + b.so }), { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0 });
    return `<div class="box-team">
      <h3><span class="tcolor" style="background:${teamColor(s.team)}"></span>${esc(s.team)} 打擊</h3>
      <div class="tbl-scroll"><table class="stats">
        <thead><tr><th class="l">球員</th><th class="n">AB</th><th class="n">R</th><th class="n">H</th><th class="n">RBI</th><th class="n">BB</th><th class="n">SO</th><th class="n">AVG</th></tr></thead>
        <tbody>
        ${s.batting.map(b => `<tr>
          <td class="l player">${esc(b.name)}<span class="pos">${esc(b.pos || '')}</span>${b.hr ? `<span class="hr-tag">HR${b.hr > 1 ? '×' + b.hr : ''}</span>` : ''}</td>
          <td class="n">${b.ab}</td><td class="n">${b.r}</td><td class="n ${b.h ? 'hl' : ''}">${b.h}</td>
          <td class="n">${b.rbi}</td><td class="n">${b.bb}</td><td class="n">${b.so}</td>
          <td class="n">${avg(b.h, b.ab)}</td></tr>`).join('')}
        <tr class="totals"><td class="l">合計</td><td class="n">${t.ab}</td><td class="n">${t.r}</td><td class="n">${t.h}</td><td class="n">${t.rbi}</td><td class="n">${t.bb}</td><td class="n">${t.so}</td><td class="n"></td></tr>
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

function viewTeams() {
  const byPlayer = teamRecordsByPlayer();
  const hasAny = PLAYERS.some(p => byPlayer[p]?.length);
  if (!hasAny) return `<div class="empty">還沒有隊伍資料，記錄比賽後就會出現。</div>`;

  const section = (player) => {
    const recs = byPlayer[player] || [];
    if (!recs.length) return `<div class="section-title">${esc(player)} 的隊伍</div><div class="empty" style="padding:24px">還沒有 ${esc(player)} 的比賽。</div>`;
    return `<div class="section-title">${esc(player)} 的隊伍</div>
      <div class="tbl-card"><div class="tbl-scroll"><table class="rank">
        <thead><tr><th class="l">隊伍</th><th>場次</th><th>勝</th><th>敗</th><th>勝率</th><th>得分</th><th>失分</th></tr></thead>
        <tbody>${recs.map(r => `<tr>
          <td class="l name"><span class="tcolor" style="background:${teamColor(r.team)}"></span>${esc(r.team)}</td>
          <td class="num">${r.gp}</td><td class="num">${r.w}</td><td class="num">${r.l}</td>
          <td class="num">${(r.w / r.gp).toFixed(3).replace(/^0/, '')}</td>
          <td class="num">${r.rs}</td><td class="num">${r.ra}</td></tr>`).join('')}
        </tbody>
      </table></div></div>`;
  };
  return PLAYERS.map(section).join('');
}

let playerTab = 'bat';
function viewPlayers() {
  const bat = battingByOwner(), pit = pitchingByOwner();
  const hasAny = PLAYERS.some(p => bat[p]?.length || pit[p]?.length);
  if (!hasAny) return `<div class="empty">還沒有球員資料。</div>`;

  const batTable = (rows) => `<div class="tbl-card"><div class="tbl-scroll"><table class="rank">
      <thead><tr><th class="l">球員</th><th>G</th><th>AB</th><th>H</th><th>HR</th><th>RBI</th><th>R</th><th>BB</th><th>SO</th><th>AVG</th></tr></thead>
      <tbody>${rows.map(p => `<tr>
        <td class="l name">${esc(p.name)}<span class="team-tag">${esc(p.team)}</span></td>
        <td class="num">${p.g}</td><td class="num">${p.ab}</td><td class="num">${p.h}</td>
        <td class="num">${p.hr}</td><td class="num">${p.rbi}</td><td class="num">${p.r}</td>
        <td class="num">${p.bb}</td><td class="num">${p.so}</td><td class="num">${avg(p.h, p.ab)}</td></tr>`).join('')}
      </tbody></table></div></div>`;

  const pitTable = (rows) => `<div class="tbl-card"><div class="tbl-scroll"><table class="rank">
      <thead><tr><th class="l">投手</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SO</th><th>BB</th><th>H</th><th>ER</th><th>ERA</th></tr></thead>
      <tbody>${rows.map(p => `<tr>
        <td class="l name">${esc(p.name)}</td>
        <td class="num">${p.g}</td><td class="num">${outsToIp(p.outs)}</td><td class="num">${p.w}</td>
        <td class="num">${p.l}</td><td class="num">${p.so}</td><td class="num">${p.bb}</td>
        <td class="num">${p.h}</td><td class="num">${p.er}</td><td class="num">${era(p.er, p.outs)}</td></tr>`).join('')}
      </tbody></table></div></div>`;

  const section = (player) => {
    const rows = playerTab === 'bat' ? (bat[player] || []) : (pit[player] || []);
    if (!rows.length) return `<div class="section-title">${esc(player)}</div><div class="empty" style="padding:24px">還沒有 ${esc(player)} 的${playerTab === 'bat' ? '打擊' : '投球'}資料。</div>`;
    return `<div class="section-title">${esc(player)}</div>${playerTab === 'bat' ? batTable(rows) : pitTable(rows)}`;
  };

  return `<div class="toggle">
      <button class="${playerTab === 'bat' ? 'active' : ''}" onclick="setPlayerTab('bat')">打擊</button>
      <button class="${playerTab === 'pit' ? 'active' : ''}" onclick="setPlayerTab('pit')">投球</button>
    </div>
    ${PLAYERS.map(section).join('')}`;
}
function setPlayerTab(t) { playerTab = t; render(); }

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

async function boot() {
  try {
    const res = await fetch('data/games.json?_=' + Date.now());
    DATA = await res.json();
    DATA.games.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1)));
  } catch (e) {
    app().innerHTML = `<div class="empty">資料載入失敗：${esc(e.message)}</div>`;
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}
boot();
