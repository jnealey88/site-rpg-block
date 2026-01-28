/**
 * Character Creation Wizard
 *
 * Handles the multi-step character creation flow with race, class, stat rolling, and avatar customization.
 */
import { RACES, CLASSES, STAT_INFO, DEFAULT_AVATAR, CLASS_WEAPONS, CLASS_BODIES } from '../constants/index.js';
import { scrollToModal } from '../utils/scroll.js';

export class CreationWizard {
	constructor( container, characterManager ) {
		this.container = container;
		this.characterManager = characterManager;

		// Wizard state.
		this.currentStep = 1;
		this.totalSteps = 5;
		this.maxRerolls = 3;
		this.rerollsUsed = 0;

		// Selected options.
		this.selectedRace = null;
		this.selectedClass = null;
		this.humanStatChoices = [];
		this.rolledStats = null;
		this.avatarData = { ...DEFAULT_AVATAR };
		this.characterName = '';

		// UI elements.
		this.wizardModal = container.querySelector( '.site-rpg-creation-wizard' );

		if ( this.wizardModal ) {
			this.bindEvents();
		}
	}

	/**
	 * Show the wizard modal.
	 */
	show() {
		if ( ! this.wizardModal ) return;

		this.reset();
		this.isLegacyMode = false;
		this.wizardModal.style.display = 'flex';
		this.renderStep();
		scrollToModal( this.wizardModal );
	}

	/**
	 * Show wizard in legacy mode (only race/class selection for existing characters).
	 */
	showLegacyMode() {
		if ( ! this.wizardModal ) return;

		this.reset();
		this.isLegacyMode = true;
		this.totalSteps = 2; // Only race and class selection
		this.wizardModal.style.display = 'flex';
		this.renderStep();
		scrollToModal( this.wizardModal );
	}

	/**
	 * Hide the wizard modal.
	 */
	hide() {
		if ( this.wizardModal ) {
			this.wizardModal.style.display = 'none';
		}
		// Reset total steps in case we were in legacy mode
		this.totalSteps = 5;
		this.isLegacyMode = false;
	}

	/**
	 * Reset wizard to initial state.
	 */
	reset() {
		this.currentStep = 1;
		this.rerollsUsed = 0;
		this.selectedRace = null;
		this.selectedClass = null;
		this.humanStatChoices = [];
		this.rolledStats = null;
		this.avatarData = { ...DEFAULT_AVATAR };
		this.characterName = '';
		this.isLegacyMode = false;
		this.totalSteps = 5;
	}

	/**
	 * Move to next step.
	 */
	nextStep() {
		if ( this.currentStep < this.totalSteps ) {
			// Validate current step before proceeding.
			if ( ! this.validateStep() ) return;

			this.currentStep++;
			this.renderStep();
		}
	}

	/**
	 * Move to previous step.
	 */
	prevStep() {
		if ( this.currentStep > 1 ) {
			this.currentStep--;
			this.renderStep();
		}
	}

	/**
	 * Go to a specific step.
	 */
	goToStep( step ) {
		if ( step >= 1 && step <= this.totalSteps ) {
			this.currentStep = step;
			this.renderStep();
		}
	}

	/**
	 * Validate the current step.
	 */
	validateStep() {
		switch ( this.currentStep ) {
			case 1: // Race selection.
				if ( ! this.selectedRace ) {
					this.showError( 'Please select a race.' );
					return false;
				}
				// Check human stat choices.
				if ( this.selectedRace === 'human' && this.humanStatChoices.length < 2 ) {
					this.showError( 'Please choose 2 stats for your Human bonus.' );
					return false;
				}
				return true;

			case 2: // Class selection.
				if ( ! this.selectedClass ) {
					this.showError( 'Please select a class.' );
					return false;
				}
				return true;

			case 3: // Stat rolling.
				if ( ! this.rolledStats ) {
					this.showError( 'Please roll your stats.' );
					return false;
				}
				return true;

			case 4: // Avatar customization.
				return true; // Avatar has defaults.

			case 5: // Confirmation.
				if ( ! this.characterName.trim() ) {
					this.showError( 'Please enter a character name.' );
					return false;
				}
				return true;

			default:
				return true;
		}
	}

