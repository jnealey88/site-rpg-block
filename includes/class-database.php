<?php
/**
 * Site RPG Database Management
 *
 * Handles database table creation and upgrades for the character system.
 *
 * @package Site_RPG_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_Database
 *
 * Manages database tables for user characters and XP logging.
 */
class Site_RPG_Database {

	/**
	 * Current database version.
	 */
	const DB_VERSION = '1.2.0';

	/**
	 * Option key for tracking database version.
	 */
	const DB_VERSION_OPTION = 'site_rpg_db_version';

	/**
	 * Character table name (without prefix).
	 */
	const CHARACTER_TABLE = 'site_rpg_characters';

	/**
	 * XP log table name (without prefix).
	 */
	const XP_LOG_TABLE = 'site_rpg_xp_log';

	/**
	 * Get full table name with WordPress prefix.
	 *
	 * @param string $table Table name constant.
	 * @return string Full table name with prefix.
	 */
	public static function get_table_name( $table ) {
		global $wpdb;
		return $wpdb->prefix . $table;
	}

	/**
	 * Install database tables.
	 *
	 * Called on plugin activation.
	 */
	public static function install() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		// Characters table.
		$characters_table = self::get_table_name( self::CHARACTER_TABLE );
		$characters_sql   = "CREATE TABLE {$characters_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			character_name VARCHAR(100) NOT NULL,
			character_race VARCHAR(50) DEFAULT NULL,
			character_class VARCHAR(50) DEFAULT NULL,
			avatar_data LONGTEXT DEFAULT NULL,

			base_strength TINYINT UNSIGNED NOT NULL DEFAULT 10,
			base_wisdom TINYINT UNSIGNED NOT NULL DEFAULT 10,
			base_charisma TINYINT UNSIGNED NOT NULL DEFAULT 10,
			base_stamina TINYINT UNSIGNED NOT NULL DEFAULT 10,
			base_agility TINYINT UNSIGNED NOT NULL DEFAULT 10,
			base_intelligence TINYINT UNSIGNED NOT NULL DEFAULT 10,

			bonus_strength TINYINT UNSIGNED NOT NULL DEFAULT 0,
			bonus_wisdom TINYINT UNSIGNED NOT NULL DEFAULT 0,
			bonus_charisma TINYINT UNSIGNED NOT NULL DEFAULT 0,
			bonus_stamina TINYINT UNSIGNED NOT NULL DEFAULT 0,
			bonus_agility TINYINT UNSIGNED NOT NULL DEFAULT 0,
			bonus_intelligence TINYINT UNSIGNED NOT NULL DEFAULT 0,

			xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
			total_xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
			level INT UNSIGNED NOT NULL DEFAULT 1,
			unspent_stat_points TINYINT UNSIGNED NOT NULL DEFAULT 0,

			games_played INT UNSIGNED NOT NULL DEFAULT 0,
			enemies_killed INT UNSIGNED NOT NULL DEFAULT 0,

			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

			PRIMARY KEY (id),
			UNIQUE KEY user_character (user_id),
			KEY level_idx (level),
			KEY total_xp_idx (total_xp)
		) {$charset_collate};";

		// XP log table.
		$xp_log_table = self::get_table_name( self::XP_LOG_TABLE );
		$xp_log_sql   = "CREATE TABLE {$xp_log_table} (
			id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			user_id BIGINT(20) UNSIGNED NOT NULL,
			action_type VARCHAR(50) NOT NULL,
			xp_earned INT NOT NULL,
			reference_id BIGINT UNSIGNED DEFAULT NULL,
			reference_type VARCHAR(50) DEFAULT NULL,
			ip_address VARCHAR(45) DEFAULT NULL,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

			PRIMARY KEY (id),
			KEY user_action_idx (user_id, action_type, created_at),
			KEY reference_idx (reference_type, reference_id)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		// Only run dbDelta for tables that don't exist to avoid MariaDB/WordPress compatibility issues.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		if ( $wpdb->get_var( "SHOW TABLES LIKE '{$characters_table}'" ) !== $characters_table ) {
			dbDelta( $characters_sql );
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		if ( $wpdb->get_var( "SHOW TABLES LIKE '{$xp_log_table}'" ) !== $xp_log_table ) {
			dbDelta( $xp_log_sql );
		}

		update_option( self::DB_VERSION_OPTION, self::DB_VERSION );
	}

	/**
	 * Check if database needs upgrade and perform it.
	 */
	public static function maybe_upgrade() {
		$installed_version = get_option( self::DB_VERSION_OPTION, '0' );

		if ( version_compare( $installed_version, self::DB_VERSION, '<' ) ) {
			// Run migration for 1.1.0 (race, class, avatar columns).
			if ( version_compare( $installed_version, '1.1.0', '<' ) ) {
				self::migrate_to_1_1_0();
			}

			// Run migration for 1.2.0 (unlocked_coupons column).
			if ( version_compare( $installed_version, '1.2.0', '<' ) ) {
				self::migrate_to_1_2_0();
			}

			self::install();
		}
	}

	/**
	 * Migration to version 1.1.0.
	 *
	 * Adds race, class, and avatar_data columns to characters table.
	 */
	private static function migrate_to_1_1_0() {
		global $wpdb;

		$table = self::get_table_name( self::CHARACTER_TABLE );

		// Check if columns exist before adding.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$columns = $wpdb->get_col( "DESCRIBE {$table}", 0 );

		if ( ! in_array( 'character_race', $columns, true ) ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN character_race VARCHAR(50) DEFAULT NULL AFTER character_name" );
		}

		if ( ! in_array( 'character_class', $columns, true ) ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN character_class VARCHAR(50) DEFAULT NULL AFTER character_race" );
		}

		if ( ! in_array( 'avatar_data', $columns, true ) ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN avatar_data LONGTEXT DEFAULT NULL AFTER character_class" );
		}
	}

	/**
	 * Migration to version 1.2.0.
	 *
	 * Adds unlocked_coupons column to characters table for level-based coupon rewards.
	 */
	private static function migrate_to_1_2_0() {
		global $wpdb;

		$table = self::get_table_name( self::CHARACTER_TABLE );

		// Check if column exists before adding.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$columns = $wpdb->get_col( "DESCRIBE {$table}", 0 );

		if ( ! in_array( 'unlocked_coupons', $columns, true ) ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN unlocked_coupons LONGTEXT DEFAULT NULL AFTER avatar_data" );
		}
	}

	/**
	 * Uninstall database tables.
	 *
	 * Called on plugin uninstall (optional).
	 */
	public static function uninstall() {
		global $wpdb;

		$characters_table = self::get_table_name( self::CHARACTER_TABLE );
		$xp_log_table     = self::get_table_name( self::XP_LOG_TABLE );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS {$characters_table}" );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS {$xp_log_table}" );

		delete_option( self::DB_VERSION_OPTION );
	}

	/**
	 * Check if tables exist.
	 *
	 * @return bool True if both tables exist.
	 */
	public static function tables_exist() {
		global $wpdb;

		$characters_table = self::get_table_name( self::CHARACTER_TABLE );
		$xp_log_table     = self::get_table_name( self::XP_LOG_TABLE );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$characters_exists = $wpdb->get_var( "SHOW TABLES LIKE '{$characters_table}'" ) === $characters_table;
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$xp_log_exists = $wpdb->get_var( "SHOW TABLES LIKE '{$xp_log_table}'" ) === $xp_log_table;

		return $characters_exists && $xp_log_exists;
	}
}
