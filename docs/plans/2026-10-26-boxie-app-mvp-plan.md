# Boxie App MVP 實作企劃（2026-10-26，給 Opus 無人看管執行 4 小時）

> 目標：用 Expo 做一個 iOS App，功能照現在的網站 https://esl-bd5.pages.dev （E-Sport League）。後端一行都不改，App 直接打現有的 API。
> Scott 睡覺中，四小時後回來看成果。你要**自己驗證、自己 debug、自己寫報告**。做不完的明講，不要硬湊。

## 0. 開工前必讀與鐵律
1. 先讀 `~/.claude/guides/work-rules.md`。
2. **每個 shell 指令前都加** `export PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH"`（系統 Node 25 跑 Expo 會炸；非互動 shell 的 nvm use 不會生效，直接指路徑）。
3. **禁止**：`eas init`／`eas build`／`eas update`／任何 EAS 指令（EAS 現在登入的是 ivey 的帳號 artzy，Boxie 要用 Scott 自己的，等他回來）；`git push`／建 GitHub repo；改 `~/Claude/mlb-tracker`、Supabase、Cloudflare 任何東西；安裝需要原生編譯的套件（見 §2）。
4. 付費 API：線上 `/api/submit-game` 每打一次約 NT$1.5，**最多打 2 次**（§6.4），其他用假資料。
5. 同一個錯誤試 3 種修法沒過 → 寫進報告、跳下一個里程碑，不要卡死。
6. UI 一律 mobile-first、深色；做 UI 前跑一次 `/ui-ux-pro-max`（查「mobile tab bar dark data table」即可，不用 design-system）。卡片／提示塊不加左側直條。
7. 每個里程碑結束：§6 驗證全過 → commit（指名檔案，不用 `git add -A`；scaffold 那一次可以 `git add .`）。
8. 時間分配（總 4 小時）：M0 30 分、M1 60 分、M2 45 分、M3 60 分、M4 剩餘、最後 **20 分鐘保留給 §8 報告**。超時就砍 P1。

## 1. 範圍
### P0（一定要有，照網站）
| 網站 | App |
|---|---|
| 總覽：戰績表（W L PCT GB STRK RS RA DIFF HOME AWAY） | 分頁「總覽」 |
| 總覽：數據對比卡（每項數據的直向排行、距龍頭差距） | 分頁「總覽」下方 |
| 對戰列表（搜尋、卡片）＋單場詳情（逐局表、兩隊打擊／投手表、HR/SB/E、單場最佳、刪除） | 分頁「對戰」＋ `/game/[id]` |
| 隊伍戰績（每位玩家用過的隊伍：G W L PCT 得分 失分） | 分頁「隊伍」 |
| 球員數據（打者／投手兩個 tab，依玩家分組的生涯累計；點球員看逐場） | 分頁「球員」 |
| ⚾／🏀 切換（兩種運動的戰績、對戰、隊伍完全分開；籃球戰績表 RS/RA 顯示 PF/PA） | 總覽頂部 segmented，全域狀態 |
| 提交：選截圖（多張）→ AI 解析（最多約 1 分鐘）→ 核對（警示、比分、指定兩隊玩家含「新增玩家」、打者 AB R H RBI BB SO、投手 IP H R ER BB SO、HR 一行）→ 確認記錄／數據有誤重傳 → 成功頁 | 「＋ 提交」浮動按鈕 → `/submit` |
| 下拉重新整理 | 每個列表分頁 |
### P1（有時間再做）
- 總覽「戰報」卡：近 3 場洞察（規則庫 `insightCandidates` 20+ 條、`weightedPick`、點卡片換一則）＋賽程建議 `scheduleSuggestion`。
- 籃球版戰報 `nbaInsightCandidates`、籃球對比 `nbaCompareCard`、籃球單場 `viewGameNba`（目前線上 0 場籃球，資料格式見 §4.3，先用假資料驗）。
- 運動選擇記在本機（AsyncStorage）。
### 不做
登入、聯盟、推播、Share Extension、Widget、OTA、後端改動、上架設定。這些是下一階段（見 `docs/native-app-spec-20260903.md`）。

