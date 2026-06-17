=== FIFA World Cup 2026™ Schedule ===
Contributors: camaleaun
Tags: fifa, world cup, soccer, schedule, block
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 8.0
Stable tag: trunk
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Interactive FIFA World Cup 2026™ schedule as a Gutenberg block — calendar, groups, knockout bracket and score entry.

== Description ==

Full-featured World Cup schedule block with four views (Calendar, Matches, Groups, Knockout), live standings computed from entered scores, per-match sync from the plugin's own database, timezone support and local SVG flags for all 48 national teams.

**Features**

* 🗓 Calendar — all 104 matches grouped by local date (timezone-aware). Sticky day headers, kick-off time, city and score button
* 📋 Matches — filterable table with chips (All / Group Stage / Knockout / Group A–L). Responsive columns
* 🏆 Groups — 12 group cards with live standings computed from entered scores + round switcher + match list per round
* ⚔️ Knockout — full bracket (desktop: column layout / mobile: round tabs R32 / R16 / QF / SF / 🏆). Resolves team names as upstream results are entered
* ✏️ Score entry — inline on any card: two goal inputs. Knockout draws: penalty shootout inputs
* 💾 Persistence — `localStorage` (`wc2026_scores_v1`), survives page refresh, works offline
* ⬇️ Per-match sync — REST endpoint lets admin enter official results; frontend can pull single match
* 🏴 Flags — local SVG files (`assets/flags/bra.svg` etc.), no external CDN dependency at runtime
* 🕐 Timezone — 29 common IANA timezones, persisted in `localStorage`

== Database Schema ==

Five custom tables are created on activation under the `{prefix}cwc26_` namespace. The schema mirrors the WordPress `wp_posts` + `wp_postmeta` and `wp_terms` + `wp_term_taxonomy` patterns for familiarity.

= cwc26_teams =

The 48 qualified national teams.

| Column | Type | Notes |
| --- | --- | --- |
| `team_id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `fifa_code` | VARCHAR(4) UNIQUE NOT NULL | Three-letter FIFA code (e.g. `BRA`) |
| `flag_iso` | VARCHAR(10) | ISO 3166-1 alpha-2 used when downloading flag SVG |
| `name` | VARCHAR(100) NOT NULL | English team name |
| `ranking` | INT UNSIGNED | FIFA ranking at time of draw |

= cwc26_stadiums =

The 16 FIFA World Cup 2026™ venues.

| Column | Type | Notes |
| --- | --- | --- |
| `stadium_id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `code` | VARCHAR(10) UNIQUE NOT NULL | Short venue code (e.g. `XII`) |
| `city` | VARCHAR(100) NOT NULL | Host city |
| `name` | VARCHAR(150) NOT NULL | Full venue name |

= cwc26_groups =

Pivot table mapping each team to its group-phase group.

| Column | Type | Notes |
| --- | --- | --- |
| `group_id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `group_letter` | CHAR(1) NOT NULL | `A`–`L` |
| `team_code` | VARCHAR(4) NOT NULL | FK → `cwc26_teams.fifa_code` |

= cwc26_matches =

The 104 scheduled matches.

| Column | Type | Notes |
| --- | --- | --- |
| `match_id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `match_date` | DATETIME NOT NULL | Kick-off in UTC |
| `stadium_id` | BIGINT UNSIGNED | FK → `cwc26_stadiums.stadium_id` |
| `round` | VARCHAR(10) NOT NULL | `1` / `2` / `3` (group) or `r32` / `r16` / `qf` / `sf` / `f` |
| `phase` | VARCHAR(20) NOT NULL | `group` or `knockout` |
| `group_id` | VARCHAR(1) | Group letter (`A`–`L`); NULL for knockout |
| `home_code` | VARCHAR(4) NOT NULL | Home team FIFA code |
| `away_code` | VARCHAR(4) NOT NULL | Away team FIFA code |
| `home_score` | INT | Goals after 90 min; NULL until played |
| `away_score` | INT | Goals after 90 min; NULL until played |
| `match_status` | VARCHAR(20) NOT NULL | `scheduled` / `live` / `finished` |

= cwc26_matchmeta =

Key-value metadata per match — mirrors the WordPress `wp_postmeta` pattern. Two own columns are `meta_key` + `meta_value`.

| Column | Type | Notes |
| --- | --- | --- |
| `meta_id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `match_id` | BIGINT UNSIGNED NOT NULL | FK → `cwc26_matches.match_id` |
| `meta_key` | VARCHAR(255) NOT NULL | e.g. `home_penalties`, `away_penalties` |
| `meta_value` | LONGTEXT | Serialized value |

== REST API ==

Base namespace: `cwc26/v1`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/teams` | — | All 48 teams with `flag_url` |
| GET | `/stadiums` | — | All 16 venues |
| GET | `/matches` | — | All 104 matches (paginated, `per_page` supported) |
| GET | `/matches/{id}` | — | Single match by ID |
| POST | `/matches/{id}/score` | Editor+ | Set `home_score`, `away_score`, `match_status` |

== Block Attributes ==

| Attribute | Type | Default | Description |
| --- | --- | --- | --- |
| `defaultTab` | string | `calendar` | Which tab opens first |
| `resultsUrl` | string | GitHub raw URL | URL for bulk `results.json` sync |
| `align` | string | `wide` | Block alignment (`wide` or `full`) |

== i18n ==

* `.pot` template generated with `wp i18n make-pot`
* `.po` for `pt_BR` — 80+ strings including all 48 team names
* `.mo` compiled and ready

== Changelog ==

= 1.2.0 =
* Add normalized DB tables (`cwc26_*`), REST API (`cwc26/v1`), DataViews admin page, per-match sync, and local SVG flags.

= 1.1.0 =
* Add WordPress Playground blueprints and CI release workflow.

= 1.0.0 =
* Initial release — block plugin with Calendar, Matches, Groups, and Knockout views, score entry and timezone support.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
