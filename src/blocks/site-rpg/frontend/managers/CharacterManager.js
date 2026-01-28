/**
 * Character Manager - Handles persistent user characters
 */
import { scrollToModal } from '../utils/scroll.js';
import { CreationWizard } from './CreationWizard.js';

export class CharacterManager {
	constructor( container ) {
		this.container = container;
		this.character = window.siteRpgData?.character || null;
		this.isLoggedIn = window.siteRpgData?.isLoggedIn || false;
		this.userId = window.siteRpgData?.userId || 0;
		this.guestStorageKey = 'site_rpg_guest_character';

		// UI elements.
		this.createModal = container.querySelector( '.site-rpg-character-create' );
		this.levelUpModal = container.querySelector( '.site-rpg-levelup-modal' );
		this.claimModal = container.querySelector( '.site-rpg-claim-modal' );
		this.resetModal = container.querySelector( '.site-rpg-reset-modal' );

		// Legacy character modal.
		this.legacyModal = container.querySelector( '.site-rpg-legacy-modal' );

		// Initialize creation wizard.
		this.creationWizard = new CreationWizard( container, this );

		this.bindEvents();
		this.checkGuestClaim();
		this.checkLegacyCharacter();

		// Update display with character data on page load
		if ( this.character ) {
			this.updateCharacterDisplay();
		}
	}

	/**
	 * Check if existing character needs race/class selection
	 */
	checkLegacyCharacter() {
		if ( ! this.isLoggedIn || ! this.character ) return;

		// Check if character has no race or class (legacy character)
		if ( ! this.character.race || ! this.character.characterClass ) {
			this.showLegacyPrompt();
		}
	}

	/**
	 * Show prompt for legacy characters to choose race/class
	 */
	showLegacyPrompt() {
		const legacyBtn = this.container.querySelector( '.site-rpg-legacy-btn' );
		if ( legacyBtn ) {
			legacyBtn.style.display = 'inline-flex';
		}
	}

	/**
	 * Hide legacy prompt
	 */
	hideLegacyPrompt() {
		const legacyBtn = this.container.querySelector( '.site-rpg-legacy-btn' );
		if ( legacyBtn ) {
			legacyBtn.style.display = 'none';
		}
	}

	/**
	 * Open the wizard in legacy mode (race/class selection only)
	 */
	chooseLegacy() {
		if ( ! this.isLoggedIn || ! this.character ) return;

		// Show the creation wizard in legacy mode
		if ( this.creationWizard ) {
			this.creationWizard.showLegacyMode();
		}
	}

