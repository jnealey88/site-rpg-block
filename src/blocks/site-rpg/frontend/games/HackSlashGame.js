/**
 * Hack & Slash Game
 */
import { BaseGame } from './BaseGame.js';
import { DIFFICULTY } from '../constants/index.js';

export class HackSlashGame extends BaseGame {
	constructor( manager, bonuses = {}, effects = {} ) {
		super( manager );

		// Store stat bonuses (STR: damage, STA: health, AGI: speed, INT: cooldown, WIS: xp)
		this.bonuses = {
			str: bonuses.str || 0,
			wis: bonuses.wis || 0,
			sta: bonuses.sta || 0,
			agi: bonuses.agi || 0,
			int: bonuses.int || 0,
		};

		// Store race/class effects
		this.effects = effects;

		const diffSettings = DIFFICULTY[ this.difficulty ];

		// Calculate stat-modified values (bonuses reduced by 50%)
		let baseHealth = diffSettings.playerHealth;
		const healthBonus = Math.floor( this.bonuses.sta * 0.5 ); // -2 to +2

		// Ironforge passive: +1 starting health
		if ( this.effects.firewall ) {
			baseHealth += 1;
		}
		// Knight ability: +1 starting health
		if ( this.effects.shieldWall ) {
			baseHealth += 1;
		}

		const finalHealth = Math.max( 1, baseHealth + healthBonus );

		let baseSpeed = 4;
		const speedBonus = this.bonuses.agi * 0.2; // -0.8 to +1

		// Scout ability: +1 movement speed
		if ( this.effects.swiftMovement ) {
			baseSpeed += 1;
		}

		const finalSpeed = Math.max( 2, baseSpeed + speedBonus );

		this.player = {
			x: 60,
			y: this.canvas.height / 2,
			width: 24,
			height: 32,
			speed: finalSpeed,
			facing: 1,
			isAttacking: false,
			attackFrame: 0,
			attackCooldown: 0,
			health: finalHealth,
			maxHealth: finalHealth,
			invincible: 0,
		};

		// Attack cooldown modified by INT (reduced impact)
		let cooldownBase = 20 - this.bonuses.int;

		// Arcanet passive: 15% cooldown reduction
		if ( this.effects.scriptMastery ) {
			cooldownBase = Math.floor( cooldownBase * 0.85 );
		}

		this.attackCooldownMax = Math.max( 10, cooldownBase );

		this.enemies = [];
		this.particles = [];
		this.wave = 1;
		this.totalWaves = 5;
		this.enemiesToSpawn = [];
		this.spawnTimer = 0;
		this.waveComplete = false;
		this.waveTransitionTimer = 0;
		this.screenShake = 0;

		this.touchControls = { up: false, down: false, left: false, right: false, attack: false };
		this.setupMobileControls();
	}

	setupMobileControls() {
		const dpad = this.container.querySelector( '.site-rpg-dpad' );
		const attackBtn = this.container.querySelector( '.site-rpg-attack-btn' );

		if ( dpad ) {
			[ 'up', 'down', 'left', 'right' ].forEach( ( dir ) => {
				const btn = dpad.querySelector( `[data-dir="${ dir }"]` );
				if ( btn ) {
					btn.addEventListener( 'touchstart', ( e ) => {
						e.preventDefault();
						this.touchControls[ dir ] = true;
					} );
					btn.addEventListener( 'touchend', ( e ) => {
						e.preventDefault();
						this.touchControls[ dir ] = false;
					} );
				}
			} );
		}

		if ( attackBtn ) {
			attackBtn.addEventListener( 'touchstart', ( e ) => {
				e.preventDefault();
				if ( this.player.attackCooldown <= 0 ) this.attack();
			} );
		}
	}

	start() {
		super.start();
		this.setupWave();
		this.manager.updateHUD( this.wave, this.totalWaves, this.score, this.player.health, this.player.maxHealth );
	}

