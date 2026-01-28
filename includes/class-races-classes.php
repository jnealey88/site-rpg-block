<?php
/**
 * Site RPG Races and Classes
 *
 * Defines the available races and classes for character creation.
 *
 * @package Site_RPG_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_Races_Classes
 *
 * Contains definitions for all races and classes in the RPG system.
 */
class Site_RPG_Races_Classes {

	/**
	 * Valid race keys.
	 */
	const VALID_RACES = array( 'human', 'pixelkin', 'ironforge', 'arcanet', 'trickster' );

	/**
	 * Valid class keys.
	 */
	const VALID_CLASSES = array( 'knight', 'wizard', 'scout', 'bard', 'ranger' );

	/**
	 * Race definitions with stat modifiers and passive abilities.
	 *
	 * @return array Race data.
	 */
	public static function get_races() {
		return array(
			'human'     => array(
				'name'           => 'Human',
				'icon'           => '👤',
				'description'    => 'Versatile site administrators who excel through determination and adaptability.',
				'stat_modifiers' => array(),
				'flexible_points' => 2,
				'passive'        => 'adaptable',
				'passive_name'   => 'Adaptable',
				'passive_desc'   => '+5% XP from all sources',
				'passive_effect' => array(
					'xp_multiplier' => 1.05,
				),
			),
			'pixelkin'  => array(
				'name'           => 'Pixelkin',
				'icon'           => '🧚',
				'description'    => 'Small, fast digital sprites born from optimized code. They dart through data like lightning.',
				'stat_modifiers' => array(
					'agility'      => 2,
					'intelligence' => 1,
					'stamina'      => -1,
				),
				'flexible_points' => 0,
				'passive'        => 'cache_spirit',
				'passive_name'   => 'Cache Spirit',
				'passive_desc'   => '10% chance to dodge damage in runner games',
				'passive_effect' => array(
					'dodge_chance' => 0.10,
				),
			),
			'ironforge' => array(
				'name'           => 'Ironforge',
				'icon'           => '🔩',
				'description'    => 'Sturdy beings forged from server infrastructure. They are the backbone of any reliable system.',
				'stat_modifiers' => array(
					'stamina'  => 2,
					'strength' => 1,
					'agility'  => -1,
				),
				'flexible_points' => 0,
				'passive'        => 'firewall',
				'passive_name'   => 'Firewall',
				'passive_desc'   => '+1 starting health in all games',
				'passive_effect' => array(
					'bonus_health' => 1,
				),
			),
			'arcanet'   => array(
				'name'           => 'Arcanet',
				'icon'           => '🔮',
				'description'    => 'Magical entities who weave code like spells. Masters of APIs and arcane frameworks.',
				'stat_modifiers' => array(
					'intelligence' => 2,
					'wisdom'       => 1,
					'strength'     => -1,
				),
				'flexible_points' => 0,
				'passive'        => 'script_mastery',
				'passive_name'   => 'Script Mastery',
				'passive_desc'   => '15% cooldown reduction on abilities',
				'passive_effect' => array(
					'cooldown_reduction' => 0.15,
				),
			),
			'trickster' => array(
				'name'           => 'Trickster',
				'icon'           => '🎭',
				'description'    => 'Charismatic beings who manipulate social algorithms. They thrive on engagement.',
				'stat_modifiers' => array(
					'charisma' => 2,
					'agility'  => 1,
					'wisdom'   => -1,
				),
				'flexible_points' => 0,
				'passive'        => 'social_engineering',
				'passive_name'   => 'Social Engineering',
				'passive_desc'   => '+20% XP from WordPress hooks (comments, shares)',
				'passive_effect' => array(
					'wp_hook_xp_multiplier' => 1.20,
				),
			),
		);
	}