	/**
	 * Set race and class for an existing legacy character
	 */
	async setRaceClass( race, characterClass ) {
		if ( ! this.isLoggedIn || ! this.character ) return null;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/set-race-class', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
				body: JSON.stringify( { race, character_class: characterClass } ),
			} );

			const data = await response.json();

			if ( data.success && data.character ) {
				this.character = data.character;
				this.updateCharacterDisplay();
				this.hideLegacyPrompt();
				return this.character;
			}
		} catch ( error ) {
			console.error( 'Failed to set race/class:', error );
		}

		return null;
	}

	/**
	 * Check if logged-in user should claim guest progress
	 */
	async checkGuestClaim() {
		if ( ! this.isLoggedIn ) return;

		const guestData = this.getGuestData();
		if ( ! guestData || ! guestData.games_played ) return;

		// Show claim modal if we have guest data and user has no character
		if ( ! this.character && this.claimModal ) {
			this.showClaimModal( guestData );
		}
	}

	/**
	 * Get guest character data from localStorage
	 */
	getGuestData() {
		try {
			const stored = localStorage.getItem( this.guestStorageKey );
			if ( stored ) {
				return JSON.parse( stored );
			}

			// Also check for old rolled stats format
			const rolledStats = localStorage.getItem( 'site_rpg_rolled_stats' );
			if ( rolledStats ) {
				const data = JSON.parse( rolledStats );
				return {
					stats: data.stats,
					xp: 0,
					level: 1,
					games_played: parseInt( localStorage.getItem( 'site_rpg_games_played' ) || '0', 10 ),
				};
			}
		} catch ( e ) {
			return null;
		}
		return null;
	}

	/**
	 * Save guest character progress
	 */
	saveGuestData( data ) {
		localStorage.setItem( this.guestStorageKey, JSON.stringify( data ) );
	}

	/**
	 * Clear guest data after claiming
	 */
	clearGuestData() {
		localStorage.removeItem( this.guestStorageKey );
		localStorage.removeItem( 'site_rpg_rolled_stats' );
		localStorage.removeItem( 'site_rpg_games_played' );
	}

	/**
	 * Show claim modal for guest progress
	 */
	showClaimModal( guestData ) {
		if ( ! this.claimModal ) return;

		const xpEl = this.claimModal.querySelector( '.claim-xp' );
		const gamesEl = this.claimModal.querySelector( '.claim-games' );

		if ( xpEl ) xpEl.textContent = guestData.xp || 0;
		if ( gamesEl ) gamesEl.textContent = guestData.games_played || 0;

		this.claimModal.style.display = 'flex';
		scrollToModal( this.claimModal );
	}

	/**
	 * Claim guest progress to user account
	 */
	async claimGuestProgress() {
		const guestData = this.getGuestData();
		if ( ! guestData ) return;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/claim-guest', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
				body: JSON.stringify( { guestData } ),
			} );

			const data = await response.json();

			if ( data.success && data.character ) {
				this.character = data.character;
				this.clearGuestData();
				this.updateCharacterDisplay();

				if ( this.claimModal ) {
					this.claimModal.style.display = 'none';
				}
			}
		} catch ( error ) {
			console.error( 'Failed to claim guest progress:', error );
		}
	}

	/**
	 * Create character for logged-in user.
	 * Shows the creation wizard instead of directly creating.
	 */
	createCharacter() {
		if ( ! this.isLoggedIn ) return;

		// Show the creation wizard.
		if ( this.creationWizard ) {
			this.creationWizard.show();
		}
	}

	/**
	 * Direct character creation (bypasses wizard, used for quick creation).
	 */
	async createCharacterDirect() {
		if ( ! this.isLoggedIn ) return null;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
			} );

			const data = await response.json();

			if ( data.success && data.character ) {
				this.character = data.character;
				this.updateCharacterDisplay();
				this.hideCreateCharacterPrompt();
				return this.character;
			}
		} catch ( error ) {
			console.error( 'Failed to create character:', error );
		}

		return null;
	}

	/**
	 * Hide the create character prompt after character is created
	 */
	hideCreateCharacterPrompt() {
		const createPrompt = this.container.querySelector( '.site-rpg-card__create-character' );
		if ( createPrompt ) {
			createPrompt.style.display = 'none';
		}

		// Show the reset character button
		const resetBtn = this.container.querySelector( '.site-rpg-reset-character-btn' );
		if ( resetBtn ) {
			resetBtn.style.display = 'inline-flex';
		}
	}

	/**
	 * Show level-up modal with stat allocation
	 */
	showLevelUpModal( newLevel, unspentPoints ) {
		if ( ! this.levelUpModal ) return;

		const levelEl = this.levelUpModal.querySelector( '.levelup-level' );
		const pointsEl = this.levelUpModal.querySelector( '.points-count' );

		if ( levelEl ) levelEl.textContent = newLevel;
		if ( pointsEl ) pointsEl.textContent = unspentPoints;

		// Update stat buttons
		this.updateStatAllocationButtons();

		this.levelUpModal.style.display = 'flex';
		scrollToModal( this.levelUpModal );
	}

	/**
	 * Hide level-up modal
	 */
	hideLevelUpModal() {
		if ( this.levelUpModal ) {
			this.levelUpModal.style.display = 'none';
		}
	}

	/**
	 * Update stat allocation buttons
	 */
	updateStatAllocationButtons() {
		if ( ! this.character || ! this.levelUpModal ) return;

		const buttons = this.levelUpModal.querySelectorAll( '[data-allocate-stat]' );
		buttons.forEach( ( btn ) => {
			const stat = btn.dataset.allocateStat;
			const statValue = this.character.stats[ stat ] || 10;

			// Disable if at max (20)
			btn.disabled = statValue >= 20;

			// Update displayed value
			const valueEl = btn.querySelector( '.stat-value' );
			if ( valueEl ) {
				valueEl.textContent = statValue;
			}
		} );

		// Update points remaining
		const pointsEl = this.levelUpModal.querySelector( '.points-count' );
		if ( pointsEl ) {
			pointsEl.textContent = this.character.unspentStatPoints || 0;
		}

		// Hide modal if no points left
		if ( this.character.unspentStatPoints <= 0 ) {
			setTimeout( () => this.hideLevelUpModal(), 1500 );
		}
	}

	/**
	 * Allocate a stat point
	 */
	async allocateStat( stat ) {
		if ( ! this.isLoggedIn || ! this.character ) return;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/allocate-stat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
				body: JSON.stringify( { stat } ),
			} );

			const data = await response.json();

			if ( data.success && data.character ) {
				this.character = data.character;
				this.updateCharacterDisplay();
				this.updateStatAllocationButtons();
			}
		} catch ( error ) {
			console.error( 'Failed to allocate stat:', error );
		}
	}

	/**
	 * Get current character stats for gameplay
	 */
	getStats() {
		if ( this.character && this.character.stats ) {
			return this.character.stats;
		}
		return null;
	}

	/**
	 * Get stat bonuses for gameplay (D&D-style)
	 */
	getStatBonuses() {
		if ( this.character && this.character.statBonuses ) {
			return this.character.statBonuses;
		}

		// Calculate from stats if bonuses not provided
		const stats = this.getStats();
		if ( stats ) {
			return {
				str: Math.floor( ( stats.strength - 10 ) / 2 ),
				wis: Math.floor( ( stats.wisdom - 10 ) / 2 ),
				cha: Math.floor( ( stats.charisma - 10 ) / 2 ),
				sta: Math.floor( ( stats.stamina - 10 ) / 2 ),
				agi: Math.floor( ( stats.agility - 10 ) / 2 ),
				int: Math.floor( ( stats.intelligence - 10 ) / 2 ),
			};
		}

		return null;
	}

	/**
	 * Update character display in the UI
	 */
	updateCharacterDisplay() {
		if ( ! this.character ) return;

		// Update level display
		const levelBadge = this.container.querySelector( '.site-rpg-card__level-badge' );
		if ( levelBadge ) {
			levelBadge.textContent = `Level ${ this.character.level }`;
		}

		const levelTitle = this.container.querySelector( '.site-rpg-card__level-title' );
		if ( levelTitle ) {
			levelTitle.textContent = this.character.levelTitle;
		}

		// Update race/class display
		const raceDisplay = this.container.querySelector( '.site-rpg-card__race' );
		if ( raceDisplay ) {
			if ( this.character.raceName ) {
				raceDisplay.textContent = this.character.raceName;
				raceDisplay.style.display = 'inline';
			} else {
				raceDisplay.textContent = 'Unknown Heritage';
				raceDisplay.style.display = 'inline';
			}
		}

		const classDisplay = this.container.querySelector( '.site-rpg-card__class' );
		if ( classDisplay ) {
			if ( this.character.className ) {
				classDisplay.textContent = this.character.className;
				classDisplay.style.display = 'inline';
			} else {
				classDisplay.textContent = 'Adventurer';
				classDisplay.style.display = 'inline';
			}
		}

		const avatarLevel = this.container.querySelector( '.site-rpg-card__avatar-level' );
		if ( avatarLevel ) {
			avatarLevel.textContent = this.character.level;
		}

		// Update XP display
		const xpCurrent = this.container.querySelector( '.site-rpg-xp-current' );
		if ( xpCurrent ) {
			xpCurrent.textContent = this.character.xp;
		}

		const xpNext = this.container.querySelector( '.site-rpg-xp-next' );
		if ( xpNext ) {
			xpNext.textContent = this.character.xpToNextLevel;
		}

		const xpFill = this.container.querySelector( '.site-rpg-card__xp-fill' );
		if ( xpFill ) {
			const percent = ( this.character.xp / this.character.xpToNextLevel ) * 100;
			xpFill.style.width = `${ Math.min( 100, percent ) }%`;
		}

		// Update stats display
		const statElements = this.container.querySelectorAll( '.site-rpg-card__stat' );
		statElements.forEach( ( el ) => {
			const statKey = el.dataset.stat;
			if ( this.character.stats && this.character.stats[ statKey ] !== undefined ) {
				const value = this.character.stats[ statKey ];
				el.dataset.value = value;

				const valueEl = el.querySelector( '.site-rpg-card__stat-value' );
				if ( valueEl ) {
					valueEl.innerHTML = `${ value }<span class="site-rpg-card__stat-max">/20</span>`;
				}

				const fillEl = el.querySelector( '.site-rpg-card__stat-fill' );
				if ( fillEl ) {
					fillEl.style.width = `${ Math.min( value * 5, 100 ) }%`;
				}
			}
		} );
	}

	/**
	 * Handle game completion with potential level-up
	 */
	handleGameComplete( response ) {
		if ( response.character ) {
			this.character = response.character;
			this.updateCharacterDisplay();
		}

		if ( response.leveledUp && this.character ) {
			this.showLevelUpModal( response.newLevel, this.character.unspentStatPoints );

			// Check for level coupon unlock (after a delay so modals don't overlap)
			if ( response.newlyUnlockedLevel && this.container.rewardsManager ) {
				setTimeout( () => {
					this.container.rewardsManager.checkLevelCouponUnlock(
						response.newlyUnlockedLevel,
						true // isServerUnlock
					);
				}, 500 );
			}
		}
	}

	/**
	 * Show reset confirmation modal
	 */
	showResetModal() {
		if ( ! this.resetModal ) return;

		// Update modal with current character info
		if ( this.character ) {
			const levelEl = this.resetModal.querySelector( '.reset-current-level' );
			const xpEl = this.resetModal.querySelector( '.reset-current-xp' );
			const gamesEl = this.resetModal.querySelector( '.reset-current-games' );

			if ( levelEl ) levelEl.textContent = this.character.level;
			if ( xpEl ) xpEl.textContent = this.character.totalXp;
			if ( gamesEl ) gamesEl.textContent = this.character.gamesPlayed;
		}

		this.resetModal.style.display = 'flex';
		scrollToModal( this.resetModal );
	}

	/**
	 * Hide reset modal
	 */
	hideResetModal() {
		if ( this.resetModal ) {
			this.resetModal.style.display = 'none';
		}
	}

	/**
	 * Delete character completely
	 */
	async resetCharacter() {
		if ( ! this.isLoggedIn || ! this.character ) return;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
			} );

			const data = await response.json();

			if ( data.success && data.deleted ) {
				// Clear character data
				this.character = null;

				// Hide reset modal
				this.hideResetModal();

				// Show create character prompt
				this.showCreateCharacterPrompt();
			}
		} catch ( error ) {
			console.error( 'Failed to delete character:', error );
		}
	}

	/**
	 * Show the create character prompt after deletion
	 */
	showCreateCharacterPrompt() {
		const createPrompt = this.container.querySelector( '.site-rpg-card__create-character' );
		if ( createPrompt ) {
			createPrompt.style.display = 'flex';
		}

		// Hide the reset character button
		const resetBtn = this.container.querySelector( '.site-rpg-reset-character-btn' );
		if ( resetBtn ) {
			resetBtn.style.display = 'none';
		}
	}

	/**
	 * Bind event listeners
	 */
	bindEvents() {
		// Character creation buttons
		const createBtn = this.container.querySelector( '[data-action="create-character"]' );
		if ( createBtn ) {
			createBtn.addEventListener( 'click', () => this.createCharacter() );
		}

		// Legacy character button (choose race/class for existing characters)
		const legacyBtn = this.container.querySelector( '[data-action="choose-legacy"]' );
		if ( legacyBtn ) {
			legacyBtn.addEventListener( 'click', () => this.chooseLegacy() );
		}

		// Claim guest buttons
		const claimBtn = this.container.querySelector( '[data-action="claim-guest"]' );
		if ( claimBtn ) {
			claimBtn.addEventListener( 'click', () => this.claimGuestProgress() );
		}

		const skipClaimBtn = this.container.querySelector( '[data-action="skip-claim"]' );
		if ( skipClaimBtn ) {
			skipClaimBtn.addEventListener( 'click', () => {
				this.clearGuestData();
				if ( this.claimModal ) {
					this.claimModal.style.display = 'none';
				}
			} );
		}

		// Stat allocation buttons
		const allocateButtons = this.container.querySelectorAll( '[data-allocate-stat]' );
		allocateButtons.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				const stat = btn.dataset.allocateStat;
				this.allocateStat( stat );
			} );
		} );

		// Close level-up modal
		const closeLevelUp = this.container.querySelector( '[data-action="close-levelup"]' );
		if ( closeLevelUp ) {
			closeLevelUp.addEventListener( 'click', () => this.hideLevelUpModal() );
		}

		// Reset character buttons (there may be multiple)
		const resetBtns = this.container.querySelectorAll( '[data-action="show-reset"]' );
		resetBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => this.showResetModal() );
		} );

		const confirmResetBtn = this.container.querySelector( '[data-action="confirm-reset"]' );
		if ( confirmResetBtn ) {
			confirmResetBtn.addEventListener( 'click', () => this.resetCharacter() );
		}

		const cancelResetBtn = this.container.querySelector( '[data-action="cancel-reset"]' );
		if ( cancelResetBtn ) {
			cancelResetBtn.addEventListener( 'click', () => this.hideResetModal() );
		}
	}
}
