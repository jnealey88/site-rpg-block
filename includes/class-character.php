<?php
/**
 * Site RPG Character Management
 *
 * Handles character creation, stats, XP, and leveling.
 *
 * @package Site_RPG_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_Character
 *
 * Manages individual user characters.
 */
class Site_RPG_Character {

	/**
	 * Maximum stat value.
	 */
	const STAT_CAP = 20;

	/**
	 * Base XP required per level.
	 */
	const BASE_XP_PER_LEVEL = 100;

	/**
	 * XP growth multiplier per level.
	 */
	const XP_GROWTH_RATE = 1.5;

	/**
	 * Stat points awarded per level.
	 */
	const STAT_POINTS_PER_LEVEL = 1;

	/**
	 * Valid stat keys.
	 */
	const VALID_STATS = array( 'strength', 'wisdom', 'charisma', 'stamina', 'agility', 'intelligence' );

	/**
	 * Level titles.
	 */
	const LEVEL_TITLES = array(
		1  => 'Newcomer',
		2  => 'Adventurer',
		3  => 'Explorer',
		4  => 'Champion',
		5  => 'Hero',
		6  => 'Legend',
		7  => 'Master',
		8  => 'Grandmaster',
		9  => 'Mythic',
		10 => 'Immortal',
	);

	/**
	 * Character data.
	 *
	 * @var array
	 */
	private $data;

	/**
	 * Constructor.
	 *
	 * @param array $data Character data from database.
	 */
	public function __construct( $data ) {
		$this->data = $data;
	}

	/**
	 * Get character by user ID.
	 *
	 * @param int $user_id WordPress user ID.
	 * @return Site_RPG_Character|null Character instance or null if not found.
	 */
	public static function get_by_user_id( $user_id ) {
		global $wpdb;

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$data = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d", $user_id ),
			ARRAY_A
		);

		if ( ! $data ) {
			return null;
		}

