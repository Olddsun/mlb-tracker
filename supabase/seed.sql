INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('6368c8b7-2f6b-469b-83cb-452d9e766ed8', '2026-06-18-01', '2026-06-18', 'mlb', 'alvin', 'Max Fried', 'Yankees', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', '6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'scott', 'Phillies', 'Philadelphia Phillies', 'away', 0, 5, 1, '["0", "0", "0", "0", "0", "0", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 1, 'Trea Turner', 'SS', 4, 0, 2, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 2, 'Kyle Schwarber', 'DH', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 3, 'Bryce Harper', '1B', 4, 0, 2, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 4, 'Alec Bohm', '3B', 4, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 5, 'Brandon Marsh', 'LF', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 6, 'Adolis García', 'RF', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 7, 'J.T. Realmuto', 'C', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 8, 'Bryson Stott', '2B', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 9, 'Justin Crawford', 'CF', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 1, 'Cristopher Sánchez', 'L', '13-5', '7.1', 5, 2, 2, 1, 9);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('b28941b0-ce9b-4add-b3d8-c88c747b2e31', 2, 'Brad Keller', NULL, NULL, '0.2', 0, 0, 0, 0, 1);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', '6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'alvin', 'Yankees', 'New York Yankees', 'home', 2, 5, 0, '["0", "0", "0", "1", "1", "0", "0", "0", "X"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 1, 'Trent Grisham', 'CF', 4, 0, 0, 0, 0, 4, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 2, 'Aaron Judge', 'RF', 3, 1, 1, 1, 0, 2, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 3, 'Cody Bellinger', 'LF', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 4, 'Giancarlo Stanton', 'DH', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 5, 'Paul Goldschmidt', '1B', 3, 1, 2, 1, 0, 0, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 6, 'Jazz Chisholm Jr.', '2B', 2, 0, 0, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 7, 'Ryan McMahon', '3B', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 8, 'José Caballero', 'SS', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 9, 'Austin Wells', 'C', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('eeb60c48-5ccc-4204-9638-014b41eb0d3a', 1, 'Max Fried', 'W', '19-5', '9.0', 5, 0, 0, 0, 3);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'hr', 'Aaron Judge', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'hr', 'Paul Goldschmidt', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'sb', 'Trea Turner', 2);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6368c8b7-2f6b-469b-83cb-452d9e766ed8', 'error', 'Brandon Marsh', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', '2026-06-19-01', '2026-06-19', 'mlb', 'scott', 'Manny Machado', 'Padres', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', '64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'alvin', 'Tigers', 'Detroit Tigers', 'away', 3, 5, 1, '["1", "0", "0", "0", "0", "0", "2", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 1, 'Kerry Carpenter', 'RF', 4, 1, 1, 1, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 2, 'Gleyber Torres', '2B', 4, 1, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 3, 'Colt Keith', 'DH', 4, 0, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 4, 'Riley Greene', 'LF', 4, 1, 1, 2, 0, 2, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 5, 'Spencer Torkelson', '1B', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 6, 'Kevin McGonigle', '3B', 3, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 7, 'Dillon Dingler', 'C', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 8, 'Parker Meadows', 'CF', 2, 0, 0, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 9, 'Javier Báez', 'SS', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('0fe20dcf-d1e4-4a6d-934c-ef2bf8517cf8', 1, 'Tarik Skubal', 'L', '13-6', '8.0', 11, 6, 5, 0, 7);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', '64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'scott', 'Padres', 'San Diego Padres', 'home', 6, 11, 0, '["2", "0", "2", "0", "0", "0", "0", "2", "X"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 1, 'Fernando Tatis Jr.', 'RF', 4, 2, 2, 2, 0, 2, 2);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 2, 'Jackson Merrill', 'CF', 4, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 3, 'Manny Machado', '3B', 4, 3, 3, 2, 0, 2, 2);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 4, 'Ramón Laureano', 'LF', 4, 1, 1, 2, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 5, 'Ty France', '1B', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 6, 'Xander Bogaerts', 'SS', 4, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 7, 'Jake Cronenworth', '2B', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 8, 'Miguel Andujar', 'DH', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 9, 'Freddy Fermin', 'C', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 1, 'Nick Pivetta', 'W', '13-5', '6.0', 3, 2, 2, 0, 9);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 2, 'Adrian Morejon', 'HLD', '20', '2.0', 2, 1, 1, 1, 2);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('5d74e276-4aec-4ffb-9965-b6bed8ec5f34', 3, 'Jeremiah Estrada', 'SV', '3', '1.0', 0, 0, 0, 0, 3);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'hr', 'Fernando Tatis Jr. 2', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'hr', 'Manny Machado 2', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'hr', 'Ramón Laureano', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'hr', 'Kerry Carpenter', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'hr', 'Riley Greene', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('64f97f55-9aec-46d3-afa6-7e7cd3dc1c9c', 'error', 'Kevin McGonigle', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', '2026-06-19-02', '2026-06-19', 'mlb', 'alvin', 'Mookie Betts', 'Dodgers', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 'f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'alvin', 'Dodgers', 'Los Angeles Dodgers', 'away', 3, 9, 0, '["0", "0", "0", "2", "0", "1", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 1, 'Shohei Ohtani', 'DH', 4, 0, 1, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 2, 'Andy Pages', 'CF', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 3, 'Mookie Betts', 'SS', 4, 2, 2, 1, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 4, 'Freddie Freeman', '1B', 4, 1, 2, 2, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 5, 'Max Muncy', '3B', 3, 0, 1, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 6, 'Kyle Tucker', 'RF', 4, 0, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 7, 'Teoscar Hernández', 'LF', 2, 0, 0, 0, 1, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 8, 'Will Smith', 'C', 4, 0, 2, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 9, 'Alex Freeland', '2B', 3, 0, 0, 0, 1, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 1, 'Yoshinobu Yamamoto', 'W', '12-8', '6.2', 5, 2, 2, 2, 3);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('17908a01-e341-4e76-869a-1ac982976f72', 2, 'Blake Treinen', 'SV', '2', '2.1', 1, 0, 0, 0, 2);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 'f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'scott', 'Rangers', 'Texas Rangers', 'home', 2, 6, 1, '["0", "0", "0", "0", "2", "0", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 1, 'Brandon Nimmo', 'RF', 3, 0, 1, 0, 1, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 2, 'Wyatt Langford', 'LF', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 3, 'Corey Seager', 'SS', 4, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 4, 'Jake Burger', '1B', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 5, 'Josh Smith', '2B', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 6, 'Josh Jung', '3B', 3, 0, 0, 0, 1, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 7, 'Joc Pederson', 'DH', 2, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 8, 'Sam Haggerty', 'PR-DH', 2, 1, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 9, 'Evan Carter', 'CF', 3, 1, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 10, 'Danny Jansen', 'C', 3, 0, 2, 1, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 1, 'Jacob deGrom', NULL, NULL, '4.2', 5, 2, 2, 1, 6);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 2, 'Jalen Beeks', 'L', '5-3', '1.1', 3, 1, 1, 1, 2);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 3, 'Chris Martin', NULL, NULL, '2.0', 1, 0, 0, 2, 1);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('f84dceb9-03aa-4cac-8b40-ab851a3714d7', 4, 'Jacob Latz', NULL, NULL, '1.0', 0, 0, 0, 0, 0);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'hr', 'Mookie Betts', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'hr', 'Freddie Freeman', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'sb', 'Shohei Ohtani', 2);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'sb', 'Josh Smith', 3);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f24ec5bc-72dc-414b-94fb-f45082ce2fda', 'error', 'Corey Seager', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('f5c8dc3c-46e2-450c-8a0c-fab311e90ee3', '2026-06-24-01', '2026-06-24', 'mlb', 'scott', 'Garrett Crochet', 'Red Sox', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 'f5c8dc3c-46e2-450c-8a0c-fab311e90ee3', 'scott', 'Red Sox', 'Boston Red Sox', 'away', 2, 6, 0, '["0", "0", "1", "0", "0", "0", "0", "0", "1"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 1, 'Roman Anthony', 'LF', 3, 0, 0, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 2, 'Trevor Story', 'SS', 3, 0, 0, 0, 1, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 3, 'Jarren Duran', 'DH', 4, 0, 1, 1, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 4, 'Willson Contreras', '1B', 4, 1, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 5, 'Wilyer Abreu', 'RF', 4, 0, 2, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 6, 'Caleb Durbin', '3B', 4, 0, 1, 1, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 7, 'Ceddanne Rafaela', 'CF', 4, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 8, 'Marcelo Mayer', '2B', 4, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 9, 'Carlos Narváez', 'C', 2, 1, 1, 0, 1, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 1, 'Garrett Crochet', 'W', '18-5', '8.0', 2, 0, 0, 0, 13);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('b4100740-5ae0-436e-a217-f75fc1414df8', 2, 'Garrett Whitlock', 'SV', '1', '1.0', 0, 0, 0, 0, 2);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 'f5c8dc3c-46e2-450c-8a0c-fab311e90ee3', 'alvin', 'Padres', 'San Diego Padres', 'home', 0, 2, 0, '["0", "0", "0", "0", "0", "0", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 1, 'Fernando Tatis Jr.', 'RF', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 2, 'Jackson Merrill', 'CF', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 3, 'Manny Machado', '3B', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 4, 'Ramón Laureano', 'LF', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 5, 'Ty France', '1B', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 6, 'Xander Bogaerts', 'SS', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 7, 'Jake Cronenworth', '2B', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 8, 'Miguel Andujar', 'DH', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 9, 'Freddy Fermin', 'C', 3, 0, 0, 0, 0, 3, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 1, 'Nick Pivetta', 'L', '13-5', '6.0', 3, 1, 1, 3, 11);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('5fba8360-0bc4-4e77-b470-40d698cad7f1', 2, 'Adrian Morejon', NULL, NULL, '3.0', 3, 1, 1, 0, 6);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('f5c8dc3c-46e2-450c-8a0c-fab311e90ee3', 'sb', 'Willson Contreras', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', '2026-06-24-02', '2026-06-24', 'mlb', 'alvin', 'Andy Pages', 'Dodgers', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', '1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'scott', 'Marlins', 'Miami Marlins', 'away', 3, 5, 0, '["0", "0", "1", "0", "0", "0", "0", "0", "2"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 1, 'Jakob Marsee', 'CF', 4, 0, 1, 1, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 2, 'Xavier Edwards', '2B', 4, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 3, 'Agustín Ramírez', 'C', 4, 1, 0, 0, 1, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 4, 'Otto Lopez', 'SS', 4, 1, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 5, 'Christopher Morel', '1B', 4, 0, 1, 2, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 6, 'Griffin Conine', 'LF', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 7, 'Graham Pauley', 'DH', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 8, 'Owen Caissie', 'RF', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 9, 'Connor Norby', '3B', 3, 1, 1, 0, 0, 2, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 1, 'Eury Pérez', NULL, NULL, '5.0', 6, 2, 2, 0, 7);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('cf965dee-fa32-43bd-9b9c-2a23945e2ae9', 2, 'Anthony Bender', 'L', '3-5', '3.0', 4, 2, 2, 0, 3);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', '1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'alvin', 'Dodgers', 'Los Angeles Dodgers', 'home', 4, 10, 1, '["0", "0", "1", "0", "1", "0", "0", "1", "1"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 1, 'Shohei Ohtani', 'DH', 4, 1, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 2, 'Andy Pages', 'CF', 4, 1, 3, 2, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 3, 'Freddie Freeman', '1B', 4, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 4, 'Mookie Betts', 'SS', 4, 0, 2, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 5, 'Will Smith', 'C', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 6, 'Kyle Tucker', 'RF', 4, 1, 2, 1, 0, 2, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 7, 'Max Muncy', '3B', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 8, 'Teoscar Hernández', 'LF', 3, 1, 1, 1, 0, 1, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 9, 'Alex Freeland', '2B', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 1, 'Yoshinobu Yamamoto', NULL, NULL, '8.2', 5, 3, 3, 1, 12);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('ebe7cc3d-bab5-4279-83d8-3f2c4473f89f', 2, 'Blake Treinen', 'W', '2-7', '0.1', 0, 0, 0, 0, 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'hr', 'Kyle Tucker', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'hr', 'Teoscar Hernández', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'hr', 'Andy Pages', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'sb', 'Jakob Marsee', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b9932ff-d40a-47f0-8203-6a1a6ffbb471', 'error', 'Will Smith', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('1b43354b-b250-49cc-bdd5-85964991d4e6', '2026-06-25-01', '2026-06-25', 'mlb', 'alvin', 'Chris Sale', 'Braves', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', '1b43354b-b250-49cc-bdd5-85964991d4e6', 'scott', 'Rays', 'Tampa Bay Rays', 'away', 1, 6, 0, '["0", "0", "0", "0", "0", "0", "0", "0", "1"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 1, 'Yandy Díaz', 'DH', 4, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 2, 'Jonathan Aranda', '1B', 4, 1, 1, 1, 0, 3, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 3, 'Junior Caminero', '3B', 4, 0, 2, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 4, 'Jonny DeLuca', 'RF', 4, 0, 0, 0, 0, 4, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 5, 'Cedric Mullins', 'CF', 4, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 6, 'Ben Williamson', '2B', 4, 0, 2, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 7, 'Carson Williams', 'SS', 3, 0, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 8, 'Chandler Simpson', 'LF', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 9, 'Nick Fortes', 'C', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 1, 'Drew Rasmussen', 'L', '10-5', '5.0', 5, 2, 2, 0, 6);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('3c9570d4-fb12-4065-8e35-6853f0fd7727', 2, 'Ian Seymour', NULL, NULL, '3.0', 2, 0, 0, 0, 3);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', '1b43354b-b250-49cc-bdd5-85964991d4e6', 'alvin', 'Braves', 'Atlanta Braves', 'home', 2, 7, 0, '["1", "0", "0", "0", "1", "0", "0", "0", "X"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 1, 'Ronald Acuña Jr.', 'RF', 4, 1, 2, 1, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 2, 'Drake Baldwin', 'C', 4, 0, 1, 1, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 3, 'Matt Olson', '1B', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 4, 'Austin Riley', '3B', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 5, 'Mike Yastrzemski', 'LF', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 6, 'Ozzie Albies', '2B', 3, 0, 1, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 7, 'Michael Harris II', 'CF', 3, 1, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 8, 'Dominic Smith', 'DH', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 9, 'Mauricio Dubón', 'SS', 3, 0, 0, 0, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 1, 'Chris Sale', 'W', '7-5', '7.1', 4, 0, 0, 0, 13);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 2, 'Tyler Kinley', 'HLD', '14', '0.2', 2, 1, 1, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('1abf618a-0fc8-4e54-8d23-9ad17edf55b9', 3, 'Raisel Iglesias', 'SV', '29', '1.0', 0, 0, 0, 0, 3);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b43354b-b250-49cc-bdd5-85964991d4e6', 'hr', 'Jonathan Aranda', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('1b43354b-b250-49cc-bdd5-85964991d4e6', 'sb', 'Ben Williamson', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('91c4d0b7-95df-41f6-8f68-37eb783a0a5d', '2026-06-25-02', '2026-06-25', 'mlb', 'scott', 'Matt Chapman', 'Giants', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', '91c4d0b7-95df-41f6-8f68-37eb783a0a5d', 'scott', 'Giants', 'San Francisco Giants', 'away', 2, 7, 0, '["0", "0", "0", "0", "0", "0", "0", "0", "2"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 1, 'Luis Arraez', '2B', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 2, 'Willy Adames', 'SS', 3, 0, 1, 0, 1, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 3, 'Rafael Devers', '1B', 4, 0, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 4, 'Matt Chapman', '3B', 4, 1, 2, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 5, 'Jung Hoo Lee', 'RF', 4, 1, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 6, 'Harrison Bader', 'CF', 4, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 7, 'Heliot Ramos', 'LF', 3, 0, 0, 1, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 8, 'Bryce Eldridge', 'DH', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 9, 'Patrick Bailey', 'C', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 1, 'Logan Webb', NULL, NULL, '7.0', 6, 1, 1, 0, 9);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('21731f3a-e9f0-4c3d-b521-5311692ca9a7', 2, 'Ryan Borucki', 'W', '1-3', '2.0', 1, 0, 0, 0, 4);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', '91c4d0b7-95df-41f6-8f68-37eb783a0a5d', 'alvin', 'Phillies', 'Philadelphia Phillies', 'home', 1, 7, 0, '["0", "0", "1", "0", "0", "0", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 1, 'Trea Turner', 'SS', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 2, 'Kyle Schwarber', 'DH', 4, 0, 1, 1, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 3, 'Bryce Harper', '1B', 4, 0, 2, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 4, 'Alec Bohm', '3B', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 5, 'Brandon Marsh', 'LF', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 6, 'Adolis García', 'RF', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 7, 'J.T. Realmuto', 'C', 4, 0, 1, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 8, 'Bryson Stott', '2B', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 9, 'Justin Crawford', 'CF', 2, 1, 0, 0, 0, 0, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 1, 'Cristopher Sánchez', 'L', '13-5', '8.2', 7, 2, 1, 1, 10);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('88085b7c-4743-4a77-b3b8-69308cc50227', 2, 'José Alvarado', NULL, NULL, '0.1', 0, 0, 0, 0, 0);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('91c4d0b7-95df-41f6-8f68-37eb783a0a5d', 'sb', 'Matt Chapman', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('91c4d0b7-95df-41f6-8f68-37eb783a0a5d', 'sb', 'Jung Hoo Lee', 2);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('91c4d0b7-95df-41f6-8f68-37eb783a0a5d', 'sb', 'Justin Crawford', 1);

INSERT INTO games (id, legacy_id, played_at, sport, winner_player_id, player_of_game_name, player_of_game_team, source)
VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', '2026-06-25-03', '2026-06-25', 'mlb', 'vincent', 'Daniel Palencia', 'Cubs', 'manual_migration');

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', '6eb6d31c-16e7-4587-89de-ae624b975f83', 'scott', 'Guardians', 'Cleveland Guardians', 'away', 2, 5, 2, '["0", "0", "2", "0", "0", "0", "0", "0", "0"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 1, 'Steven Kwan', 'CF', 3, 1, 1, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 2, 'Angel Martinez', 'LF', 4, 1, 2, 2, 0, 0, 1);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 3, 'José Ramírez', '3B', 4, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 4, 'David Fry', '1B', 4, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 5, 'Rhys Hoskins', 'DH', 2, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 6, 'Daniel Schneemann', 'PR-DH', 1, 0, 0, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 7, 'Chase DeLauter', 'RF', 4, 0, 1, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 8, 'Gabriel Arias', 'SS', 3, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 9, 'Bo Naylor', 'C', 3, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 10, 'Brayan Rocchio', '2B', 3, 0, 1, 0, 0, 1, 0);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 1, 'Tanner Bibee', NULL, NULL, '5.2', 6, 1, 1, 3, 5);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 2, 'Erik Sabrowski', 'L', '0-1', '1.2', 1, 2, 2, 1, 4);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('929a152c-e5c1-470c-b1e5-17897135e3b0', 3, 'Shawn Armstrong', NULL, NULL, '0.2', 1, 0, 0, 0, 0);

INSERT INTO game_sides (id, game_id, player_id, team_name, team_full, home_away, runs, hits, errors, innings)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', '6eb6d31c-16e7-4587-89de-ae624b975f83', 'vincent', 'Cubs', 'Chicago Cubs', 'home', 3, 8, 1, '["0", "0", "0", "0", "1", "0", "2", "0", "X"]');

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 1, 'Michael Busch', '1B', 5, 0, 3, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 2, 'Alex Bregman', '3B', 3, 1, 0, 0, 1, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 3, 'Ian Happ', 'LF', 4, 1, 2, 0, 0, 0, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 4, 'Nico Hoerner', '2B', 4, 0, 0, 0, 0, 3, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 5, 'Pete Crow-Armstrong', 'CF', 4, 0, 0, 0, 0, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 6, 'Carson Kelly', 'C', 3, 0, 1, 1, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 7, 'Moisés Ballesteros', 'DH', 3, 0, 0, 0, 0, 2, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 8, 'Dansby Swanson', 'SS', 4, 0, 1, 0, 1, 1, 0);

INSERT INTO batting_lines (game_side_id, batting_order, name, pos, ab, r, h, rbi, bb, so, hr)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 9, 'Michael Conforto', 'RF', 3, 1, 1, 1, 1, 0, 1);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 1, 'Matthew Boyd', NULL, NULL, '6.1', 2, 2, 2, 1, 7);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 2, 'Phil Maton', 'W', '4-5', '1.1', 3, 0, 0, 0, 3);

INSERT INTO pitching_lines (game_side_id, pitching_order, name, decision, record, ip, h, r, er, bb, so)
VALUES ('97a66300-1246-4405-815f-c1b2311db3b0', 3, 'Daniel Palencia', 'SV', '22', '1.1', 0, 0, 0, 0, 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'hr', 'Angel Martinez', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'hr', 'Michael Conforto', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'sb', 'Alex Bregman', 2);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'sb', 'Ian Happ', 2);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'sb', 'Brayan Rocchio', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'error', 'José Ramírez', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'error', 'Bo Naylor', 1);

INSERT INTO game_notes (game_id, note_type, player_name, count) VALUES ('6eb6d31c-16e7-4587-89de-ae624b975f83', 'error', 'Dansby Swanson', 1);