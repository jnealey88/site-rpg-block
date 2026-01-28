/**
 * Endless Runner Game - Plugin Dash
 */
import { BaseGame } from './BaseGame.js';

export class RunnerGame extends BaseGame {
	constructor( manager, bonuses = {}, effects = {} ) {
		super( manager );

		// Store stat bonuses (AGI: jump, STA: shield, WIS: xp, INT: collectible rate)
		this.bonuses = {
			agi: bonuses.agi || 0,
			sta: bonuses.sta || 0,
			wis: bonuses.wis || 0,
			int: bonuses.int || 0,
		};

		// Store race/class effects
		this.effects = effects;

		// Ground higher up for better visibility
		this.groundY = this.canvas.height - 80;

		// Jump velocity modified by AGI (reduced impact)
		this.jumpVelocity = -15 - this.bonuses.agi * 0.25;
		this.doubleJumpVelocity = -12 - this.bonuses.agi * 0.2;

		// Scout ability: +20% double-jump window (more forgiving timing)
		this.doubleJumpWindow = this.effects.quickReflexes ? 1.2 : 1.0;

		this.player = {
			x: 80,
			y: this.groundY,
			width: 30,
			height: 40,
			velocityY: 0,
			isJumping: false,
			canDoubleJump: true,
			jumpTime: 0, // Track time since first jump for double-jump window
		};

		// Shield from STA: can survive 1 hit if STA bonus >= 0
		this.hasShield = this.bonuses.sta >= 0;

		// Ironforge passive: +1 hit absorbed
		if ( this.effects.firewall ) {
			this.shieldCharges = this.hasShield ? 2 : 1;
		} else {
			this.shieldCharges = this.hasShield ? 1 : 0;
		}

		// Knight ability: +1 hit absorbed
		if ( this.effects.shieldWall ) {
			this.shieldCharges += 1;
		}

		this.obstacles = [];
		this.collectibles = [];
		this.distance = 0;
		this.speed = 3; // Slower initial speed
		this.maxSpeed = 6; // Cap maximum speed
		this.obstacleTimer = 0;
		this.collectibleTimer = 0;
		this.gameOver = false;

		// Collectible spawn rate modified by INT (reduced impact)
		this.collectibleSpawnRate = Math.max( 60, 100 - this.bonuses.int * 4 );

		this.setupControls();
	}

	setupControls() {
		const jumpBtn = this.container.querySelector( '.site-rpg-jump-btn' );
		if ( jumpBtn ) {
			jumpBtn.addEventListener( 'touchstart', ( e ) => {
				e.preventDefault();
				this.jump();
			} );
		}

		this.canvas.addEventListener( 'click', () => this.jump() );
	}

	handleKeyDown( e ) {
		if ( e.code === 'Space' || e.code === 'ArrowUp' ) {
			e.preventDefault();
			this.jump();
		}
	}

	jump() {
		if ( ! this.player.isJumping ) {
			this.player.velocityY = this.jumpVelocity;
			this.player.isJumping = true;
			this.player.canDoubleJump = true;
		} else if ( this.player.canDoubleJump ) {
			this.player.velocityY = this.doubleJumpVelocity;
			this.player.canDoubleJump = false;
		}
	}

	start() {
		super.start();
		this.manager.updateHUD( 1, 1, 0, 1, 1 );
		this.manager.waveDisplay.textContent = 'Distance: 0m';
	}

