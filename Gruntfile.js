'use strict';

module.exports = function ( grunt ) {

	// ── Configuration ────────────────────────────────────────────────────────

	grunt.initConfig( {

		wp_readme_to_markdown: {
			readme: {
				files: {
					'README.md': 'readme.txt',
				},
				options: {
					/**
					 * pre_convert — runs on the raw readme.txt before conversion.
					 * Nothing to patch here for now; kept for future hooks.
					 */
					pre_convert( readmeTxt ) {
						return readmeTxt;
					},

					/**
					 * post_convert — runs on the generated Markdown.
					 * Replaces the bare H1 with a richer header (badge included)
					 * and appends the Development section that is too verbose for
					 * a WordPress.org readme.txt.
					 */
					post_convert( readmeMd ) {
						const header = [
							'# FIFA World Cup 2026™ Schedule',
							'',
							'> **Interactive schedule as a Gutenberg block.**  ',
							'> Calendar · Groups · Knockout bracket · Score entry · DB-backed · REST API',
							'',
							'[![Try in Playground](https://img.shields.io/badge/Try%20in-WordPress%20Playground-3858e9?logo=wordpress&logoColor=white)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/camaleaun/camaleaun-worldcup2026/trunk/blueprints/blueprint.json)',
							'',
						].join( '\n' );

						const development = [
							'',
							'---',
							'',
							'## Development',
							'',
							'### Requirements',
							'',
							'| Tool | Version |',
							'| --- | --- |',
							'| Node.js | ≥ 18 |',
							'| npm | ≥ 9 |',
							'| PHP | ≥ 8.0 |',
							'',
							'### Scripts',
							'',
							'```bash',
							'npm install          # install dependencies',
							'npm run build        # production build → build/',
							'npm run start        # development watch',
							'npm run flags        # download flag SVGs → assets/flags/',
							'npm run readme       # regenerate README.md from readme.txt',
							'npm run check-types  # TypeScript type-check (no emit)',
							'```',
							'',
							'### Source Structure',
							'',
							'```',
							'src/',
							'├── index.tsx              # Block registration + editor preview',
							'├── frontend.tsx           # Front-end entry — mounts React',
							'├── App.tsx                # Root: tabs, timezone, sync',
							'├── types.ts               # TypeScript interfaces',
							'├── data.ts                # DB data helpers (getTeam, getStadium…)',
							'├── utils.ts               # Datetime formatting + standings calc',
							'├── hooks/',
							'│   ├── useScores.ts       # localStorage state + REST sync',
							'│   └── useTimezone.ts     # Timezone state + persistence',
							'├── components/',
							'│   ├── MatchCard.tsx      # Card used across all views',
							'│   ├── MatchDetail.tsx    # Full match panel with score editing',
							'│   └── ScoreInput.tsx     # Inline score form (goals + penalties)',
							'├── views/',
							'│   ├── CalendarView.tsx   # Day-grouped calendar',
							'│   ├── MatchesView.tsx    # Filterable matches table',
							'│   ├── GroupsView.tsx     # Groups grid → live standings',
							'│   └── KnockoutView.tsx   # Bracket (desktop / mobile)',
							'├── admin/',
							'│   └── index.tsx          # WP admin DataViews page',
							'├── frontend.css           # Front-end styles (dark navy + FIFA gold)',
							'└── editor.css             # Editor-only preview styles',
							'',
							'includes/',
							'├── class-cwc26-db.php     # Table creation (dbDelta) + meta helpers',
							'├── class-cwc26-seeder.php # Seeds all tables from src/data.json',
							'├── class-cwc26-rest.php   # REST namespace cwc26/v1',
							'└── class-cwc26-admin.php  # Admin menu page + script enqueue',
							'',
							'scripts/',
							'└── download-flags.mjs     # Downloads flag SVGs from flagcdn.com',
							'```',
							'',
							'### Flag SVGs',
							'',
							'Flag files live in `assets/flags/` using lowercase FIFA codes (`bra.svg`, `arg.svg`, …).',
							'They are **gitignored** — download locally with `npm run flags`.',
							'The CI release workflow runs `npm run flags` automatically before creating the zip.',
							'',
							'### GitHub Sync — `data/results.json` format',
							'',
							'Place this file at the raw URL configured in the block settings:',
							'',
							'```json',
							'{',
							'  "version": "1.0",',
							'  "updated": "2026-06-11",',
							'  "scores": {',
							'    "1":  { "home": 2, "away": 0 },',
							'    "73": { "home": 1, "away": 1, "homePenalties": 4, "awayPenalties": 3 }',
							'  }',
							'}',
							'```',
							'',
							'- **Key** — match ID (1–104)',
							'- **`home` / `away`** — goals after 90 minutes',
							'- **`homePenalties` / `awayPenalties`** — penalty shootout, knockout draws only',
							'',
						].join( '\n' );

						// Replace the bare H1 the converter generates with our richer header.
						const withoutFirstH1 = readmeMd.replace( /^# .+\n/, '' );

						return header + withoutFirstH1 + development;
					},
				},
			},
		},

	} );

	// ── Load tasks ───────────────────────────────────────────────────────────

	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );

	// ── Register tasks ───────────────────────────────────────────────────────

	grunt.registerTask( 'readme', [ 'wp_readme_to_markdown' ] );
	grunt.registerTask( 'default', [ 'readme' ] );

};
