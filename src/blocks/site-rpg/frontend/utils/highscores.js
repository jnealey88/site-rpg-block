/**
 * Initialize high scores display on game cards
 */
export function initHighScores() {
	const highscoreElements = document.querySelectorAll( '[data-game-highscore]' );

	highscoreElements.forEach( ( el ) => {
		const game = el.dataset.gameHighscore;
		const key = `site_rpg_highscore_${ game }`;
		const highscore = localStorage.getItem( key );

		if ( highscore ) {
			el.textContent = `${ highscore } XP`;
		}
	} );
}

/**
 * Save high score after game
 */
export function saveHighScore( game, score ) {
	const key = `site_rpg_highscore_${ game }`;
	const currentHigh = parseInt( localStorage.getItem( key ) || '0', 10 );

	if ( score > currentHigh ) {
		localStorage.setItem( key, score.toString() );
		// Update display
		const el = document.querySelector( `[data-game-highscore="${ game }"]` );
		if ( el ) {
			el.textContent = `${ score } XP`;
			el.classList.add( 'site-rpg-highscore--new' );
			setTimeout( () => el.classList.remove( 'site-rpg-highscore--new' ), 2000 );
		}
		return true; // New high score
	}
	return false;
}
