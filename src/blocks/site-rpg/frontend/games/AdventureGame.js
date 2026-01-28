/**
 * Text Quest - Choose Your Own Adventure Game
 *
 * A DOM-based text adventure with D20 skill checks and branching narratives.
 */
import { BaseGame } from './BaseGame.js';
import { STAT_INFO } from '../constants/index.js';
import { ADVENTURES, ADVENTURE_DIFFICULTY } from '../constants/adventures.js';

export class AdventureGame extends BaseGame {
	constructor( manager, bonuses = {}, effects = {} ) {
		super( manager );

		// Store stat bonuses (used for skill check modifiers)
		this.bonuses = {
			str: bonuses.str || 0,
			wis: bonuses.wis || 0,
			cha: bonuses.cha || 0,
			sta: bonuses.sta || 0,
			agi: bonuses.agi || 0,
			int: bonuses.int || 0,
		};

		// Store race/class effects for special abilities
		this.effects = effects;

		// Difficulty settings
		this.difficultySettings = ADVENTURE_DIFFICULTY[ this.difficulty ] || ADVENTURE_DIFFICULTY.normal;

		// Adventure state
		this.currentAdventure = null;
		this.currentScene = null;
		this.health = this.calculateStartingHealth();
		this.maxHealth = this.health;
		this.inventory = [];
		this.flags = {};
		this.eventLog = [];
		this.xpEarned = 0;

		// Animation state
		this.isRolling = false;
		this.isTransitioning = false;
		this.typewriterTimeout = null;

		// UI elements (grabbed from container)
		this.adventureControls = this.container.querySelector( '.site-rpg-adventure-controls' );
		this.storyArea = this.container.querySelector( '.site-rpg-adventure__story' );
		this.textArea = this.container.querySelector( '.site-rpg-adventure__text' );
		this.sceneTitleEl = this.container.querySelector( '.site-rpg-adventure__scene-title' );
		this.sceneIconEl = this.container.querySelector( '.site-rpg-adventure__scene-icon' );
		this.choicesArea = this.container.querySelector( '.site-rpg-adventure__choices' );
		this.skillCheckArea = this.container.querySelector( '.site-rpg-adventure__skill-check' );
		this.diceEl = this.container.querySelector( '.site-rpg-adventure__dice-value' );
		this.checkStatEl = this.container.querySelector( '.site-rpg-adventure__check-stat' );
		this.checkDcEl = this.container.querySelector( '.site-rpg-adventure__check-dc' );
		this.rollFormulaEl = this.container.querySelector( '.site-rpg-adventure__roll-formula' );
		this.rollResultEl = this.container.querySelector( '.site-rpg-adventure__roll-result' );
		this.healthDisplay = this.container.querySelector( '.site-rpg-adventure__health-hearts' );
		this.xpDisplay = this.container.querySelector( '.site-rpg-adventure__xp-value' );
		this.inventoryCountEl = this.container.querySelector( '.site-rpg-adventure__inventory-count' );
		this.logEntriesEl = this.container.querySelector( '.site-rpg-adventure__log-entries' );
		this.logToggleEl = this.container.querySelector( '.site-rpg-adventure__log-toggle' );

		// Bind log toggle
		if ( this.logToggleEl ) {
			this.logToggleEl.addEventListener( 'click', () => this.toggleLog() );
		}
	}

	/**
	 * Calculate starting health based on stats and race/class.
	 */
	calculateStartingHealth() {
		let health = 3 + this.difficultySettings.healthBonus;

		// STA bonus to health (reduced by 50% like other games)
		health += Math.floor( this.bonuses.sta * 0.5 );

		// Ironforge passive: +1 starting health
		if ( this.effects.firewall ) {
			health += 1;
		}

		// Knight ability: +1 starting health
		if ( this.effects.shieldWall ) {
			health += 1;
		}

		return Math.max( 1, health );
	}

