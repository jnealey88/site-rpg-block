/**
 * Site RPG Block - Frontend View Script
 * Entry point for modular frontend code.
 */
import { init } from './frontend/init.js';

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
