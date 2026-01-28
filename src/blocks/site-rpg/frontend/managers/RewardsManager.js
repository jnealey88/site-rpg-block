/**
 * Rewards Manager - Handles level-based coupon rewards
 */
import { scrollToModal } from '../utils/scroll.js';

export class RewardsManager {
	constructor( container, characterManager ) {
		this.container = container;
		this.characterManager = characterManager;

		// Parse level coupons from data attribute
		this.levelCoupons = this.parseLevelCoupons();

		// UI elements
		this.rewardsBtn = container.querySelector( '[data-action="show-rewards"]' );
		this.rewardsBadge = container.querySelector( '.site-rpg-card__rewards-badge' );
		this.rewardsModal = container.querySelector( '.site-rpg-rewards-modal' );
		this.rewardsList = container.querySelector( '.site-rpg-rewards-modal__list' );
		this.levelCouponModal = container.querySelector( '.site-rpg-level-coupon-modal' );

		// First-game coupon settings (from existing system)
		this.firstGameCouponEnabled = container.dataset.couponEnabled === 'true';
		this.firstGameCouponCode = container.dataset.couponCode || '';
		this.firstGameCouponMessage = container.dataset.couponMessage || '';

		// Guest storage key
		this.guestStorageKey = 'site_rpg_level_coupons_unlocked';

		// Current code for copy functionality
		this.currentCouponCode = '';

		this.bindEvents();
		this.updateRewardsBadge();
	}

	/**
	 * Parse level coupons from data attribute
	 */
	parseLevelCoupons() {
		try {
			const data = this.container.dataset.levelCoupons;
			return data ? JSON.parse( data ) : [];
		} catch ( e ) {
			console.error( 'Failed to parse level coupons:', e );
			return [];
		}
	}

	/**
	 * Get unlocked coupon levels
	 */
	getUnlockedLevels() {
		// Logged-in user: get from character
		if ( this.characterManager && this.characterManager.character ) {
			return this.characterManager.character.unlockedCoupons || [];
		}

		// Guest: get from localStorage
		try {
			const stored = localStorage.getItem( this.guestStorageKey );
			return stored ? JSON.parse( stored ) : [];
		} catch ( e ) {
			return [];
		}
	}

	/**
	 * Save unlocked level for guests
	 */
	saveGuestUnlock( level ) {
		const unlocked = this.getUnlockedLevels();
		if ( ! unlocked.includes( level ) ) {
			unlocked.push( level );
			localStorage.setItem( this.guestStorageKey, JSON.stringify( unlocked ) );
		}
	}

	/**
	 * Check if a level has a coupon configured
	 */
	getCouponForLevel( level ) {
		return this.levelCoupons.find( ( c ) => c.level === level );
	}

	/**
	 * Get all unlocked coupons with their details
	 */
	getUnlockedCoupons() {
		const unlockedLevels = this.getUnlockedLevels();
		const coupons = [];

		// Add first-game coupon if unlocked
		if ( this.firstGameCouponEnabled && this.firstGameCouponCode ) {
			const firstGameUnlocked = localStorage.getItem( 'site_rpg_coupon_unlocked' );
			if ( firstGameUnlocked ) {
				coupons.push( {
					type: 'first-game',
					level: 0,
					code: this.firstGameCouponCode,
					message: this.firstGameCouponMessage,
					icon: '🎮',
					label: 'First Game Reward',
				} );
			}
		}

		// Add level coupons
		for ( const coupon of this.levelCoupons ) {
			if ( unlockedLevels.includes( coupon.level ) ) {
				coupons.push( {
					type: 'level',
					level: coupon.level,
					code: coupon.code,
					message: coupon.message,
					icon: coupon.icon || '🎁',
					label: `Level ${ coupon.level } Reward`,
				} );
			}
		}

		return coupons.sort( ( a, b ) => a.level - b.level );
	}

	/**
	 * Count total available rewards
	 */
	getTotalAvailableRewards() {
		let count = 0;

		// First-game coupon
		if ( this.firstGameCouponEnabled && this.firstGameCouponCode ) {
			count++;
		}

		// Level coupons
		count += this.levelCoupons.length;

		return count;
	}

	/**
	 * Update the rewards badge
	 */
	updateRewardsBadge() {
		if ( ! this.rewardsBadge ) {
			return;
		}

		const unlocked = this.getUnlockedCoupons();
		const count = unlocked.length;

		if ( count > 0 ) {
			this.rewardsBadge.textContent = count;
			this.rewardsBadge.style.display = 'inline-flex';
		} else {
			this.rewardsBadge.style.display = 'none';
		}
	}

	/**
	 * Handle level-up and check for coupon unlock
	 */
	checkLevelCouponUnlock( newLevel, isServerUnlock = false ) {
		const coupon = this.getCouponForLevel( newLevel );
		if ( ! coupon ) {
			return false;
		}

		// Check if already shown (for guests, to avoid duplicate modals)
		const unlocked = this.getUnlockedLevels();
		if ( unlocked.includes( newLevel ) && ! isServerUnlock ) {
			return false;
		}

		// For guests, save the unlock
		if ( ! this.characterManager?.character && ! isServerUnlock ) {
			this.saveGuestUnlock( newLevel );
		}

		// Show the unlock modal
		this.showLevelCouponModal( coupon );
		this.updateRewardsBadge();

		return true;
	}

