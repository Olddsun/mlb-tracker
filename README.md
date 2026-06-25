# E-Sport League — Scott vs Alvin

Scott 與 Alvin 的電競對戰聯盟，記錄對戰結果與數據。目前為 MLB The Show，未來會加入 NBA 2K。純靜態網站，部署於 GitHub Pages，可加入 iPhone 主畫面當 app。

**線上網址**：https://olddsun.github.io/mlb-tracker/

## 結構

```
index.html        主頁（單頁應用，hash 路由）
css/styles.css    深色廣播風樣式（mobile-first）
js/app.js         讀取 data/games.json 並渲染所有頁面與統計
data/games.json   所有比賽資料（唯一要更新的檔案）
scripts/validate-games.js  檢查 games.json 是否有匯入錯誤
```

## 如何新增一場比賽

1. 截下 5 張 box score（總成績 / A 隊打擊 / A 隊投手 / B 隊打擊 / B 隊投手）
2. 把圖交給 Claude，並說明對戰組合（誰用哪一隊）
3. Claude 解析後寫進 `data/games.json`，commit + push
4. GitHub Pages 自動更新

### AI 匯入檢查

每次從截圖新增或修改 `data/games.json` 後，都要先跑：

```bash
npm run validate
```

這個檢查會擋下常見匯入錯誤：

- JSON 格式錯誤
- 比賽 `id` 重複
- `winner` 與比分不一致
- 每局得分加總與總分不一致
- 打者安打 / 得分加總與球隊總計不一致
- 投手失分與對手得分不一致
- 投球局數格式錯誤（例如必須是 `7.1`、`9.0`）
- 玩家、主客場、必要欄位缺漏

## 資料格式重點

- `baseline`：開始記錄前的歷史勝負（無逐場數據）
- 每場 `sides` 有兩方，各含 `batting` / `pitching` 陣列
- 隊伍戰績與球員數據都**依玩家分開**累積（Scott 的洋基 ≠ Alvin 的洋基）
- 只新增比賽資料時通常不用改 `sw.js`；改 UI / JS / CSS 時才需要遞增 `CACHE_VERSION`