	/**
	 * Show error message.
	 */
	showError( message ) {
		const errorEl = this.wizardModal.querySelector( '.site-rpg-wizard__error' );
		if ( errorEl ) {
			errorEl.textContent = message;
			errorEl.style.display = 'block';
			setTimeout( () => {
				errorEl.style.display = 'none';
			}, 3000 );
		}
	}

	/**
	 * Render the current step.
	 */
	renderStep() {
		const body = this.wizardModal.querySelector( '.site-rpg-wizard__body' );
		if ( ! body ) return;

		// Update step indicator.
		this.renderStepIndicator();

		// Update navigation buttons.
		this.updateNavButtons();

		// Render step content.
		switch ( this.currentStep ) {
			case 1:
				body.innerHTML = this.renderRaceSelection();
				this.bindRaceEvents();
				break;
			case 2:
				body.innerHTML = this.renderClassSelection();
				this.bindClassEvents();
				break;
			case 3:
				body.innerHTML = this.renderStatRolling();
				this.bindStatEvents();
				break;
			case 4:
				body.innerHTML = this.renderAvatarCustomization();
				this.bindAvatarEvents();
				break;
			case 5:
				body.innerHTML = this.renderConfirmation();
				this.bindConfirmEvents();
				break;
		}
	}

	/**
	 * Render step indicator.
	 */
	renderStepIndicator() {
		const indicator = this.wizardModal.querySelector( '.site-rpg-wizard__progress' );
		if ( ! indicator ) return;

		// Different step names for legacy mode (only 2 steps)
		const stepNames = this.isLegacyMode
			? [ 'Race', 'Class' ]
			: [ 'Race', 'Class', 'Stats', 'Avatar', 'Confirm' ];

		indicator.innerHTML = stepNames.map( ( name, i ) => {
			const stepNum = i + 1;
			let className = 'site-rpg-wizard__step';
			if ( stepNum === this.currentStep ) className += ' site-rpg-wizard__step--active';
			if ( stepNum < this.currentStep ) className += ' site-rpg-wizard__step--complete';
			return `<div class="${ className }" data-step="${ stepNum }">
				<span class="site-rpg-wizard__step-num">${ stepNum }</span>
				<span class="site-rpg-wizard__step-name">${ name }</span>
			</div>`;
		} ).join( '' );
	}

	/**
	 * Update navigation buttons.
	 */
	updateNavButtons() {
		const prevBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--prev' );
		const nextBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--next' );

		if ( prevBtn ) {
			prevBtn.style.visibility = this.currentStep > 1 ? 'visible' : 'hidden';
		}

		if ( nextBtn ) {
			if ( this.currentStep === this.totalSteps ) {
				// Different text for legacy mode vs new character creation
				nextBtn.textContent = this.isLegacyMode ? 'Choose Heritage' : 'Create Character';
				nextBtn.classList.add( 'site-rpg-wizard__btn--create' );
			} else {
				nextBtn.textContent = 'Next';
				nextBtn.classList.remove( 'site-rpg-wizard__btn--create' );
			}
		}
	}

