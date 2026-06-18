# MLB The Show 對戰紀錄 — Scott vs Alvin

兩人單挑 MLB The Show 的對戰結果與數據紀錄。純靜態網站，部署於 GitHub Pages。

**線上網址**：https://olddsun.github.io/mlb-tracker/

## 結構

```
index.html        主頁（單頁應用，hash 路由）
css/styles.css    深色廣播風樣式（mobile-first）
js/app.js         讀取 data/games.json 並渲染所有頁面與統計
data/games.json   所有比賽資料（唯一要更新的檔案）
```

## 如何新增一場比賽

1. 截下 5 張 box score（總成績 / A 隊打擊 / A 隊投手 / B 隊打擊 / B 隊投手）
2. 把圖交給 Claude，並說明對戰組合（誰用哪一隊）
3. Claude 解析後寫進 `data/games.json`，commit + push
4. GitHub Pages 自動更新

## 資料格式重點

- `baseline`：開始記錄前的歷史勝負（無逐場數據）
- 每場 `sides` 有兩方，各含 `batting` / `pitching` 陣列
- 隊伍戰績與球員數據都**依玩家分開**累積（Scott 的洋基 ≠ Alvin 的洋基）
