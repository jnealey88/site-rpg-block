/**
 * Game Manager - Handles game selection and shared functionality
 */
import { GAME_INFO, RACES, CLASSES } from '../constants/index.js';
import { HackSlashGame } from '../games/HackSlashGame.js';
import { RunnerGame } from '../games/RunnerGame.js';
import { BossRushGame } from '../games/BossRushGame.js';
import { AdventureGame } from '../games/AdventureGame.js';
import { saveHighScore } from '../utils/highscores.js';
import { scrollToBlock, scrollToModal } from '../utils/scroll.js';

export class GameManager {
	constructor( container ) {
		this.container = container;
		this.canvas = container.querySelector( '.site-rpg-game__canvas' );
		this.ctx = this.canvas.getContext( '2d' );

		// Get reference to stat roller and character manager
		this.statRoller = container.statRoller || null;
		this.characterManager = container.characterManager || null;

		// UI elements
		this.cardArea = container.querySelector( '.site-rpg-card__game' );
		this.statsArea = container.querySelector( '.site-rpg-card__stats' );
		this.gameSelectArea = container.querySelector( '.site-rpg-game-select' );
		this.difficultyArea = container.querySelector( '.site-rpg-difficulty-select' );
		this.classSelectArea = container.querySelector( '.site-rpg-class-select' );
		this.gameStartArea = container.querySelector( '.site-rpg-game-start' );
		this.gameArea = container.querySelector( '.site-rpg-game' );
		this.gameOverArea = container.querySelector( '.site-rpg-game-over' );
		this.mobileControls = container.querySelector( '.site-rpg-mobile-controls' );
		this.runnerControls = container.querySelector( '.site-rpg-runner-controls' );
		this.d20Controls = container.querySelector( '.site-rpg-d20-controls' );
		this.adventureControls = container.querySelector( '.site-rpg-adventure-controls' );

		// HUD elements
		this.waveDisplay = container.querySelector( '.site-rpg-game__wave' );
		this.scoreDisplay = container.querySelector( '.site-rpg-game__score' );
		this.healthDisplay = container.querySelector( '.site-rpg-game__health' );

		// Coupon modal
		this.couponModal = container.querySelector( '.site-rpg-coupon-modal' );
		this.couponEnabled = container.dataset.couponEnabled === 'true';
		this.couponCode = container.dataset.couponCode || '';
		this.couponMessage = container.dataset.couponMessage || '';

		// State
		this.currentGame = null;
		this.selectedGameType = null;
		this.difficulty = 'normal';
		this.selectedClass = 'warrior';
		this.score = 0;

		this.bindEvents();
		this.bindCouponEvents();
	}

	/**
	 * Get current stat bonuses for gameplay
	 * @returns {Object} Bonuses object with str, wis, cha, sta, agi, int
	 */
	getStatBonuses() {
		// Logged-in users with characters get server stats
		if ( this.characterManager ) {
			const bonuses = this.characterManager.getStatBonuses();
			if ( bonuses ) {
				return bonuses;
			}
		}
		// Guests use rolled/site stats
		if ( this.statRoller ) {
			return this.statRoller.getStatBonuses();
		}
		// Default bonuses if no stat roller
		return { str: 0, wis: 0, cha: 0, sta: 0, agi: 0, int: 0 };
	}

	/**
	 * Get race/class effects for gameplay
	 * @returns {Object} Effects object with race, class, and their abilities
	 */
	getRaceClassEffects() {
		const effects = {
			race: null,
			class: null,
			// Race passives
			adaptable: false, // Human: +5% XP
			cacheSpirit: false, // Pixelkin: 10% dodge in runner
			firewall: false, // Ironforge: +1 starting health
			scriptMastery: false, // Arcanet: 15% cooldown reduction
			// Class abilities
			shieldWall: false, // Knight: +1 starting health
			powerStrike: false, // Knight: +15% damage in Hack & Slash
			arcaneKnowledge: false, // Wizard: +10% XP from games
			penetratingSpell: false, // Wizard: Ignore 1 AC in Boss Rush
			quickReflexes: false, // Scout: +20% double-jump window
			swiftMovement: false, // Scout: +1 movement speed
			precisionStrike: false, // Ranger: Crit on 18-20
			giantSlayer: false, // Ranger: +10% boss damage
		};

		// Get character data from CharacterManager
		if ( this.characterManager && this.characterManager.character ) {
			const char = this.characterManager.character;
			effects.race = char.race;
			effects.class = char.characterClass;

			// Set race passive flags
			switch ( char.race ) {
				case 'human':
					effects.adaptable = true;
					break;
				case 'pixelkin':
					effects.cacheSpirit = true;
					break;
				case 'ironforge':
					effects.firewall = true;
					break;
				case 'arcanet':
					effects.scriptMastery = true;
					break;
			}

			// Set class ability flags
			switch ( char.characterClass ) {
				case 'knight':
					effects.shieldWall = true;
					effects.powerStrike = true;
					break;
				case 'wizard':
					effects.arcaneKnowledge = true;
					effects.penetratingSpell = true;
					break;
				case 'scout':
					effects.quickReflexes = true;
					effects.swiftMovement = true;
					break;
				case 'ranger':
					effects.precisionStrike = true;
					effects.giantSlayer = true;
					break;
			}
		}

		return effects;
	}

