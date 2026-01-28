/**
 * Initialize stat tooltips with touch support
 */
export function initStatTooltips() {
	const stats = document.querySelectorAll( '.site-rpg-card__stat' );

	stats.forEach( ( stat ) => {
		let tooltipTimeout;

		// Touch devices - tap to show tooltip
		stat.addEventListener( 'touchstart', () => {
			// Hide all other tooltips
			stats.forEach( ( s ) => s.classList.remove( 'tooltip-active' ) );
			stat.classList.add( 'tooltip-active' );

			// Auto-hide after 3 seconds
			clearTimeout( tooltipTimeout );
			tooltipTimeout = setTimeout( () => {
				stat.classList.remove( 'tooltip-active' );
			}, 3000 );
		} );

		// Animate stat bars on scroll into view
		const observer = new IntersectionObserver(
			( entries ) => {
				entries.forEach( ( entry ) => {
					if ( entry.isIntersecting ) {
						const fill = stat.querySelector( '.site-rpg-card__stat-fill' );
						if ( fill ) {
							fill.style.animation = 'statFillAnimation 1s ease-out forwards';
						}
						observer.unobserve( stat );
					}
				} );
			},
			{ threshold: 0.5 }
		);

		observer.observe( stat );
	} );
}
