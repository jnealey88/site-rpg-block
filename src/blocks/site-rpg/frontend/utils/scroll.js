/**
 * Scroll utilities for smooth navigation between screens
 */

/**
 * Smoothly scroll an element into view
 * @param {Element} element - Element to scroll to
 * @param {Object} options - Scroll options
 * @param {string} options.block - Vertical alignment: 'start', 'center', 'end', 'nearest'
 * @param {number} options.delay - Delay in ms before scrolling (for DOM updates)
 */
export function scrollToElement( element, options = {} ) {
	if ( ! element ) return;

	const { block = 'start', delay = 50 } = options;

	// Small delay to allow DOM updates to complete
	setTimeout( () => {
		element.scrollIntoView( {
			behavior: 'smooth',
			block,
		} );
	}, delay );
}

/**
 * Scroll to the main block container
 * @param {Element} container - The site-rpg-block container
 */
export function scrollToBlock( container ) {
	scrollToElement( container, { block: 'start' } );
}

/**
 * Scroll to center a modal or overlay in the viewport
 * @param {Element} modal - The modal element
 */
export function scrollToModal( modal ) {
	scrollToElement( modal, { block: 'center', delay: 100 } );
}
