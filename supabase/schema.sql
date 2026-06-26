-- ESL v1 Schema
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────
-- 玩家
-- ─────────────────────────────────────────
CREATE TABLE players (
  id           TEXT PRIMARY KEY,  -- 'scott' | 'alvin' | 'vincent'
  display_name TEXT NOT NULL
);

INSERT INTO players VALUES
  ('scott',   'Scott'),
  ('alvin',   'Alvin'),
  ('vincent', 'Vincent');

-- ─────────────────────────────────────────
-- 比賽主記錄
-- ─────────────────────────────────────────
CREATE TABLE games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id           TEXT UNIQUE,          -- '2026-06-18-01'，遷移用
  played_at           DATE NOT NULL,
  sport               TEXT NOT NULL DEFAULT 'mlb',
  winner_player_id    TEXT NOT NULL REFERENCES players(id),
  player_of_game_name TEXT,
  player_of_game_team TEXT,
  submitted_by        TEXT REFERENCES players(id),
  submission_id       UUID,
  source              TEXT NOT NULL DEFAULT 'ai_submission'
                        CHECK (source IN ('manual_migration', 'ai_submission')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 每場比賽兩隊各一筆
-- ─────────────────────────────────────────
CREATE TABLE game_sides (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id    UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL REFERENCES players(id),
  team_name  TEXT NOT NULL,   -- 'Yankees'
  team_full  TEXT NOT NULL,   -- 'New York Yankees'
  home_away  TEXT NOT NULL CHECK (home_away IN ('home', 'away')),
  runs       INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
  hits       INTEGER NOT NULL DEFAULT 0 CHECK (hits >= 0),
  errors     INTEGER NOT NULL DEFAULT 0 CHECK (errors >= 0),
  innings    JSONB NOT NULL   -- ["0","0","2","0","0","0","0","0","X"]
);

-- ─────────────────────────────────────────
-- 打者成績
-- ─────────────────────────────────────────
CREATE TABLE batting_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_side_id  UUID NOT NULL REFERENCES game_sides(id) ON DELETE CASCADE,
  batting_order INTEGER NOT NULL,
  name          TEXT NOT NULL,
  pos           TEXT,
  ab            INTEGER NOT NULL DEFAULT 0 CHECK (ab >= 0),
  r             INTEGER NOT NULL DEFAULT 0 CHECK (r >= 0),
  h             INTEGER NOT NULL DEFAULT 0 CHECK (h >= 0),
  rbi           INTEGER NOT NULL DEFAULT 0 CHECK (rbi >= 0),
  bb            INTEGER NOT NULL DEFAULT 0 CHECK (bb >= 0),
  so            INTEGER NOT NULL DEFAULT 0 CHECK (so >= 0),
  hr            INTEGER NOT NULL DEFAULT 0 CHECK (hr >= 0)
);

-- ─────────────────────────────────────────
-- 投手成績
-- ─────────────────────────────────────────
CREATE TABLE pitching_lines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_side_id   UUID NOT NULL REFERENCES game_sides(id) ON DELETE CASCADE,
  pitching_order INTEGER NOT NULL,
  name           TEXT NOT NULL,
  decision       TEXT CHECK (decision IN ('W', 'L', 'SV', 'HLD', 'BS') OR decision IS NULL),
  record         TEXT,    -- '19-5'
  ip             TEXT NOT NULL,   -- '7.1' = 7⅓ 局
  h              INTEGER NOT NULL DEFAULT 0 CHECK (h >= 0),
  r              INTEGER NOT NULL DEFAULT 0 CHECK (r >= 0),
  er             INTEGER NOT NULL DEFAULT 0 CHECK (er >= 0),
  bb             INTEGER NOT NULL DEFAULT 0 CHECK (bb >= 0),
  so             INTEGER NOT NULL DEFAULT 0 CHECK (so >= 0)
);

-- ─────────────────────────────────────────
-- 比賽特殊紀錄（全壘打、盜壘、失誤）
-- ─────────────────────────────────────────
CREATE TABLE game_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  note_type   TEXT NOT NULL CHECK (note_type IN ('hr', 'sb', 'error')),
  player_name TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1)
);

-- ─────────────────────────────────────────
-- 提交 log（每次上傳都記錄）
-- ─────────────────────────────────────────
CREATE TABLE submissions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by         TEXT,                   -- 玩家名稱（輸入值，非外鍵）
  player_a             TEXT,
  team_a               TEXT,
  player_b             TEXT,
  team_b               TEXT,
  raw_user_input       TEXT,                   -- 玩家輸入的對應原文
  image_paths          JSONB NOT NULL DEFAULT '[]',
  parsed_game_json     JSONB,
  needs_review         BOOLEAN NOT NULL DEFAULT false,
  uncertainties        JSONB NOT NULL DEFAULT '[]',
  duplicate_candidates JSONB NOT NULL DEFAULT '[]',
  status               TEXT NOT NULL DEFAULT 'received'
                         CHECK (status IN ('received','uploaded','parsing','committed','failed')),
  game_id              UUID REFERENCES games(id),
  error_message        TEXT,
  request_ip           TEXT,
  user_agent           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- Index
-- ─────────────────────────────────────────
CREATE INDEX ON games (played_at DESC);
CREATE INDEX ON games (winner_player_id);
CREATE INDEX ON game_sides (game_id);
CREATE INDEX ON game_sides (player_id);
CREATE INDEX ON batting_lines (game_side_id);
CREATE INDEX ON pitching_lines (game_side_id);
CREATE INDEX ON game_notes (game_id);
CREATE INDEX ON submissions (status);
CREATE INDEX ON submissions (created_at DESC);
