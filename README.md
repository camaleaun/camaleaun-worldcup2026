# WC2026 Schedule — WordPress Block Plugin

> **FIFA World Cup 2026™** interactive schedule as a Gutenberg block.  
> Full calendar, group standings, knockout bracket and live score entry — all in one self-contained plugin.

[![Try in Playground](https://img.shields.io/badge/Try%20in-WordPress%20Playground-3858e9?logo=wordpress&logoColor=white)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/camaleaun/camaleaun-worldcup2026/trunk/blueprints/blueprint.json)

---

## Architecture

- **TypeScript + TSX** — full type-safety, compiled with `@wordpress/scripts` + Webpack
- **React** (via `@wordpress/element`) on both the front end and the block editor
- **Dynamic block** — PHP renders the container; React mounts the app inside it
- **27 KB JSON data** (UTC, converted from BRT) inlined by the PHP render callback — no extra HTTP request

## Features

| Feature | Details |
|---|---|
| 🗓 **Calendar** | All 104 matches grouped by local date (timezone-aware). Sticky day headers, emoji flags, kick-off time, city and ✏️ score button |
| 📋 **Matches** | DataViews-style table with filter chips (All / Group Stage / Knockout / Group A–L). Responsive columns |
| 🏆 **Groups** | Grid of 12 group cards → click → **live standings** (computed from entered scores) + round switcher + match list per round |
| ⚔️ **Knockout** | Mobile: round tabs (R32 / R16 / QF / SF / 🏆). Desktop: full column bracket. Resolves real team names as upstream results are entered |
| ✏️ **Score Entry** | Inline on any card: two goal inputs. For knockout draws: ⚡ Penalties toggle with home/away penalty shootout inputs |
| 💾 **Persistence** | `localStorage` (`wc2026_scores_v1`) — survives page refresh, works offline |
| ⬇️ **GitHub Sync** | "Sync" button fetches `results.json` from a configurable raw GitHub URL and merges into local storage |
| 🕐 **Timezone** | Selector with 29 common IANA timezones, persisted in `localStorage` |

## Source Structure

```
src/
├── index.tsx              # Block registration + editor preview (Edit.tsx)
├── frontend.tsx           # Front-end entry — mounts React into block containers
├── App.tsx                # Root component: tabs, timezone, sync
├── types.ts               # All TypeScript interfaces
├── data.ts                # Data helpers (getTeam, getStadium, getAllMatches)
├── utils.ts               # Datetime formatting + standings calculation
├── hooks/
│   ├── useScores.ts       # localStorage score state + GitHub sync
│   └── useTimezone.ts     # Timezone state + localStorage persistence
├── components/
│   ├── MatchCard.tsx      # Card used in Calendar, Groups and Knockout views
│   ├── MatchDetail.tsx    # Full match detail panel with score editing
│   └── ScoreInput.tsx     # Inline score form (goals + optional penalties)
├── views/
│   ├── CalendarView.tsx   # Day-grouped calendar
│   ├── MatchesView.tsx    # Filterable matches table
│   ├── GroupsView.tsx     # Groups grid → detail with live standings
│   └── KnockoutView.tsx   # Bracket (desktop columns / mobile tabs)
├── frontend.css           # All front-end styles (dark navy + FIFA gold)
└── editor.css             # Editor-only preview styles
```

## Block Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `defaultTab` | `string` | `"calendar"` | Which tab opens first |
| `resultsUrl` | `string` | GitHub raw URL | URL to the `results.json` file for bulk sync |
| `align` | `string` | `"wide"` | Block alignment (`wide` or `full`) |

Both attributes are configurable in the block's **Inspector Controls** sidebar.

## i18n

- `.pot` template generated with `wp i18n make-pot`
- `.po` for `pt_BR` — 80+ strings including all 48 team names
- `.mo` compiled and ready

## GitHub Sync — `data/results.json` format

Place this file at the raw URL configured in the block settings (default: `https://raw.githubusercontent.com/camaleaun/camaleaun-worldcup2026/trunk/data/results.json`).

```json
{
  "version": "1.0",
  "updated": "2026-06-11",
  "scores": {
    "1":  { "home": 2, "away": 0 },
    "73": { "home": 1, "away": 1, "homePenalties": 4, "awayPenalties": 3 }
  }
}
```

- **Key** — match ID (1–104, matching `src/data.json`)
- **`home` / `away`** — goals after 90 minutes (integer)
- **`homePenalties` / `awayPenalties`** — penalty shootout score, only for tied knockout matches

## Development

```bash
# Install dependencies
npm install

# Production build → build/
npm run build

# Watch mode (dev)
npm run start

# TypeScript type-checking (no emit)
npm run check-types
```

Requires Node ≥ 18 and npm ≥ 9.

## Requirements

- WordPress 6.4+
- PHP 8.0+
- Node 18+ / npm 9+ *(build-time only)*

## License

GPL-2.0-or-later — same as WordPress.
