<?php
/**
 * Database schema for the WC2026 Schedule plugin.
 *
 * Tables (all prefixed with {wpdb->prefix}cwc26_):
 *
 *  cwc26_teams      — static reference data (like wp_terms)
 *  cwc26_stadiums   — static reference data (like wp_terms)
 *  cwc26_groups     — team ↔ group assignments (like wp_term_taxonomy)
 *  cwc26_matches    — each fixture is a "post"  (like wp_posts)
 *  cwc26_matchmeta  — extensible metadata       (like wp_postmeta)
 *                     two own columns: meta_key + meta_value
 *
 * @package camaleaun-worldcup2026
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class CWC26_DB
 *
 * Handles table creation, upgrades and helper queries.
 */
class CWC26_DB {

	const SCHEMA_VERSION = '1.0.0';
	const OPTION_KEY     = 'cwc26_db_version';

	// ── Table name helpers ────────────────────────────────────────────────

	public static function teams(): string {
		return $GLOBALS['wpdb']->prefix . 'cwc26_teams';
	}

	public static function stadiums(): string {
		return $GLOBALS['wpdb']->prefix . 'cwc26_stadiums';
	}

	public static function groups(): string {
		return $GLOBALS['wpdb']->prefix . 'cwc26_groups';
	}

	public static function matches(): string {
		return $GLOBALS['wpdb']->prefix . 'cwc26_matches';
	}

	public static function matchmeta(): string {
		return $GLOBALS['wpdb']->prefix . 'cwc26_matchmeta';
	}

	// ── Activation / upgrade ──────────────────────────────────────────────

	/**
	 * Run on plugin activation.
	 * Creates or upgrades all tables, then seeds if fresh install.
	 */
	public static function install(): void {
		$installed = get_option( self::OPTION_KEY, '' );

		self::create_tables();

		if ( '' === $installed ) {
			CWC26_Seeder::run();
		}

		update_option( self::OPTION_KEY, self::SCHEMA_VERSION );
	}

	// ── DDL ───────────────────────────────────────────────────────────────

	private static function create_tables(): void {
		global $wpdb;

		$charset = $wpdb->get_charset_collate();

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		// ── teams ────────────────────────────────────────────────────────
		dbDelta( "CREATE TABLE " . self::teams() . " (
			team_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			fifa_code CHAR(3)         NOT NULL,
			name      VARCHAR(100)    NOT NULL,
			flag_iso  VARCHAR(10)     NOT NULL DEFAULT '',
			ranking   SMALLINT UNSIGNED        DEFAULT NULL,
			PRIMARY KEY  (team_id),
			UNIQUE KEY uq_fifa_code (fifa_code)
		) $charset;" );

		// ── stadiums ─────────────────────────────────────────────────────
		dbDelta( "CREATE TABLE " . self::stadiums() . " (
			stadium_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
			roman_id   CHAR(4)          NOT NULL,
			city       VARCHAR(100)     NOT NULL,
			name       VARCHAR(200)     NOT NULL,
			PRIMARY KEY  (stadium_id),
			UNIQUE KEY uq_roman_id (roman_id)
		) $charset;" );

		// ── groups (team ↔ group assignments) ────────────────────────────
		dbDelta( "CREATE TABLE " . self::groups() . " (
			group_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			group_letter CHAR(1)         NOT NULL,
			team_code    CHAR(3)         NOT NULL,
			position     TINYINT UNSIGNED NOT NULL DEFAULT 0,
			PRIMARY KEY  (group_id),
			UNIQUE KEY uq_group_team (group_letter, team_code),
			KEY idx_group_letter (group_letter)
		) $charset;" );

		// ── matches ──────────────────────────────────────────────────────
		dbDelta( "CREATE TABLE " . self::matches() . " (
			match_id     BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
			match_utc    DATETIME         NOT NULL,
			stadium_id   CHAR(4)          NOT NULL,
			round        VARCHAR(10)      NOT NULL,
			phase        VARCHAR(10)      NOT NULL DEFAULT 'group',
			group_letter CHAR(1)                   DEFAULT NULL,
			home_code    VARCHAR(20)      NOT NULL,
			away_code    VARCHAR(20)      NOT NULL,
			home_score   TINYINT UNSIGNED          DEFAULT NULL,
			away_score   TINYINT UNSIGNED          DEFAULT NULL,
			match_status VARCHAR(20)      NOT NULL DEFAULT 'scheduled',
			PRIMARY KEY  (match_id),
			KEY idx_phase        (phase),
			KEY idx_group_letter (group_letter),
			KEY idx_match_utc    (match_utc)
		) $charset;" );

		// ── matchmeta — duas próprias colunas ────────────────────────────
		dbDelta( "CREATE TABLE " . self::matchmeta() . " (
			meta_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			match_id   BIGINT UNSIGNED NOT NULL,
			meta_key   VARCHAR(255)    NOT NULL,
			meta_value LONGTEXT                 DEFAULT NULL,
			PRIMARY KEY  (meta_id),
			KEY idx_match_id (match_id),
			KEY idx_meta_key (meta_key(191))
		) $charset;" );
	}

	// ── Meta helpers (mirrors WP get/update/delete_post_meta) ────────────

	public static function get_match_meta( int $match_id, string $key, bool $single = true ) {
		global $wpdb;

		$rows = $wpdb->get_results( $wpdb->prepare(
			'SELECT meta_value FROM ' . self::matchmeta() . ' WHERE match_id = %d AND meta_key = %s',
			$match_id, $key
		) );

		if ( ! $rows ) {
			return $single ? '' : [];
		}

		$values = array_column( $rows, 'meta_value' );
		return $single ? $values[0] : $values;
	}

	public static function update_match_meta( int $match_id, string $key, $value ): void {
		global $wpdb;

		$exists = $wpdb->get_var( $wpdb->prepare(
			'SELECT meta_id FROM ' . self::matchmeta() . ' WHERE match_id = %d AND meta_key = %s LIMIT 1',
			$match_id, $key
		) );

		if ( $exists ) {
			$wpdb->update(
				self::matchmeta(),
				[ 'meta_value' => maybe_serialize( $value ) ],
				[ 'match_id' => $match_id, 'meta_key' => $key ],
				[ '%s' ],
				[ '%d', '%s' ]
			);
		} else {
			$wpdb->insert(
				self::matchmeta(),
				[ 'match_id' => $match_id, 'meta_key' => $key, 'meta_value' => maybe_serialize( $value ) ],
				[ '%d', '%s', '%s' ]
			);
		}
	}

	public static function delete_match_meta( int $match_id, string $key ): void {
		$GLOBALS['wpdb']->delete(
			self::matchmeta(),
			[ 'match_id' => $match_id, 'meta_key' => $key ],
			[ '%d', '%s' ]
		);
	}

	// ── Uninstall ─────────────────────────────────────────────────────────

	public static function uninstall(): void {
		global $wpdb;

		foreach ( [ self::matchmeta(), self::matches(), self::groups(), self::stadiums(), self::teams() ] as $table ) {
			$wpdb->query( "DROP TABLE IF EXISTS $table" ); // phpcs:ignore
		}

		delete_option( self::OPTION_KEY );
	}
}