## 2. 技術棧（照 ivey Home，Scott 熟）
- Expo SDK 55、expo-router（tabs）、TypeScript strict、vitest、zustand、react-native-safe-area-context、react-native-screens、react-native-svg。
- 圖片：`expo-image-picker`（多選）、`expo-image-manipulator`（縮到寬 1600、JPEG 0.82，跟網站 `submit/index.html` 第 382–388 行一樣）。
- **只能用 Expo Go 內建的模組**（上面這些都是），不要裝 expo-dev-client、不要裝任何要 prebuild 的套件。原因：Scott 早上要用手機上的 Expo Go 掃 QR 直接看，不經過 build。
- 建專案：`cd ~/Claude && npx create-expo-app@latest boxie --template default@sdk-55`（模板名若不對，`npx create-expo-app@latest --help` 查；重點是 SDK 55＋expo-router＋TS）。把範例畫面清掉。
- `app.json`：name `Boxie`、slug `boxie`、scheme `boxie`、ios.bundleIdentifier `com.boxieleague.app`、深色 `userInterfaceStyle: "dark"`、icon 先用 `~/Claude/mlb-tracker/assets/icon-source.png` 縮成 1024。**不要填 owner／projectId**。
- 專案根目錄要有 `CLAUDE.md`（≤ 60 行：這是什麼、怎麼跑、API 來源、Node 版本坑、禁止事項、測試指令）。

## 3. 架構
```
app/
  _layout.tsx            # Stack，深色主題、SafeArea
  (tabs)/_layout.tsx     # 4 個 tab：總覽 index／對戰 games／隊伍 teams／球員 players ＋ 浮動「＋ 提交」
  (tabs)/index.tsx  games.tsx  teams.tsx  players.tsx
  game/[id].tsx          # 單場詳情（含刪除）
  submit/index.tsx       # 提交三步驟（modal presentation）
src/
  api/client.ts          # fetch 包裝，BASE_URL = https://esl-bd5.pages.dev
  types.ts               # §4 的型別，照 API 原樣
  store.ts               # zustand：games、players、sport、loading/error、refresh()
  lib/stats.ts           # 從網站 js/app.js 移植的純計算（§5），全部純函式、全部有測試
  lib/format.ts          # avg/era/ip/日期（app.js 第 87–95 行）
  theme.ts               # §3.1 色票、radius、字級
  components/            # StandingsTable、GameCard、LineScore、BattingTable、PitchingTable、PlayerPill、SportSwitch、Card、EmptyState、ErrorState…
scripts/parity.mjs       # §6.2 對帳腳本
docs/reports/            # §8 報告與截圖
```
### 3.1 色票（網站 `css/styles.css` 第 5–16 行，照抄）
bg `#0b0f17`、surface `#151b27`、surface2 `#1d2533`、border `#2a3342`、text `#e6edf3`、muted `#8b98a9`、accent `#4f8ef7`、win `#22c55e`、loss `#f05252`、gold `#f5a524`、radius 16。
玩家色：Scott `#4f8ef7`、Alvin `#f5a524`、Vincent `#34d399`，其他玩家（Allen）依序取 `js/app.js` 第 14–24 行的備用色盤。隊伍色 `TEAM_COLORS`（`js/app.js` 第 50–79 行）照搬。

