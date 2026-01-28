<?php
/**
 * Site RPG User XP Actions
 *
 * Handles XP rewards for WordPress actions.
 *
 * @package Site_RPG_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Site_RPG_User_XP_Actions
 *
 * Registers WordPress hooks for XP earning.
 */
class Site_RPG_User_XP_Actions {

	/**
	 * XP values for each action.
	 */
	const XP_ACTIONS = array(
		'view_post'        => 2,
		'view_page'        => 2,
		'post_comment'     => 15,
		'comment_approved' => 5,
		'share_social'     => 10,
		'time_on_site'     => 5,
		'view_product'     => 3,
		'add_to_cart'      => 10,
		'purchase'         => 50,
		'review_product'   => 25,
	);

	/**
	 * Cooldowns for each action (in seconds).
	 */
	const COOLDOWNS = array(
		'view_post'        => 3600,   // 1 hour per post.
		'view_page'        => 3600,   // 1 hour per page.
		'post_comment'     => 300,    // 5 minutes between comments.
		'comment_approved' => 0,      // No cooldown (one-time per comment).
		'share_social'     => 3600,   // 1 hour between shares.
		'time_on_site'     => 7200,   // Every 2 hours.
		'view_product'     => 3600,   // 1 hour per product.
		'add_to_cart'      => 1800,   // 30 minutes between add to cart.
		'purchase'         => 0,      // No cooldown (one-time per order).
		'review_product'   => 0,      // No cooldown (one-time per review).
	);

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		// Post/Page views.
		add_action( 'template_redirect', array( __CLASS__, 'track_post_view' ) );

		// Comments.
		add_action( 'wp_insert_comment', array( __CLASS__, 'on_comment_post' ), 10, 2 );
		add_action( 'comment_approved_comment', array( __CLASS__, 'on_comment_approved' ) );
		add_action( 'transition_comment_status', array( __CLASS__, 'on_comment_status_change' ), 10, 3 );

		// User registration bonus.
		add_action( 'user_register', array( __CLASS__, 'on_user_register' ) );

