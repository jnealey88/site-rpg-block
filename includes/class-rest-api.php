<?php
/**
 * REST API Class
 *
 * Handles REST API endpoints for XP tracking, game interactions, and character management.
 *
 * @package SiteRPGBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_REST_API
 */
class Site_RPG_REST_API {

	/**
	 * Singleton instance.
	 *
	 * @var Site_RPG_REST_API
	 */
	private static $instance = null;

	/**
	 * API namespace.
	 *
	 * @var string
	 */
	const NAMESPACE = 'site-rpg/v1';

	/**
	 * Get singleton instance.
	 *
	 * @return Site_RPG_REST_API
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		// Get site stats (and character if logged in).
		register_rest_route(
			self::NAMESPACE,
			'/stats',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_stats' ),
				'permission_callback' => '__return_true',
			)
		);

		// Record game completion.
		register_rest_route(
			self::NAMESPACE,
			'/game/complete',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'complete_game' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'xp'            => array(
						'required'          => true,
						'type'              => 'integer',
						'minimum'           => 0,
						'maximum'           => 500,
						'sanitize_callback' => 'absint',
					),
					'enemiesKilled' => array(
						'required'          => false,
						'type'              => 'integer',
						'default'           => 0,
						'sanitize_callback' => 'absint',
					),
					'wave'          => array(
						'required'          => false,
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// Record visitor action (page view, scroll, etc.).
		register_rest_route(
			self::NAMESPACE,
			'/visitor/action',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'visitor_action' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'action' => array(
						'required'          => true,
						'type'              => 'string',
						'enum'              => array( 'visit', 'scroll', 'share', 'time' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// === Character Endpoints ===

		// Get current user's character.
		register_rest_route(
			self::NAMESPACE,
			'/character',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_character' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
			)
		);

		// Create character for current user.
		register_rest_route(
			self::NAMESPACE,
			'/character/create',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'create_character' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
			)
		);

		// Allocate stat point.
		register_rest_route(
			self::NAMESPACE,
			'/character/allocate-stat',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'allocate_stat' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
				'args'                => array(
					'stat' => array(
						'required'          => true,
						'type'              => 'string',
						'enum'              => array( 'strength', 'wisdom', 'charisma', 'stamina', 'agility', 'intelligence' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// Claim guest character data.
		register_rest_route(
			self::NAMESPACE,
			'/character/claim-guest',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'claim_guest' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
				'args'                => array(
					'guestData' => array(
						'required' => true,
						'type'     => 'object',
					),
				),
			)
		);

		// Reset character.
		register_rest_route(
			self::NAMESPACE,
			'/character/reset',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'reset_character' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
			)
		);

		// Get available races and classes.
		register_rest_route(
			self::NAMESPACE,
			'/races-classes',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_races_classes' ),
				'permission_callback' => '__return_true',
			)
		);

		// Set race and class for existing character (backward compatibility).
		register_rest_route(
			self::NAMESPACE,
			'/character/set-race-class',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_race_class' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
				'args'                => array(
					'race'         => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'class'        => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'humanChoices' => array(
						'required' => false,
						'type'     => 'array',
						'default'  => array(),
					),
				),
			)
		);

		// Update avatar.
		register_rest_route(
			self::NAMESPACE,
			'/character/avatar',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'update_avatar' ),
				'permission_callback' => array( $this, 'check_logged_in' ),
				'args'                => array(
					'avatarData' => array(
						'required' => true,
						'type'     => 'object',
					),
				),
			)
		);
	}

	/**
	 * Check if user is logged in.
	 *
	 * @return bool|WP_Error
	 */
	public function check_logged_in() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_not_logged_in',
				'You must be logged in to access this endpoint.',
				array( 'status' => 401 )
			);
		}
		return true;
	}

	/**
	 * Get site stats endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_stats( $request ) {
		$xp_tracker = Site_RPG_XP_Tracker::get_instance();

		$response = array(
			'success' => true,
			'site'    => $xp_tracker->get_site_stats(),
		);

		// Include character data if logged in.
		if ( is_user_logged_in() ) {
			$user_id   = get_current_user_id();
			$character = Site_RPG_Character::get_by_user_id( $user_id );

			$response['character'] = $character ? $character->to_array() : null;
			$response['userId']    = $user_id;
		} else {
			$response['character'] = null;
			$response['userId']    = 0;
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Complete game endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function complete_game( $request ) {
		$xp             = $request->get_param( 'xp' );
		$enemies_killed = $request->get_param( 'enemiesKilled' );
		$wave           = $request->get_param( 'wave' );

		// Cap XP to prevent abuse.
		$xp = min( $xp, 200 );

		// If logged in, route to user character.
		if ( is_user_logged_in() ) {
			$user_id   = get_current_user_id();
			$character = Site_RPG_Character::get_by_user_id( $user_id );

			if ( ! $character ) {
				// Auto-create character.
				$character = Site_RPG_Character::create( $user_id );

				if ( is_wp_error( $character ) ) {
					return new WP_REST_Response(
						array(
							'success' => false,
							'message' => $character->get_error_message(),
						),
						400
					);
				}
			}

			$result = $character->record_game( $xp, $enemies_killed );

			// Check for level coupon unlock.
			$newly_unlocked_level = null;
			if ( $result['leveled_up'] ) {
				$new_level = $result['new_level'];
				$unlocked  = $character->get_unlocked_coupons();

				// Unlock this level if not already unlocked.
				if ( ! in_array( $new_level, $unlocked, true ) ) {
					$character->unlock_coupon( $new_level );
					$newly_unlocked_level = $new_level;
				}
			}

			return rest_ensure_response(
				array(
					'success'            => true,
					'xpEarned'           => $xp,
					'leveledUp'          => $result['leveled_up'],
					'newLevel'           => $result['new_level'],
					'newlyUnlockedLevel' => $newly_unlocked_level,
					'character'          => $character->to_array(),
				)
			);
		}

		// Guest: use site-wide XP with rate limiting.
		$ip_hash    = md5( $this->get_client_ip() );
		$rate_key   = 'site_rpg_game_' . $ip_hash;
		$rate_count = (int) get_transient( $rate_key );

		// Allow max 10 games per hour per IP.
		if ( $rate_count >= 10 ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Rate limit exceeded. Try again later.',
				),
				429
			);
		}

		set_transient( $rate_key, $rate_count + 1, HOUR_IN_SECONDS );

		$xp_tracker = Site_RPG_XP_Tracker::get_instance();
		$result     = $xp_tracker->record_game( $xp, $enemies_killed );

		return rest_ensure_response(
			array(
				'success'   => true,
				'xpEarned'  => $xp,
				'leveledUp' => false,
				'data'      => $result,
			)
		);
	}

	/**
	 * Visitor action endpoint.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function visitor_action( $request ) {
		$action = $request->get_param( 'action' );

		// Map old action names to new ones.
		$action_map = array(
			'visit'  => 'view_post',
			'scroll' => 'time_on_site',
			'share'  => 'share_social',
			'time'   => 'time_on_site',
		);

		$mapped_action = isset( $action_map[ $action ] ) ? $action_map[ $action ] : $action;

		// XP values per action.
		$xp_values = array(
			'visit'  => 2,
			'scroll' => 3,
			'share'  => 10,
			'time'   => 5,
		);

		$xp = isset( $xp_values[ $action ] ) ? $xp_values[ $action ] : 1;

		// If logged in, use character system.
		if ( is_user_logged_in() ) {
			$user_id = get_current_user_id();
			$result  = Site_RPG_User_XP_Actions::trigger_visitor_action( $user_id, $mapped_action );

			if ( is_wp_error( $result ) ) {
				return rest_ensure_response(
					array(
						'success' => true,
						'message' => $result->get_error_message(),
						'xp'      => 0,
					)
				);
			}

			$character = Site_RPG_Character::get_by_user_id( $user_id );

			return rest_ensure_response(
				array(
					'success'   => true,
					'xpEarned'  => $result['xp'],
					'character' => $character ? $character->to_array() : null,
				)
			);
		}

		// Guest: use site-wide XP with rate limiting.
		$ip_hash  = md5( $this->get_client_ip() );
		$rate_key = 'site_rpg_visitor_' . $ip_hash . '_' . $action;

		// Only allow each action once per session (1 hour).
		if ( get_transient( $rate_key ) ) {
			return rest_ensure_response(
				array(
					'success' => true,
					'message' => 'Action already recorded.',
					'xp'      => 0,
				)
			);
		}

		set_transient( $rate_key, true, HOUR_IN_SECONDS );

		$xp_tracker = Site_RPG_XP_Tracker::get_instance();
		$result     = $xp_tracker->add_xp( $xp, 'visitor' );

		return rest_ensure_response(
			array(
				'success'  => true,
				'xpEarned' => $xp,
				'data'     => $result,
			)
		);
	}

	/**
	 * Get current user's character.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_character( $request ) {
		$user_id   = get_current_user_id();
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			return new WP_REST_Response(
				array(
					'success'   => true,
					'character' => null,
					'message'   => 'No character found. Create one first.',
				),
				200
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'character' => $character->to_array(),
			)
		);
	}

	/**
	 * Create character for current user.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function create_character( $request ) {
		$user_id        = get_current_user_id();
		$race           = $request->get_param( 'race' );
		$class_key      = $request->get_param( 'class' );
		$avatar_data    = $request->get_param( 'avatarData' );
		$human_choices  = $request->get_param( 'humanChoices' );
		$character_name = $request->get_param( 'characterName' );
		$prerolled_stats = $request->get_param( 'stats' );

		// Sanitize human choices.
		if ( ! empty( $human_choices ) && is_array( $human_choices ) ) {
			$human_choices = array_map( 'sanitize_text_field', $human_choices );
		} else {
			$human_choices = array();
		}

		$character = Site_RPG_Character::create(
			$user_id,
			$character_name ? sanitize_text_field( $character_name ) : '',
			$race ? sanitize_text_field( $race ) : null,
			$class_key ? sanitize_text_field( $class_key ) : null,
			$avatar_data,
			$human_choices,
			$prerolled_stats
		);

		if ( is_wp_error( $character ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $character->get_error_message(),
				),
				400
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => 'Character created successfully!',
				'character' => $character->to_array(),
			)
		);
	}

	/**
	 * Allocate stat point.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function allocate_stat( $request ) {
		$user_id   = get_current_user_id();
		$stat      = $request->get_param( 'stat' );
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'No character found.',
				),
				404
			);
		}

		$result = $character->allocate_stat_point( $stat );

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => ucfirst( $stat ) . ' increased!',
				'result'    => $result,
				'character' => $character->to_array(),
			)
		);
	}

	/**
	 * Claim guest character data.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function claim_guest( $request ) {
		$user_id    = get_current_user_id();
		$guest_data = $request->get_param( 'guestData' );
		$character  = Site_RPG_Character::get_by_user_id( $user_id );

		// If no character exists, create one first.
		if ( ! $character ) {
			$character = Site_RPG_Character::create( $user_id );

			if ( is_wp_error( $character ) ) {
				return new WP_REST_Response(
					array(
						'success' => false,
						'message' => $character->get_error_message(),
					),
					400
				);
			}
		}

		// Import guest data.
		$imported = $character->import_guest_data( $guest_data );

		if ( ! $imported ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Failed to import guest data.',
				),
				400
			);
		}

		// Refresh character data.
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => 'Guest progress claimed successfully!',
				'character' => $character->to_array(),
			)
		);
	}

	/**
	 * Delete character completely.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function reset_character( $request ) {
		$user_id   = get_current_user_id();
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'No character found.',
				),
				404
			);
		}

		$result = $character->delete();

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => 'Character deleted successfully!',
				'deleted'   => true,
			)
		);
	}

	/**
	 * Get client IP address.
	 *
	 * @return string
	 */
	private function get_client_ip() {
		$ip = '';

		if ( ! empty( $_SERVER['HTTP_CLIENT_IP'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_CLIENT_IP'] ) );
		} elseif ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) );
		} elseif ( ! empty( $_SERVER['REMOTE_ADDR'] ) ) {
			$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
		}

		return $ip;
	}

	/**
	 * Get available races and classes.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_races_classes( $request ) {
		return rest_ensure_response(
			array(
				'success' => true,
				'races'   => Site_RPG_Races_Classes::get_races(),
				'classes' => Site_RPG_Races_Classes::get_classes(),
			)
		);
	}

	/**
	 * Set race and class for existing character.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function set_race_class( $request ) {
		$user_id       = get_current_user_id();
		$race          = $request->get_param( 'race' );
		$class_key     = $request->get_param( 'class' );
		$human_choices = $request->get_param( 'humanChoices' );

		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'No character found.',
				),
				404
			);
		}

		// Sanitize human choices.
		if ( ! empty( $human_choices ) && is_array( $human_choices ) ) {
			$human_choices = array_map( 'sanitize_text_field', $human_choices );
		} else {
			$human_choices = array();
		}

		$result = $character->set_race_class( $race, $class_key, $human_choices );

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => 'Race and class set successfully!',
				'character' => $character->to_array(),
			)
		);
	}

	/**
	 * Update character avatar.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function update_avatar( $request ) {
		$user_id     = get_current_user_id();
		$avatar_data = $request->get_param( 'avatarData' );

		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'No character found.',
				),
				404
			);
		}

		$result = $character->set_avatar_data( $avatar_data );

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				400
			);
		}

		return rest_ensure_response(
			array(
				'success'   => true,
				'message'   => 'Avatar updated successfully!',
				'character' => $character->to_array(),
			)
		);
	}
}
