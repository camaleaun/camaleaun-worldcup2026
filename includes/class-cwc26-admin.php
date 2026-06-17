<?php
/**
 * Admin page — Match management via React + @wordpress/dataviews.
 *
 * @package camaleaun-worldcup2026
 */

defined( 'ABSPATH' ) || exit;

class CWC26_Admin {

	const PAGE_SLUG = 'cwc26-matches';
	const SCRIPT_HANDLE = 'cwc26-admin';

	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_page' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue' ] );
	}

	public static function register_page(): void {
		add_menu_page(
			__( 'WC2026 Matches', 'camaleaun-worldcup2026' ),
			__( 'WC2026', 'camaleaun-worldcup2026' ),
			'manage_options',
			self::PAGE_SLUG,
			[ __CLASS__, 'render_page' ],
			'dashicons-awards',
			30
		);
	}

	public static function render_page(): void {
		echo '<div id="cwc26-admin-root"></div>';
	}

	public static function enqueue( string $hook ): void {
		if ( 'toplevel_page_' . self::PAGE_SLUG !== $hook ) {
			return;
		}

		$build = WC2026_PLUGIN_DIR . 'build/admin/';
		$url   = WC2026_PLUGIN_URL . 'build/admin/';

		if ( ! file_exists( $build . 'index.js' ) ) {
			return;
		}

		$asset = file_exists( $build . 'index.asset.php' )
			? require $build . 'index.asset.php'
			: [ 'dependencies' => [], 'version' => WC2026_VERSION ];

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$url . 'index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			self::SCRIPT_HANDLE,
			$url . 'index.css',
			[ 'wp-components' ],
			$asset['version']
		);

		wp_localize_script( self::SCRIPT_HANDLE, 'CWC26Admin', [
			'restUrl'   => esc_url_raw( rest_url( CWC26_REST::NAMESPACE ) ),
			'nonce'     => wp_create_nonce( 'wp_rest' ),
			'pluginUrl' => WC2026_PLUGIN_URL,
		] );
	}
}