		// WooCommerce hooks (conditional).
		if ( class_exists( 'WooCommerce' ) ) {
			add_action( 'woocommerce_after_single_product', array( __CLASS__, 'on_product_view' ) );
			add_action( 'woocommerce_add_to_cart', array( __CLASS__, 'on_add_to_cart' ), 10, 6 );
			add_action( 'woocommerce_order_status_completed', array( __CLASS__, 'on_order_complete' ) );
			add_action( 'comment_post', array( __CLASS__, 'on_product_review' ), 10, 3 );
		}
	}

	/**
	 * Track post/page views.
	 */
	public static function track_post_view() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		if ( ! is_singular( array( 'post', 'page' ) ) ) {
			return;
		}

		$user_id = get_current_user_id();
		$post_id = get_the_ID();
		$post    = get_post( $post_id );

		if ( ! $post ) {
			return;
		}

		// Don't give XP for viewing own content.
		if ( (int) $post->post_author === $user_id ) {
			return;
		}

		$action = 'post' === $post->post_type ? 'view_post' : 'view_page';

		if ( ! self::can_earn_xp( $user_id, $action, $post_id ) ) {
			return;
		}

		self::award_xp( $user_id, $action, $post_id, 'post' );
	}

	/**
	 * Handle comment posting.
	 *
	 * @param int        $comment_id Comment ID.
	 * @param WP_Comment $comment    Comment object.
	 */
	public static function on_comment_post( $comment_id, $comment ) {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user_id = get_current_user_id();

		// Only award for logged-in user's own comments.
		if ( (int) $comment->user_id !== $user_id ) {
			return;
		}

		// Check if it's a product review (WooCommerce).
		$post = get_post( $comment->comment_post_ID );
		if ( $post && 'product' === $post->post_type ) {
			// Will be handled by on_product_review.
			return;
		}

		if ( ! self::can_earn_xp( $user_id, 'post_comment' ) ) {
			return;
		}

		self::award_xp( $user_id, 'post_comment', $comment_id, 'comment' );
	}

	/**
	 * Handle comment approval.
	 *
	 * @param int $comment_id Comment ID.
	 */
	public static function on_comment_approved( $comment_id ) {
		$comment = get_comment( $comment_id );

		if ( ! $comment || ! $comment->user_id ) {
			return;
		}

		$user_id = (int) $comment->user_id;

		if ( ! self::can_earn_xp( $user_id, 'comment_approved', $comment_id ) ) {
			return;
		}

		self::award_xp( $user_id, 'comment_approved', $comment_id, 'comment' );
	}

	/**
	 * Handle comment status changes.
	 *
	 * @param string     $new_status New comment status.
	 * @param string     $old_status Old comment status.
	 * @param WP_Comment $comment    Comment object.
	 */
	public static function on_comment_status_change( $new_status, $old_status, $comment ) {
		if ( 'approved' !== $new_status || 'approved' === $old_status ) {
			return;
		}

		self::on_comment_approved( $comment->comment_ID );
	}

	/**
	 * Handle user registration (create character and bonus XP).
	 *
	 * @param int $user_id New user ID.
	 */
	public static function on_user_register( $user_id ) {
		// Auto-create character on registration.
		$character = Site_RPG_Character::create( $user_id );

		if ( is_wp_error( $character ) ) {
			return;
		}

		// Award registration bonus XP (25 XP).
		$character->add_xp( 25, 'registration', $user_id, 'user' );
	}

	/**
	 * Track WooCommerce product views.
	 */
	public static function on_product_view() {
		if ( ! is_user_logged_in() ) {
			return;
		}

		global $product;

		if ( ! $product ) {
			return;
		}

		$user_id    = get_current_user_id();
		$product_id = $product->get_id();

		if ( ! self::can_earn_xp( $user_id, 'view_product', $product_id ) ) {
			return;
		}

		self::award_xp( $user_id, 'view_product', $product_id, 'product' );
	}

	/**
	 * Handle WooCommerce add to cart.
	 *
	 * @param string $cart_item_key  Cart item key.
	 * @param int    $product_id     Product ID.
	 * @param int    $quantity       Quantity.
	 * @param int    $variation_id   Variation ID.
	 * @param array  $variation      Variation data.
	 * @param array  $cart_item_data Cart item data.
	 */
	public static function on_add_to_cart( $cart_item_key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user_id = get_current_user_id();

		if ( ! self::can_earn_xp( $user_id, 'add_to_cart' ) ) {
			return;
		}

		self::award_xp( $user_id, 'add_to_cart', $product_id, 'product' );
	}

	/**
	 * Handle WooCommerce order completion.
	 *
	 * @param int $order_id Order ID.
	 */
	public static function on_order_complete( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return;
		}

		$user_id = $order->get_user_id();

		if ( ! $user_id ) {
			return;
		}

		if ( ! self::can_earn_xp( $user_id, 'purchase', $order_id ) ) {
			return;
		}

		// Base XP for purchase.
		$xp = self::XP_ACTIONS['purchase'];

		// Bonus XP based on order total (1 XP per $10).
		$order_total = $order->get_total();
		$bonus_xp    = (int) floor( $order_total / 10 );
		$xp         += $bonus_xp;

		// Cap at 200 XP per purchase.
		$xp = min( 200, $xp );

		self::award_xp( $user_id, 'purchase', $order_id, 'order', $xp );
	}

	/**
	 * Handle WooCommerce product reviews.
	 *
	 * @param int        $comment_id       Comment ID.
	 * @param int|string $comment_approved Approval status.
	 * @param array      $commentdata      Comment data.
	 */
	public static function on_product_review( $comment_id, $comment_approved, $commentdata ) {
		if ( ! is_user_logged_in() ) {
			return;
		}

		$user_id = get_current_user_id();

		// Check if it's a product review.
		if ( empty( $commentdata['comment_post_ID'] ) ) {
			return;
		}

		$post = get_post( $commentdata['comment_post_ID'] );
		if ( ! $post || 'product' !== $post->post_type ) {
			return;
		}

		// Check if user already reviewed this product.
		if ( ! self::can_earn_xp( $user_id, 'review_product', $commentdata['comment_post_ID'] ) ) {
			return;
		}

		self::award_xp( $user_id, 'review_product', $commentdata['comment_post_ID'], 'product' );
	}

	/**
	 * Check if user can earn XP for an action (rate limiting).
	 *
	 * @param int    $user_id      User ID.
	 * @param string $action       Action type.
	 * @param int    $reference_id Optional reference ID.
	 * @return bool True if user can earn XP.
	 */
	private static function can_earn_xp( $user_id, $action, $reference_id = null ) {
		global $wpdb;

		$cooldown = isset( self::COOLDOWNS[ $action ] ) ? self::COOLDOWNS[ $action ] : 3600;

		// No cooldown means one-time action (check if ever done).
		if ( 0 === $cooldown && $reference_id ) {
			$table = Site_RPG_Database::get_table_name( Site_RPG_Database::XP_LOG_TABLE );

			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$exists = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND action_type = %s AND reference_id = %d",
					$user_id,
					$action,
					$reference_id
				)
			);

			return 0 === (int) $exists;
		}

		// Check cooldown.
		$table = Site_RPG_Database::get_table_name( Site_RPG_Database::XP_LOG_TABLE );
		$since = gmdate( 'Y-m-d H:i:s', time() - $cooldown );

		if ( $reference_id ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$exists = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND action_type = %s AND reference_id = %d AND created_at > %s",
					$user_id,
					$action,
					$reference_id,
					$since
				)
			);
		} else {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$exists = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND action_type = %s AND created_at > %s",
					$user_id,
					$action,
					$since
				)
			);
		}

		return 0 === (int) $exists;
	}

	/**
	 * Award XP to a user.
	 *
	 * @param int    $user_id        User ID.
	 * @param string $action         Action type.
	 * @param int    $reference_id   Reference ID.
	 * @param string $reference_type Reference type.
	 * @param int    $xp_override    Optional XP override.
	 * @return array|false XP result or false on failure.
	 */
	private static function award_xp( $user_id, $action, $reference_id = null, $reference_type = null, $xp_override = null ) {
		$character = Site_RPG_Character::get_by_user_id( $user_id );

		if ( ! $character ) {
			// Try to create character if it doesn't exist.
			$character = Site_RPG_Character::create( $user_id );

			if ( is_wp_error( $character ) ) {
				return false;
			}
		}

		$xp = null !== $xp_override ? $xp_override : ( self::XP_ACTIONS[ $action ] ?? 0 );

		if ( $xp <= 0 ) {
			return false;
		}

		return $character->add_xp( $xp, $action, $reference_id, $reference_type );
	}

	/**
	 * Manually trigger XP for a visitor action (called from REST API).
	 *
	 * @param int    $user_id User ID.
	 * @param string $action  Action type.
	 * @return array|WP_Error XP result or error.
	 */
	public static function trigger_visitor_action( $user_id, $action ) {
		$valid_actions = array( 'time_on_site', 'share_social' );

		if ( ! in_array( $action, $valid_actions, true ) ) {
			return new WP_Error( 'invalid_action', 'Invalid action type.' );
		}

		if ( ! self::can_earn_xp( $user_id, $action ) ) {
			return new WP_Error( 'rate_limited', 'Action is rate limited.' );
		}

		$result = self::award_xp( $user_id, $action );

		if ( ! $result ) {
			return new WP_Error( 'award_failed', 'Failed to award XP.' );
		}

		return array(
			'success' => true,
			'xp'      => self::XP_ACTIONS[ $action ],
			'result'  => $result,
		);
	}
}
