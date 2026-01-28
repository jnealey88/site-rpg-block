/**
 * Base Game class
 */
export class BaseGame {
	constructor( manager ) {
		this.manager = manager;
		this.canvas = manager.canvas;
		this.ctx = manager.ctx;
		this.container = manager.container;
		this.isRunning = false;
		this.isPaused = false;
		this.score = 0;
		this.difficulty = manager.difficulty;
		this.keys = new Set();

		// Bind keyboard events
		this.keyDownHandler = ( e ) => this.handleKeyDown( e );
		this.keyUpHandler = ( e ) => this.handleKeyUp( e );
		document.addEventListener( 'keydown', this.keyDownHandler );
		document.addEventListener( 'keyup', this.keyUpHandler );
	}

	start() {
		this.isRunning = true;
		this.isPaused = false;
		this.score = 0;
		this.gameLoop();
	}

	stop() {
		this.isRunning = false;
		document.removeEventListener( 'keydown', this.keyDownHandler );
		document.removeEventListener( 'keyup', this.keyUpHandler );
	}

	togglePause() {
		this.isPaused = ! this.isPaused;
		if ( ! this.isPaused ) this.gameLoop();
	}

	handleKeyDown( e ) {}
	handleKeyUp( e ) {}

	gameLoop() {
		if ( ! this.isRunning || this.isPaused ) return;
		this.update();
		this.render();
		requestAnimationFrame( () => this.gameLoop() );
	}

	update() {}
	render() {}
}
