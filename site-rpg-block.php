<?php
/**
 * Plugin Name:       Site RPG Block
 * Description:       Turn your WordPress site into an RPG character that levels up based on metrics and visitor interactions.
 * Version:           1.1.0
 * Requires at least: 6.1
 * Requires PHP:      7.4
 * Author:            Nealey
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       site-rpg-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SITE_RPG_BLOCK_VERSION', '1.1.0' );
define( 'SITE_RPG_BLOCK_PATH', plugin_dir_path( __FILE__ ) );
define( 'SITE_RPG_BLOCK_URL', plugin_dir_url( __FILE__ ) );

// Include required files.
require_once SITE_RPG_BLOCK_PATH . 'includes/class-database.php';
require_once SITE_RPG_BLOCK_PATH . 'includes/class-xp-tracker.php';
require_once SITE_RPG_BLOCK_PATH . 'includes/class-races-classes.php';
require_once SITE_RPG_BLOCK_PATH . 'includes/class-character.php';
require_once SITE_RPG_BLOCK_PATH . 'includes/class-user-xp-actions.php';
require_once SITE_RPG_BLOCK_PATH . 'includes/class-rest-api.php';

/**
 * Plugin activation hook.
 */
function site_rpg_block_activate() {
	// Create database tables.
	Site_RPG_Database::install();
}
register_activation_hook( __FILE__, 'site_rpg_block_activate' );

/**
 * Check for database updates on plugin load.
 */
function site_rpg_block_check_db() {
	Site_RPG_Database::maybe_upgrade();
}
add_action( 'plugins_loaded', 'site_rpg_block_check_db' );

/**
 * Initialize the plugin.
 */
function site_rpg_block_init() {
	// Initialize XP Tracker.
	Site_RPG_XP_Tracker::get_instance();

	// Initialize REST API.
	Site_RPG_REST_API::get_instance();

	// Initialize User XP Actions.
	Site_RPG_User_XP_Actions::init();
}
add_action( 'init', 'site_rpg_block_init' );

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 */
function site_rpg_block_register() {
	register_block_type( SITE_RPG_BLOCK_PATH . 'build/blocks/site-rpg' );
}
add_action( 'init', 'site_rpg_block_register' );

/**
 * Enqueue block assets and pass data to frontend.
 */
function site_rpg_block_enqueue_assets() {
	$xp_tracker = Site_RPG_XP_Tracker::get_instance();

	$data = array(
		'ajaxUrl'     => admin_url( 'admin-ajax.php' ),
		'restUrl'     => rest_url( 'site-rpg/v1/' ),
		'nonce'       => wp_create_nonce( 'wp_rest' ),
		'actionToken' => Site_RPG_REST_API::generate_action_token(),
		'siteData'    => $xp_tracker->get_site_stats(),
		'userId'      => get_current_user_id(),
	);

	// Add character data if user is logged in.
	if ( is_user_logged_in() ) {
		$user_id   = get_current_user_id();
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		$data['character']    = $character ? $character->to_array() : null;
		$data['isLoggedIn']   = true;
		$data['userDisplayName'] = wp_get_current_user()->display_name;
	} else {
		$data['character']    = null;
		$data['isLoggedIn']   = false;
		$data['userDisplayName'] = '';
	}

	wp_localize_script(
		'site-rpg-character-card-view-script',
		'siteRpgData',
		$data
	);
}
add_action( 'wp_enqueue_scripts', 'site_rpg_block_enqueue_assets' );

/**
 * Pass site data to the editor.
 */
function site_rpg_block_editor_assets() {
	$xp_tracker = Site_RPG_XP_Tracker::get_instance();

	wp_localize_script(
		'site-rpg-character-card-editor-script',
		'siteRpgData',
		array(
			'siteData' => $xp_tracker->get_site_stats(),
		)
	);
}
add_action( 'enqueue_block_editor_assets', 'site_rpg_block_editor_assets' );
