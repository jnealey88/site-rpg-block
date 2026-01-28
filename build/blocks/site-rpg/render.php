<?php
/**
 * Server-side rendering of the Site RPG block.
 *
 * @package SiteRPGBlock
 */

$xp_tracker = Site_RPG_XP_Tracker::get_instance();
$site_data  = $xp_tracker->get_site_stats();

// Get current user's character data if logged in.
$is_logged_in   = is_user_logged_in();
$user_character = null;
if ( $is_logged_in ) {
	$user_character = Site_RPG_Character::get_by_user_id( get_current_user_id() );
}

$site_name      = ! empty( $attributes['siteName'] ) ? $attributes['siteName'] : get_bloginfo( 'name' );
$show_mini_game = isset( $attributes['showMiniGame'] ) ? $attributes['showMiniGame'] : true;
$card_style     = ! empty( $attributes['cardStyle'] ) ? $attributes['cardStyle'] : 'classic';
$coupon_enabled = isset( $attributes['couponEnabled'] ) ? $attributes['couponEnabled'] : false;
$coupon_code    = ! empty( $attributes['couponCode'] ) ? $attributes['couponCode'] : '';
$coupon_message = ! empty( $attributes['couponMessage'] ) ? $attributes['couponMessage'] : __( 'Congratulations! Here\'s your reward:', 'site-rpg-block' );
$level_coupons  = isset( $attributes['levelCoupons'] ) ? $attributes['levelCoupons'] : array();
$level_coupons_json = ! empty( $level_coupons ) ? wp_json_encode( $level_coupons ) : '[]';

$xp_progress = ( $site_data['xp'] / $site_data['xpToNextLevel'] ) * 100;

$stats = array(
	array( 'key' => 'strength', 'label' => 'STR', 'name' => 'Strength', 'color' => '#e74c3c', 'icon' => '💪', 'tooltip' => 'Content engagement power. Increases with comments and shares.' ),
	array( 'key' => 'wisdom', 'label' => 'WIS', 'name' => 'Wisdom', 'color' => '#9b59b6', 'icon' => '🧠', 'tooltip' => 'Site knowledge depth. Grows with quality content and backlinks.' ),
	array( 'key' => 'charisma', 'label' => 'CHA', 'name' => 'Charisma', 'color' => '#e91e63', 'icon' => '✨', 'tooltip' => 'Social appeal. Increases with social shares and follows.' ),
	array( 'key' => 'stamina', 'label' => 'STA', 'name' => 'Stamina', 'color' => '#27ae60', 'icon' => '🛡️', 'tooltip' => 'Site uptime resilience. Grows with consistent availability.' ),
	array( 'key' => 'agility', 'label' => 'AGI', 'name' => 'Agility', 'color' => '#3498db', 'icon' => '⚡', 'tooltip' => 'Page load speed. Improves with performance optimization.' ),
	array( 'key' => 'intelligence', 'label' => 'INT', 'name' => 'Intelligence', 'color' => '#f39c12', 'icon' => '📚', 'tooltip' => 'Content quality. Increases with well-structured articles.' ),
);