	/**
	 * Render race selection step.
	 */
	renderRaceSelection() {
		const raceList = Object.entries( RACES ).map( ( [ key, race ] ) => {
			const isSelected = this.selectedRace === key;
			const modifiers = Object.entries( race.statModifiers || {} )
				.map( ( [ stat, mod ] ) => `${ STAT_INFO[ stat ]?.name || stat } ${ mod > 0 ? '+' : '' }${ mod }` )
				.join( ', ' ) || '+1 to any 2 stats';

			return `
				<div class="site-rpg-wizard__race ${ isSelected ? 'site-rpg-wizard__race--selected' : '' }" data-race="${ key }">
					<div class="site-rpg-wizard__race-icon">${ race.icon }</div>
					<div class="site-rpg-wizard__race-info">
						<h4 class="site-rpg-wizard__race-name">${ race.name }</h4>
						<p class="site-rpg-wizard__race-desc">${ race.description }</p>
						<div class="site-rpg-wizard__race-stats">${ modifiers }</div>
						<div class="site-rpg-wizard__race-passive">
							<strong>${ race.passiveName }:</strong> ${ race.passiveDesc }
						</div>
					</div>
				</div>
			`;
		} ).join( '' );

		let humanBonusHtml = '';
		if ( this.selectedRace === 'human' ) {
			const statOptions = Object.entries( STAT_INFO ).map( ( [ key, info ] ) => {
				const isSelected = this.humanStatChoices.includes( key );
				return `
					<button type="button" class="site-rpg-wizard__stat-choice ${ isSelected ? 'site-rpg-wizard__stat-choice--selected' : '' }"
						data-stat="${ key }" ${ this.humanStatChoices.length >= 2 && ! isSelected ? 'disabled' : '' }>
						${ info.icon } ${ info.name }
					</button>
				`;
			} ).join( '' );

			humanBonusHtml = `
				<div class="site-rpg-wizard__human-bonus">
					<h4>Choose 2 Stats for +1 Bonus</h4>
					<div class="site-rpg-wizard__stat-choices">${ statOptions }</div>
					<p class="site-rpg-wizard__human-count">${ this.humanStatChoices.length }/2 selected</p>
				</div>
			`;
		}

		return `
			<h3 class="site-rpg-wizard__title">Choose Your Race</h3>
			<div class="site-rpg-wizard__error" style="display: none;"></div>
			<div class="site-rpg-wizard__races">${ raceList }</div>
			${ humanBonusHtml }
		`;
	}

	/**
	 * Render class selection step.
	 */
	renderClassSelection() {
		const classList = Object.entries( CLASSES ).map( ( [ key, cls ] ) => {
			const isSelected = this.selectedClass === key;
			const primaryStats = cls.primaryStats.map( stat => STAT_INFO[ stat ]?.name || stat ).join( ', ' );

			return `
				<div class="site-rpg-wizard__class ${ isSelected ? 'site-rpg-wizard__class--selected' : '' }" data-class="${ key }">
					<div class="site-rpg-wizard__class-icon">${ cls.icon }</div>
					<div class="site-rpg-wizard__class-info">
						<h4 class="site-rpg-wizard__class-name">${ cls.name }</h4>
						<p class="site-rpg-wizard__class-desc">${ cls.description }</p>
						<div class="site-rpg-wizard__class-primary">Primary: ${ primaryStats } (+1 each)</div>
						<div class="site-rpg-wizard__class-abilities">
							${ cls.abilities.map( a => `<div class="site-rpg-wizard__ability"><strong>${ a.name }:</strong> ${ a.desc }</div>` ).join( '' ) }
						</div>
					</div>
				</div>
			`;
		} ).join( '' );

		return `
			<h3 class="site-rpg-wizard__title">Choose Your Class</h3>
			<div class="site-rpg-wizard__error" style="display: none;"></div>
			<div class="site-rpg-wizard__classes">${ classList }</div>
		`;
	}

	/**
	 * Render stat rolling step.
	 */
	renderStatRolling() {
		let statsDisplay = '';

		if ( this.rolledStats ) {
			// Apply race modifiers for display.
			const displayStats = this.getModifiedStats();

			statsDisplay = Object.entries( STAT_INFO ).map( ( [ key, info ] ) => {
				const baseValue = this.rolledStats[ key ] || 10;
				const finalValue = displayStats[ key ] || 10;
				const diff = finalValue - baseValue;
				const diffDisplay = diff !== 0 ? `<span class="site-rpg-wizard__stat-mod ${ diff > 0 ? 'positive' : 'negative' }">(${ diff > 0 ? '+' : '' }${ diff })</span>` : '';

				return `
					<div class="site-rpg-wizard__stat-row">
						<span class="site-rpg-wizard__stat-icon">${ info.icon }</span>
						<span class="site-rpg-wizard__stat-name">${ info.fullName }</span>
						<span class="site-rpg-wizard__stat-value">${ baseValue }${ diffDisplay } = <strong>${ finalValue }</strong></span>
					</div>
				`;
			} ).join( '' );
		}

		const rollBtnDisabled = this.rerollsUsed >= this.maxRerolls && this.rolledStats;
		const rerollsLeft = this.maxRerolls - this.rerollsUsed;

		return `
			<h3 class="site-rpg-wizard__title">Roll Your Stats</h3>
			<div class="site-rpg-wizard__error" style="display: none;"></div>
			<p class="site-rpg-wizard__subtitle">Click the dice to roll 4d6 (drop lowest) for each stat!</p>

			<div class="site-rpg-wizard__dice-container">
				<button type="button" class="site-rpg-wizard__roll-btn" ${ rollBtnDisabled ? 'disabled' : '' }>
					<span class="site-rpg-wizard__dice">🎲</span>
					${ this.rolledStats ? 'Re-roll' : 'Roll Stats!' }
				</button>
				${ this.rolledStats ? `<p class="site-rpg-wizard__rerolls">${ rerollsLeft } re-roll${ rerollsLeft !== 1 ? 's' : '' } remaining</p>` : '' }
			</div>

			${ this.rolledStats ? `
				<div class="site-rpg-wizard__stats-result">
					${ statsDisplay }
				</div>
				<p class="site-rpg-wizard__stats-note">
					Race modifiers from <strong>${ RACES[ this.selectedRace ]?.name || 'Unknown' }</strong>
					and class bonuses from <strong>${ CLASSES[ this.selectedClass ]?.name || 'Unknown' }</strong> are applied.
				</p>
			` : '' }
		`;
	}

