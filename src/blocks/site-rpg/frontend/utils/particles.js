/**
 * Add particle effects to avatar
 */
export function initAvatarParticles() {
	const containers = document.querySelectorAll( '.site-rpg-card__avatar-particles' );
	const particles = [ '✨', '⭐', '💫' ];

	containers.forEach( ( container ) => {
		for ( let i = 0; i < 5; i++ ) {
			const particle = document.createElement( 'span' );
			particle.className = 'avatar-particle';
			particle.style.setProperty( '--delay', `${ i * 0.5 }s` );
			particle.style.setProperty( '--duration', `${ 3 + Math.random() * 2 }s` );
			particle.textContent = particles[ Math.floor( Math.random() * particles.length ) ];
			container.appendChild( particle );
		}
	} );
}