$level_titles = array(
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
$level_title = isset( $level_titles[ $site_data['level'] ] ) ? $level_titles[ $site_data['level'] ] : 'Adventurer';
?>

<div
	<?php echo get_block_wrapper_attributes( array( 'class' => 'site-rpg-block' ) ); ?>
	data-site-name="<?php echo esc_attr( $site_name ); ?>"
	data-show-mini-game="<?php echo $show_mini_game ? 'true' : 'false'; ?>"
	data-card-style="<?php echo esc_attr( $card_style ); ?>"
	data-coupon-enabled="<?php echo $coupon_enabled ? 'true' : 'false'; ?>"
	data-coupon-code="<?php echo esc_attr( $coupon_code ); ?>"
	data-coupon-message="<?php echo esc_attr( $coupon_message ); ?>"
	data-level-coupons="<?php echo esc_attr( $level_coupons_json ); ?>"
>
	<div class="site-rpg-card site-rpg-card--<?php echo esc_attr( $card_style ); ?>">
		<!-- Header -->
		<div class="site-rpg-card__header">
			<div class="site-rpg-card__avatar-container">
				<div class="site-rpg-card__avatar">
					<div class="site-rpg-card__avatar-ring"></div>
					<div class="site-rpg-card__avatar-icon">🏰</div>
					<div class="site-rpg-card__avatar-level"><?php echo esc_html( $site_data['level'] ); ?></div>
				</div>
				<div class="site-rpg-card__avatar-particles"></div>
			</div>
			<div class="site-rpg-card__info">
				<h3 class="site-rpg-card__name"><?php echo esc_html( $site_name ); ?></h3>
				<div class="site-rpg-card__level">
					<span class="site-rpg-card__level-badge">Level <?php echo esc_html( $site_data['level'] ); ?></span>
					<span class="site-rpg-card__level-title"><?php echo esc_html( $level_title ); ?></span>
				</div>
			</div>
		</div>

		<!-- XP Bar -->
		<div class="site-rpg-card__xp">
			<div class="site-rpg-card__xp-label">
				<span>XP</span>
				<span class="site-rpg-card__xp-numbers">
					<span class="site-rpg-xp-current"><?php echo esc_html( $site_data['xp'] ); ?></span> /
					<span class="site-rpg-xp-next"><?php echo esc_html( $site_data['xpToNextLevel'] ); ?></span>
				</span>
			</div>
			<div class="site-rpg-card__xp-bar">
				<div class="site-rpg-card__xp-fill" style="width: <?php echo esc_attr( $xp_progress ); ?>%"></div>
			</div>
		</div>

		<?php if ( $is_logged_in && ! $user_character ) : ?>
			<!-- Create Character Prompt -->
			<div class="site-rpg-card__create-character">
				<div class="site-rpg-card__create-character-content">
					<span class="site-rpg-card__create-character-icon">⚔️</span>
					<div class="site-rpg-card__create-character-text">
						<p class="site-rpg-card__create-character-title"><?php esc_html_e( 'Create Your Character', 'site-rpg-block' ); ?></p>
						<p class="site-rpg-card__create-character-desc"><?php esc_html_e( 'Roll your stats and start your adventure!', 'site-rpg-block' ); ?></p>
					</div>
				</div>
				<button type="button" class="site-rpg-card__create-character-btn" data-action="create-character">
					🎲 <?php esc_html_e( 'Create Character', 'site-rpg-block' ); ?>
				</button>
			</div>
		<?php endif; ?>

		<!-- Stats -->
		<div class="site-rpg-card__stats">
			<div class="site-rpg-card__stats-header">
				<?php if ( ! $is_logged_in ) : ?>
					<button type="button" class="site-rpg-roll-btn" data-action="roll-stats" title="<?php esc_attr_e( 'Roll random stats', 'site-rpg-block' ); ?>">
						🎲 <?php esc_html_e( 'Roll Stats', 'site-rpg-block' ); ?>
					</button>
					<button type="button" class="site-rpg-reset-btn" data-action="reset-stats" style="display: none;" title="<?php esc_attr_e( 'Reset to site stats', 'site-rpg-block' ); ?>">
						↺ <?php esc_html_e( 'Site Stats', 'site-rpg-block' ); ?>
					</button>
				<?php endif; ?>
				<?php if ( $is_logged_in && $user_character ) : ?>
					<?php
					// Check if character is missing race or class (legacy character)
					$is_legacy = empty( $user_character->get_race() ) || empty( $user_character->get_class() );
					?>
					<?php if ( $is_legacy ) : ?>
					<button type="button" class="site-rpg-legacy-btn" data-action="choose-legacy" title="<?php esc_attr_e( 'Choose your race and class', 'site-rpg-block' ); ?>">
						✨ <?php esc_html_e( 'Choose Heritage', 'site-rpg-block' ); ?>
					</button>
					<?php endif; ?>
					<button type="button" class="site-rpg-reset-character-btn" data-action="show-reset" title="<?php esc_attr_e( 'Delete your character', 'site-rpg-block' ); ?>">
						🗑️ <?php esc_html_e( 'Delete Character', 'site-rpg-block' ); ?>
					</button>
				<?php endif; ?>
			</div>
			<div class="site-rpg-card__stats-indicator" style="display: none;">
				<span class="site-rpg-card__stats-mode">🎲 Custom Rolled Stats</span>
			</div>
			<?php foreach ( $stats as $stat ) : ?>
				<div class="site-rpg-card__stat" data-stat="<?php echo esc_attr( $stat['key'] ); ?>" data-value="<?php echo esc_attr( $site_data['stats'][ $stat['key'] ] ); ?>" data-site-value="<?php echo esc_attr( $site_data['stats'][ $stat['key'] ] ); ?>">
					<div class="site-rpg-card__stat-icon" style="background-color: <?php echo esc_attr( $stat['color'] ); ?>20;">
						<span class="site-rpg-card__stat-emoji"><?php echo $stat['icon']; ?></span>
					</div>
					<div class="site-rpg-card__stat-content">
						<div class="site-rpg-card__stat-header">
							<span class="site-rpg-card__stat-label" style="color: <?php echo esc_attr( $stat['color'] ); ?>">
								<?php echo esc_html( $stat['label'] ); ?>
							</span>
							<span class="site-rpg-card__stat-value">
								<?php echo esc_html( $site_data['stats'][ $stat['key'] ] ); ?><span class="site-rpg-card__stat-max">/20</span>
							</span>
						</div>
						<div class="site-rpg-card__stat-bar">
							<div
								class="site-rpg-card__stat-fill"
								style="width: <?php echo esc_attr( min( $site_data['stats'][ $stat['key'] ] * 5, 100 ) ); ?>%; background-color: <?php echo esc_attr( $stat['color'] ); ?>"
							></div>
							<div class="site-rpg-card__stat-glow"></div>
						</div>
					</div>
					<div class="site-rpg-card__stat-tooltip">
						<span class="site-rpg-card__stat-tooltip-title"><?php echo esc_html( $stat['name'] ); ?></span>
						<span class="site-rpg-card__stat-tooltip-desc"><?php echo esc_html( $stat['tooltip'] ); ?></span>
					</div>
				</div>
			<?php endforeach; ?>
		</div>

		<?php if ( $is_logged_in && $user_character ) : ?>
			<!-- Character Actions -->
			<div class="site-rpg-card__character-actions">
				<button type="button" class="site-rpg-card__reset-link" data-action="show-reset">
					🗑️ <?php esc_html_e( 'Delete Character', 'site-rpg-block' ); ?>
				</button>
			</div>
		<?php endif; ?>

		<!-- Mini-game -->
		<?php if ( $show_mini_game ) : ?>
			<div class="site-rpg-card__game">
				<button type="button" class="site-rpg-card__game-btn" data-action="start-game">
					🎮 <?php esc_html_e( 'Play Mini-Games!', 'site-rpg-block' ); ?>
				</button>
				<p class="site-rpg-card__game-hint">
					<?php esc_html_e( 'Earn XP by playing games and defending your site!', 'site-rpg-block' ); ?>
				</p>
			</div>

			<!-- Rewards Button -->
			<div class="site-rpg-card__rewards">
				<button type="button" class="site-rpg-card__rewards-btn" data-action="show-rewards">
					🏆 <?php esc_html_e( 'Rewards', 'site-rpg-block' ); ?>
					<span class="site-rpg-card__rewards-badge" style="display: none;">0</span>
				</button>
			</div>

			<!-- Game Selector -->
			<div class="site-rpg-game-select" style="display: none;">
				<h4><?php esc_html_e( 'Choose Your Game', 'site-rpg-block' ); ?></h4>
				<p class="site-rpg-game-select__hint"><?php esc_html_e( 'Each game earns XP for your site!', 'site-rpg-block' ); ?></p>
				<div class="site-rpg-game-select__grid">
					<button type="button" class="site-rpg-game-select__btn site-rpg-game-select__btn--hackslash" data-game="hackslash">
						<div class="site-rpg-game-select__icon-wrapper">
							<span class="site-rpg-game-select__icon">⚔️</span>
							<span class="site-rpg-game-select__glow"></span>
						</div>
						<div class="site-rpg-game-select__info">
							<span class="site-rpg-game-select__title"><?php esc_html_e( 'Hack & Slash', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__desc"><?php esc_html_e( 'Battle enemies in waves', 'site-rpg-block' ); ?></span>
						</div>
						<div class="site-rpg-game-select__stats">
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--str" title="Strength bonus">💪 +2</span>
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--sta" title="Stamina bonus">🛡️ +1</span>
						</div>
						<div class="site-rpg-game-select__highscore">
							<span class="site-rpg-game-select__highscore-label"><?php esc_html_e( 'Best:', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__highscore-value" data-game-highscore="hackslash">--</span>
						</div>
					</button>
					<button type="button" class="site-rpg-game-select__btn site-rpg-game-select__btn--runner" data-game="runner">
						<div class="site-rpg-game-select__icon-wrapper">
							<span class="site-rpg-game-select__icon">🏃</span>
							<span class="site-rpg-game-select__glow"></span>
						</div>
						<div class="site-rpg-game-select__info">
							<span class="site-rpg-game-select__title"><?php esc_html_e( 'Plugin Dash', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__desc"><?php esc_html_e( 'Jump over obstacles', 'site-rpg-block' ); ?></span>
						</div>
						<div class="site-rpg-game-select__stats">
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--agi" title="Agility bonus">⚡ +2</span>
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--sta" title="Stamina bonus">🛡️ +1</span>
						</div>
						<div class="site-rpg-game-select__highscore">
							<span class="site-rpg-game-select__highscore-label"><?php esc_html_e( 'Best:', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__highscore-value" data-game-highscore="runner">--</span>
						</div>
					</button>
					<button type="button" class="site-rpg-game-select__btn site-rpg-game-select__btn--bossrush" data-game="bossrush">
						<div class="site-rpg-game-select__icon-wrapper">
							<span class="site-rpg-game-select__icon">🎲</span>
							<span class="site-rpg-game-select__glow"></span>
						</div>
						<div class="site-rpg-game-select__info">
							<span class="site-rpg-game-select__title"><?php esc_html_e( 'Boss Rush', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__desc"><?php esc_html_e( 'D20 turn-based combat', 'site-rpg-block' ); ?></span>
						</div>
						<div class="site-rpg-game-select__stats">
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--wis" title="Wisdom bonus">🧠 +2</span>
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--int" title="Intelligence bonus">📚 +1</span>
						</div>
						<div class="site-rpg-game-select__highscore">
							<span class="site-rpg-game-select__highscore-label"><?php esc_html_e( 'Best:', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__highscore-value" data-game-highscore="bossrush">--</span>
						</div>
					</button>
					<button type="button" class="site-rpg-game-select__btn site-rpg-game-select__btn--adventure" data-game="adventure">
						<div class="site-rpg-game-select__icon-wrapper">
							<span class="site-rpg-game-select__icon">📖</span>
							<span class="site-rpg-game-select__glow"></span>
						</div>
						<div class="site-rpg-game-select__info">
							<span class="site-rpg-game-select__title"><?php esc_html_e( 'Text Quest', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__desc"><?php esc_html_e( 'Choose your adventure', 'site-rpg-block' ); ?></span>
						</div>
						<div class="site-rpg-game-select__stats">
							<span class="site-rpg-game-select__stat site-rpg-game-select__stat--all" title="All stats used">🎲 All</span>
						</div>
						<div class="site-rpg-game-select__highscore">
							<span class="site-rpg-game-select__highscore-label"><?php esc_html_e( 'Best:', 'site-rpg-block' ); ?></span>
							<span class="site-rpg-game-select__highscore-value" data-game-highscore="adventure">--</span>
						</div>
					</button>
				</div>
				<button type="button" class="site-rpg-game__back" data-action="back-to-card" style="margin-top: 16px;">
					← <?php esc_html_e( 'Back', 'site-rpg-block' ); ?>
				</button>
			</div>

			<!-- Difficulty Selector -->
			<div class="site-rpg-difficulty-select" style="display: none;">
				<h4><?php esc_html_e( 'Select Difficulty', 'site-rpg-block' ); ?></h4>
				<p class="site-rpg-difficulty-hint"><?php esc_html_e( 'Choose your challenge level', 'site-rpg-block' ); ?></p>
				<div class="site-rpg-difficulty-buttons">
					<button type="button" class="site-rpg-difficulty-btn site-rpg-difficulty-btn--easy" data-difficulty="easy">
						<span class="site-rpg-difficulty-btn__title"><?php esc_html_e( 'Easy', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-difficulty-btn__desc"><?php esc_html_e( '5 hearts, slower enemies', 'site-rpg-block' ); ?></span>
					</button>
					<button type="button" class="site-rpg-difficulty-btn site-rpg-difficulty-btn--normal" data-difficulty="normal">
						<span class="site-rpg-difficulty-btn__title"><?php esc_html_e( 'Normal', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-difficulty-btn__desc"><?php esc_html_e( '3 hearts, balanced challenge', 'site-rpg-block' ); ?></span>
					</button>
					<button type="button" class="site-rpg-difficulty-btn site-rpg-difficulty-btn--hard" data-difficulty="hard">
						<span class="site-rpg-difficulty-btn__title"><?php esc_html_e( 'Hard', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-difficulty-btn__desc"><?php esc_html_e( '2 hearts, faster enemies', 'site-rpg-block' ); ?></span>
					</button>
				</div>
				<button type="button" class="site-rpg-game__back" data-action="back-to-games" style="margin-top: 16px;">
					← <?php esc_html_e( 'Back', 'site-rpg-block' ); ?>
				</button>
			</div>

			<!-- Class Selection (D20 Boss Rush only) -->
			<div class="site-rpg-class-select" style="display: none;">
				<h4><?php esc_html_e( 'Choose Your Class', 'site-rpg-block' ); ?></h4>
				<p class="site-rpg-class-select__hint"><?php esc_html_e( 'Each class has unique combat bonuses', 'site-rpg-block' ); ?></p>
				<div class="site-rpg-class-select__grid">
					<button type="button" class="site-rpg-class-btn site-rpg-class-btn--warrior" data-class="warrior">
						<span class="site-rpg-class-btn__icon">⚔️</span>
						<span class="site-rpg-class-btn__name"><?php esc_html_e( 'Warrior', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-class-btn__stats">+3 Attack • 1d8 Damage • 20 HP</span>
					</button>
					<button type="button" class="site-rpg-class-btn site-rpg-class-btn--mage" data-class="mage">
						<span class="site-rpg-class-btn__icon">🔮</span>
						<span class="site-rpg-class-btn__name"><?php esc_html_e( 'Mage', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-class-btn__stats">+1 Attack • 2d6 Damage • 12 HP</span>
					</button>
					<button type="button" class="site-rpg-class-btn site-rpg-class-btn--rogue" data-class="rogue">
						<span class="site-rpg-class-btn__icon">🗡️</span>
						<span class="site-rpg-class-btn__name"><?php esc_html_e( 'Rogue', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-class-btn__stats">+5 Attack • 1d6 Damage • 15 HP</span>
					</button>
				</div>
				<button type="button" class="site-rpg-game__back" data-action="back-to-difficulty" style="margin-top: 16px;">
					← <?php esc_html_e( 'Back', 'site-rpg-block' ); ?>
				</button>
			</div>

			<!-- Game Start Screen -->
			<div class="site-rpg-game-start" style="display: none;">
				<span class="site-rpg-game-start__icon"></span>
				<h4 class="site-rpg-game-start__title"></h4>
				<p class="site-rpg-game-start__desc"></p>
				<p class="site-rpg-game-start__controls"></p>
				<button type="button" class="site-rpg-game-start__btn" data-action="begin-game">
					<?php esc_html_e( 'Start Game', 'site-rpg-block' ); ?>
				</button>
				<button type="button" class="site-rpg-game__back" data-action="back-to-class" style="margin-top: 16px;">
					← <?php esc_html_e( 'Back', 'site-rpg-block' ); ?>
				</button>
			</div>

			<!-- Game Canvas (hidden until started) -->
			<div class="site-rpg-game" style="display: none;">
				<div class="site-rpg-game__hud">
					<span class="site-rpg-game__wave">Wave 1/5</span>
					<span class="site-rpg-game__score">XP: 0</span>
					<span class="site-rpg-game__health">❤️❤️❤️</span>
				</div>
				<canvas class="site-rpg-game__canvas" width="800" height="400"></canvas>
				<div class="site-rpg-game__controls">
					<button type="button" class="site-rpg-game__pause" data-action="pause-game">⏸️</button>
					<button type="button" class="site-rpg-game__quit" data-action="quit-game">✖️</button>
				</div>
				<p class="site-rpg-game__hint-desktop"><?php esc_html_e( 'Arrow keys to move, Space to attack/jump', 'site-rpg-block' ); ?></p>
			</div>

			<!-- Mobile Controls - Hack & Slash (hidden until game started) -->
			<div class="site-rpg-mobile-controls" style="display: none;">
				<div class="site-rpg-dpad">
					<button type="button" class="site-rpg-dpad__btn site-rpg-dpad__btn--up" data-dir="up">▲</button>
					<button type="button" class="site-rpg-dpad__btn site-rpg-dpad__btn--left" data-dir="left">◀</button>
					<button type="button" class="site-rpg-dpad__btn site-rpg-dpad__btn--right" data-dir="right">▶</button>
					<button type="button" class="site-rpg-dpad__btn site-rpg-dpad__btn--down" data-dir="down">▼</button>
				</div>
				<button type="button" class="site-rpg-attack-btn">⚔️</button>
			</div>

			<!-- D20 Combat Controls (Boss Rush only) - Compact Layout -->
			<div class="site-rpg-d20-controls" style="display: none;">
				<div class="site-rpg-d20-action-row">
					<div class="site-rpg-d20-dice-wrapper">
						<div class="site-rpg-d20-turn-indicator">
							<span class="site-rpg-d20-turn__text"><?php esc_html_e( 'Your Turn', 'site-rpg-block' ); ?></span>
						</div>
						<div class="site-rpg-d20-dice-area">
							<div class="site-rpg-d20-dice">
								<span class="site-rpg-d20-dice__value">20</span>
							</div>
							<div class="site-rpg-d20-roll-result" style="display: none;">
								<span class="site-rpg-d20-roll__formula"></span>
								<span class="site-rpg-d20-roll__outcome"></span>
							</div>
						</div>
					</div>
					<div class="site-rpg-d20-action-buttons">
						<button type="button" class="site-rpg-d20-attack-btn" data-action="d20-attack">
							⚔️ <?php esc_html_e( 'Attack', 'site-rpg-block' ); ?>
						</button>
						<button type="button" class="site-rpg-d20-defend-btn" data-action="d20-defend">
							🛡️ <?php esc_html_e( 'Defend', 'site-rpg-block' ); ?>
						</button>
					</div>
				</div>
				<div class="site-rpg-d20-status-effects"></div>
				<div class="site-rpg-d20-combat-log">
					<div class="site-rpg-d20-combat-log__entries"></div>
				</div>
			</div>

			<!-- Mobile Controls - Runner -->
			<div class="site-rpg-runner-controls" style="display: none;">
				<button type="button" class="site-rpg-jump-btn"><?php esc_html_e( 'JUMP', 'site-rpg-block' ); ?></button>
			</div>

			<!-- Text Quest Adventure Controls -->
			<div class="site-rpg-adventure-controls" style="display: none;">
				<!-- Story Area -->
				<div class="site-rpg-adventure__story">
					<div class="site-rpg-adventure__header">
						<span class="site-rpg-adventure__scene-icon">📖</span>
						<h4 class="site-rpg-adventure__scene-title"><?php esc_html_e( 'The Adventure Begins', 'site-rpg-block' ); ?></h4>
					</div>
					<div class="site-rpg-adventure__text"></div>
				</div>

				<!-- Skill Check Area (shown during dice rolls) -->
				<div class="site-rpg-adventure__skill-check" style="display: none;">
					<div class="site-rpg-adventure__check-info">
						<span class="site-rpg-adventure__check-stat">💪 <?php esc_html_e( 'Strength Check', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-adventure__check-dc">DC: 12</span>
					</div>
					<div class="site-rpg-adventure__dice-area">
						<div class="site-rpg-adventure__dice">
							<span class="site-rpg-adventure__dice-value">20</span>
						</div>
						<div class="site-rpg-adventure__roll-breakdown">
							<span class="site-rpg-adventure__roll-formula"></span>
							<span class="site-rpg-adventure__roll-result"></span>
						</div>
					</div>
				</div>

				<!-- Choices Area -->
				<div class="site-rpg-adventure__choices"></div>

				<!-- Status Bar -->
				<div class="site-rpg-adventure__status">
					<div class="site-rpg-adventure__health">
						<span class="site-rpg-adventure__health-label"><?php esc_html_e( 'HP:', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-adventure__health-hearts">❤️❤️❤️</span>
					</div>
					<div class="site-rpg-adventure__xp">
						<span class="site-rpg-adventure__xp-label"><?php esc_html_e( 'XP:', 'site-rpg-block' ); ?></span>
						<span class="site-rpg-adventure__xp-value">0</span>
					</div>
					<div class="site-rpg-adventure__inventory">
						<span class="site-rpg-adventure__inventory-label">🎒</span>
						<span class="site-rpg-adventure__inventory-count">0</span>
					</div>
				</div>

				<!-- Event Log (collapsible) -->
				<div class="site-rpg-adventure__log">
					<button type="button" class="site-rpg-adventure__log-toggle">📜 <?php esc_html_e( 'Adventure Log', 'site-rpg-block' ); ?></button>
					<div class="site-rpg-adventure__log-entries"></div>
				</div>
			</div>

			<!-- Game Over Screen -->
			<div class="site-rpg-game-over" style="display: none;">
				<h4><?php esc_html_e( 'Game Over!', 'site-rpg-block' ); ?></h4>
				<p class="site-rpg-game-over__xp">+<span class="earned-xp">0</span> XP</p>
				<p class="site-rpg-game-over__message"><?php esc_html_e( 'You helped defend this site!', 'site-rpg-block' ); ?></p>
				<button type="button" class="site-rpg-card__game-btn" data-action="play-again">
					🔄 <?php esc_html_e( 'Play Again', 'site-rpg-block' ); ?>
				</button>
				<button type="button" class="site-rpg-game__back" data-action="back-to-games" style="margin-top: 12px;">
					← <?php esc_html_e( 'Choose Different Game', 'site-rpg-block' ); ?>
				</button>
			</div>

			<!-- Coupon Reward Modal -->
			<div class="site-rpg-coupon-modal" style="display: none;">
				<div class="site-rpg-coupon-modal__content">
					<div class="site-rpg-coupon-modal__icon">🎉</div>
					<h3 class="site-rpg-coupon-modal__title"><?php esc_html_e( 'You Unlocked a Reward!', 'site-rpg-block' ); ?></h3>
					<p class="site-rpg-coupon-modal__message"></p>
					<div class="site-rpg-coupon-modal__code-wrapper">
						<span class="site-rpg-coupon-modal__code"></span>
					</div>
					<button type="button" class="site-rpg-coupon-modal__copy">
						📋 <?php esc_html_e( 'Copy Code', 'site-rpg-block' ); ?>
					</button>
					<button type="button" class="site-rpg-coupon-modal__close">
						<?php esc_html_e( 'Continue', 'site-rpg-block' ); ?>
					</button>
				</div>
			</div>

			<!-- Level Coupon Unlock Modal -->
			<div class="site-rpg-level-coupon-modal" style="display: none;">
				<div class="site-rpg-level-coupon-modal__content">
					<div class="site-rpg-level-coupon-modal__icon">🎁</div>
					<h3 class="site-rpg-level-coupon-modal__title"><?php esc_html_e( 'Reward Unlocked!', 'site-rpg-block' ); ?></h3>
					<p class="site-rpg-level-coupon-modal__message"></p>
					<div class="site-rpg-level-coupon-modal__code-wrapper">
						<span class="site-rpg-level-coupon-modal__code"></span>
					</div>
					<button type="button" class="site-rpg-level-coupon-modal__copy">
						📋 <?php esc_html_e( 'Copy Code', 'site-rpg-block' ); ?>
					</button>
					<button type="button" class="site-rpg-level-coupon-modal__close">
						<?php esc_html_e( 'Continue', 'site-rpg-block' ); ?>
					</button>
				</div>
			</div>

			<!-- Rewards Modal (View All Unlocked) -->
			<div class="site-rpg-rewards-modal" style="display: none;">
				<div class="site-rpg-rewards-modal__content">
					<button type="button" class="site-rpg-rewards-modal__close" data-action="close-rewards">&times;</button>
					<div class="site-rpg-rewards-modal__header">
						<span class="site-rpg-rewards-modal__icon">🏆</span>
						<h3 class="site-rpg-rewards-modal__title"><?php esc_html_e( 'Your Rewards', 'site-rpg-block' ); ?></h3>
					</div>
					<div class="site-rpg-rewards-modal__list">
						<!-- Populated by JavaScript -->
					</div>
					<p class="site-rpg-rewards-modal__hint"><?php esc_html_e( 'Keep leveling up to unlock more rewards!', 'site-rpg-block' ); ?></p>
				</div>
			</div>

			<!-- Level Up Modal -->
			<div class="site-rpg-levelup-modal" style="display: none;">
				<div class="site-rpg-levelup-modal__content">
					<div class="site-rpg-levelup-modal__celebration">✨</div>
					<h3 class="site-rpg-levelup-modal__title"><?php esc_html_e( 'Level Up!', 'site-rpg-block' ); ?></h3>
					<p class="site-rpg-levelup-modal__level"><?php esc_html_e( 'You reached Level', 'site-rpg-block' ); ?> <span class="levelup-level">2</span>!</p>
					<p class="site-rpg-levelup-modal__points"><?php esc_html_e( 'Stat points to allocate:', 'site-rpg-block' ); ?> <span class="points-count">1</span></p>
					<div class="site-rpg-levelup-modal__stats">
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="strength">
							<span class="stat-icon">💪</span>
							<span class="stat-name"><?php esc_html_e( 'STR', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="wisdom">
							<span class="stat-icon">🧠</span>
							<span class="stat-name"><?php esc_html_e( 'WIS', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="charisma">
							<span class="stat-icon">✨</span>
							<span class="stat-name"><?php esc_html_e( 'CHA', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="stamina">
							<span class="stat-icon">🛡️</span>
							<span class="stat-name"><?php esc_html_e( 'STA', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="agility">
							<span class="stat-icon">⚡</span>
							<span class="stat-name"><?php esc_html_e( 'AGI', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
						<button type="button" class="site-rpg-levelup-modal__stat-btn" data-allocate-stat="intelligence">
							<span class="stat-icon">📚</span>
							<span class="stat-name"><?php esc_html_e( 'INT', 'site-rpg-block' ); ?></span>
							<span class="stat-value">10</span>
							<span class="stat-add">+</span>
						</button>
					</div>
					<button type="button" class="site-rpg-levelup-modal__close" data-action="close-levelup">
						<?php esc_html_e( 'Continue', 'site-rpg-block' ); ?>
					</button>
				</div>
			</div>

			<!-- Claim Guest Progress Modal -->
			<div class="site-rpg-claim-modal" style="display: none;">
				<div class="site-rpg-claim-modal__content">
					<div class="site-rpg-claim-modal__icon">🎮</div>
					<h3 class="site-rpg-claim-modal__title"><?php esc_html_e( 'Welcome Back!', 'site-rpg-block' ); ?></h3>
					<p class="site-rpg-claim-modal__desc"><?php esc_html_e( 'We found progress from your previous session:', 'site-rpg-block' ); ?></p>
					<div class="site-rpg-claim-modal__stats">
						<div class="site-rpg-claim-modal__stat">
							<span class="claim-stat-label"><?php esc_html_e( 'XP Earned:', 'site-rpg-block' ); ?></span>
							<span class="claim-xp">0</span>
						</div>
						<div class="site-rpg-claim-modal__stat">
							<span class="claim-stat-label"><?php esc_html_e( 'Games Played:', 'site-rpg-block' ); ?></span>
							<span class="claim-games">0</span>
						</div>
					</div>
					<p class="site-rpg-claim-modal__question"><?php esc_html_e( 'Would you like to claim this progress for your character?', 'site-rpg-block' ); ?></p>
					<div class="site-rpg-claim-modal__buttons">
						<button type="button" class="site-rpg-claim-modal__btn site-rpg-claim-modal__btn--claim" data-action="claim-guest">
							<?php esc_html_e( 'Claim Progress', 'site-rpg-block' ); ?>
						</button>
						<button type="button" class="site-rpg-claim-modal__btn site-rpg-claim-modal__btn--skip" data-action="skip-claim">
							<?php esc_html_e( 'Start Fresh', 'site-rpg-block' ); ?>
						</button>
					</div>
				</div>
			</div>

			<!-- Delete Character Modal -->
			<div class="site-rpg-reset-modal" style="display: none;">
				<div class="site-rpg-reset-modal__content">
					<div class="site-rpg-reset-modal__icon">⚠️</div>
					<h3 class="site-rpg-reset-modal__title"><?php esc_html_e( 'Delete Character?', 'site-rpg-block' ); ?></h3>
					<p class="site-rpg-reset-modal__warning"><?php esc_html_e( 'This will permanently delete your character and all progress:', 'site-rpg-block' ); ?></p>
					<div class="site-rpg-reset-modal__stats">
						<div class="site-rpg-reset-modal__stat">
							<span class="reset-stat-label"><?php esc_html_e( 'Current Level:', 'site-rpg-block' ); ?></span>
							<span class="reset-current-level">1</span>
						</div>
						<div class="site-rpg-reset-modal__stat">
							<span class="reset-stat-label"><?php esc_html_e( 'Total XP:', 'site-rpg-block' ); ?></span>
							<span class="reset-current-xp">0</span>
						</div>
						<div class="site-rpg-reset-modal__stat">
							<span class="reset-stat-label"><?php esc_html_e( 'Games Played:', 'site-rpg-block' ); ?></span>
							<span class="reset-current-games">0</span>
						</div>
					</div>
					<p class="site-rpg-reset-modal__confirm-text"><?php esc_html_e( 'You can create a new character with fresh rolled stats afterward. This cannot be undone!', 'site-rpg-block' ); ?></p>
					<div class="site-rpg-reset-modal__buttons">
						<button type="button" class="site-rpg-reset-modal__btn site-rpg-reset-modal__btn--confirm" data-action="confirm-reset">
							<?php esc_html_e( 'Delete Character', 'site-rpg-block' ); ?>
						</button>
						<button type="button" class="site-rpg-reset-modal__btn site-rpg-reset-modal__btn--cancel" data-action="cancel-reset">
							<?php esc_html_e( 'Cancel', 'site-rpg-block' ); ?>
						</button>
					</div>
				</div>
			</div>

			<!-- Character Creation Wizard Modal -->
			<div class="site-rpg-creation-wizard" style="display: none;">
				<div class="site-rpg-wizard__content">
					<button type="button" class="site-rpg-wizard__close" aria-label="<?php esc_attr_e( 'Close wizard', 'site-rpg-block' ); ?>">&times;</button>

					<div class="site-rpg-wizard__header">
						<h2 class="site-rpg-wizard__main-title"><?php esc_html_e( 'Create Your Character', 'site-rpg-block' ); ?></h2>
						<div class="site-rpg-wizard__progress"></div>
					</div>

					<div class="site-rpg-wizard__body">
						<!-- Dynamic content rendered by JavaScript -->
					</div>

					<div class="site-rpg-wizard__footer">
						<button type="button" class="site-rpg-wizard__btn site-rpg-wizard__btn--prev">
							<?php esc_html_e( 'Back', 'site-rpg-block' ); ?>
						</button>
						<button type="button" class="site-rpg-wizard__btn site-rpg-wizard__btn--next">
							<?php esc_html_e( 'Next', 'site-rpg-block' ); ?>
						</button>
					</div>
				</div>
			</div>
		<?php endif; ?>
	</div>
</div>
