/**
 * Site RPG Block - Initialization
 */
import { CharacterManager } from './managers/CharacterManager.js';
import { StatRoller } from './managers/StatRoller.js';
import { GameManager } from './managers/GameManager.js';
import { RewardsManager } from './managers/RewardsManager.js';
import { trackVisitorAction } from './utils/analytics.js';
import { initStatTooltips } from './utils/tooltips.js';
import { initHighScores } from './utils/highscores.js';
import { initAvatarParticles } from './utils/particles.js';

/**
 * Initialize all Site RPG blocks on the page
 */
export function init() {
	const blocks = document.querySelectorAll( '.site-rpg-block' );
	blocks.forEach( ( block ) => {
		// Initialize stat roller for all blocks and store reference
		block.statRoller = new StatRoller( block );

		// Initialize character manager for logged-in users
		if ( window.siteRpgData?.isLoggedIn ) {
			block.characterManager = new CharacterManager( block );
		}

		// Initialize rewards manager for level-based coupons
		block.rewardsManager = new RewardsManager( block, block.characterManager );

		if ( block.dataset.showMiniGame === 'true' ) {
			new GameManager( block );
		}
	} );

	// Initialize UI enhancements
	initStatTooltips();
	initHighScores();
	initAvatarParticles();

	trackVisitorAction( 'visit' );

	let scrollTracked = false;
	window.addEventListener( 'scroll', () => {
		if ( scrollTracked ) return;
		const scrollPercent = ( window.scrollY + window.innerHeight ) / document.body.scrollHeight;
		if ( scrollPercent > 0.75 ) {
			scrollTracked = true;
			trackVisitorAction( 'scroll' );
		}
	} );

	setTimeout( () => trackVisitorAction( 'time' ), 120000 );
}
