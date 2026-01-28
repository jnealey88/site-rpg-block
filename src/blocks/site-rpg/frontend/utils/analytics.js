/**
 * Track visitor actions for XP
 */
export function trackVisitorAction( action ) {
	if ( ! window.siteRpgData?.restUrl ) return;

	const key = `site_rpg_${ action }`;
	const lastAction = localStorage.getItem( key );
	const now = Date.now();

	if ( lastAction && now - parseInt( lastAction, 10 ) < 3600000 ) return;

	localStorage.setItem( key, now.toString() );

	const headers = {
		'Content-Type': 'application/json',
		'X-WP-Nonce': window.siteRpgData.nonce,
	};

	// Include action token for anti-abuse protection.
	if ( window.siteRpgData.actionToken ) {
		headers[ 'X-Site-RPG-Token' ] = window.siteRpgData.actionToken;
	}

	fetch( window.siteRpgData.restUrl + 'visitor/action', {
		method: 'POST',
		headers,
		body: JSON.stringify( { action } ),
	} ).catch( () => {} );
}