	/**
	 * Render avatar customization step.
	 */
	renderAvatarCustomization() {
		// For now, simplified avatar customization with color choices.
		const skinColors = this.renderColorOptions( 'skin' );
		const hairColors = this.renderColorOptions( 'hair' );
		const primaryColors = this.renderColorOptions( 'primary' );
		const secondaryColors = this.renderColorOptions( 'secondary' );

		return `
			<h3 class="site-rpg-wizard__title">Customize Your Avatar</h3>
			<div class="site-rpg-wizard__error" style="display: none;"></div>

			<div class="site-rpg-wizard__avatar-preview">
				<div class="site-rpg-wizard__avatar-display" style="background: ${ this.avatarData.colors.primary }; border-color: ${ this.avatarData.colors.secondary };">
					<span class="site-rpg-wizard__avatar-icon">${ CLASSES[ this.selectedClass ]?.icon || '⚔️' }</span>
				</div>
				<p class="site-rpg-wizard__avatar-race">${ RACES[ this.selectedRace ]?.icon } ${ RACES[ this.selectedRace ]?.name }</p>
				<p class="site-rpg-wizard__avatar-class">${ CLASSES[ this.selectedClass ]?.icon } ${ CLASSES[ this.selectedClass ]?.name }</p>
			</div>

			<div class="site-rpg-wizard__avatar-options">
				<div class="site-rpg-wizard__color-section">
					<h4>Skin Tone</h4>
					<div class="site-rpg-wizard__color-grid" data-color-type="skin">${ skinColors }</div>
				</div>
				<div class="site-rpg-wizard__color-section">
					<h4>Hair Color</h4>
					<div class="site-rpg-wizard__color-grid" data-color-type="hair">${ hairColors }</div>
				</div>
				<div class="site-rpg-wizard__color-section">
					<h4>Primary Color</h4>
					<div class="site-rpg-wizard__color-grid" data-color-type="primary">${ primaryColors }</div>
				</div>
				<div class="site-rpg-wizard__color-section">
					<h4>Accent Color</h4>
					<div class="site-rpg-wizard__color-grid" data-color-type="secondary">${ secondaryColors }</div>
				</div>
			</div>
		`;
	}