	/**
	 * Calculate XP multiplier based on race/class
	 * @param {string} source - Source of XP (game, hook, etc.)
	 * @returns {number} Multiplier to apply to XP
	 */
	getXpMultiplier( source = 'game' ) {
		const effects = this.getRaceClassEffects();
		let multiplier = 1.0;

		// Human: +5% from all sources
		if ( effects.adaptable ) {
			multiplier += 0.05;
		}

		// Wizard: +10% from games
		if ( effects.arcaneKnowledge && source === 'game' ) {
			multiplier += 0.10;
		}

		// Trickster/Bard bonuses for hooks handled server-side

		return multiplier;
	}

	bindEvents() {
		// Start game button -> show game selector
		const startBtn = this.container.querySelector( '[data-action="start-game"]' );
		if ( startBtn ) {
			startBtn.addEventListener( 'click', () => this.showGameSelect() );
		}

		// Game selection buttons
		const gameBtns = this.container.querySelectorAll( '[data-game]' );
		gameBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				this.selectedGameType = btn.dataset.game;
				if ( this.selectedGameType === 'runner' || this.selectedGameType === 'adventure' ) {
					// Runner and Adventure don't need difficulty, go straight to start screen
					this.difficulty = 'normal';
					this.showGameStart();
				} else {
					this.showDifficultySelect();
				}
			} );
		} );

		// Difficulty buttons -> show class select for boss rush, or start screen for others
		const diffBtns = this.container.querySelectorAll( '[data-difficulty]' );
		diffBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				this.difficulty = btn.dataset.difficulty;
				if ( this.selectedGameType === 'bossrush' ) {
					this.showClassSelect();
				} else {
					this.showGameStart();
				}
			} );
		} );

		// Class selection buttons -> show start screen
		const classBtns = this.container.querySelectorAll( '[data-class]' );
		classBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				this.selectedClass = btn.dataset.class;
				this.showGameStart();
			} );
		} );

		// Begin game button (on start screen)
		const beginBtn = this.container.querySelector( '[data-action="begin-game"]' );
		if ( beginBtn ) {
			beginBtn.addEventListener( 'click', () => this.startGame() );
		}

		// Back buttons
		const backBtns = this.container.querySelectorAll( '[data-action="back-to-card"]' );
		backBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => this.showCard() );
		} );

		const backToGamesBtns = this.container.querySelectorAll( '[data-action="back-to-games"]' );
		backToGamesBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => this.showGameSelect() );
		} );

		const backToDiffBtns = this.container.querySelectorAll( '[data-action="back-to-difficulty"]' );
		backToDiffBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				if ( this.selectedGameType === 'runner' || this.selectedGameType === 'adventure' ) {
					this.showGameSelect();
				} else {
					this.showDifficultySelect();
				}
			} );
		} );

		const backToClassBtns = this.container.querySelectorAll( '[data-action="back-to-class"]' );
		backToClassBtns.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				if ( this.selectedGameType === 'bossrush' ) {
					this.showClassSelect();
				} else {
					this.showDifficultySelect();
				}
			} );
		} );

		// Play again -> go back to start screen
		const playAgainBtn = this.container.querySelector( '[data-action="play-again"]' );
		if ( playAgainBtn ) {
			playAgainBtn.addEventListener( 'click', () => this.showGameStart() );
		}

		// Pause/Quit
		const pauseBtn = this.container.querySelector( '[data-action="pause-game"]' );
		if ( pauseBtn ) {
			pauseBtn.addEventListener( 'click', () => {
				if ( this.currentGame ) this.currentGame.togglePause();
			} );
		}

		const quitBtn = this.container.querySelector( '[data-action="quit-game"]' );
		if ( quitBtn ) {
			quitBtn.addEventListener( 'click', () => this.endCurrentGame() );
		}
	}

	showCard() {
		this.hideAll();
		this.cardArea.style.display = 'block';
		this.container.classList.remove( 'site-rpg-block--playing' );
		// Expand stats
		if ( this.statsArea ) {
			this.statsArea.classList.remove( 'site-rpg-card__stats--minimized' );
		}
		scrollToBlock( this.container );
	}

	showGameSelect() {
		this.hideAll();
		this.gameSelectArea.style.display = 'block';
		// Minimize stats to give more room for game selection
		if ( this.statsArea ) {
			this.statsArea.classList.add( 'site-rpg-card__stats--minimized' );
		}
		scrollToBlock( this.container );
	}

	showDifficultySelect() {
		this.hideAll();
		this.difficultyArea.style.display = 'block';
		scrollToBlock( this.container );
	}

	showClassSelect() {
		this.hideAll();
		this.classSelectArea.style.display = 'block';
		scrollToBlock( this.container );
	}

	showGameStart() {
		this.hideAll();
		this.container.classList.add( 'site-rpg-block--playing' );

		// Populate start screen with game info
		const info = GAME_INFO[ this.selectedGameType ];
		if ( info && this.gameStartArea ) {
			const iconEl = this.gameStartArea.querySelector( '.site-rpg-game-start__icon' );
			const titleEl = this.gameStartArea.querySelector( '.site-rpg-game-start__title' );
			const descEl = this.gameStartArea.querySelector( '.site-rpg-game-start__desc' );
			const controlsEl = this.gameStartArea.querySelector( '.site-rpg-game-start__controls' );

			if ( iconEl ) iconEl.textContent = info.icon;
			if ( titleEl ) titleEl.textContent = info.title;
			if ( descEl ) descEl.textContent = info.desc;
			if ( controlsEl ) controlsEl.innerHTML = info.controls;

			this.gameStartArea.style.display = 'block';
		}
		scrollToBlock( this.container );
	}

	hideAll() {
		if ( this.cardArea ) this.cardArea.style.display = 'none';
		if ( this.gameSelectArea ) this.gameSelectArea.style.display = 'none';
		if ( this.difficultyArea ) this.difficultyArea.style.display = 'none';
		if ( this.classSelectArea ) this.classSelectArea.style.display = 'none';
		if ( this.gameStartArea ) this.gameStartArea.style.display = 'none';
		if ( this.gameArea ) this.gameArea.style.display = 'none';
		if ( this.gameOverArea ) this.gameOverArea.style.display = 'none';
		if ( this.mobileControls ) this.mobileControls.style.display = 'none';
		if ( this.runnerControls ) this.runnerControls.style.display = 'none';
		if ( this.d20Controls ) this.d20Controls.style.display = 'none';
		if ( this.adventureControls ) this.adventureControls.style.display = 'none';
	}

	startGame() {
		this.hideAll();
		this.gameArea.style.display = 'block';
		this.container.classList.add( 'site-rpg-block--playing' );

		// Resize canvas to container
		const containerWidth = this.gameArea.offsetWidth;
		this.canvas.width = Math.min( containerWidth, 800 );
		this.canvas.height = Math.min( containerWidth * 0.35, 280 );

		// Get stat bonuses and race/class effects for gameplay
		const bonuses = this.getStatBonuses();
		const effects = this.getRaceClassEffects();

		// Create appropriate game with stat bonuses and effects
		switch ( this.selectedGameType ) {
			case 'hackslash':
				if ( this.mobileControls ) this.mobileControls.style.display = 'flex';
				this.currentGame = new HackSlashGame( this, bonuses, effects );
				break;
			case 'runner':
				if ( this.runnerControls ) this.runnerControls.style.display = 'flex';
				this.currentGame = new RunnerGame( this, bonuses, effects );
				break;
			case 'bossrush':
				if ( this.d20Controls ) this.d20Controls.style.display = 'flex';
				this.currentGame = new BossRushGame( this, bonuses, effects );
				break;
			case 'adventure':
				// Adventure game uses DOM instead of canvas
				this.gameArea.style.display = 'none';
				if ( this.adventureControls ) this.adventureControls.style.display = 'flex';
				this.currentGame = new AdventureGame( this, bonuses, effects );
				break;
			default:
				this.currentGame = new HackSlashGame( this, bonuses, effects );
		}

		this.currentGame.start();
		scrollToBlock( this.container );
	}

	endCurrentGame() {
		if ( this.currentGame ) {
			this.currentGame.stop();
			this.currentGame = null;
		}
		this.showGameOver();
	}

	showGameOver() {
		this.hideAll();
		this.gameOverArea.style.display = 'block';
		this.container.classList.remove( 'site-rpg-block--playing' );

		const earnedXpEl = this.gameOverArea.querySelector( '.earned-xp' );
		if ( earnedXpEl ) {
			earnedXpEl.textContent = this.score;
		}

		this.submitScore();
		scrollToBlock( this.container );
	}

	updateHUD( wave, totalWaves, score, health, maxHealth ) {
		this.score = score;
		if ( this.waveDisplay ) {
			this.waveDisplay.textContent = `Wave ${ wave }/${ totalWaves }`;
		}
		if ( this.scoreDisplay ) {
			this.scoreDisplay.textContent = `XP: ${ score }`;
		}
		if ( this.healthDisplay ) {
			this.healthDisplay.textContent = '❤️'.repeat( health ) + '🖤'.repeat( maxHealth - health );
		}
	}

	async submitScore() {
		// Save high score locally
		saveHighScore( this.selectedGameType, this.score );

		if ( ! window.siteRpgData?.restUrl ) return;

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'game/complete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
				body: JSON.stringify( {
					xp: this.score,
					game: this.selectedGameType,
					difficulty: this.difficulty,
				} ),
			} );

			const data = await response.json();

			if ( data.success ) {
				// Handle character updates for logged-in users
				if ( this.characterManager && data.character ) {
					this.characterManager.handleGameComplete( data );
				} else if ( data.data ) {
					// Guest/site XP updates
					const xpCurrentEl = this.container.querySelector( '.site-rpg-xp-current' );
					if ( xpCurrentEl ) {
						xpCurrentEl.textContent = data.data.xp;
					}

					const levelEl = this.container.querySelector( '.site-rpg-card__level' );
					if ( levelEl ) {
						levelEl.textContent = `Level ${ data.data.level }`;
					}
				}
			}
		} catch ( error ) {
			console.error( 'Failed to submit score:', error );
		}

		// Check for coupon unlock after score submission
		this.checkCouponUnlock();
	}

	bindCouponEvents() {
		if ( ! this.couponModal ) return;

		const copyBtn = this.couponModal.querySelector( '.site-rpg-coupon-modal__copy' );
		const closeBtn = this.couponModal.querySelector( '.site-rpg-coupon-modal__close' );

		if ( copyBtn ) {
			copyBtn.addEventListener( 'click', () => this.copyCouponCode() );
		}

		if ( closeBtn ) {
			closeBtn.addEventListener( 'click', () => this.hideCouponModal() );
		}
	}

	checkCouponUnlock() {
		// Only proceed if coupon is enabled and has a code
		if ( ! this.couponEnabled || ! this.couponCode ) return;

		// Check if already unlocked
		const storageKey = 'site_rpg_coupon_unlocked';
		if ( localStorage.getItem( storageKey ) ) return;

		// First time! Mark as unlocked and show modal
		localStorage.setItem( storageKey, Date.now().toString() );
		this.showCouponModal();
	}

	showCouponModal() {
		if ( ! this.couponModal ) return;

		const codeEl = this.couponModal.querySelector( '.site-rpg-coupon-modal__code' );
		const msgEl = this.couponModal.querySelector( '.site-rpg-coupon-modal__message' );

		if ( codeEl ) {
			codeEl.textContent = this.couponCode;
		}
		if ( msgEl ) {
			msgEl.textContent = this.couponMessage;
		}

		this.couponModal.style.display = 'flex';
		scrollToModal( this.couponModal );
	}

	hideCouponModal() {
		if ( this.couponModal ) {
			this.couponModal.style.display = 'none';
		}
	}

	async copyCouponCode() {
		try {
			await navigator.clipboard.writeText( this.couponCode );
			const copyBtn = this.couponModal.querySelector( '.site-rpg-coupon-modal__copy' );
			if ( copyBtn ) {
				const originalText = copyBtn.textContent;
				copyBtn.textContent = '✅ Copied!';
				setTimeout( () => {
					copyBtn.textContent = originalText;
				}, 2000 );
			}
		} catch ( error ) {
			console.error( 'Failed to copy coupon code:', error );
		}
	}
}