## 4. 資料契約（照線上實際回傳，不要猜）
### 4.1 `GET /api/games`
```ts
{ players: string[];           // 顯示名，例 ["Allen","Alvin","Scott","Vincent"]
  games: Game[] }               // 已依日期新→舊、同日依上傳時間新→舊排好
type Game = { id: string; sport: 'mlb'|'nba2k'; date: string /* YYYY-MM-DD */; winner: string /* 玩家名 */;
  playerOfGame: { name: string; team: string } | null; sides: [Side, Side];
  notes: { hr: string[]; sb: { name: string; count: number }[]; errors: string[] } }
type Side = { player: string; team: string; teamFull: string; homeAway: 'home'|'away'; runs: number; hits: number; errors: number;
  innings: string[] /* 例 ["0","2","0",…,"X"]，可能 >9 局 */; stats: NbaStats | null;
  batting: { name: string; pos: string|null; ab: number; r: number; h: number; rbi: number; bb: number; so: number; hr?: number }[];
  pitching: { name: string; decision: 'W'|'L'|'SV'|'HLD'|'BS'|null; record: string|null; ip: string /* "7.1" 棒球格式 */; h: number; r: number; er: number; bb: number; so: number }[] }
```
注意：`batting` 列的 `hr` 可能沒有（舊資料），全壘打以 `notes.hr`（名字出現幾次＝幾轟）為準，網站就是這樣算的。
### 4.2 `GET /api/players` → `{ players: { id: string; name: string }[] }`
### 4.3 籃球 `Side.stats`（nba2k）
`{ fgm, fga, tpm, tpa, ftm, fta, fastbreak, paint, second_chance, bench, ast, oreb, dreb, stl, blk, to, to_points, fouls, dunks, biggest_lead, possession: "13:14", timeouts }`，籃球沒有 batting/pitching/innings 意義（`runs` 就是得分）。
### 4.4 提交（兩階段，同一個網址）
- 階段一 `POST /api/submit-game`，multipart：欄位 `image_0`、`image_1`…（JPEG，從 0 連號到沒有為止）。
  - 成功：`{ status:'parsed', submissionId, game: DisplayGame, duplicates: string[], needsReview: boolean, uncertainties: string[] }`
  - 失敗：`{ status:'failed', error: string }`（HTTP 200）或 HTTP 4xx/5xx `{ error }`
  - 約 15–60 秒，要顯示「AI 解析中，最多約 1 分鐘，請留在此畫面」。
- 階段二 `POST /api/submit-game`，JSON `{ submissionId, homePlayer: string, awayPlayer: string }`（玩家名，可以是新名字，後端會自動建立）。成功 `{ ok:true, game, warnings: string[] }`；失敗 `{ error }`。
- `DisplayGame = { sport, homePlayer, awayPlayer, homeTeam, awayTeam, homeScore, awayScore, winner, playerOfGame, homeBatting[], awayBatting[], homePitching[], awayPitching[], teamStats }`（batting/pitching 列同 §4.1，batting 多 `hr`）。
- 核對畫面欄位照網站 `submit/index.html` `teamBlock()`：打者 AB R H RBI BB SO、投手 IP H R ER BB SO、打擊表下方一行「HR：名字」、投手名字下一行小字「(BS, 4)」之類的註記；警示（`uncertainties`、`duplicates`）用黃色卡。
### 4.5 刪除 `POST /api/delete-game` JSON `{ id }` → `{ ok:true }` 或 `{ error }`（404＝已不存在）。刪完重抓 `/api/games`。

## 5. 計算邏輯移植（`~/Claude/mlb-tracker/js/app.js`，網站是唯一真相）
全部搬進 `src/lib/stats.ts`，純函式、輸入 `Game[]`＋玩家清單，每個都要有 vitest。先讀原碼再寫，不要憑印象。
P0：`computePlayers`（6）、`playerColor`（17）、`headToHead`（98）、`recentForm`（107）、`playerTotals`（112）、`teamRecordsByPlayer`（126）、`battingByOwner`（143）、`pitchingByOwner`（163）、戰績表的勝率／GB／連勝／主客（`standingsCard` 180–260 內的計算部分）、`careerStats`（297）、`rankMap`（376）、對比卡的統計定義（`compareCard` 635、`lbBlocks` 577 的欄位與排序）、`gameMatches`（888，搜尋）、格式化（87–95）。
P1：`recentGamesOf`／`recentAgg`（264、273）、`h2hAll`（316）、`playerGameEvent`（338）、`streakOf`（363）、`insightCandidates`（386）、`scheduleSuggestion`（455）、`pickInsights`（477）、`nbaTotals`（655）、`nbaRecentAgg`（693）、`nbaInsightCandidates`（718）。
規則：資料依 `sport` 過濾後再算（`applySportFilter` 26）；元老三人固定排前、其餘字母序；「HR」以 notes 為準。