	setupWave() {
		const enemies = [ 'spamBot', 'spamBot', 'spamBot', 'phantom404', 'goblin' ];
		const count = 3 + this.wave * 2;
		this.enemiesToSpawn = [];
		for ( let i = 0; i < count; i++ ) {
			this.enemiesToSpawn.push( enemies[ Math.floor( Math.random() * Math.min( this.wave + 1, enemies.length ) ) ] );
		}
		if ( this.wave === this.totalWaves ) {
			this.enemiesToSpawn.push( 'dragon' );
		}
		this.waveComplete = false;
	}

	handleKeyDown( e ) {
		if ( ! this.isRunning ) return;
		if ( this.isPaused && ( e.code === 'Escape' || e.code === 'KeyP' ) ) { this.togglePause(); return; }

		const validKeys = [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape', 'KeyP' ];
		if ( validKeys.includes( e.code ) ) {
			e.preventDefault();
			if ( e.code === 'Escape' || e.code === 'KeyP' ) { this.togglePause(); return; }
			this.keys.add( e.code );
			if ( e.code === 'Space' && this.player.attackCooldown <= 0 ) this.attack();
		}
	}

	handleKeyUp( e ) {
		this.keys.delete( e.code );
	}

	gameLoop() {
		if ( ! this.isRunning || this.isPaused ) return;

		if ( this.waveTransitionTimer > 0 ) {
			this.waveTransitionTimer--;
			this.render();
			requestAnimationFrame( () => this.gameLoop() );
			return;
		}

		this.spawnEnemies();
		this.update();

		if ( this.enemies.length === 0 && this.enemiesToSpawn.length === 0 && ! this.waveComplete ) {
			this.completeWave();
		}

		this.render();
		requestAnimationFrame( () => this.gameLoop() );
	}

	spawnEnemies() {
		if ( this.enemiesToSpawn.length === 0 ) return;
		this.spawnTimer++;
		if ( this.spawnTimer >= 50 ) {
			this.spawnTimer = 0;
			const type = this.enemiesToSpawn.shift();
			this.spawnEnemy( type );
		}
	}

	spawnEnemy( type ) {
		const types = {
			spamBot: { hp: 1, xp: 5, speed: 1.5, size: 24, emoji: '🤖' },
			phantom404: { hp: 2, xp: 10, speed: 2, size: 28, emoji: '👻' },
			goblin: { hp: 1, xp: 8, speed: 3, size: 22, emoji: '👺' },
			dragon: { hp: 10, xp: 100, speed: 0.8, size: 48, emoji: '🐉', boss: true },
		};
		const t = types[ type ] || types.spamBot;
		this.enemies.push( {
			...t,
			x: this.canvas.width + t.size,
			y: Math.random() * ( this.canvas.height - t.size * 2 ) + t.size,
			knockback: 0,
		} );
	}

	update() {
		// Player movement
		let dx = 0, dy = 0;
		const speed = this.player.speed;
		if ( this.keys.has( 'ArrowUp' ) || this.keys.has( 'KeyW' ) || this.touchControls.up ) dy = -speed;
		if ( this.keys.has( 'ArrowDown' ) || this.keys.has( 'KeyS' ) || this.touchControls.down ) dy = speed;
		if ( this.keys.has( 'ArrowLeft' ) || this.keys.has( 'KeyA' ) || this.touchControls.left ) { dx = -speed; this.player.facing = -1; }
		if ( this.keys.has( 'ArrowRight' ) || this.keys.has( 'KeyD' ) || this.touchControls.right ) { dx = speed; this.player.facing = 1; }

		this.player.x = Math.max( 20, Math.min( this.canvas.width * 0.6, this.player.x + dx ) );
		this.player.y = Math.max( 20, Math.min( this.canvas.height - 20, this.player.y + dy ) );

		// Cooldowns
		if ( this.player.attackCooldown > 0 ) this.player.attackCooldown--;
		if ( this.player.invincible > 0 ) this.player.invincible--;
		if ( this.screenShake > 0 ) this.screenShake--;

		if ( this.player.isAttacking ) {
			this.player.attackFrame++;
			if ( this.player.attackFrame >= 15 ) {
				this.player.isAttacking = false;
				this.player.attackFrame = 0;
			}
		}

		// Update enemies
		for ( let i = this.enemies.length - 1; i >= 0; i-- ) {
			const e = this.enemies[ i ];
			if ( e.knockback > 0 ) { e.x += 5; e.knockback--; continue; }
			e.x -= e.speed;
			const targetY = this.player.y;
			e.y += Math.sign( targetY - e.y ) * 0.5;

			// Collision with player
			if ( this.player.invincible <= 0 ) {
				const dist = Math.hypot( e.x - this.player.x, e.y - this.player.y );
				if ( dist < ( e.size + this.player.width ) / 2 ) {
					this.playerHit();
				}
			}

			if ( e.x < -e.size ) this.enemies.splice( i, 1 );
		}

		// Particles
		for ( let i = this.particles.length - 1; i >= 0; i-- ) {
			const p = this.particles[ i ];
			p.x += p.dx;
			p.y += p.dy;
			p.life--;
			if ( p.life <= 0 ) this.particles.splice( i, 1 );
		}
	}

	attack() {
		this.player.isAttacking = true;
		this.player.attackFrame = 0;
		this.player.attackCooldown = this.attackCooldownMax;

		// Base damage + STR bonus (minimum 1 damage, bonus reduced by 50%)
		let damage = Math.max( 1, 1 + Math.floor( this.bonuses.str * 0.5 ) );

		// Knight ability: +15% damage
		if ( this.effects.powerStrike ) {
			damage = Math.ceil( damage * 1.15 );
		}

		const reach = 45;
		for ( let i = this.enemies.length - 1; i >= 0; i-- ) {
			const e = this.enemies[ i ];
			const attackX = this.player.x + ( this.player.facing === 1 ? 0 : -reach );
			if ( e.x > attackX && e.x < attackX + reach + this.player.width &&
				Math.abs( e.y - this.player.y ) < 35 ) {
				let finalDamage = damage;

				// Ranger ability: +10% damage to bosses
				if ( this.effects.giantSlayer && e.boss ) {
					finalDamage = Math.ceil( finalDamage * 1.10 );
				}

				e.hp -= finalDamage;
				e.knockback = 5;
				this.spawnParticles( e.x, e.y, '#e74c3c' );
				if ( e.hp <= 0 ) {
					// XP bonus from WIS (5% per point, -20% to +25%)
					let xpMultiplier = 1 + this.bonuses.wis * 0.05;

					// Human passive: +5% XP
					if ( this.effects.adaptable ) {
						xpMultiplier += 0.05;
					}
					// Wizard ability: +10% XP from games
					if ( this.effects.arcaneKnowledge ) {
						xpMultiplier += 0.10;
					}

					const xpGained = Math.round( e.xp * Math.max( 0.5, xpMultiplier ) );
					this.score += xpGained;
					this.spawnParticles( e.x, e.y, '#f39c12', 10 );
					if ( e.boss ) this.screenShake = 15;
					this.enemies.splice( i, 1 );
					this.manager.updateHUD( this.wave, this.totalWaves, this.score, this.player.health, this.player.maxHealth );
				}
			}
		}
	}

	playerHit() {
		this.player.health--;
		this.player.invincible = 60;
		this.screenShake = 10;
		this.spawnParticles( this.player.x, this.player.y, '#e74c3c' );
		this.manager.updateHUD( this.wave, this.totalWaves, this.score, this.player.health, this.player.maxHealth );
		if ( this.player.health <= 0 ) this.manager.endCurrentGame();
	}

	spawnParticles( x, y, color, count = 5 ) {
		for ( let i = 0; i < count; i++ ) {
			const angle = Math.random() * Math.PI * 2;
			this.particles.push( { x, y, dx: Math.cos( angle ) * 2, dy: Math.sin( angle ) * 2, color, life: 30 } );
		}
	}

	completeWave() {
		this.waveComplete = true;
		this.score += this.wave * 10;
		this.manager.updateHUD( this.wave, this.totalWaves, this.score, this.player.health, this.player.maxHealth );

		if ( this.wave >= this.totalWaves ) {
			setTimeout( () => this.manager.endCurrentGame(), 1500 );
		} else {
			this.wave++;
			this.waveTransitionTimer = 90;
			setTimeout( () => this.setupWave(), 1500 );
		}
	}

	render() {
		const ctx = this.ctx;
		ctx.save();
		if ( this.screenShake > 0 ) {
			ctx.translate( ( Math.random() - 0.5 ) * this.screenShake, ( Math.random() - 0.5 ) * this.screenShake );
		}

		// Background
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
		ctx.strokeStyle = '#333';
		ctx.beginPath();
		ctx.moveTo( 0, this.canvas.height - 20 );
		ctx.lineTo( this.canvas.width, this.canvas.height - 20 );
		ctx.stroke();

		// Player
		if ( this.player.invincible <= 0 || Math.floor( this.player.invincible / 4 ) % 2 === 0 ) {
			ctx.save();
			ctx.translate( this.player.x, this.player.y );
			if ( this.player.facing === -1 ) ctx.scale( -1, 1 );
			ctx.fillStyle = '#c0c0c0';
			ctx.fillRect( -6, -16, 12, 6 ); // Helmet
			ctx.fillStyle = '#a0a0a0';
			ctx.fillRect( -6, -10, 12, 12 ); // Body
			ctx.fillStyle = '#654321';
			ctx.fillRect( -6, 2, 5, 12 ); // Legs
			ctx.fillRect( 1, 2, 5, 12 );
			if ( this.player.isAttacking ) {
				const reach = Math.min( this.player.attackFrame * 3, 20 );
				ctx.fillStyle = '#e0e0e0';
				ctx.fillRect( 6, -4, 10 + reach, 4 ); // Sword
			}
			ctx.restore();
		}

		// Enemies
		for ( const e of this.enemies ) {
			ctx.font = `${ e.size }px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText( e.emoji, e.x, e.y );
			if ( e.boss ) {
				const barWidth = e.size;
				ctx.fillStyle = '#333';
				ctx.fillRect( e.x - barWidth / 2, e.y - e.size / 2 - 8, barWidth, 4 );
				ctx.fillStyle = '#e74c3c';
				ctx.fillRect( e.x - barWidth / 2, e.y - e.size / 2 - 8, barWidth * ( e.hp / 10 ), 4 );
			}
		}

		// Particles
		for ( const p of this.particles ) {
			ctx.fillStyle = p.color;
			ctx.globalAlpha = p.life / 30;
			ctx.beginPath();
			ctx.arc( p.x, p.y, 3, 0, Math.PI * 2 );
			ctx.fill();
			ctx.globalAlpha = 1;
		}

		// Wave transition
		if ( this.waveTransitionTimer > 0 ) {
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
			ctx.font = 'bold 24px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#f39c12';
			ctx.fillText( this.wave > this.totalWaves ? 'VICTORY!' : `Wave ${ this.wave } incoming...`, this.canvas.width / 2, this.canvas.height / 2 );
		}

		// Paused
		if ( this.isPaused ) {
			ctx.fillStyle = 'rgba(0,0,0,0.7)';
			ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
			ctx.font = 'bold 28px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#f39c12';
			ctx.fillText( 'PAUSED', this.canvas.width / 2, this.canvas.height / 2 );
		}

		ctx.restore();
	}
}