	/**
	 * Render color options for a category.
	 */
	renderColorOptions( type ) {
		const colors = {
			skin: [
				{ name: 'Fair', value: '#f4c794' },
				{ name: 'Light', value: '#e0ac69' },
				{ name: 'Medium', value: '#c68642' },
				{ name: 'Tan', value: '#8d5524' },
				{ name: 'Dark', value: '#6b4423' },
				{ name: 'Deep', value: '#4a2c17' },
			],
			hair: [
				{ name: 'Black', value: '#090806' },
				{ name: 'Dark Brown', value: '#2c1608' },
				{ name: 'Brown', value: '#3b3024' },
				{ name: 'Blonde', value: '#b89778' },
				{ name: 'Platinum', value: '#d6c4c2' },
				{ name: 'Red', value: '#8b2500' },
			],
			primary: [
				{ name: 'Red', value: '#e74c3c' },
				{ name: 'Blue', value: '#3498db' },
				{ name: 'Green', value: '#27ae60' },
				{ name: 'Purple', value: '#9b59b6' },
				{ name: 'Gold', value: '#f39c12' },
				{ name: 'Teal', value: '#1abc9c' },
			],
			secondary: [
				{ name: 'Dark Red', value: '#c0392b' },
				{ name: 'Dark Blue', value: '#2980b9' },
				{ name: 'Dark Green', value: '#1e8449' },
				{ name: 'Dark Purple', value: '#8e44ad' },
				{ name: 'Dark Gold', value: '#d68910' },
				{ name: 'Dark Teal', value: '#16a085' },
			],
		};

		const options = colors[ type ] || [];
		const selectedValue = this.avatarData.colors[ type ];

		return options.map( opt => {
			const isSelected = opt.value === selectedValue;
			return `
				<button type="button"
					class="site-rpg-wizard__color-swatch ${ isSelected ? 'site-rpg-wizard__color-swatch--selected' : '' }"
					data-color="${ opt.value }"
					style="background-color: ${ opt.value };"
					title="${ opt.name }">
				</button>
			`;
		} ).join( '' );
	}

	/**
	 * Render confirmation step.
	 */
	renderConfirmation() {
		const displayStats = this.getModifiedStats();
		const race = RACES[ this.selectedRace ];
		const cls = CLASSES[ this.selectedClass ];

		const statsDisplay = Object.entries( STAT_INFO ).map( ( [ key, info ] ) => {
			const value = displayStats[ key ] || 10;
			return `
				<div class="site-rpg-wizard__confirm-stat">
					<span class="site-rpg-wizard__confirm-stat-icon">${ info.icon }</span>
					<span class="site-rpg-wizard__confirm-stat-name">${ info.name }</span>
					<span class="site-rpg-wizard__confirm-stat-value">${ value }</span>
				</div>
			`;
		} ).join( '' );

		const defaultName = window.siteRpgData?.userDisplayName || 'Hero';

		return `
			<h3 class="site-rpg-wizard__title">Create Your Character</h3>
			<div class="site-rpg-wizard__error" style="display: none;"></div>

			<div class="site-rpg-wizard__confirm-avatar">
				<div class="site-rpg-wizard__avatar-display site-rpg-wizard__avatar-display--large"
					style="background: ${ this.avatarData.colors.primary }; border-color: ${ this.avatarData.colors.secondary };">
					<span class="site-rpg-wizard__avatar-icon">${ cls?.icon || '⚔️' }</span>
				</div>
			</div>

			<div class="site-rpg-wizard__confirm-name">
				<label for="wizard-character-name">Character Name</label>
				<input type="text" id="wizard-character-name" class="site-rpg-wizard__name-input"
					value="${ this.characterName || defaultName }" placeholder="Enter your name" maxlength="50">
			</div>

			<div class="site-rpg-wizard__confirm-info">
				<div class="site-rpg-wizard__confirm-row">
					<span class="site-rpg-wizard__confirm-label">Race:</span>
					<span class="site-rpg-wizard__confirm-value">${ race?.icon } ${ race?.name }</span>
				</div>
				<div class="site-rpg-wizard__confirm-row">
					<span class="site-rpg-wizard__confirm-label">Class:</span>
					<span class="site-rpg-wizard__confirm-value">${ cls?.icon } ${ cls?.name }</span>
				</div>
			</div>

			<div class="site-rpg-wizard__confirm-stats">
				<h4>Final Stats</h4>
				<div class="site-rpg-wizard__confirm-stats-grid">${ statsDisplay }</div>
			</div>
		`;
	}