## 6. 自我驗證（每個里程碑都跑，報告要附數字）
### 6.1 基本
`npx tsc --noEmit`（0 錯）→ `npx vitest run`（全過）→ `npx expo export --platform web --output-dir dist-web`（成功）→ `npx expo-doctor`（記下警告）。
### 6.2 對帳（App 的數字＝網站的數字）
寫 `scripts/parity.mjs`：用 `npx tsx` 載入 `src/lib/stats.ts`，抓線上 `/api/games` 算戰績表；再用 headless Chrome `--dump-dom https://esl-bd5.pages.dev/`（指令：`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom <url>`）把網站戰績表的列抓出來，逐玩家比 W／L／RS／RA／PCT。**不一致就是移植錯，改到一致**。籃球目前 0 場不用比。
### 6.3 畫面（每個路由都要有截圖）
把 `dist-web` 用 `python3 -m http.server 8787` 起來（背景、記 PID、結束 kill），用 headless Chrome 截圖。Chrome 最小視窗 500px 量不到手機寬，用包裝頁放 390px 寬的 iframe：
```html
<!doctype html><meta charset="utf-8"><body style="margin:0;background:#333">
<iframe src="/<route>" style="width:390px;height:844px;border:0;display:block"></iframe>
```
`--window-size=500,900 --virtual-time-budget=10000 --screenshot=docs/reports/screens/<route>.png`。路由：`/`、`/games`、`/teams`、`/players`、`/game/<第一場的 id>`、`/submit`。每張用 Read 工具**打開看**：有沒有橫向溢出、文字被切、空白一片、顏色對比。量橫向溢出用 iframe 內 `document.documentElement.scrollWidth`（要 ≤ 390）。
### 6.4 提交流程
- 單元測試：FormData 組裝（`image_0…`）、兩階段回應的狀態機（parsed／failed／error／commit ok／commit error）用假回應測。
- 真打線上端點最多 2 次：用 `~/Downloads/IMG_2379.jpg … IMG_2383.jpg`（2026-09-24 海盜 vs 紅襪那五張；若檔案不在就跳過這步）寫一個 node 腳本 POST 階段一，確認回應格式跟 §4.4 一致、核對畫面能吃。**不要打階段二**（會真的寫入一場比賽）。
- 手機上的實際操作留給 Scott 早上做。

## 7. 里程碑
- **M0 scaffold**：建專案、清範例、theme、types、api client、store、tab 骨架（4 個 tab 都能開、顯示「載入中／空／錯誤」三態）、CLAUDE.md。驗證 §6.1。commit。
- **M1 總覽＋對戰＋單場**：stats P0 移植＋測試、戰績表、對比卡、對戰列表（搜尋）、單場詳情（逐局表、兩隊表、notes、POG、刪除含確認）。驗證 §6.1＋6.2＋6.3。commit。
- **M2 隊伍＋球員＋運動切換**：隊伍戰績、球員數據（兩 tab、點開逐場）、⚾／🏀 全域切換（籃球用假資料 1–2 場塞進測試驗畫面）。驗證。commit。
- **M3 提交**：三步驟、圖片縮圖、兩階段 API、核對畫面七欄、新增玩家、成功頁、錯誤處理、下拉重新整理。驗證 §6.4。commit。
- **M4（有時間）**：P1 戰報卡、籃球戰報、AsyncStorage 記運動。
- **M5 報告**（保留 20 分鐘）：§8。

## 8. 交付（Scott 早上看這個）
1. `~/Claude/boxie/docs/reports/2026-10-26-mvp-report.md`：每個里程碑做了什麼／沒做什麼、tsc／vitest／parity 的實際數字、每張截圖內嵌（相對路徑）、已知問題、§6 跳過的項目與原因、需要 Scott 的事（自己的 Expo 帳號建 EAS 專案、Apple Developer、之後要不要 GitHub repo）。
2. `docs/reports/screens/*.png` 全部路由。
3. 「手機上看」的步驟寫在報告最上面：
   - iPhone 裝 App Store 的 **Expo Go**。
   - 終端機：`cd ~/Claude/boxie && export PATH="$HOME/.nvm/versions/node/v20.20.1/bin:$PATH" && npx expo start`，手機跟 Mac 同一個 Wi-Fi，用 Expo Go 掃 QR；不同網路就加 `--tunnel`（會問要不要裝 ngrok，答 y）。
4. 把報告的「現況」三行摘要同步到記憶 `~/.claude/projects/-Users-chihsun-----/memory/boxie_app.md` 的「現況」段（照 `~/.claude/guides/maintenance.md` 先備份）。
5. git：`~/Claude/boxie` 本機 repo，每個里程碑一個 commit，結尾兩行照 session 規定的署名。**不 push**（還沒有 remote）。

## 9. 完成定義
P0 全部能在 web export 上截到圖且數字與網站一致、tsc 0 錯、vitest 全過、報告寫完。P1 做多少算多少，寫清楚。