		return new self( $data );
	}

	/**
	 * Get character by ID.
	 *
	 * @param int $character_id Character ID.
	 * @return Site_RPG_Character|null Character instance or null if not found.
	 */
	public static function get_by_id( $character_id ) {
		global $wpdb;

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$data = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $character_id ),
			ARRAY_A
		);

		if ( ! $data ) {
			return null;
		}

		return new self( $data );
	}

	/**
	 * Create a new character for a user.
	 *
	 * @param int    $user_id          WordPress user ID.
	 * @param string $character_name   Optional character name (defaults to display name).
	 * @param string $race             Optional race key.
	 * @param string $class_key        Optional class key.
	 * @param array  $avatar_data      Optional avatar customization data.
	 * @param array  $human_choices    Optional stat choices for human race (array of stat keys).
	 * @param array  $prerolled_stats  Optional pre-rolled stats from wizard.
	 * @return Site_RPG_Character|WP_Error Character instance or error.
	 */
	public static function create( $user_id, $character_name = '', $race = null, $class_key = null, $avatar_data = null, $human_choices = array(), $prerolled_stats = null ) {
		global $wpdb;

		// Check if user already has a character.
		$existing = self::get_by_user_id( $user_id );
		if ( $existing ) {
			return new WP_Error( 'character_exists', 'User already has a character.' );
		}

		// Validate race if provided.
		if ( $race && ! Site_RPG_Races_Classes::is_valid_race( $race ) ) {
			return new WP_Error( 'invalid_race', 'Invalid race selection.' );
		}

		// Validate class if provided.
		if ( $class_key && ! Site_RPG_Races_Classes::is_valid_class( $class_key ) ) {
			return new WP_Error( 'invalid_class', 'Invalid class selection.' );
		}

		// Get user display name if no name provided.
		if ( empty( $character_name ) ) {
			$user = get_user_by( 'id', $user_id );
			if ( $user ) {
				$character_name = $user->display_name;
			} else {
				$character_name = 'Hero';
			}
		}

		// Use pre-rolled stats if provided, otherwise roll fresh.
		if ( ! empty( $prerolled_stats ) && is_array( $prerolled_stats ) ) {
			$rolled_stats = array();
			foreach ( self::VALID_STATS as $stat ) {
				$rolled_stats[ $stat ] = isset( $prerolled_stats[ $stat ] )
					? max( 1, min( 20, (int) $prerolled_stats[ $stat ] ) )
					: 10;
			}
		} else {
			$rolled_stats = self::roll_stats();
		}

		// Apply race modifiers.
		if ( $race ) {
			$rolled_stats = Site_RPG_Races_Classes::apply_race_modifiers( $rolled_stats, $race, $human_choices );
		}

		// Apply class proficiency bonuses.
		if ( $class_key ) {
			$rolled_stats = Site_RPG_Races_Classes::apply_class_bonuses( $rolled_stats, $class_key );
		}

		// Encode avatar data as JSON.
		$avatar_json = null;
		if ( ! empty( $avatar_data ) && is_array( $avatar_data ) ) {
			$avatar_json = wp_json_encode( $avatar_data );
		}

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$insert_data = array(
			'user_id'           => $user_id,
			'character_name'    => sanitize_text_field( $character_name ),
			'character_race'    => $race ? sanitize_text_field( $race ) : null,
			'character_class'   => $class_key ? sanitize_text_field( $class_key ) : null,
			'avatar_data'       => $avatar_json,
			'base_strength'     => $rolled_stats['strength'],
			'base_wisdom'       => $rolled_stats['wisdom'],
			'base_charisma'     => $rolled_stats['charisma'],
			'base_stamina'      => $rolled_stats['stamina'],
			'base_agility'      => $rolled_stats['agility'],
			'base_intelligence' => $rolled_stats['intelligence'],
			'xp'                => 0,
			'total_xp'          => 0,
			'level'             => 1,
			'unspent_stat_points' => 0,
			'games_played'      => 0,
			'enemies_killed'    => 0,
		);

		$result = $wpdb->insert(
			$table,
			$insert_data,
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d', '%d', '%d', '%d', '%d', '%d', '%d' )
		);

		if ( false === $result ) {
			return new WP_Error( 'db_error', 'Failed to create character.' );
		}

		return self::get_by_id( $wpdb->insert_id );
	}

	/**
	 * Roll stats using 4d6 drop lowest method.
	 *
	 * @return array Array of rolled stats.
	 */
	public static function roll_stats() {
		$stats = array();

		foreach ( self::VALID_STATS as $stat ) {
			$roll           = self::roll_4d6_drop_lowest();
			$stats[ $stat ] = self::scale_to_stat_range( $roll );
		}

		return $stats;
	}

	/**
	 * Roll 4d6 and drop the lowest die.
	 *
	 * @return int Result (3-18 range).
	 */
	private static function roll_4d6_drop_lowest() {
		$rolls = array();
		for ( $i = 0; $i < 4; $i++ ) {
			$rolls[] = wp_rand( 1, 6 );
		}
		sort( $rolls );
		array_shift( $rolls ); // Drop lowest.
		return array_sum( $rolls );
	}

	/**
	 * Scale a 3-18 roll to 1-20 stat range.
	 *
	 * @param int $roll The roll result (3-18).
	 * @return int Scaled stat value (1-20).
	 */
	private static function scale_to_stat_range( $roll ) {
		// Map 3-18 to 1-20.
		// 3 -> 1, 10-11 -> 10, 18 -> 20.
		$scaled = round( ( ( $roll - 3 ) / 15 ) * 19 ) + 1;
		return max( 1, min( 20, (int) $scaled ) );
	}

	/**
	 * Get character ID.
	 *
	 * @return int Character ID.
	 */
	public function get_id() {
		return (int) $this->data['id'];
	}

	/**
	 * Get user ID.
	 *
	 * @return int User ID.
	 */
	public function get_user_id() {
		return (int) $this->data['user_id'];
	}

	/**
	 * Get character name.
	 *
	 * @return string Character name.
	 */
	public function get_name() {
		return $this->data['character_name'];
	}

	/**
	 * Get character race.
	 *
	 * @return string|null Race key or null if not set.
	 */
	public function get_race() {
		return isset( $this->data['character_race'] ) ? $this->data['character_race'] : null;
	}

	/**
	 * Get character class.
	 *
	 * @return string|null Class key or null if not set.
	 */
	public function get_class() {
		return isset( $this->data['character_class'] ) ? $this->data['character_class'] : null;
	}

	/**
	 * Get avatar data.
	 *
	 * @return array|null Avatar data array or null if not set.
	 */
	public function get_avatar_data() {
		if ( empty( $this->data['avatar_data'] ) ) {
			return null;
		}
		$data = json_decode( $this->data['avatar_data'], true );
		return is_array( $data ) ? $data : null;
	}

	/**
	 * Get unlocked coupon levels.
	 *
	 * @return array Array of level numbers that have unlocked coupons.
	 */
	public function get_unlocked_coupons() {
		if ( empty( $this->data['unlocked_coupons'] ) ) {
			return array();
		}
		$data = json_decode( $this->data['unlocked_coupons'], true );
		return is_array( $data ) ? $data : array();
	}

	/**
	 * Unlock a level-based coupon.
	 *
	 * @param int $level The level that was reached.
	 * @return bool True on success.
	 */
	public function unlock_coupon( $level ) {
		global $wpdb;

		$level    = (int) $level;
		$unlocked = $this->get_unlocked_coupons();

		// Already unlocked.
		if ( in_array( $level, $unlocked, true ) ) {
			return true;
		}

		$unlocked[] = $level;
		$table      = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$result = $wpdb->update(
			$table,
			array( 'unlocked_coupons' => wp_json_encode( $unlocked ) ),
			array( 'id' => $this->get_id() ),
			array( '%s' ),
			array( '%d' )
		);

		if ( false !== $result ) {
			$this->data['unlocked_coupons'] = wp_json_encode( $unlocked );
		}

		return false !== $result;
	}

	/**
	 * Get current level.
	 *
	 * @return int Current level.
	 */
	public function get_level() {
		return (int) $this->data['level'];
	}

	/**
	 * Get current XP (progress toward next level).
	 *
	 * @return int Current XP.
	 */
	public function get_xp() {
		return (int) $this->data['xp'];
	}

	/**
	 * Get total XP earned.
	 *
	 * @return int Total XP.
	 */
	public function get_total_xp() {
		return (int) $this->data['total_xp'];
	}

	/**
	 * Get unspent stat points.
	 *
	 * @return int Unspent stat points.
	 */
	public function get_unspent_stat_points() {
		return (int) $this->data['unspent_stat_points'];
	}

	/**
	 * Get games played count.
	 *
	 * @return int Games played.
	 */
	public function get_games_played() {
		return (int) $this->data['games_played'];
	}

	/**
	 * Get enemies killed count.
	 *
	 * @return int Enemies killed.
	 */
	public function get_enemies_killed() {
		return (int) $this->data['enemies_killed'];
	}

	/**
	 * Get base stat value (before bonuses).
	 *
	 * @param string $stat Stat key.
	 * @return int Base stat value.
	 */
	public function get_base_stat( $stat ) {
		if ( ! in_array( $stat, self::VALID_STATS, true ) ) {
			return 0;
		}
		return (int) $this->data[ 'base_' . $stat ];
	}

	/**
	 * Get bonus stat value (from level-ups).
	 *
	 * @param string $stat Stat key.
	 * @return int Bonus stat value.
	 */
	public function get_bonus_stat( $stat ) {
		if ( ! in_array( $stat, self::VALID_STATS, true ) ) {
			return 0;
		}
		return (int) $this->data[ 'bonus_' . $stat ];
	}

	/**
	 * Get total stat value (base + bonus, capped at 20).
	 *
	 * @param string $stat Stat key.
	 * @return int Total stat value.
	 */
	public function get_total_stat( $stat ) {
		$total = $this->get_base_stat( $stat ) + $this->get_bonus_stat( $stat );
		return min( self::STAT_CAP, $total );
	}

	/**
	 * Get all stats as array.
	 *
	 * @return array All stats with base, bonus, and total values.
	 */
	public function get_all_stats() {
		$stats = array();

		foreach ( self::VALID_STATS as $stat ) {
			$stats[ $stat ] = array(
				'base'  => $this->get_base_stat( $stat ),
				'bonus' => $this->get_bonus_stat( $stat ),
				'total' => $this->get_total_stat( $stat ),
			);
		}

		return $stats;
	}

	/**
	 * Get stat bonuses for game mechanics (D&D-style).
	 *
	 * @return array Stat bonuses (-4 to +5).
	 */
	public function get_stat_bonuses() {
		$bonuses = array();

		foreach ( self::VALID_STATS as $stat ) {
			$value              = $this->get_total_stat( $stat );
			$bonuses[ $stat ]   = (int) floor( ( $value - 10 ) / 2 );
		}

		// Also include short names for convenience.
		$bonuses['str'] = $bonuses['strength'];
		$bonuses['wis'] = $bonuses['wisdom'];
		$bonuses['cha'] = $bonuses['charisma'];
		$bonuses['sta'] = $bonuses['stamina'];
		$bonuses['agi'] = $bonuses['agility'];
		$bonuses['int'] = $bonuses['intelligence'];

		return $bonuses;
	}

	/**
	 * Get XP required for next level.
	 *
	 * @return int XP required.
	 */
	public function get_xp_for_next_level() {
		return self::calculate_xp_for_level( $this->get_level() );
	}

	/**
	 * Calculate XP required for a specific level.
	 *
	 * @param int $level Level number.
	 * @return int XP required.
	 */
	public static function calculate_xp_for_level( $level ) {
		return (int) round( self::BASE_XP_PER_LEVEL * pow( self::XP_GROWTH_RATE, $level - 1 ) );
	}

	/**
	 * Get level title.
	 *
	 * @return string Level title.
	 */
	public function get_level_title() {
		$level = $this->get_level();

		// Find the appropriate title.
		$title = 'Immortal';
		foreach ( self::LEVEL_TITLES as $lvl => $t ) {
			if ( $level >= $lvl ) {
				$title = $t;
			}
		}

		return $title;
	}

	/**
	 * Add XP to character and handle level-ups.
	 *
	 * @param int    $amount        Amount of XP to add.
	 * @param string $source        Source of XP (game, action, etc.).
	 * @param int    $reference_id  Optional reference ID.
	 * @param string $reference_type Optional reference type.
	 * @return array Result with leveled_up flag and new stats.
	 */
	public function add_xp( $amount, $source = 'general', $reference_id = null, $reference_type = null ) {
		global $wpdb;

		$amount        = max( 0, (int) $amount );
		$old_level     = $this->get_level();
		$new_xp        = $this->get_xp() + $amount;
		$new_total_xp  = $this->get_total_xp() + $amount;
		$new_level     = $old_level;
		$stat_points   = 0;

		// Check for level-ups.
		while ( $new_xp >= self::calculate_xp_for_level( $new_level ) ) {
			$new_xp -= self::calculate_xp_for_level( $new_level );
			$new_level++;
			$stat_points += self::STAT_POINTS_PER_LEVEL;
		}

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$wpdb->update(
			$table,
			array(
				'xp'                  => $new_xp,
				'total_xp'            => $new_total_xp,
				'level'               => $new_level,
				'unspent_stat_points' => $this->get_unspent_stat_points() + $stat_points,
			),
			array( 'id' => $this->get_id() ),
			array( '%d', '%d', '%d', '%d' ),
			array( '%d' )
		);

		// Update local data.
		$this->data['xp']                  = $new_xp;
		$this->data['total_xp']            = $new_total_xp;
		$this->data['level']               = $new_level;
		$this->data['unspent_stat_points'] = $this->get_unspent_stat_points() + $stat_points;

		// Log the XP action.
		$this->log_xp_action( $amount, $source, $reference_id, $reference_type );

		return array(
			'leveled_up'         => $new_level > $old_level,
			'old_level'          => $old_level,
			'new_level'          => $new_level,
			'xp'                 => $new_xp,
			'total_xp'           => $new_total_xp,
			'xp_to_next_level'   => self::calculate_xp_for_level( $new_level ),
			'unspent_stat_points' => $this->data['unspent_stat_points'],
		);
	}

	/**
	 * Log an XP action to the log table.
	 *
	 * @param int    $xp_earned     Amount of XP earned.
	 * @param string $action_type   Type of action.
	 * @param int    $reference_id  Optional reference ID.
	 * @param string $reference_type Optional reference type.
	 */
	private function log_xp_action( $xp_earned, $action_type, $reference_id = null, $reference_type = null ) {
		global $wpdb;

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::XP_LOG_TABLE );

		$wpdb->insert(
			$table,
			array(
				'user_id'        => $this->get_user_id(),
				'action_type'    => sanitize_text_field( $action_type ),
				'xp_earned'      => $xp_earned,
				'reference_id'   => $reference_id,
				'reference_type' => $reference_type ? sanitize_text_field( $reference_type ) : null,
				'ip_address'     => self::get_client_ip(),
			),
			array( '%d', '%s', '%d', '%d', '%s', '%s' )
		);
	}

	/**
	 * Record a game completion.
	 *
	 * @param int $xp_earned      XP earned in the game.
	 * @param int $enemies_killed Enemies killed in the game.
	 * @return array Result with leveled_up flag and new stats.
	 */
	public function record_game( $xp_earned, $enemies_killed = 0 ) {
		global $wpdb;

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		// Update game stats.
		$wpdb->update(
			$table,
			array(
				'games_played'   => $this->get_games_played() + 1,
				'enemies_killed' => $this->get_enemies_killed() + $enemies_killed,
			),
			array( 'id' => $this->get_id() ),
			array( '%d', '%d' ),
			array( '%d' )
		);

		// Update local data.
		$this->data['games_played']   = $this->get_games_played() + 1;
		$this->data['enemies_killed'] = $this->get_enemies_killed() + $enemies_killed;

		// Add XP.
		return $this->add_xp( $xp_earned, 'game', null, 'game' );
	}

	/**
	 * Allocate a stat point.
	 *
	 * @param string $stat Stat to increase.
	 * @return array|WP_Error Updated stats or error.
	 */
	public function allocate_stat_point( $stat ) {
		if ( ! in_array( $stat, self::VALID_STATS, true ) ) {
			return new WP_Error( 'invalid_stat', 'Invalid stat key.' );
		}

		if ( $this->get_unspent_stat_points() < 1 ) {
			return new WP_Error( 'no_points', 'No stat points available.' );
		}

		if ( $this->get_total_stat( $stat ) >= self::STAT_CAP ) {
			return new WP_Error( 'stat_capped', 'Stat is already at maximum.' );
		}

		global $wpdb;

		$table     = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );
		$bonus_col = 'bonus_' . $stat;

		$wpdb->update(
			$table,
			array(
				$bonus_col            => $this->get_bonus_stat( $stat ) + 1,
				'unspent_stat_points' => $this->get_unspent_stat_points() - 1,
			),
			array( 'id' => $this->get_id() ),
			array( '%d', '%d' ),
			array( '%d' )
		);

		// Update local data.
		$this->data[ $bonus_col ]          = $this->get_bonus_stat( $stat ) + 1;
		$this->data['unspent_stat_points'] = $this->get_unspent_stat_points() - 1;

		return array(
			'stat'                => $stat,
			'new_value'           => $this->get_total_stat( $stat ),
			'unspent_stat_points' => $this->data['unspent_stat_points'],
		);
	}

	/**
	 * Delete character completely.
	 *
	 * @return bool|WP_Error True on success or error.
	 */
	public function delete() {
		global $wpdb;

		$table     = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );
		$log_table = Site_RPG_Database::get_table_name( Site_RPG_Database::XP_LOG_TABLE );

		// Delete XP log entries for this user.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->delete( $log_table, array( 'user_id' => $this->get_user_id() ), array( '%d' ) );

		// Delete the character record.
		$result = $wpdb->delete(
			$table,
			array( 'id' => $this->get_id() ),
			array( '%d' )
		);

		if ( false === $result ) {
			return new WP_Error( 'db_error', 'Failed to delete character.' );
		}

		return true;
	}

	/**
	 * Import guest character data (on first login).
	 *
	 * @param array $guest_data Guest character data from localStorage.
	 * @return bool Success.
	 */
	public function import_guest_data( $guest_data ) {
		global $wpdb;

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$update_data = array();
		$formats     = array();

		// Import XP if provided.
		if ( isset( $guest_data['xp'] ) ) {
			$update_data['xp'] = max( 0, (int) $guest_data['xp'] );
			$formats[]         = '%d';
		}

		if ( isset( $guest_data['total_xp'] ) ) {
			$update_data['total_xp'] = max( 0, (int) $guest_data['total_xp'] );
			$formats[]               = '%d';
		}

		if ( isset( $guest_data['level'] ) ) {
			$update_data['level'] = max( 1, (int) $guest_data['level'] );
			$formats[]            = '%d';
		}

		if ( isset( $guest_data['games_played'] ) ) {
			$update_data['games_played'] = max( 0, (int) $guest_data['games_played'] );
			$formats[]                   = '%d';
		}

		if ( isset( $guest_data['enemies_killed'] ) ) {
			$update_data['enemies_killed'] = max( 0, (int) $guest_data['enemies_killed'] );
			$formats[]                     = '%d';
		}

		if ( empty( $update_data ) ) {
			return true; // Nothing to import.
		}

		$result = $wpdb->update(
			$table,
			$update_data,
			array( 'id' => $this->get_id() ),
			$formats,
			array( '%d' )
		);

		// Update local data.
		foreach ( $update_data as $key => $value ) {
			$this->data[ $key ] = $value;
		}

		return false !== $result;
	}

	/**
	 * Get client IP address.
	 *
	 * Uses REMOTE_ADDR by default to prevent IP spoofing via headers.
	 * Only uses X-Forwarded-For if the server is behind a trusted proxy
	 * (configured via 'site_rpg_trusted_proxies' filter).
	 *
	 * @return string IP address.
	 */
	private static function get_client_ip() {
		$remote_addr = ! empty( $_SERVER['REMOTE_ADDR'] )
			? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) )
			: '';

		/** This filter is documented in includes/class-rest-api.php */
		$trusted_proxies = apply_filters( 'site_rpg_trusted_proxies', array() );

		// Only trust forwarded headers if request is from a known proxy.
		if ( ! empty( $trusted_proxies ) && in_array( $remote_addr, $trusted_proxies, true ) ) {
			if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
				$forwarded = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
				// Take the first (client) IP from the chain.
				$ips = array_map( 'trim', explode( ',', $forwarded ) );
				if ( ! empty( $ips[0] ) && filter_var( $ips[0], FILTER_VALIDATE_IP ) ) {
					return $ips[0];
				}
			}
		}

		return $remote_addr;
	}

	/**
	 * Convert character to array for frontend.
	 *
	 * @return array Character data.
	 */
	public function to_array() {
		$stats = array();
		foreach ( self::VALID_STATS as $stat ) {
			$stats[ $stat ] = $this->get_total_stat( $stat );
		}

		$race_key  = $this->get_race();
		$class_key = $this->get_class();

		return array(
			'id'                  => $this->get_id(),
			'userId'              => $this->get_user_id(),
			'name'                => $this->get_name(),
			'race'                => $race_key,
			'raceData'            => $race_key ? Site_RPG_Races_Classes::get_race( $race_key ) : null,
			'class'               => $class_key,
			'classData'           => $class_key ? Site_RPG_Races_Classes::get_class( $class_key ) : null,
			'avatarData'          => $this->get_avatar_data(),
			'level'               => $this->get_level(),
			'levelTitle'          => $this->get_level_title(),
			'xp'                  => $this->get_xp(),
			'totalXp'             => $this->get_total_xp(),
			'xpToNextLevel'       => $this->get_xp_for_next_level(),
			'unspentStatPoints'   => $this->get_unspent_stat_points(),
			'gamesPlayed'         => $this->get_games_played(),
			'enemiesKilled'       => $this->get_enemies_killed(),
			'stats'               => $stats,
			'statBonuses'         => $this->get_stat_bonuses(),
			'unlockedCoupons'     => $this->get_unlocked_coupons(),
		);
	}

	/**
	 * Set race and class for an existing character (backward compatibility).
	 *
	 * @param string $race          Race key.
	 * @param string $class_key     Class key.
	 * @param array  $human_choices Optional stat choices for human race.
	 * @return bool|WP_Error True on success or error.
	 */
	public function set_race_class( $race, $class_key, $human_choices = array() ) {
		global $wpdb;

		// Don't allow if already set.
		if ( $this->get_race() || $this->get_class() ) {
			return new WP_Error( 'already_set', 'Race and class already chosen.' );
		}

		// Validate.
		if ( ! Site_RPG_Races_Classes::is_valid_race( $race ) ) {
			return new WP_Error( 'invalid_race', 'Invalid race selection.' );
		}
		if ( ! Site_RPG_Races_Classes::is_valid_class( $class_key ) ) {
			return new WP_Error( 'invalid_class', 'Invalid class selection.' );
		}

		// Get current base stats.
		$current_stats = array();
		foreach ( self::VALID_STATS as $stat ) {
			$current_stats[ $stat ] = $this->get_base_stat( $stat );
		}

		// Apply race modifiers.
		$modified_stats = Site_RPG_Races_Classes::apply_race_modifiers( $current_stats, $race, $human_choices );

		// Apply class bonuses.
		$modified_stats = Site_RPG_Races_Classes::apply_class_bonuses( $modified_stats, $class_key );

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$result = $wpdb->update(
			$table,
			array(
				'character_race'    => sanitize_text_field( $race ),
				'character_class'   => sanitize_text_field( $class_key ),
				'base_strength'     => $modified_stats['strength'],
				'base_wisdom'       => $modified_stats['wisdom'],
				'base_charisma'     => $modified_stats['charisma'],
				'base_stamina'      => $modified_stats['stamina'],
				'base_agility'      => $modified_stats['agility'],
				'base_intelligence' => $modified_stats['intelligence'],
			),
			array( 'id' => $this->get_id() ),
			array( '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d' ),
			array( '%d' )
		);

		if ( false === $result ) {
			return new WP_Error( 'db_error', 'Failed to update character.' );
		}

		// Update local data.
		$this->data['character_race']  = $race;
		$this->data['character_class'] = $class_key;
		foreach ( $modified_stats as $stat => $value ) {
			$this->data[ 'base_' . $stat ] = $value;
		}

		return true;
	}

	/**
	 * Update avatar data.
	 *
	 * @param array $avatar_data Avatar customization data.
	 * @return bool|WP_Error True on success or error.
	 */
	public function set_avatar_data( $avatar_data ) {
		global $wpdb;

		if ( ! is_array( $avatar_data ) ) {
			return new WP_Error( 'invalid_data', 'Avatar data must be an array.' );
		}

		$avatar_json = wp_json_encode( $avatar_data );

		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::CHARACTER_TABLE );

		$result = $wpdb->update(
			$table,
			array( 'avatar_data' => $avatar_json ),
			array( 'id' => $this->get_id() ),
			array( '%s' ),
			array( '%d' )
		);

		if ( false === $result ) {
			return new WP_Error( 'db_error', 'Failed to update avatar.' );
		}

		$this->data['avatar_data'] = $avatar_json;

		return true;
	}
}
