/**
 * Stat Roller - Handles RPG-style stat rolling with localStorage persistence
 */
export class StatRoller {
	constructor( container ) {
		this.container = container;
		this.storageKey = 'site_rpg_rolled_stats';
		this.expirationDays = 7;

		this.rollBtn = container.querySelector( '[data-action="roll-stats"]' );
		this.resetBtn = container.querySelector( '[data-action="reset-stats"]' );
		this.statsIndicator = container.querySelector( '.site-rpg-card__stats-indicator' );
		this.statElements = container.querySelectorAll( '.site-rpg-card__stat' );

		this.bindEvents();
		this.loadFromStorage();
	}

	/**
	 * Roll 4d6, drop the lowest die (classic D&D method)
	 * @returns {number} Value between 3-18
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
	 * Scale 3-18 roll to 1-20 stat range
	 * @param {number} roll - Raw roll value (3-18)
	 * @returns {number} Scaled value (1-20)
	 */
	scaleToStatRange( roll ) {
		return Math.round( ( ( roll - 3 ) / 15 ) * 19 + 1 );
	}

	/**
	 * Roll all 6 stats
	 * @returns {Object} Stats object with all 6 stat values
	 */
	rollAllStats() {
		const statKeys = [ 'strength', 'wisdom', 'charisma', 'stamina', 'agility', 'intelligence' ];
		const stats = {};

		statKeys.forEach( ( key ) => {
			const rawRoll = this.roll4d6DropLowest();
			stats[ key ] = this.scaleToStatRange( rawRoll );
		} );

		return stats;
	}

	/**
	 * Save rolled stats to localStorage
	 * @param {Object} stats - Stats object to save
	 */
	saveToStorage( stats ) {
		const data = {
			stats: stats,
			rolledAt: Date.now(),
			expiresAt: Date.now() + this.expirationDays * 24 * 60 * 60 * 1000,
		};
		localStorage.setItem( this.storageKey, JSON.stringify( data ) );
	}

	/**
	 * Load rolled stats from localStorage
	 * @returns {Object|null} Stats object or null if not found/expired
	 */
	loadFromStorage() {
		const stored = localStorage.getItem( this.storageKey );
		if ( ! stored ) {
			this.showSiteStats();
			return null;
		}

		try {
			const data = JSON.parse( stored );

			if ( data.expiresAt && Date.now() > data.expiresAt ) {
				this.clearRolledStats();
				return null;
			}

			this.applyRolledStats( data.stats );
			return data.stats;
		} catch ( e ) {
			this.clearRolledStats();
			return null;
		}
	}

	/**
	 * Clear rolled stats and reset to site stats
	 */
	clearRolledStats() {
		localStorage.removeItem( this.storageKey );
		this.showSiteStats();
	}

	/**
	 * Apply rolled stats to the UI
	 * @param {Object} stats - Stats object to apply
	 */
	applyRolledStats( stats ) {
		this.statElements.forEach( ( el ) => {
			const statKey = el.dataset.stat;
			if ( stats[ statKey ] !== undefined ) {
				this.updateStatDisplay( el, stats[ statKey ] );
			}
		} );

		this.showRolledIndicator();
	}

	/**
	 * Reset UI to site-calculated stats
	 */
	showSiteStats() {
		this.statElements.forEach( ( el ) => {
			const siteValue = parseInt( el.dataset.siteValue, 10 );
			this.updateStatDisplay( el, siteValue );
		} );

		this.hideRolledIndicator();
	}

	/**
	 * Update a single stat's display
	 * @param {Element} statEl - Stat element to update
	 * @param {number} value - New stat value
	 */
	updateStatDisplay( statEl, value ) {
		statEl.dataset.value = value;

		const valueEl = statEl.querySelector( '.site-rpg-card__stat-value' );
		if ( valueEl ) {
			valueEl.innerHTML = `${ value }<span class="site-rpg-card__stat-max">/20</span>`;
		}

		const fillEl = statEl.querySelector( '.site-rpg-card__stat-fill' );
		if ( fillEl ) {
			fillEl.style.width = `${ Math.min( value * 5, 100 ) }%`;
		}
	}

	/**
	 * Show indicator that rolled stats are active
	 */
	showRolledIndicator() {
		if ( this.resetBtn ) this.resetBtn.style.display = 'inline-flex';
		if ( this.statsIndicator ) this.statsIndicator.style.display = 'block';
	}

	/**
	 * Hide rolled stats indicator
	 */
	hideRolledIndicator() {
		if ( this.resetBtn ) this.resetBtn.style.display = 'none';
		if ( this.statsIndicator ) this.statsIndicator.style.display = 'none';
	}

	/**
	 * Animate dice rolling effect
	 * @returns {Promise} Resolves when animation completes
	 */
	async animateRoll() {
		const duration = 1200;
		const interval = 60;
		const iterations = duration / interval;

		this.container.classList.add( 'site-rpg-block--rolling' );

		for ( let i = 0; i < iterations; i++ ) {
			this.statElements.forEach( ( el ) => {
				const randomValue = Math.floor( Math.random() * 20 ) + 1;
				this.updateStatDisplay( el, randomValue );
			} );

			await new Promise( ( resolve ) => setTimeout( resolve, interval ) );
		}

		this.container.classList.remove( 'site-rpg-block--rolling' );
	}

	/**
	 * Get current player stats (rolled or site stats)
	 * @returns {Object} Stats object with all 6 stat values
	 */
	getPlayerStats() {
		const stats = {};
		this.statElements.forEach( ( el ) => {
			stats[ el.dataset.stat ] = parseInt( el.dataset.value, 10 ) || 10;
		} );
		return stats;
	}

	/**
	 * Calculate D&D-style stat bonus from stat value
	 * @param {number} value - Stat value (1-20)
	 * @returns {number} Bonus (-4 to +5)
	 */
	static getStatBonus( value ) {
		return Math.floor( ( value - 10 ) / 2 );
	}

	/**
	 * Get all stat bonuses for gameplay
	 * @returns {Object} Bonuses object with str, wis, cha, sta, agi, int
	 */
	getStatBonuses() {
		const stats = this.getPlayerStats();
		return {
			str: StatRoller.getStatBonus( stats.strength ),
			wis: StatRoller.getStatBonus( stats.wisdom ),
			cha: StatRoller.getStatBonus( stats.charisma ),
			sta: StatRoller.getStatBonus( stats.stamina ),
			agi: StatRoller.getStatBonus( stats.agility ),
			int: StatRoller.getStatBonus( stats.intelligence ),
		};
	}

	/**
	 * Bind event listeners
	 */
	bindEvents() {
		if ( this.rollBtn ) {
			this.rollBtn.addEventListener( 'click', async () => {
				await this.animateRoll();
				const stats = this.rollAllStats();
				this.saveToStorage( stats );
				this.applyRolledStats( stats );
			} );
		}

		if ( this.resetBtn ) {
			this.resetBtn.addEventListener( 'click', () => {
				this.clearRolledStats();
			} );
		}
	}
}