	/**
	 * Get stats with race and class modifiers applied.
	 */
	getModifiedStats() {
		if ( ! this.rolledStats ) return {};

		const stats = { ...this.rolledStats };
		const race = RACES[ this.selectedRace ];
		const cls = CLASSES[ this.selectedClass ];

		// Apply race modifiers.
		if ( race ) {
			for ( const [ stat, mod ] of Object.entries( race.statModifiers || {} ) ) {
				stats[ stat ] = Math.max( 1, Math.min( 20, ( stats[ stat ] || 10 ) + mod ) );
			}

			// Apply human flexible points.
			if ( this.selectedRace === 'human' ) {
				for ( const stat of this.humanStatChoices ) {
					stats[ stat ] = Math.min( 20, ( stats[ stat ] || 10 ) + 1 );
				}
			}
		}

		// Apply class primary stat bonuses.
		if ( cls ) {
			for ( const stat of cls.primaryStats ) {
				stats[ stat ] = Math.min( 20, ( stats[ stat ] || 10 ) + 1 );
			}
		}

		return stats;
	}

	/**
	 * Roll stats using 4d6 drop lowest.
	 */
	rollStats() {
		const statKeys = [ 'strength', 'wisdom', 'charisma', 'stamina', 'agility', 'intelligence' ];
		const stats = {};

		for ( const key of statKeys ) {
			const rawRoll = this.roll4d6DropLowest();
			stats[ key ] = this.scaleToStatRange( rawRoll );
		}

		return stats;
	}

	/**
	 * Roll 4d6 and drop the lowest.
	 */
	roll4d6DropLowest() {
		const rolls = [];
		for ( let i = 0; i < 4; i++ ) {
			rolls.push( Math.floor( Math.random() * 6 ) + 1 );
		}
		rolls.sort( ( a, b ) => b - a );
		return rolls[ 0 ] + rolls[ 1 ] + rolls[ 2 ];
	}

	/**
	 * Scale a 3-18 roll to 1-20 range.
	 */
	scaleToStatRange( roll ) {
		return Math.round( ( ( roll - 3 ) / 15 ) * 19 + 1 );
	}

	/**
	 * Bind general wizard events.
	 */
	bindEvents() {
		// Navigation buttons.
		const prevBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--prev' );
		const nextBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--next' );
		const closeBtn = this.wizardModal.querySelector( '.site-rpg-wizard__close' );

		if ( prevBtn ) {
			prevBtn.addEventListener( 'click', () => this.prevStep() );
		}

		if ( nextBtn ) {
			nextBtn.addEventListener( 'click', () => {
				if ( this.currentStep === this.totalSteps ) {
					if ( this.isLegacyMode ) {
						this.submitLegacyChoice();
					} else {
						this.submitCharacter();
					}
				} else {
					this.nextStep();
				}
			} );
		}

		if ( closeBtn ) {
			closeBtn.addEventListener( 'click', () => this.hide() );
		}

		// Close on backdrop click.
		this.wizardModal.addEventListener( 'click', ( e ) => {
			if ( e.target === this.wizardModal ) {
				this.hide();
			}
		} );
	}

	/**
	 * Bind race selection events.
	 */
	bindRaceEvents() {
		const races = this.wizardModal.querySelectorAll( '.site-rpg-wizard__race' );
		races.forEach( ( el ) => {
			el.addEventListener( 'click', () => {
				const race = el.dataset.race;
				this.selectedRace = race;

				// Reset human choices if switching away from human.
				if ( race !== 'human' ) {
					this.humanStatChoices = [];
				}

				this.renderStep();
			} );
		} );

		// Human stat choices.
		const statChoices = this.wizardModal.querySelectorAll( '.site-rpg-wizard__stat-choice' );
		statChoices.forEach( ( el ) => {
			el.addEventListener( 'click', () => {
				const stat = el.dataset.stat;
				const idx = this.humanStatChoices.indexOf( stat );

				if ( idx > -1 ) {
					this.humanStatChoices.splice( idx, 1 );
				} else if ( this.humanStatChoices.length < 2 ) {
					this.humanStatChoices.push( stat );
				}

				this.renderStep();
			} );
		} );
	}

	/**
	 * Bind class selection events.
	 */
	bindClassEvents() {
		const classes = this.wizardModal.querySelectorAll( '.site-rpg-wizard__class' );
		classes.forEach( ( el ) => {
			el.addEventListener( 'click', () => {
				this.selectedClass = el.dataset.class;

				// Set default avatar weapon/body based on class.
				const cls = CLASSES[ this.selectedClass ];
				if ( cls ) {
					this.avatarData.weapon = CLASS_WEAPONS[ this.selectedClass ] || 'sword';
					this.avatarData.body = CLASS_BODIES[ this.selectedClass ] || 'tunic';
				}

				this.renderStep();
			} );
		} );
	}

