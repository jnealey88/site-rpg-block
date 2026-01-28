<?php
/**
 * XP Tracker Class
 *
 * Handles XP calculation, storage, and level progression.
 *
 * @package SiteRPGBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_XP_Tracker
 */
class Site_RPG_XP_Tracker {

	/**
	 * Singleton instance.
	 *
	 * @var Site_RPG_XP_Tracker
	 */
	private static $instance = null;

	/**
	 * Option key for storing XP data.
	 *
	 * @var string
	 */
	const OPTION_KEY = 'site_rpg_xp_data';

	/**
	 * XP required per level (exponential growth).
	 *
	 * @var int
	 */
	const BASE_XP_PER_LEVEL = 100;

	/**
	 * Get singleton instance.
	 *
	 * @return Site_RPG_XP_Tracker
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		// Initialize default data if not exists.
		if ( false === get_option( self::OPTION_KEY ) ) {
			$this->reset_data();
		}
	}

	/**
	 * Get XP data.
	 *
	 * @return array
	 */
	public function get_data() {
		$data = get_option( self::OPTION_KEY, array() );
		return wp_parse_args( $data, $this->get_defaults() );
	}

	/**
	 * Get default XP data.
	 *
	 * @return array
	 */
	private function get_defaults() {
		return array(
			'xp'             => 0,
			'level'          => 1,
			'total_xp'       => 0,
			'game_xp'        => 0,
			'visitor_xp'     => 0,
			'enemies_killed' => 0,
			'games_played'   => 0,
		);
	}

	/**
	 * Reset XP data to defaults.
	 */
	public function reset_data() {
		update_option( self::OPTION_KEY, $this->get_defaults() );
	}

	/**
	 * Add XP and handle leveling.
	 *
	 * @param int    $amount XP amount to add.
	 * @param string $source Source of XP (game, visitor, etc.).
	 * @return array Updated data with level up info.
	 */
	public function add_xp( $amount, $source = 'general' ) {
		$data = $this->get_data();

		$data['xp']       += $amount;
		$data['total_xp'] += $amount;

		// Track source-specific XP.
		if ( 'game' === $source ) {
			$data['game_xp'] += $amount;
		} elseif ( 'visitor' === $source ) {
			$data['visitor_xp'] += $amount;
		}

		// Check for level up.
		$leveled_up  = false;
		$new_level   = $data['level'];
		$xp_required = $this->get_xp_for_level( $data['level'] + 1 );

		while ( $data['xp'] >= $xp_required ) {
			$data['xp'] -= $xp_required;
			$data['level']++;
			$leveled_up  = true;
			$new_level   = $data['level'];
			$xp_required = $this->get_xp_for_level( $data['level'] + 1 );
		}

		update_option( self::OPTION_KEY, $data );

		return array(
			'xp'            => $data['xp'],
			'level'         => $data['level'],
			'xpToNextLevel' => $xp_required,
			'leveledUp'     => $leveled_up,
			'newLevel'      => $new_level,
		);
	}

	/**
	 * Record game completion.
	 *
	 * @param int $xp_earned XP earned in game.
	 * @param int $enemies_killed Enemies killed in game.
	 * @return array Updated data.
	 */
	public function record_game( $xp_earned, $enemies_killed = 0 ) {
		$data = $this->get_data();

		$data['games_played']++;
		$data['enemies_killed'] += $enemies_killed;

		update_option( self::OPTION_KEY, $data );

		return $this->add_xp( $xp_earned, 'game' );
	}

	/**
	 * Get XP required for a specific level.
	 *
	 * @param int $level Target level.
	 * @return int XP required.
	 */
	public function get_xp_for_level( $level ) {
		// Exponential growth: 100, 150, 225, 337, 506...
		return (int) round( self::BASE_XP_PER_LEVEL * pow( 1.5, $level - 1 ) );
	}

	/**
	 * Calculate stats based on site metrics.
	 *
	 * @return array Stats array.
	 */
	public function calculate_stats() {
		global $wpdb;

		// Strength: Posts published.
		$post_count = wp_count_posts( 'post' );
		$strength   = min( 20, (int) ( $post_count->publish ?? 0 ) );

		// Wisdom: Pages (content depth).
		$page_count = wp_count_posts( 'page' );
		$wisdom     = min( 20, (int) ( $page_count->publish ?? 0 ) );

		// Charisma: Comments.
		$comment_count = wp_count_comments();
		$charisma      = min( 20, (int) ceil( ( $comment_count->approved ?? 0 ) / 5 ) );

		// Stamina: Days since site created.
		$first_post = get_posts(
			array(
				'numberposts' => 1,
				'post_status' => 'publish',
				'orderby'     => 'date',
				'order'       => 'ASC',
			)
		);

		$stamina = 5;
		if ( ! empty( $first_post ) ) {
			$first_date = strtotime( $first_post[0]->post_date );
			$days       = (int) floor( ( time() - $first_date ) / DAY_IN_SECONDS );
			$stamina    = min( 20, max( 1, (int) ceil( $days / 30 ) ) );
		}

		// Agility & Intelligence: Placeholder (could integrate with PageSpeed API, SEO plugins).
		$agility      = 10;
		$intelligence = 10;

		return array(
			'strength'     => $strength,
			'wisdom'       => $wisdom,
			'charisma'     => $charisma,
			'stamina'      => $stamina,
			'agility'      => $agility,
			'intelligence' => $intelligence,
		);
	}

	/**
	 * Get complete site stats for frontend.
	 *
	 * @return array Site stats.
	 */
	public function get_site_stats() {
		$data  = $this->get_data();
		$stats = $this->calculate_stats();

		return array(
			'level'         => $data['level'],
			'xp'            => $data['xp'],
			'xpToNextLevel' => $this->get_xp_for_level( $data['level'] + 1 ),
			'totalXp'       => $data['total_xp'],
			'gamesPlayed'   => $data['games_played'],
			'enemiesKilled' => $data['enemies_killed'],
			'stats'         => $stats,
		);
	}

	/**
	 * Get level title based on level.
	 *
	 * @param int $level Current level.
	 * @return string Level title.
	 */
	public function get_level_title( $level ) {
		$titles = array(
			1  => 'Novice Site',
			5  => 'Apprentice Blog',
			10 => 'Journeyman Portal',
			15 => 'Expert Hub',
			20 => 'Master Domain',
			25 => 'Grandmaster Platform',
			30 => 'Legendary Destination',
		);

		$title = 'Novice Site';
		foreach ( $titles as $req_level => $level_title ) {
			if ( $level >= $req_level ) {
				$title = $level_title;
			}
		}

		return $title;
	}
}