	/**
	 * Calculate skill check modifier for a stat.
	 */
	getStatModifier( stat ) {
		// Map stat names to short names
		const statMap = {
			str: 'str',
			strength: 'str',
			wis: 'wis',
			wisdom: 'wis',
			cha: 'cha',
			charisma: 'cha',
			sta: 'sta',
			stamina: 'sta',
			agi: 'agi',
			agility: 'agi',
			int: 'int',
			intelligence: 'int',
		};

		const shortStat = statMap[ stat.toLowerCase() ];
		if ( ! shortStat ) return 0;

		// Base modifier from stat (reduced by 50% like other games)
		let modifier = Math.floor( ( this.bonuses[ shortStat ] || 0 ) * 0.5 );

		// Apply race/class bonuses to specific stats
		modifier += this.getRaceClassStatBonus( shortStat );

		// Apply difficulty modifier
		modifier -= this.difficultySettings.dcMod;

		return modifier;
	}

	/**
	 * Get race/class bonuses for specific skill check types.
	 */
	getRaceClassStatBonus( stat ) {
		let bonus = 0;

		// Trickster gets CHA bonus for social checks
		if ( stat === 'cha' && this.effects.race === 'trickster' ) {
			bonus += 2;
		}

		// Ranger gets WIS bonus for perception/tracking
		if ( stat === 'wis' && this.effects.class === 'ranger' ) {
			bonus += 1;
		}

		// Wizard gets INT bonus for arcane knowledge
		if ( stat === 'int' && this.effects.class === 'wizard' ) {
			bonus += 1;
		}

		// Scout gets AGI bonus for agility checks
		if ( stat === 'agi' && this.effects.class === 'scout' ) {
			bonus += 1;
		}

		// Knight gets STR bonus for combat
		if ( stat === 'str' && this.effects.class === 'knight' ) {
			bonus += 1;
		}

		return bonus;
	}

	/**
	 * Start the adventure game.
	 */
	start() {
		// Don't call super.start() - we don't need the canvas game loop
		this.isRunning = true;
		this.isPaused = false;
		this.score = 0;

		// Load the selected adventure (default to dungeon_delve)
		this.currentAdventure = ADVENTURES.dungeon_delve;

		// Clear event log
		if ( this.logEntriesEl ) {
			this.logEntriesEl.innerHTML = '';
		}

		// Navigate to starting scene
		this.goToScene( this.currentAdventure.startingScene );

		// Log start of adventure
		this.addToLog( `🎮 Starting: ${ this.currentAdventure.title }` );

		this.updateUI();
	}

	/**
	 * Navigate to a scene by ID.
	 */
	goToScene( sceneId ) {
		const scene = this.currentAdventure.scenes[ sceneId ];
		if ( ! scene ) {
			console.error( `Scene not found: ${ sceneId }` );
			return;
		}

		this.currentScene = scene;

		// Award XP for reaching this scene
		if ( scene.xpReward ) {
			this.awardXP( scene.xpReward, `Reached: ${ scene.title }` );
		}

		// Apply damage if scene specifies it
		if ( scene.damage ) {
			this.takeDamage( scene.damage, scene.damageMessage || 'You take damage!' );
		}

		// Apply healing if scene specifies it
		if ( scene.healing ) {
			this.heal( scene.healing );
		}

		// Add items to inventory
		if ( scene.giveItem ) {
			this.addToInventory( scene.giveItem );
		}

		// Set story flags
		if ( scene.setFlags ) {
			for ( const [ key, value ] of Object.entries( scene.setFlags ) ) {
				this.flags[ key ] = value;
			}
		}

		// Check for game-ending scenes
		if ( scene.isDeath ) {
			this.gameOver( false );
			return;
		}

		if ( scene.isVictory ) {
			this.gameOver( true );
			return;
		}

		// Render the scene
		this.renderScene();
	}

	/**
	 * Render the current scene.
	 */
	renderScene() {
		const scene = this.currentScene;
		if ( ! scene ) return;

		// Hide skill check area
		if ( this.skillCheckArea ) {
			this.skillCheckArea.style.display = 'none';
		}

		// Hide choices during text animation
		if ( this.choicesArea ) {
			this.choicesArea.style.display = 'none';
		}

		// Update scene header
		if ( this.sceneTitleEl ) {
			this.sceneTitleEl.textContent = scene.title;
		}
		if ( this.sceneIconEl ) {
			this.sceneIconEl.textContent = scene.icon || '📖';
		}

		// Render narrative text with typewriter effect
		this.typewriteText( scene.text, () => {
			// Show choices after text animation completes
			this.renderChoices();
		} );

		this.updateUI();
	}

