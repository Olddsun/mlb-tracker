-- NBA 2K 支援：game_sides 加一個 JSONB 欄位放球隊整場數據
-- （games.sport 本來就是 TEXT 無約束，直接存 'nba2k' 不用改）
-- 執行方式：Supabase Dashboard → SQL Editor → 貼上執行

ALTER TABLE game_sides ADD COLUMN IF NOT EXISTS stats JSONB;