	/**
	 * Class definitions with primary stats and abilities.
	 *
	 * @return array Class data.
	 */
	public static function get_classes() {
		return array(
			'knight' => array(
				'name'          => 'Knight',
				'icon'          => '🛡️',
				'description'   => 'Defenders of the realm. Knights excel at direct combat and protecting what matters.',
				'primary_stats' => array( 'strength', 'stamina' ),
				'weapon'        => 'sword',
				'abilities'     => array(
					array(
						'name' => 'Shield Wall',
						'desc' => '+1 starting health in all games',
					),
					array(
						'name' => 'Power Strike',
						'desc' => '+15% damage in Hack & Slash',
					),
				),
				'effects'       => array(
					'hackslash_damage_mult' => 1.15,
					'bonus_health'          => 1,
				),
			),
			'wizard' => array(
				'name'          => 'Wizard',
				'icon'          => '🪄',
				'description'   => 'Masters of arcane code. Wizards turn knowledge into power and experience into mastery.',
				'primary_stats' => array( 'intelligence', 'wisdom' ),
				'weapon'        => 'staff',
				'abilities'     => array(
					array(
						'name' => 'Arcane Knowledge',
						'desc' => '+10% XP earned from games',
					),
					array(
						'name' => 'Penetrating Spell',
						'desc' => 'Ignore 1 AC in Boss Rush',
					),
				),
				'effects'       => array(
					'game_xp_multiplier' => 1.10,
					'boss_ac_ignore'     => 1,
				),
			),
			'scout'  => array(
				'name'          => 'Scout',
				'icon'          => '🏹',
				'description'   => 'Swift reconnaissance experts. Scouts move fast and see opportunities others miss.',
				'primary_stats' => array( 'agility', 'intelligence' ),
				'weapon'        => 'bow',
				'abilities'     => array(
					array(
						'name' => 'Quick Reflexes',
						'desc' => '+20% double-jump window in Runner',
					),
					array(
						'name' => 'Swift Movement',
						'desc' => '+1 movement speed in Hack & Slash',
					),
				),
				'effects'       => array(
					'runner_jump_window_mult' => 1.20,
					'hackslash_speed_bonus'   => 1,
				),
			),
			'bard'   => array(
				'name'          => 'Bard',
				'icon'          => '🎸',
				'description'   => 'Storytellers and community builders. Bards inspire others and turn engagement into legend.',
				'primary_stats' => array( 'charisma', 'wisdom' ),
				'weapon'        => 'lute',
				'abilities'     => array(
					array(
						'name' => 'Inspiring Presence',
						'desc' => '+25% XP from WordPress hooks',
					),
					array(
						'name' => 'Party Buff',
						'desc' => '+5% XP for other players on site',
					),
				),
				'effects'       => array(
					'wp_hook_xp_multiplier' => 1.25,
					'party_xp_buff'         => 0.05,
				),
			),
			'ranger' => array(
				'name'          => 'Ranger',
				'icon'          => '⚔️',
				'description'   => 'Hunters of dangerous prey. Rangers specialize in taking down the biggest threats.',
				'primary_stats' => array( 'strength', 'agility' ),
				'weapon'        => 'dual_blades',
				'abilities'     => array(
					array(
						'name' => 'Precision Strike',
						'desc' => 'Expanded crit range (18-20) in Boss Rush',
					),
					array(
						'name' => 'Giant Slayer',
						'desc' => '+10% damage to boss enemies',
					),
				),
				'effects'       => array(
					'crit_range'        => array( 18, 19, 20 ),
					'boss_damage_mult'  => 1.10,
				),
			),
		);
	}

	/**
	 * Get a specific race by key.
	 *
	 * @param string $race_key Race key.
	 * @return array|null Race data or null if not found.
	 */
	public static function get_race( $race_key ) {
		$races = self::get_races();
		return isset( $races[ $race_key ] ) ? $races[ $race_key ] : null;
	}

	/**
	 * Get a specific class by key.
	 *
	 * @param string $class_key Class key.
	 * @return array|null Class data or null if not found.
	 */
	public static function get_class( $class_key ) {
		$classes = self::get_classes();
		return isset( $classes[ $class_key ] ) ? $classes[ $class_key ] : null;
	}

