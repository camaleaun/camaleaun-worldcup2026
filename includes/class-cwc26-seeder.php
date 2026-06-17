<?php
/**
 * Seeds the CWC26 tables from the bundled src/data.json.
 *
 * Runs once on plugin activation (fresh install only).
 * To re-seed: delete the cwc26_db_version option and reactivate,
 * or call CWC26_Seeder::run() directly from WP-CLI.
 *
 * @package camaleaun-worldcup2026
 */

defined( 'ABSPATH' ) || exit;

class CWC26_Seeder {

	/**
	 * FIFA code → ISO 3166-1 alpha-2 (for flagcdn.com).
	 * Subdivision codes used for England (gb-eng) and Scotland (gb-sct).
	 */
	const FLAG_ISO = [
		'ALG' => 'dz', 'ARG' => 'ar', 'AUS' => 'au', 'AUT' => 'at',
		'BEL' => 'be', 'BIH' => 'ba', 'BRA' => 'br', 'CAN' => 'ca',
		'CIV' => 'ci', 'COD' => 'cd', 'COL' => 'co', 'CPV' => 'cv',
		'CRO' => 'hr', 'CUW' => 'cw', 'CZE' => 'cz', 'ECU' => 'ec',
		'EGY' => 'eg', 'ENG' => 'gb-eng', 'ESP' => 'es', 'FRA' => 'fr',
		'GER' => 'de', 'GHA' => 'gh', 'HAI' => 'ht', 'IRN' => 'ir',
		'IRQ' => 'iq', 'JOR' => 'jo', 'JPN' => 'jp', 'KOR' => 'kr',
		'KSA' => 'sa', 'MAR' => 'ma', 'MEX' => 'mx', 'NED' => 'nl',
		'NOR' => 'no', 'NZL' => 'nz', 'PAN' => 'pa', 'PAR' => 'py',
		'POR' => 'pt', 'QAT' => 'qa', 'RSA' => 'za', 'SCO' => 'gb-sct',
		'SEN' => 'sn', 'SUI' => 'ch', 'SWE' => 'se', 'TUN' => 'tn',
		'TUR' => 'tr', 'URU' => 'uy', 'USA' => 'us', 'UZB' => 'uz',
	];

	public static function run(): void {
		$path = WC2026_PLUGIN_DIR . 'src/data.json';

		if ( ! file_exists( $path ) ) {
			return;
		}

		$raw = file_get_contents( $path ); // phpcs:ignore
		$data = json_decode( $raw, true );

		if ( ! $data ) {
			return;
		}

		self::seed_teams( $data['teams'] ?? [] );
		self::seed_stadiums( $data['stadiums'] ?? [] );
		self::seed_groups( $data['groups'] ?? [] );
		self::seed_matches( $data['groups'] ?? [], $data['knockout'] ?? [] );
	}

	// ── Teams ─────────────────────────────────────────────────────────────

	private static function seed_teams( array $teams ): void {
		global $wpdb;
		$table = CWC26_DB::teams();

		foreach ( $teams as $code => $team ) {
			$wpdb->replace(
				$table,
				[
					'fifa_code' => $code,
					'name'      => $team['name'],
					'flag_iso'  => self::FLAG_ISO[ $code ] ?? strtolower( $code ),
					'ranking'   => isset( $team['ranking'] ) ? (int) $team['ranking'] : null,
				],
				[ '%s', '%s', '%s', '%d' ]
			);
		}
	}

	// ── Stadiums ──────────────────────────────────────────────────────────

	private static function seed_stadiums( array $stadiums ): void {
		global $wpdb;
		$table = CWC26_DB::stadiums();

		foreach ( $stadiums as $roman => $stadium ) {
			$wpdb->replace(
				$table,
				[
					'roman_id' => $roman,
					'city'     => $stadium['city'],
					'name'     => $stadium['name'],
				],
				[ '%s', '%s', '%s' ]
			);
		}
	}

	// ── Groups ────────────────────────────────────────────────────────────

	private static function seed_groups( array $groups ): void {
		global $wpdb;
		$table = CWC26_DB::groups();

		foreach ( $groups as $letter => $group ) {
			foreach ( $group['teams'] as $pos => $code ) {
				$wpdb->replace(
					$table,
					[
						'group_letter' => $letter,
						'team_code'    => $code,
						'position'     => $pos,
					],
					[ '%s', '%s', '%d' ]
				);
			}
		}
	}

	// ── Matches ───────────────────────────────────────────────────────────

	private static function seed_matches( array $groups, array $knockout ): void {
		global $wpdb;
		$table = CWC26_DB::matches();

		// Group stage.
		foreach ( $groups as $letter => $group ) {
			foreach ( $group['matches'] as $m ) {
				$wpdb->replace(
					$table,
					[
						'match_id'     => (int) $m['id'],
						'match_utc'    => self::iso_to_datetime( $m['utc'] ),
						'stadium_id'   => $m['stadium'],
						'round'        => (string) $m['round'],
						'phase'        => 'group',
						'group_letter' => $letter,
						'home_code'    => $m['home'],
						'away_code'    => $m['away'],
					],
					[ '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s' ]
				);
			}
		}

		// Knockout rounds.
		$round_map = [
			'round_of_32'  => 'r32',
			'round_of_16'  => 'r16',
			'quarter_finals' => 'qf',
			'semi_finals'  => 'sf',
			'finals'       => 'f',
		];

		foreach ( $knockout as $phase_key => $matches ) {
			$round = $round_map[ $phase_key ] ?? $phase_key;
			foreach ( $matches as $m ) {
				$wpdb->replace(
					$table,
					[
						'match_id'   => (int) $m['id'],
						'match_utc'  => self::iso_to_datetime( $m['utc'] ),
						'stadium_id' => $m['stadium'],
						'round'      => $round,
						'phase'      => 'knockout',
						'home_code'  => $m['home'],
						'away_code'  => $m['away'],
					],
					[ '%d', '%s', '%s', '%s', '%s', '%s', '%s' ]
				);
			}
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────

	private static function iso_to_datetime( string $iso ): string {
		try {
			return ( new DateTimeImmutable( $iso ) )->format( 'Y-m-d H:i:s' );
		} catch ( \Exception $e ) {
			return '0000-00-00 00:00:00';
		}
	}
}