	/**
	 * Show the level coupon unlock modal
	 */
	showLevelCouponModal( coupon ) {
		if ( ! this.levelCouponModal ) {
			return;
		}

		const iconEl = this.levelCouponModal.querySelector( '.site-rpg-level-coupon-modal__icon' );
		const messageEl = this.levelCouponModal.querySelector( '.site-rpg-level-coupon-modal__message' );
		const codeEl = this.levelCouponModal.querySelector( '.site-rpg-level-coupon-modal__code' );

		if ( iconEl ) {
			iconEl.textContent = coupon.icon || '🎁';
		}
		if ( messageEl ) {
			messageEl.textContent = coupon.message;
		}
		if ( codeEl ) {
			codeEl.textContent = coupon.code;
		}

		// Store current code for copy functionality
		this.currentCouponCode = coupon.code;

		this.levelCouponModal.style.display = 'flex';
		scrollToModal( this.levelCouponModal );
	}

	/**
	 * Hide the level coupon modal
	 */
	hideLevelCouponModal() {
		if ( this.levelCouponModal ) {
			this.levelCouponModal.style.display = 'none';
		}
	}

	/**
	 * Show the rewards modal
	 */
	showRewardsModal() {
		if ( ! this.rewardsModal ) {
			return;
		}

		this.renderRewardsList();
		this.rewardsModal.style.display = 'flex';
		scrollToModal( this.rewardsModal );
	}

	/**
	 * Hide the rewards modal
	 */
	hideRewardsModal() {
		if ( this.rewardsModal ) {
			this.rewardsModal.style.display = 'none';
		}
	}

	/**
	 * Render the rewards list in the modal
	 */
	renderRewardsList() {
		if ( ! this.rewardsList ) {
			return;
		}

		const unlocked = this.getUnlockedCoupons();

		if ( unlocked.length === 0 ) {
			this.rewardsList.innerHTML = `
				<div class="site-rpg-rewards-modal__empty">
					<span class="site-rpg-rewards-modal__empty-icon">🔒</span>
					<p>No rewards unlocked yet.</p>
					<p class="site-rpg-rewards-modal__empty-hint">
						Play games and level up to unlock rewards!
					</p>
				</div>
			`;
			return;
		}

		const html = unlocked
			.map(
				( coupon ) => `
			<div class="site-rpg-rewards-modal__item" data-code="${ this.escapeHtml( coupon.code ) }">
				<div class="site-rpg-rewards-modal__item-icon">${ coupon.icon }</div>
				<div class="site-rpg-rewards-modal__item-info">
					<span class="site-rpg-rewards-modal__item-label">${ this.escapeHtml( coupon.label ) }</span>
					<span class="site-rpg-rewards-modal__item-code">${ this.escapeHtml( coupon.code ) }</span>
				</div>
				<button type="button" class="site-rpg-rewards-modal__item-copy" data-copy="${ this.escapeHtml( coupon.code ) }">
					📋
				</button>
			</div>
		`
			)
			.join( '' );

		this.rewardsList.innerHTML = html;

		// Bind copy buttons
		this.rewardsList.querySelectorAll( '[data-copy]' ).forEach( ( btn ) => {
			btn.addEventListener( 'click', () => this.copyCode( btn.dataset.copy, btn ) );
		} );
	}

	/**
	 * Copy a coupon code
	 */
	async copyCode( code, button ) {
		try {
			await navigator.clipboard.writeText( code );
			if ( button ) {
				const original = button.textContent;
				button.textContent = '✅';
				setTimeout( () => ( button.textContent = original ), 2000 );
			}
		} catch ( e ) {
			console.error( 'Failed to copy code:', e );
		}
	}

	/**
	 * Escape HTML
	 */
	escapeHtml( str ) {
		const div = document.createElement( 'div' );
		div.textContent = str;
		return div.innerHTML;
	}

	/**
	 * Bind event listeners
	 */
	bindEvents() {
		// Rewards button
		if ( this.rewardsBtn ) {
			this.rewardsBtn.addEventListener( 'click', () => this.showRewardsModal() );
		}

		// Close rewards modal
		const closeRewardsBtn = this.container.querySelector( '[data-action="close-rewards"]' );
		if ( closeRewardsBtn ) {
			closeRewardsBtn.addEventListener( 'click', () => this.hideRewardsModal() );
		}

		// Level coupon modal buttons
		if ( this.levelCouponModal ) {
			const copyBtn = this.levelCouponModal.querySelector( '.site-rpg-level-coupon-modal__copy' );
			const closeBtn = this.levelCouponModal.querySelector( '.site-rpg-level-coupon-modal__close' );

			if ( copyBtn ) {
				copyBtn.addEventListener( 'click', () => this.copyCode( this.currentCouponCode, copyBtn ) );
			}
			if ( closeBtn ) {
				closeBtn.addEventListener( 'click', () => this.hideLevelCouponModal() );
			}
		}
	}
}