	/**
	 * Typewriter text effect for narrative immersion.
	 */
	typewriteText( text, onComplete ) {
		if ( ! this.textArea ) {
			if ( onComplete ) onComplete();
			return;
		}

		// Clear any existing typewriter
		if ( this.typewriterTimeout ) {
			clearTimeout( this.typewriterTimeout );
		}

		this.textArea.innerHTML = '';
		this.textArea.classList.add( 'site-rpg-adventure__text--typing' );

		let index = 0;
		const speed = 15; // ms per character

		const typeChar = () => {
			if ( ! this.isRunning ) return;

			if ( index < text.length ) {
				this.textArea.innerHTML += text.charAt( index );
				index++;
				this.typewriterTimeout = setTimeout( typeChar, speed );
			} else {
				this.textArea.classList.remove( 'site-rpg-adventure__text--typing' );
				if ( onComplete ) {
					setTimeout( onComplete, 300 );
				}
			}
		};

		typeChar();
	}

	/**
	 * Skip typewriter animation.
	 */
	skipTypewriter() {
		if ( this.typewriterTimeout ) {
			clearTimeout( this.typewriterTimeout );
			this.typewriterTimeout = null;
		}

		if ( this.textArea && this.currentScene ) {
			this.textArea.innerHTML = this.currentScene.text;
			this.textArea.classList.remove( 'site-rpg-adventure__text--typing' );
		}

		// Show choices immediately
		this.renderChoices();
	}