	/**
	 * Validate race key.
	 *
	 * @param string $race_key Race key to validate.
	 * @return bool True if valid.
	 */
	public static function is_valid_race( $race_key ) {
		return in_array( $race_key, self::VALID_RACES, true );
	}

	/**
	 * Validate class key.
	 *
	 * @param string $class_key Class key to validate.
	 * @return bool True if valid.
	 */
	public static function is_valid_class( $class_key ) {
		return in_array( $class_key, self::VALID_CLASSES, true );
	}

	/**
	 * Apply race stat modifiers to base stats.
	 *
	 * @param array  $stats Base stats array.
	 * @param string $race_key Race key.
	 * @param array  $human_choices Optional stat choices for human race (array of stat keys).
	 * @return array Modified stats.
	 */
	public static function apply_race_modifiers( $stats, $race_key, $human_choices = array() ) {
		$race = self::get_race( $race_key );
		if ( ! $race ) {
			return $stats;
		}

		// Apply fixed stat modifiers.
		foreach ( $race['stat_modifiers'] as $stat => $modifier ) {
			if ( isset( $stats[ $stat ] ) ) {
				$stats[ $stat ] = max( 1, min( 20, $stats[ $stat ] + $modifier ) );
			}
		}

		// Apply flexible points for human.
		if ( 'human' === $race_key && ! empty( $human_choices ) ) {
			$points_applied = 0;
			foreach ( $human_choices as $stat ) {
				if ( isset( $stats[ $stat ] ) && $points_applied < $race['flexible_points'] ) {
					$stats[ $stat ] = min( 20, $stats[ $stat ] + 1 );
					$points_applied++;
				}
			}
		}

		return $stats;
	}

	/**
	 * Apply class proficiency bonuses to stats.
	 *
	 * @param array  $stats Stats array.
	 * @param string $class_key Class key.
	 * @return array Modified stats.
	 */
	public static function apply_class_bonuses( $stats, $class_key ) {
		$class = self::get_class( $class_key );
		if ( ! $class ) {
			return $stats;
		}

		// +1 to each primary stat.
		foreach ( $class['primary_stats'] as $stat ) {
			if ( isset( $stats[ $stat ] ) ) {
				$stats[ $stat ] = min( 20, $stats[ $stat ] + 1 );
			}
		}

		return $stats;
	}

	/**
	 * Calculate combined XP multiplier from race and class.
	 *
	 * @param string $race_key Race key.
	 * @param string $class_key Class key.
	 * @param string $source XP source ('game', 'wp_hook', etc.).
	 * @return float Combined multiplier.
	 */
	public static function get_xp_multiplier( $race_key, $class_key, $source = 'game' ) {
		$multiplier = 1.0;

		$race  = self::get_race( $race_key );
		$class = self::get_class( $class_key );

		// Race passives.
		if ( $race && isset( $race['passive_effect'] ) ) {
			if ( isset( $race['passive_effect']['xp_multiplier'] ) ) {
				$multiplier *= $race['passive_effect']['xp_multiplier'];
			}
			if ( 'wp_hook' === $source && isset( $race['passive_effect']['wp_hook_xp_multiplier'] ) ) {
				$multiplier *= $race['passive_effect']['wp_hook_xp_multiplier'];
			}
		}

		// Class effects.
		if ( $class && isset( $class['effects'] ) ) {
			if ( 'game' === $source && isset( $class['effects']['game_xp_multiplier'] ) ) {
				$multiplier *= $class['effects']['game_xp_multiplier'];
			}
			if ( 'wp_hook' === $source && isset( $class['effects']['wp_hook_xp_multiplier'] ) ) {
				$multiplier *= $class['effects']['wp_hook_xp_multiplier'];
			}
		}

		return $multiplier;
	}

	/**
	 * Get all race/class data for frontend.
	 *
	 * @return array Combined data for REST API.
	 */
	public static function get_all_for_frontend() {
		return array(
			'races'   => self::get_races(),
			'classes' => self::get_classes(),
		);
	}
}