	/**
	 * Bind stat rolling events.
	 */
	bindStatEvents() {
		const rollBtn = this.wizardModal.querySelector( '.site-rpg-wizard__roll-btn' );
		if ( rollBtn ) {
			rollBtn.addEventListener( 'click', () => {
				// Animate dice.
				const dice = rollBtn.querySelector( '.site-rpg-wizard__dice' );
				if ( dice ) {
					dice.classList.add( 'site-rpg-wizard__dice--rolling' );
					setTimeout( () => dice.classList.remove( 'site-rpg-wizard__dice--rolling' ), 500 );
				}

				// Roll stats.
				setTimeout( () => {
					this.rolledStats = this.rollStats();
					if ( this.rolledStats ) {
						this.rerollsUsed++;
					}
					this.renderStep();
				}, 500 );
			} );
		}
	}

	/**
	 * Bind avatar customization events.
	 */
	bindAvatarEvents() {
		const colorGrids = this.wizardModal.querySelectorAll( '.site-rpg-wizard__color-grid' );
		colorGrids.forEach( ( grid ) => {
			const colorType = grid.dataset.colorType;

			grid.querySelectorAll( '.site-rpg-wizard__color-swatch' ).forEach( ( swatch ) => {
				swatch.addEventListener( 'click', () => {
					this.avatarData.colors[ colorType ] = swatch.dataset.color;
					this.renderStep();
				} );
			} );
		} );
	}

	/**
	 * Bind confirmation events.
	 */
	bindConfirmEvents() {
		const nameInput = this.wizardModal.querySelector( '.site-rpg-wizard__name-input' );
		if ( nameInput ) {
			nameInput.addEventListener( 'input', ( e ) => {
				this.characterName = e.target.value;
			} );

			// Initialize from input value.
			this.characterName = nameInput.value;
		}
	}

	/**
	 * Submit character creation.
	 */
	async submitCharacter() {
		if ( ! this.validateStep() ) return;

		const nextBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--next' );
		if ( nextBtn ) {
			nextBtn.disabled = true;
			nextBtn.textContent = 'Creating...';
		}

		try {
			const response = await fetch( window.siteRpgData.restUrl + 'character/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.siteRpgData.nonce,
				},
				body: JSON.stringify( {
					race: this.selectedRace,
					class: this.selectedClass,
					characterName: this.characterName,
					avatarData: this.avatarData,
					humanChoices: this.humanStatChoices,
					stats: this.rolledStats,
				} ),
			} );

			const data = await response.json();

			if ( data.success && data.character ) {
				// Update character manager.
				this.characterManager.character = data.character;
				this.characterManager.updateCharacterDisplay();
				this.characterManager.hideCreateCharacterPrompt();

				// Hide wizard.
				this.hide();
			} else {
				this.showError( data.message || 'Failed to create character.' );
			}
		} catch ( error ) {
			console.error( 'Character creation failed:', error );
			this.showError( 'An error occurred. Please try again.' );
		} finally {
			if ( nextBtn ) {
				nextBtn.disabled = false;
				nextBtn.textContent = 'Create Character';
			}
		}
	}

	/**
	 * Submit legacy character race/class choice.
	 */
	async submitLegacyChoice() {
		if ( ! this.validateStep() ) return;

		const nextBtn = this.wizardModal.querySelector( '.site-rpg-wizard__btn--next' );
		if ( nextBtn ) {
			nextBtn.disabled = true;
			nextBtn.textContent = 'Saving...';
		}

		try {
			const character = await this.characterManager.setRaceClass(
				this.selectedRace,
				this.selectedClass
			);

			if ( character ) {
				// Success - hide wizard
				this.hide();
			} else {
				this.showError( 'Failed to update character. Please try again.' );
			}
		} catch ( error ) {
			console.error( 'Legacy choice failed:', error );
			this.showError( 'An error occurred. Please try again.' );
		} finally {
			if ( nextBtn ) {
				nextBtn.disabled = false;
				nextBtn.textContent = 'Choose Heritage';
			}
		}
	}
}