	/**
	 * Render available choices for the current scene.
	 */
	renderChoices() {
		if ( ! this.choicesArea || ! this.currentScene ) return;

		const choices = this.getAvailableChoices();

		// If no choices, this is an ending
		if ( choices.length === 0 ) {
			this.choicesArea.innerHTML = `
				<button class="site-rpg-adventure__choice site-rpg-adventure__choice--end" data-action="end">
					<span class="site-rpg-adventure__choice-text">End Adventure</span>
				</button>
			`;
		} else {
			this.choicesArea.innerHTML = choices
				.map( ( choice, index ) => {
					const requiresCheck = !! choice.skillCheck;
					let statInfo = null;
					let statShort = '';

					if ( requiresCheck ) {
						// Map stat name to STAT_INFO key
						const statMap = {
							str: 'strength',
							strength: 'strength',
							wis: 'wisdom',
							wisdom: 'wisdom',
							cha: 'charisma',
							charisma: 'charisma',
							sta: 'stamina',
							stamina: 'stamina',
							agi: 'agility',
							agility: 'agility',
							int: 'intelligence',
							intelligence: 'intelligence',
						};
						const fullStat = statMap[ choice.skillCheck.stat.toLowerCase() ];
						statInfo = STAT_INFO[ fullStat ];
						statShort = statInfo?.name || choice.skillCheck.stat.toUpperCase();
					}

					return `
					<button class="site-rpg-adventure__choice ${ requiresCheck ? 'site-rpg-adventure__choice--check' : '' }"
							data-choice-index="${ index }">
						<span class="site-rpg-adventure__choice-text">${ choice.text }</span>
						${ requiresCheck
		? `
							<span class="site-rpg-adventure__choice-check">
								${ statInfo?.icon || '🎲' } ${ statShort } DC ${ choice.skillCheck.dc }
							</span>
						`
		: ''
}
					</button>
				`;
				} )
				.join( '' );
		}

		// Bind click events
		const choiceButtons = this.choicesArea.querySelectorAll( '.site-rpg-adventure__choice' );
		choiceButtons.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				if ( btn.dataset.action === 'end' ) {
					this.manager.endCurrentGame();
					return;
				}
				const index = parseInt( btn.dataset.choiceIndex );
				if ( ! isNaN( index ) && choices[ index ] ) {
					this.selectChoice( choices[ index ] );
				}
			} );
		} );

		// Show choices area with animation
		this.choicesArea.style.display = 'flex';
		this.choicesArea.classList.add( 'site-rpg-adventure__choices--visible' );
	}

	/**
	 * Get available choices, filtering by conditions.
	 */
	getAvailableChoices() {
		if ( ! this.currentScene?.choices ) return [];

		return this.currentScene.choices.filter( ( choice ) => {
			// Check required flags
			if ( choice.requireFlag && ! this.flags[ choice.requireFlag ] ) {
				return false;
			}

			// Check forbidden flags
			if ( choice.forbidFlag && this.flags[ choice.forbidFlag ] ) {
				return false;
			}

			// Check required items
			if ( choice.requireItem && ! this.inventory.includes( choice.requireItem ) ) {
				return false;
			}

			return true;
		} );
	}

	/**
	 * Handle player selecting a choice.
	 */
	async selectChoice( choice ) {
		if ( this.isRolling || this.isTransitioning ) return;

		// Hide choices during processing
		if ( this.choicesArea ) {
			this.choicesArea.classList.remove( 'site-rpg-adventure__choices--visible' );
		}

		// Add to log
		this.addToLog( `> ${ choice.text }` );

		if ( choice.skillCheck ) {
			// Perform skill check
			await this.performSkillCheck( choice );
		} else {
			// Direct navigation
			this.isTransitioning = true;
			setTimeout( () => {
				this.goToScene( choice.nextScene );
				this.isTransitioning = false;
			}, 300 );
		}
	}

	/**
	 * Perform a D20 skill check.
	 */
	async performSkillCheck( choice ) {
		const check = choice.skillCheck;
		this.isRolling = true;

		// Map stat to full name for display
		const statMap = {
			str: 'strength',
			strength: 'strength',
			wis: 'wisdom',
			wisdom: 'wisdom',
			cha: 'charisma',
			charisma: 'charisma',
			sta: 'stamina',
			stamina: 'stamina',
			agi: 'agility',
			agility: 'agility',
			int: 'intelligence',
			intelligence: 'intelligence',
		};
		const fullStat = statMap[ check.stat.toLowerCase() ];
		const statInfo = STAT_INFO[ fullStat ];

		// Show skill check UI
		if ( this.skillCheckArea ) {
			this.skillCheckArea.style.display = 'block';

			if ( this.checkStatEl ) {
				this.checkStatEl.innerHTML = `${ statInfo?.icon || '🎲' } ${ statInfo?.fullName || check.stat } Check`;
			}
			if ( this.checkDcEl ) {
				this.checkDcEl.textContent = `DC: ${ check.dc }`;
			}
			if ( this.rollFormulaEl ) {
				this.rollFormulaEl.textContent = 'Rolling...';
			}
			if ( this.rollResultEl ) {
				this.rollResultEl.textContent = '';
				this.rollResultEl.className = 'site-rpg-adventure__roll-result';
			}
		}

		// Roll the die with animation
		const roll = this.rollD20();
		await this.animateDiceRoll( roll );

		// Calculate total
		const modifier = this.getStatModifier( check.stat );
		const total = roll + modifier;

		// Determine result
		const isCritSuccess = roll === 20;
		const isCritFail = roll === 1;
		let success = false;
		let nextScene = null;

		if ( isCritFail ) {
			// Critical failure - always fail
			success = false;
			nextScene = check.critFail || check.failure;
			this.addToLog( `💀 CRITICAL FAIL! Rolled 1 + ${ modifier } = ${ total } vs DC ${ check.dc }` );
		} else if ( isCritSuccess ) {
			// Critical success - always succeed
			success = true;
			nextScene = check.critSuccess || check.success;
			this.addToLog( `⭐ CRITICAL SUCCESS! Rolled 20 + ${ modifier } = ${ total } vs DC ${ check.dc }` );
		} else {
			// Normal check
			success = total >= check.dc;
			nextScene = success ? check.success : check.failure;
			const modSign = modifier >= 0 ? '+' : '';
			this.addToLog(
				`🎲 Rolled ${ roll } ${ modSign }${ modifier } = ${ total } vs DC ${ check.dc }: ${ success ? 'Success!' : 'Failure' }`
			);
		}

		// Display result
		this.displayRollResult( roll, modifier, total, check.dc, success, isCritSuccess, isCritFail );

		// Award XP for successful checks
		if ( success ) {
			const xpAmount = isCritSuccess ? 15 : 10;
			setTimeout( () => {
				this.awardXP( xpAmount, 'Skill check passed' );
			}, 500 );
		}

		// Navigate to result scene after delay
		this.isRolling = false;
		setTimeout( () => {
			if ( nextScene ) {
				this.goToScene( nextScene );
			} else {
				// Fallback - re-render current scene
				this.renderChoices();
			}
		}, 2000 );
	}

	/**
	 * Roll a D20.
	 */
	rollD20() {
		return Math.floor( Math.random() * 20 ) + 1;
	}

	/**
	 * Animate the dice roll.
	 */
	async animateDiceRoll( finalValue ) {
		if ( ! this.diceEl ) return;

		const duration = 600;
		const startTime = Date.now();

		// Add rolling class
		const diceContainer = this.diceEl.parentElement;
		if ( diceContainer ) {
			diceContainer.classList.add( 'site-rpg-adventure__dice--rolling' );
		}

		return new Promise( ( resolve ) => {
			const animate = () => {
				const elapsed = Date.now() - startTime;
				if ( elapsed < duration ) {
					this.diceEl.textContent = Math.floor( Math.random() * 20 ) + 1;
					requestAnimationFrame( animate );
				} else {
					this.diceEl.textContent = finalValue;
					if ( diceContainer ) {
						diceContainer.classList.remove( 'site-rpg-adventure__dice--rolling' );
					}
					resolve();
				}
			};
			animate();
		} );
	}

	/**
	 * Display the skill check result.
	 */
	displayRollResult( roll, modifier, total, dc, success, isCrit, isCritFail ) {
		if ( this.rollFormulaEl ) {
			const modSign = modifier >= 0 ? '+' : '';
			this.rollFormulaEl.textContent = `Rolled ${ roll } ${ modSign }${ modifier } = ${ total } vs DC ${ dc }`;
		}

		if ( this.rollResultEl ) {
			this.rollResultEl.className = 'site-rpg-adventure__roll-result';

			if ( isCritFail ) {
				this.rollResultEl.textContent = 'CRITICAL FAILURE!';
				this.rollResultEl.classList.add( 'site-rpg-adventure__roll-result--critfail' );
			} else if ( isCrit ) {
				this.rollResultEl.textContent = 'CRITICAL SUCCESS!';
				this.rollResultEl.classList.add( 'site-rpg-adventure__roll-result--crit' );
			} else if ( success ) {
				this.rollResultEl.textContent = 'SUCCESS!';
				this.rollResultEl.classList.add( 'site-rpg-adventure__roll-result--success' );
			} else {
				this.rollResultEl.textContent = 'FAILURE';
				this.rollResultEl.classList.add( 'site-rpg-adventure__roll-result--failure' );
			}
		}
	}

	/**
	 * Take damage.
	 */
	takeDamage( amount, message = 'You take damage!' ) {
		this.health -= amount;
		this.addToLog( `💔 ${ message } (-${ amount } HP)` );

		if ( this.health <= 0 ) {
			this.health = 0;
			this.updateUI();
			// Don't call gameOver here - let the death scene handle it
		}

		this.updateUI();
	}

	/**
	 * Heal health.
	 */
	heal( amount ) {
		const healed = Math.min( amount, this.maxHealth - this.health );
		this.health += healed;
		if ( healed > 0 ) {
			this.addToLog( `💚 You heal ${ healed } HP` );
		}
		this.updateUI();
	}

	/**
	 * Award XP.
	 */
	awardXP( amount, reason = '' ) {
		// Apply XP multiplier from race/class
		let multiplier = this.difficultySettings.xpMult || 1.0;

		// Human: +5% from all sources
		if ( this.effects.adaptable ) {
			multiplier += 0.05;
		}

		// Wizard: +10% from games
		if ( this.effects.arcaneKnowledge ) {
			multiplier += 0.1;
		}

		const finalAmount = Math.round( amount * multiplier );
		this.xpEarned += finalAmount;
		this.score = this.xpEarned;

		if ( reason ) {
			this.addToLog( `✨ +${ finalAmount } XP (${ reason })` );
		}

		this.updateUI();
	}

	/**
	 * Add item to inventory.
	 */
	addToInventory( item ) {
		this.inventory.push( item );
		this.addToLog( `🎒 Obtained: ${ item }` );
		this.updateUI();
	}

	/**
	 * Add entry to event log.
	 */
	addToLog( message ) {
		this.eventLog.push( {
			message,
			timestamp: Date.now(),
		} );

		if ( this.logEntriesEl ) {
			const entry = document.createElement( 'div' );
			entry.className = 'site-rpg-adventure__log-entry';
			entry.textContent = message;
			this.logEntriesEl.appendChild( entry );
			this.logEntriesEl.scrollTop = this.logEntriesEl.scrollHeight;
		}
	}

	/**
	 * Toggle event log visibility.
	 */
	toggleLog() {
		if ( this.logEntriesEl ) {
			this.logEntriesEl.classList.toggle( 'site-rpg-adventure__log-entries--visible' );
		}
	}

	/**
	 * Update the UI status displays.
	 */
	updateUI() {
		// Health display
		if ( this.healthDisplay ) {
			this.healthDisplay.textContent =
				'❤️'.repeat( Math.max( 0, this.health ) ) + '🖤'.repeat( Math.max( 0, this.maxHealth - this.health ) );
		}

		// XP display
		if ( this.xpDisplay ) {
			this.xpDisplay.textContent = this.xpEarned;
		}

		// Inventory count
		if ( this.inventoryCountEl ) {
			this.inventoryCountEl.textContent = this.inventory.length;
		}

		// Update main game HUD
		this.manager.updateHUD( this.currentScene?.title || 'Adventure', '', this.score, this.health, this.maxHealth );
	}

	/**
	 * Handle game over (victory or defeat).
	 */
	gameOver( victory ) {
		this.isRunning = false;

		// Clear any pending typewriter
		if ( this.typewriterTimeout ) {
			clearTimeout( this.typewriterTimeout );
		}

		if ( victory ) {
			this.addToLog( '🎉 VICTORY! You completed the adventure!' );
			// Bonus XP for completion
			this.awardXP( 25, 'Adventure completed' );
		} else {
			this.addToLog( '💀 GAME OVER - You have been defeated.' );
		}

		// Render the final scene if it exists
		if ( this.currentScene ) {
			this.renderScene();
		}

		// Let GameManager handle end game flow after a delay
		setTimeout( () => {
			this.manager.endCurrentGame();
		}, 3000 );
	}

	/**
	 * Stop the game.
	 */
	stop() {
		this.isRunning = false;

		// Clear typewriter
		if ( this.typewriterTimeout ) {
			clearTimeout( this.typewriterTimeout );
		}

		// Remove event listeners
		document.removeEventListener( 'keydown', this.keyDownHandler );
		document.removeEventListener( 'keyup', this.keyUpHandler );
	}

	/**
	 * Handle keyboard input.
	 */
	handleKeyDown( e ) {
		if ( ! this.isRunning ) return;

		// Pause toggle
		if ( e.code === 'Escape' || e.code === 'KeyP' ) {
			e.preventDefault();
			this.togglePause();
			return;
		}

		if ( this.isPaused || this.isRolling || this.isTransitioning ) return;

		// Skip typewriter with space or enter
		if ( e.code === 'Space' || e.code === 'Enter' ) {
			if ( this.typewriterTimeout ) {
				e.preventDefault();
				this.skipTypewriter();
				return;
			}
		}

		// Number keys 1-9 to select choices
		const num = parseInt( e.key );
		if ( num >= 1 && num <= 9 ) {
			const choices = this.getAvailableChoices();
			if ( choices[ num - 1 ] ) {
				e.preventDefault();
				this.selectChoice( choices[ num - 1 ] );
			}
		}
	}

	// Override game loop methods - we don't need canvas rendering
	gameLoop() {}
	update() {}
	render() {}
}