	update() {
		if ( this.gameOver ) return;

		// Gravity
		this.player.velocityY += 0.8;
		this.player.y += this.player.velocityY;

		if ( this.player.y >= this.groundY ) {
			this.player.y = this.groundY;
			this.player.velocityY = 0;
			this.player.isJumping = false;
		}

		// Distance & speed
		this.distance += this.speed * 0.1;
		this.speed = Math.min( 3 + this.distance * 0.005, this.maxSpeed );
		this.score = Math.floor( this.distance );

		// Spawn obstacles (less frequent for better playability)
		this.obstacleTimer++;
		if ( this.obstacleTimer > 120 - Math.min( this.distance * 0.05, 50 ) ) {
			this.obstacleTimer = 0;
			const height = 25 + Math.random() * 25;
			this.obstacles.push( {
				x: this.canvas.width,
				y: this.groundY - height + 40,
				width: 30,
				height: height,
				emoji: [ '🐛', '🪲', '⚠️', '🔴' ][ Math.floor( Math.random() * 4 ) ],
			} );
		}

		// Spawn collectibles (rate modified by INT)
		this.collectibleTimer++;
		if ( this.collectibleTimer > this.collectibleSpawnRate ) {
			this.collectibleTimer = 0;
			// Points modified by WIS (5% per point, reduced impact)
			const basePoints = 10 + Math.floor( Math.random() * 20 );
			let xpMultiplier = 1 + this.bonuses.wis * 0.05;

			// Human passive: +5% XP
			if ( this.effects.adaptable ) {
				xpMultiplier += 0.05;
			}
			// Wizard ability: +10% XP from games
			if ( this.effects.arcaneKnowledge ) {
				xpMultiplier += 0.10;
			}

			this.collectibles.push( {
				x: this.canvas.width,
				y: this.groundY - 60 - Math.random() * 80,
				emoji: [ '🔌', '📦', '⭐', '💎' ][ Math.floor( Math.random() * 4 ) ],
				points: Math.round( basePoints * Math.max( 0.5, xpMultiplier ) ),
			} );
		}

		// Move obstacles
		for ( let i = this.obstacles.length - 1; i >= 0; i-- ) {
			this.obstacles[ i ].x -= this.speed;
			if ( this.obstacles[ i ].x < -50 ) {
				this.obstacles.splice( i, 1 );
			}
		}

		// Move collectibles
		for ( let i = this.collectibles.length - 1; i >= 0; i-- ) {
			this.collectibles[ i ].x -= this.speed;

			// Collect
			const c = this.collectibles[ i ];
			if ( Math.abs( c.x - this.player.x ) < 30 && Math.abs( c.y - ( this.player.y - 20 ) ) < 40 ) {
				this.score += c.points;
				this.collectibles.splice( i, 1 );
				continue;
			}

			if ( c.x < -30 ) {
				this.collectibles.splice( i, 1 );
			}
		}

		// Update display and sync score to manager
		this.manager.waveDisplay.textContent = `Distance: ${ Math.floor( this.distance ) }m`;
		this.manager.scoreDisplay.textContent = `XP: ${ this.score }`;
		this.manager.score = this.score;

		// Collision detection
		for ( const obs of this.obstacles ) {
			if ( this.player.x + 15 > obs.x && this.player.x - 15 < obs.x + obs.width &&
				this.player.y > obs.y - 20 ) {
				// Pixelkin passive: 10% chance to dodge
				if ( this.effects.cacheSpirit && Math.random() < 0.10 ) {
					// Dodged! Remove the obstacle
					const idx = this.obstacles.indexOf( obs );
					if ( idx > -1 ) this.obstacles.splice( idx, 1 );
					continue;
				}

				// Shield charges absorb hits
				if ( this.shieldCharges > 0 ) {
					this.shieldCharges--;
					// Remove the obstacle that hit us
					const idx = this.obstacles.indexOf( obs );
					if ( idx > -1 ) this.obstacles.splice( idx, 1 );
					return;
				}
				this.gameOver = true;
				this.manager.endCurrentGame();
				return;
			}
		}
	}

	render() {
		const ctx = this.ctx;

		// Sky gradient
		const gradient = ctx.createLinearGradient( 0, 0, 0, this.canvas.height );
		gradient.addColorStop( 0, '#1e3c72' );
		gradient.addColorStop( 1, '#2a5298' );
		ctx.fillStyle = gradient;
		ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		// Ground
		ctx.fillStyle = '#2d2d2d';
		ctx.fillRect( 0, this.groundY + 40, this.canvas.width, this.canvas.height - this.groundY );
		ctx.fillStyle = '#3d3d3d';
		ctx.fillRect( 0, this.groundY + 35, this.canvas.width, 10 );

		// Player
		ctx.font = '40px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText( '🏃', this.player.x, this.player.y );

		// Obstacles
		for ( const obs of this.obstacles ) {
			ctx.font = `${ obs.height }px sans-serif`;
			ctx.fillText( obs.emoji, obs.x + obs.width / 2, obs.y + obs.height / 2 );
		}

		// Collectibles
		for ( const c of this.collectibles ) {
			ctx.font = '28px sans-serif';
			ctx.fillText( c.emoji, c.x, c.y );
		}

		if ( this.isPaused ) {
			ctx.fillStyle = 'rgba(0,0,0,0.7)';
			ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
			ctx.font = 'bold 28px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#f39c12';
			ctx.fillText( 'PAUSED', this.canvas.width / 2, this.canvas.height / 2 );
		}
	}
}
