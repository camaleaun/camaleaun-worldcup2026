<?php
/**
 * REST API endpoints for CWC26.
 *
 * Namespace : cwc26/v1
 *
 * GET  /teams
 * GET  /stadiums
 * GET  /matches          ?phase=group|knockout &group=A &round=r32 &per_page=20 &page=1
 * GET  /matches/{id}
 * POST /matches/{id}/score   { home_score, away_score, [home_penalties, away_penalties] }
 *
 * @package camaleaun-worldcup2026
 */

defined( 'ABSPATH' ) || exit;

class CWC26_REST {

	const NAMESPACE = 'cwc26/v1';

	public static function init(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	public static function register_routes(): void {
		// Teams.
		register_rest_route( self::NAMESPACE, '/teams', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_teams' ],
			'permission_callback' => '__return_true',
		] );

		// Stadiums.
		register_rest_route( self::NAMESPACE, '/stadiums', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_stadiums' ],
			'permission_callback' => '__return_true',
		] );

		// Matches list.
		register_rest_route( self::NAMESPACE, '/matches', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_matches' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'phase'    => [ 'type' => 'string', 'enum' => [ 'group', 'knockout' ] ],
				'group'    => [ 'type' => 'string', 'pattern' => '^[A-L]$' ],
				'round'    => [ 'type' => 'string' ],
				'per_page' => [ 'type' => 'integer', 'default' => 104, 'minimum' => 1, 'maximum' => 104 ],
				'page'     => [ 'type' => 'integer', 'default' => 1,   'minimum' => 1 ],
			],
		] );

		// Single match.
		register_rest_route( self::NAMESPACE, '/matches/(?P<id>\d+)', [
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => [ __CLASS__, 'get_match' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'id' => [ 'type' => 'integer', 'required' => true ],
			],
		] );

		// Update score (auth required).
		register_rest_route( self::NAMESPACE, '/matches/(?P<id>\d+)/score', [
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => [ __CLASS__, 'update_score' ],
			'permission_callback' => [ __CLASS__, 'can_edit' ],
			'args'                => [
				'id'              => [ 'type' => 'integer', 'required' => true ],
				'home_score'      => [ 'type' => 'integer', 'minimum' => 0 ],
				'away_score'      => [ 'type' => 'integer', 'minimum' => 0 ],
				'home_penalties'  => [ 'type' => 'integer', 'minimum' => 0 ],
				'away_penalties'  => [ 'type' => 'integer', 'minimum' => 0 ],
				'match_status'    => [ 'type' => 'string', 'enum' => [ 'scheduled', 'live', 'finished' ] ],
			],
		] );
	}

	// ── Permissions ───────────────────────────────────────────────────────

	public static function can_edit(): bool {
		return current_user_can( 'manage_options' );
	}

	// ── Endpoints ─────────────────────────────────────────────────────────

	public static function get_teams( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$rows = $wpdb->get_results(
			'SELECT fifa_code, name, flag_iso, ranking FROM ' . CWC26_DB::teams() . ' ORDER BY name ASC',
			ARRAY_A
		);

		$teams = [];
		foreach ( $rows as $row ) {
			$teams[ $row['fifa_code'] ] = [
				'name'     => $row['name'],
				'flag_url' => self::flag_url( $row['fifa_code'] ),
				'ranking'  => $row['ranking'] ? (int) $row['ranking'] : null,
			];
		}

		return new WP_REST_Response( $teams );
	}

	public static function get_stadiums( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$rows = $wpdb->get_results(
			'SELECT roman_id, city, name FROM ' . CWC26_DB::stadiums() . ' ORDER BY roman_id ASC',
			ARRAY_A
		);

		$stadiums = [];
		foreach ( $rows as $row ) {
			$stadiums[ $row['roman_id'] ] = [
				'city' => $row['city'],
				'name' => $row['name'],
			];
		}

		return new WP_REST_Response( $stadiums );
	}

	public static function get_matches( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$where  = [];
		$params = [];

		if ( $phase = $request->get_param( 'phase' ) ) {
			$where[]  = 'phase = %s';
			$params[] = $phase;
		}

		if ( $group = $request->get_param( 'group' ) ) {
			$where[]  = 'group_letter = %s';
			$params[] = $group;
		}

		if ( $round = $request->get_param( 'round' ) ) {
			$where[]  = 'round = %s';
			$params[] = $round;
		}

		$per_page = (int) $request->get_param( 'per_page' );
		$page     = (int) $request->get_param( 'page' );
		$offset   = ( $page - 1 ) * $per_page;

		$sql = 'SELECT * FROM ' . CWC26_DB::matches();

		if ( $where ) {
			$sql .= ' WHERE ' . implode( ' AND ', $where );
		}

		$sql .= ' ORDER BY match_utc ASC LIMIT %d OFFSET %d';

		$params[] = $per_page;
		$params[] = $offset;

		$rows = $wpdb->get_results( $wpdb->prepare( $sql, $params ), ARRAY_A );

		return new WP_REST_Response( array_map( [ __CLASS__, 'format_match' ], $rows ) );
	}

	public static function get_match( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$id  = (int) $request->get_param( 'id' );
		$row = $wpdb->get_row( $wpdb->prepare(
			'SELECT * FROM ' . CWC26_DB::matches() . ' WHERE match_id = %d',
			$id
		), ARRAY_A );

		if ( ! $row ) {
			return new WP_REST_Response( [ 'message' => 'Match not found.' ], 404 );
		}

		return new WP_REST_Response( self::format_match( $row ) );
	}

	public static function update_score( WP_REST_Request $request ): WP_REST_Response {
		global $wpdb;

		$id = (int) $request->get_param( 'id' );

		$row = $wpdb->get_var( $wpdb->prepare(
			'SELECT match_id FROM ' . CWC26_DB::matches() . ' WHERE match_id = %d',
			$id
		) );

		if ( ! $row ) {
			return new WP_REST_Response( [ 'message' => 'Match not found.' ], 404 );
		}

		$data   = [];
		$format = [];

		foreach ( [ 'home_score', 'away_score' ] as $field ) {
			$val = $request->get_param( $field );
			if ( null !== $val ) {
				$data[ $field ] = (int) $val;
				$format[]       = '%d';
			}
		}

		if ( $status = $request->get_param( 'match_status' ) ) {
			$data['match_status'] = $status;
			$format[]             = '%s';
		}

		if ( $data ) {
			$wpdb->update( CWC26_DB::matches(), $data, [ 'match_id' => $id ], $format, [ '%d' ] );
		}

		// Penalties → matchmeta.
		foreach ( [ 'home_penalties', 'away_penalties' ] as $key ) {
			$val = $request->get_param( $key );
			if ( null !== $val ) {
				CWC26_DB::update_match_meta( $id, $key, (int) $val );
			}
		}

		return self::get_match( $request );
	}

	// ── Formatters ────────────────────────────────────────────────────────

	private static function format_match( array $row ): array {
		$id  = (int) $row['match_id'];
		$out = [
			'id'           => $id,
			'utc'          => self::to_iso( $row['match_utc'] ),
			'stadium'      => $row['stadium_id'],
			'round'        => $row['round'],
			'phase'        => $row['phase'],
			'group'        => $row['group_letter'],
			'home'         => $row['home_code'],
			'away'         => $row['away_code'],
			'home_score'   => isset( $row['home_score'] ) ? (int) $row['home_score'] : null,
			'away_score'   => isset( $row['away_score'] ) ? (int) $row['away_score'] : null,
			'match_status' => $row['match_status'],
		];

		// Attach penalties from matchmeta.
		foreach ( [ 'home_penalties', 'away_penalties' ] as $key ) {
			$val = CWC26_DB::get_match_meta( $id, $key );
			if ( '' !== $val ) {
				$out[ $key ] = (int) $val;
			}
		}

		return $out;
	}

	private static function to_iso( string $datetime ): string {
		return str_replace( ' ', 'T', $datetime ) . 'Z';
	}

	private static function flag_url( string $fifa_code ): string {
		return WC2026_PLUGIN_URL . 'assets/flags/' . strtolower( $fifa_code ) . '.svg';
	}
}
