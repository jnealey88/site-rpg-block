/**
 * Boss Rush Game - D20 Turn-Based Combat
 */
import { BaseGame } from './BaseGame.js';
import { BOSS_DIFFICULTY } from '../constants/index.js';

export class BossRushGame extends BaseGame {
	constructor( manager, bonuses = {}, effects = {} ) {
		super( manager );

		// Store stat bonuses (STR: damage, WIS: accuracy, STA: hp, AGI: ac, INT: enemy ac, CHA: xp)
		this.bonuses = {
			str: bonuses.str || 0,
			wis: bonuses.wis || 0,
			sta: bonuses.sta || 0,
			agi: bonuses.agi || 0,
			int: bonuses.int || 0,
			cha: bonuses.cha || 0,
		};

		// Store race/class effects
		this.effects = effects;

		// Difficulty settings
		this.difficultySettings = BOSS_DIFFICULTY[ this.difficulty ] || BOSS_DIFFICULTY.normal;

		// Rebalanced class definitions with special abilities
		this.classes = {
			warrior: {
				name: 'Warrior',
				attackBonus: 2,
				damage: 10, // 1d10
				hp: 22,
				ac: 15,
				emoji: '⚔️',
				special: 'cleave', // +50% crit damage
				critBonus: 1.5,
				specialName: 'Shield Bash',
				specialDesc: 'Stun boss for 1 turn',
			},
			mage: {
				name: 'Mage',
				attackBonus: 0,
				damageRolls: 2,
				damage: 6, // 2d6
				hp: 14,
				ac: 11,
				emoji: '🔮',
				special: 'spellpower', // Ignore 2 AC
				acIgnore: 2,
				specialName: 'Arcane Blast',
				specialDesc: 'Auto-hit for 3d6 damage',
			},
			rogue: {
				name: 'Rogue',
				attackBonus: 3, // Reduced from 5
				damage: 6, // 1d6
				hp: 16,
				ac: 13,
				emoji: '🗡️',
				special: 'sneak', // Crit on 19-20
				critRange: [ 19, 20 ],
				specialName: 'Backstab',
				specialDesc: 'Double damage if boss missed',
			},
		};

		// Boss definitions with abilities (scaled by difficulty)
		// INT reduces enemy AC (reduced by 50%)
		let intAcReduction = Math.floor( this.bonuses.int * 0.5 );

		// Wizard ability: Ignore 1 AC in Boss Rush
		if ( this.effects.penetratingSpell ) {
			intAcReduction += 1;
		}

		const diff = this.difficultySettings;
		this.bosses = [
			{
				name: 'Spam Golem',
				ac: Math.max( 5, 10 - intAcReduction + diff.acMod ),
				hp: Math.round( 25 * diff.hpMult ),
				damage: Math.round( 4 * diff.damageMult ),
				attackBonus: 2,
				emoji: '🗿',
				abilities: [
					{ name: 'Spam Barrage', type: 'multiAttack', attacks: 2, damageMod: 0.5 },
					{ name: 'Email Flood', type: 'debuff', stat: 'accuracy', value: -2, duration: 2 },
				],
			},
			{
				name: '404 Wraith',
				ac: Math.max( 5, 12 - intAcReduction + diff.acMod ),
				hp: Math.round( 30 * diff.hpMult ),
				damage: Math.round( 5 * diff.damageMult ),
				attackBonus: 3,
				emoji: '👻',
				abilities: [
					{ name: 'Phase Shift', type: 'phase', missChance: 50 },
					{ name: 'Ghost Touch', type: 'ignoreAC' },
				],
			},
			{
				name: 'Slow Load Snail',
				ac: Math.max( 5, 8 - intAcReduction + diff.acMod ),
				hp: Math.round( 40 * diff.hpMult ),
				damage: Math.round( 3 * diff.damageMult ),
				attackBonus: 1,
				emoji: '🐌',
				abilities: [
					{ name: 'Buffer Overflow', type: 'heal', amount: 10 },
					{ name: 'Lag Spike', type: 'stun', duration: 1 },
				],
			},
			{
				name: 'Malware Dragon',
				ac: Math.max( 5, 14 - intAcReduction + diff.acMod ),
				hp: Math.round( 45 * diff.hpMult ),
				damage: Math.round( 7 * diff.damageMult ),
				attackBonus: 4,
				emoji: '🐉',
				abilities: [
					{ name: 'Virus Injection', type: 'dot', damage: 3, duration: 3 },
					{ name: 'Ransomware', type: 'lockAction', action: 'defend', duration: 2 },
				],
			},
			{
				name: 'DDoS Titan',
				ac: Math.max( 5, 16 - intAcReduction + diff.acMod ),
				hp: Math.round( 60 * diff.hpMult ),
				damage: Math.round( 10 * diff.damageMult ),
				attackBonus: 5,
				emoji: '👹',
				abilities: [
					{ name: 'Server Overload', type: 'heavyAttack', damageMult: 1.5 },
					{ name: 'Bandwidth Drain', type: 'debuff', stat: 'damage', value: -2, duration: 2 },
				],
			},
		];

		// Get selected class from manager
		const selectedClass = this.classes[ manager.selectedClass ] || this.classes.warrior;
		this.playerClass = { ...selectedClass };

		// Apply WIS bonus to attack (reduced by 50%)
		this.playerClass.attackBonus += Math.floor( this.bonuses.wis * 0.5 );

		// Apply STA bonus to HP (reduced by 50%)
		let hpBonus = this.bonuses.sta;

		// Ironforge passive: +1 starting health
		if ( this.effects.firewall ) {
			hpBonus += 2; // +2 HP in boss rush (scaled)
		}
		// Knight ability: +1 starting health
		if ( this.effects.shieldWall ) {
			hpBonus += 2; // +2 HP in boss rush (scaled)
		}

		this.playerClass.hp = Math.max( 5, this.playerClass.hp + hpBonus );

		// Apply AGI bonus to AC and defend (reduced by 50%)
		this.playerClass.ac += Math.floor( this.bonuses.agi * 0.5 );
		this.defendBonus = 4 + Math.max( 0, Math.floor( this.bonuses.agi * 0.5 ) );

		// Player stats
		this.player = {
			hp: this.playerClass.hp,
			maxHp: this.playerClass.hp,
			ac: this.playerClass.ac,
			tempAC: 0,
			isDefending: false,
			isStunned: false,
			defendLocked: false,
			specialUsed: false,
		};

		// Status effects
		this.statusEffects = {
			player: [], // { type, value, duration, name }
			boss: [],
		};

		// Combat state
		this.currentBossIndex = 0;
		this.boss = null;
		this.turn = 'player';
		this.isRolling = false;
		this.canAct = true;
		this.combatLog = [];
		this.particles = [];
		this.floatingText = [];
		this.screenShake = 0;
		this.bossLastMissed = false;

		// Animation state
		this.playerAnim = { flash: 0, shake: 0 };
		this.bossAnim = { flash: 0, shake: 0 };

		// UI elements
		this.diceEl = this.container.querySelector( '.site-rpg-d20-dice__value' );
		this.turnIndicator = this.container.querySelector( '.site-rpg-d20-turn__text' );
		this.attackBtn = this.container.querySelector( '.site-rpg-d20-attack-btn' );
		this.defendBtn = this.container.querySelector( '.site-rpg-d20-defend-btn' );
		this.rollResult = this.container.querySelector( '.site-rpg-d20-roll-result' );
		this.rollFormula = this.container.querySelector( '.site-rpg-d20-roll__formula' );
		this.rollOutcome = this.container.querySelector( '.site-rpg-d20-roll__outcome' );
		this.combatLogEl = this.container.querySelector( '.site-rpg-d20-combat-log__entries' );
		this.statusEffectsEl = this.container.querySelector( '.site-rpg-d20-status-effects' );

		this.setupControls();
	}

	setupControls() {
		if ( this.attackBtn ) {
			this.attackBtn.addEventListener( 'click', () => {
				if ( ! this.isPaused && this.canAct && this.turn === 'player' && ! this.isRolling && ! this.player.isStunned ) {
					this.playerAttack();
				}
			} );
		}

		if ( this.defendBtn ) {
			this.defendBtn.addEventListener( 'click', () => {
				if ( ! this.isPaused && this.canAct && this.turn === 'player' && ! this.isRolling && ! this.player.isStunned && ! this.player.defendLocked ) {
					this.playerDefend();
				}
			} );
		}
	}

	start() {
		super.start();
		this.spawnBoss();
		this.addCombatLog( `A wild ${ this.boss.name } appears!` );
		this.addCombatLog( `You are a ${ this.playerClass.name }. Roll to attack!` );
		this.updateUI();
	}

	spawnBoss() {
		const bossData = this.bosses[ this.currentBossIndex ];
		this.boss = {
			...bossData,
			currentHp: bossData.hp,
			maxHp: bossData.hp,
		};
		this.turn = 'player';
		this.canAct = true;
		this.updateUI();
	}

	rollD20() {
		return Math.floor( Math.random() * 20 ) + 1;
	}

	rollDamage() {
		const rolls = this.playerClass.damageRolls || 1;
		let total = 0;
		for ( let i = 0; i < rolls; i++ ) {
			total += Math.floor( Math.random() * this.playerClass.damage ) + 1;
		}
		// Add STR bonus to damage (minimum 1 total damage, reduced by 50%)
		return Math.max( 1, total + Math.floor( this.bonuses.str * 0.5 ) );
	}

	async animateDiceRoll( finalValue ) {
		this.isRolling = true;
		const diceEl = this.diceEl;
		const duration = 500;
		const startTime = Date.now();

		return new Promise( ( resolve ) => {
			const animate = () => {
				const elapsed = Date.now() - startTime;
				if ( elapsed < duration ) {
					diceEl.textContent = Math.floor( Math.random() * 20 ) + 1;
					diceEl.parentElement.classList.add( 'site-rpg-d20-dice--rolling' );
					requestAnimationFrame( animate );
				} else {
					diceEl.textContent = finalValue;
					diceEl.parentElement.classList.remove( 'site-rpg-d20-dice--rolling' );
					this.isRolling = false;
					resolve();
				}
			};
			animate();
		} );
	}

	async playerAttack() {
		this.canAct = false;
		this.attackBtn.disabled = true;
		if ( this.defendBtn ) this.defendBtn.disabled = true;

		const roll = this.rollD20();
		await this.animateDiceRoll( roll );

		const totalAttack = roll + this.playerClass.attackBonus;

		// Ranger ability: Expanded crit range (18-20)
		const critRange = this.effects.precisionStrike ? [ 18, 19, 20 ] : [ 20 ];
		const isCrit = critRange.includes( roll );
		const isCritFail = roll === 1;
		let hit = ! isCritFail && ( isCrit || totalAttack >= this.boss.ac );

		// Check for boss phase effect (50% miss chance)
		const phaseEffect = this.statusEffects.boss.find( e => e.type === 'phase' );
		if ( hit && phaseEffect && Math.random() * 100 < phaseEffect.missChance ) {
			hit = false;
			this.addCombatLog( `Your attack passes through ${ this.boss.name }!` );
		}

		this.rollFormula.textContent = `Rolled ${ roll } + ${ this.playerClass.attackBonus } = ${ totalAttack } vs AC ${ this.boss.ac }`;

		if ( hit ) {
			let damage = this.rollDamage();

			// Ranger ability: +10% damage to boss enemies
			if ( this.effects.giantSlayer ) {
				damage = Math.ceil( damage * 1.10 );
			}

			if ( isCrit ) {
				damage *= 2;
				this.rollOutcome.textContent = 'CRITICAL HIT!';
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--crit';
				this.addCombatLog( `CRITICAL HIT! You deal ${ damage } damage!` );
			} else {
				this.rollOutcome.textContent = `HIT! ${ damage } damage`;
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--hit';
				this.addCombatLog( `Hit! You deal ${ damage } damage to ${ this.boss.name }.` );
			}

			this.boss.currentHp -= damage;
			this.screenShake = isCrit ? 15 : 8;
			this.spawnParticles( this.canvas.width - 120, this.canvas.height / 2, '#e74c3c', isCrit ? 15 : 8 );
			this.spawnFloatingText( `-${ damage }`, this.canvas.width - 120, this.canvas.height / 2 - 30, isCrit ? '#f39c12' : '#e74c3c', isCrit );
			this.score += damage * 2;

			if ( this.boss.currentHp <= 0 ) {
				this.boss.currentHp = 0;
				this.addCombatLog( `${ this.boss.name } has been defeated!` );
				// XP reward with CHA bonus (5% per point, reduced)
				const baseXp = 50 + this.currentBossIndex * 25;
				let xpMultiplier = 1 + this.bonuses.cha * 0.05;

				// Human passive: +5% XP
				if ( this.effects.adaptable ) {
					xpMultiplier += 0.05;
				}
				// Wizard ability: +10% XP from games
				if ( this.effects.arcaneKnowledge ) {
					xpMultiplier += 0.10;
				}

				this.score += Math.round( baseXp * Math.max( 0.5, xpMultiplier ) );
				this.spawnParticles( this.canvas.width - 120, this.canvas.height / 2, '#f39c12', 20 );

				this.currentBossIndex++;
				if ( this.currentBossIndex >= this.bosses.length ) {
					this.addCombatLog( 'Victory! You defeated all the bosses!' );
					setTimeout( () => this.manager.endCurrentGame(), 2000 );
					return;
				} else {
					this.addCombatLog( 'Prepare for the next boss...' );
					setTimeout( () => {
						this.spawnBoss();
						this.addCombatLog( `${ this.boss.name } appears!` );
						this.canAct = true;
						this.attackBtn.disabled = false;
						this.updateUI();
					}, 1500 );
					return;
				}
			}
		} else {
			if ( isCritFail ) {
				this.rollOutcome.textContent = 'CRITICAL MISS!';
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--miss';
				this.addCombatLog( 'Critical miss! You stumble!' );
			} else {
				this.rollOutcome.textContent = 'MISS!';
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--miss';
				this.addCombatLog( 'Miss! Your attack fails to connect.' );
			}
		}

		this.rollResult.style.display = 'block';
		this.updateUI();

		setTimeout( () => this.bossAttack(), 1500 );
	}

	playerDefend() {
		this.canAct = false;
		this.attackBtn.disabled = true;
		if ( this.defendBtn ) this.defendBtn.disabled = true;

		// Apply defend buff: +AC (4 base + AGI bonus) and halve incoming damage
		this.player.isDefending = true;
		this.player.tempAC = this.defendBonus;

		const totalAC = this.player.ac + this.player.tempAC;
		this.rollFormula.textContent = `Defending: AC ${ this.player.ac } + ${ this.player.tempAC } = ${ totalAC }`;
		this.rollOutcome.textContent = '🛡️ DEFENDING';
		this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--defend';
		this.rollResult.style.display = 'block';

		this.addCombatLog( `You raise your guard! (AC +${ this.player.tempAC }, damage halved)` );
		this.updateUI();

		// Boss attacks after short delay
		setTimeout( () => this.bossAttack(), 1000 );
	}

	async bossAttack() {
		this.turn = 'boss';
		this.updateUI();

		// Check if boss uses a special ability (40% chance)
		const useAbility = Math.random() < 0.4 && this.boss.abilities && this.boss.abilities.length > 0;

		if ( useAbility ) {
			await this.executeBossAbility();
		} else {
			await this.bossNormalAttack();
		}

		// Process DoT effects on player
		this.processStatusEffects();

		// Check if player died from effects
		if ( this.player.hp <= 0 ) {
			this.player.hp = 0;
			this.addCombatLog( 'You have been defeated!' );
			setTimeout( () => this.manager.endCurrentGame(), 1500 );
			return;
		}

		this.updateUI();

		setTimeout( () => {
			// Reset defend state
			this.player.isDefending = false;
			this.player.tempAC = 0;

			// Decrement status effect durations
			this.tickStatusEffects();

			this.turn = 'player';
			this.canAct = true;
			this.attackBtn.disabled = false;
			if ( this.defendBtn && ! this.player.defendLocked ) {
				this.defendBtn.disabled = false;
			}
			this.updateUI();
		}, 1500 );
	}

	async bossNormalAttack() {
		// Calculate effective AC (base + temp from defending)
		const effectiveAC = this.player.ac + this.player.tempAC;

		const roll = this.rollD20();
		await this.animateDiceRoll( roll );

		const totalAttack = roll + this.boss.attackBonus;
		const isCrit = roll === 20;
		const isCritFail = roll === 1;
		const hit = ! isCritFail && ( isCrit || totalAttack >= effectiveAC );

		// Track if boss missed (for Rogue backstab)
		this.bossLastMissed = ! hit;

		this.rollFormula.textContent = `${ this.boss.name } rolls ${ roll } + ${ this.boss.attackBonus } = ${ totalAttack } vs AC ${ effectiveAC }`;

		if ( hit ) {
			let damage = Math.floor( Math.random() * this.boss.damage ) + 1;
			if ( isCrit ) {
				damage *= 2;
			}

			// Halve damage if defending
			if ( this.player.isDefending ) {
				const originalDamage = damage;
				damage = Math.max( 1, Math.floor( damage / 2 ) );
				this.addCombatLog( `Your defense reduces damage from ${ originalDamage } to ${ damage }!` );
			}

			if ( isCrit ) {
				this.rollOutcome.textContent = `CRITICAL! ${ damage } damage to you!`;
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--crit';
				this.addCombatLog( `CRITICAL! ${ this.boss.name } deals ${ damage } damage!` );
			} else {
				this.rollOutcome.textContent = `HIT! ${ damage } damage to you`;
				this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--hit';
				this.addCombatLog( `${ this.boss.name } hits you for ${ damage } damage.` );
			}

			this.player.hp -= damage;
			this.screenShake = isCrit ? 15 : 8;
			this.spawnParticles( 120, this.canvas.height / 2, '#9b59b6', isCrit ? 15 : 8 );
			this.spawnFloatingText( `-${ damage }`, 120, this.canvas.height / 2 - 30, isCrit ? '#f39c12' : '#9b59b6', isCrit );
		} else {
			if ( isCritFail ) {
				this.rollOutcome.textContent = `${ this.boss.name } fumbles!`;
				this.addCombatLog( `${ this.boss.name } critically misses!` );
			} else {
				this.rollOutcome.textContent = `${ this.boss.name } misses!`;
				this.addCombatLog( `${ this.boss.name } misses you.` );
			}
			this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--miss';
		}
	}

	async executeBossAbility() {
		// Pick a random ability
		const ability = this.boss.abilities[ Math.floor( Math.random() * this.boss.abilities.length ) ];

		this.rollFormula.textContent = `${ this.boss.name } uses ${ ability.name }!`;
		this.rollOutcome.textContent = `⚡ ${ ability.name.toUpperCase() }`;
		this.rollOutcome.className = 'site-rpg-d20-roll__outcome site-rpg-d20-roll__outcome--ability';
		this.rollResult.style.display = 'block';
		this.addCombatLog( `${ this.boss.name } uses ${ ability.name }!` );

		switch ( ability.type ) {
			case 'multiAttack': {
				// Multiple weaker attacks
				const attacks = ability.attacks || 2;
				const damageMod = ability.damageMod || 0.5;
				let totalDamage = 0;
				for ( let i = 0; i < attacks; i++ ) {
					const roll = this.rollD20();
					const effectiveAC = this.player.ac + this.player.tempAC;
					if ( roll !== 1 && ( roll === 20 || roll + this.boss.attackBonus >= effectiveAC ) ) {
						let damage = Math.max( 1, Math.floor( ( Math.random() * this.boss.damage + 1 ) * damageMod ) );
						if ( this.player.isDefending ) damage = Math.max( 1, Math.floor( damage / 2 ) );
						totalDamage += damage;
					}
				}
				if ( totalDamage > 0 ) {
					this.player.hp -= totalDamage;
					this.addCombatLog( `${ attacks } hits deal ${ totalDamage } total damage!` );
					this.screenShake = 10;
					this.spawnParticles( 120, this.canvas.height / 2, '#9b59b6', 10 );
					this.spawnFloatingText( `-${ totalDamage }`, 120, this.canvas.height / 2 - 30, '#9b59b6', false );
				} else {
					this.addCombatLog( 'All attacks missed!' );
				}
				this.bossLastMissed = totalDamage === 0;
				break;
			}

			case 'debuff': {
				// Apply debuff to player
				this.statusEffects.player.push( {
					type: 'debuff',
					stat: ability.stat,
					value: ability.value,
					duration: ability.duration,
					name: ability.name,
				} );
				this.addCombatLog( `${ ability.stat } reduced by ${ Math.abs( ability.value ) } for ${ ability.duration } turns!` );
				this.bossLastMissed = false;
				break;
			}

			case 'phase': {
				// 404 Wraith's phase ability - 50% miss chance on next player attack
				this.statusEffects.boss.push( {
					type: 'phase',
					missChance: ability.missChance,
					duration: 1,
					name: ability.name,
				} );
				this.addCombatLog( `${ this.boss.name } phases out of existence!` );
				this.bossLastMissed = false;
				break;
			}

			case 'ignoreAC': {
				// Auto-hit attack
				let damage = Math.floor( Math.random() * this.boss.damage ) + 1;
				if ( this.player.isDefending ) damage = Math.max( 1, Math.floor( damage / 2 ) );
				this.player.hp -= damage;
				this.addCombatLog( `Ghost Touch ignores armor! ${ damage } damage!` );
				this.screenShake = 8;
				this.spawnParticles( 120, this.canvas.height / 2, '#9b59b6', 8 );
				this.spawnFloatingText( `-${ damage }`, 120, this.canvas.height / 2 - 30, '#9b59b6', false );
				this.bossLastMissed = false;
				break;
			}

			case 'heal': {
				// Boss heals
				const healAmount = Math.min( ability.amount, this.boss.maxHp - this.boss.currentHp );
				this.boss.currentHp += healAmount;
				this.addCombatLog( `${ this.boss.name } heals for ${ healAmount } HP!` );
				this.spawnParticles( this.canvas.width - 120, this.canvas.height / 2, '#27ae60', 10 );
				this.spawnFloatingText( `+${ healAmount }`, this.canvas.width - 120, this.canvas.height / 2 - 30, '#27ae60', false );
				this.bossLastMissed = false;
				break;
			}

			case 'stun': {
				// Stun player
				this.player.isStunned = true;
				this.statusEffects.player.push( {
					type: 'stun',
					duration: ability.duration,
					name: ability.name,
				} );
				this.addCombatLog( `You are stunned for ${ ability.duration } turn(s)!` );
				this.bossLastMissed = false;
				break;
			}

			case 'dot': {
				// Apply damage over time
				this.statusEffects.player.push( {
					type: 'dot',
					damage: ability.damage,
					duration: ability.duration,
					name: ability.name,
				} );
				this.addCombatLog( `${ ability.name } will deal ${ ability.damage } damage per turn for ${ ability.duration } turns!` );
				this.bossLastMissed = false;
				break;
			}

			case 'lockAction': {
				// Lock defend action
				if ( ability.action === 'defend' ) {
					this.player.defendLocked = true;
					if ( this.defendBtn ) this.defendBtn.disabled = true;
					this.statusEffects.player.push( {
						type: 'lockAction',
						action: ability.action,
						duration: ability.duration,
						name: ability.name,
					} );
					this.addCombatLog( `Defend is locked for ${ ability.duration } turns!` );
				}
				this.bossLastMissed = false;
				break;
			}

			case 'heavyAttack': {
				// Heavy attack with increased damage
				const roll = this.rollD20();
				const effectiveAC = this.player.ac + this.player.tempAC;
				const hit = roll !== 1 && ( roll === 20 || roll + this.boss.attackBonus >= effectiveAC );

				if ( hit ) {
					let damage = Math.floor( ( Math.random() * this.boss.damage + 1 ) * ( ability.damageMult || 1.5 ) );
					if ( this.player.isDefending ) damage = Math.max( 1, Math.floor( damage / 2 ) );
					this.player.hp -= damage;
					this.addCombatLog( `Heavy attack deals ${ damage } damage!` );
					this.screenShake = 15;
					this.spawnParticles( 120, this.canvas.height / 2, '#e74c3c', 15 );
					this.spawnFloatingText( `-${ damage }`, 120, this.canvas.height / 2 - 30, '#e74c3c', true );
					this.bossLastMissed = false;
				} else {
					this.addCombatLog( 'Heavy attack misses!' );
					this.bossLastMissed = true;
				}
				break;
			}

			default:
				// Fallback to normal attack
				await this.bossNormalAttack();
		}
	}

	processStatusEffects() {
		// Process DoT effects
		for ( const effect of this.statusEffects.player ) {
			if ( effect.type === 'dot' && effect.duration > 0 ) {
				this.player.hp -= effect.damage;
				this.addCombatLog( `${ effect.name } deals ${ effect.damage } damage!` );
				this.spawnParticles( 120, this.canvas.height / 2, '#8e44ad', 5 );
				this.spawnFloatingText( `-${ effect.damage }`, 120, this.canvas.height / 2 - 30, '#8e44ad', false );
			}
		}
	}

	tickStatusEffects() {
		// Decrement player effect durations
		for ( let i = this.statusEffects.player.length - 1; i >= 0; i-- ) {
			const effect = this.statusEffects.player[ i ];
			effect.duration--;

			if ( effect.duration <= 0 ) {
				// Effect expired
				if ( effect.type === 'stun' ) {
					this.player.isStunned = false;
					this.addCombatLog( 'You are no longer stunned!' );
				} else if ( effect.type === 'lockAction' && effect.action === 'defend' ) {
					this.player.defendLocked = false;
					if ( this.defendBtn ) this.defendBtn.disabled = false;
					this.addCombatLog( 'Defend is no longer locked!' );
				} else if ( effect.type === 'debuff' ) {
					this.addCombatLog( `${ effect.name } wears off.` );
				} else if ( effect.type === 'dot' ) {
					this.addCombatLog( `${ effect.name } fades.` );
				}
				this.statusEffects.player.splice( i, 1 );
			}
		}

		// Decrement boss effect durations
		for ( let i = this.statusEffects.boss.length - 1; i >= 0; i-- ) {
			const effect = this.statusEffects.boss[ i ];
			effect.duration--;
			if ( effect.duration <= 0 ) {
				if ( effect.type === 'phase' ) {
					this.addCombatLog( `${ this.boss.name } becomes solid again.` );
				}
				this.statusEffects.boss.splice( i, 1 );
			}
		}
	}

	addCombatLog( message, type = null ) {
		this.combatLog.push( message );
		if ( this.combatLog.length > 50 ) {
			this.combatLog.shift();
		}
		if ( this.combatLogEl ) {
			const entry = document.createElement( 'div' );

			// Auto-detect message type if not provided
			let msgType = type;
			if ( ! msgType ) {
				const lowerMsg = message.toLowerCase();
				if ( lowerMsg.includes( 'critical hit' ) || lowerMsg.includes( 'critical!' ) ) {
					msgType = 'crit';
				} else if ( lowerMsg.includes( 'hit!' ) || lowerMsg.includes( 'deal' ) && lowerMsg.includes( 'damage' ) ) {
					msgType = 'hit';
				} else if ( lowerMsg.includes( 'miss' ) || lowerMsg.includes( 'passes through' ) ) {
					msgType = 'miss';
				} else if ( lowerMsg.includes( 'uses' ) || lowerMsg.includes( 'stunned' ) || lowerMsg.includes( 'locked' ) || lowerMsg.includes( 'virus' ) || lowerMsg.includes( 'phases' ) ) {
					msgType = 'ability';
				} else if ( lowerMsg.includes( 'heals' ) || lowerMsg.includes( 'defense reduces' ) ) {
					msgType = 'heal';
				} else if ( lowerMsg.includes( 'defeated' ) || lowerMsg.includes( 'victory' ) ) {
					msgType = 'victory';
				}
			}

			entry.className = 'site-rpg-d20-combat-log__entry' + ( msgType ? ` site-rpg-d20-combat-log__entry--${ msgType }` : '' );
			entry.textContent = message;
			this.combatLogEl.appendChild( entry );
			this.combatLogEl.scrollTop = this.combatLogEl.scrollHeight;
		}
	}

	updateUI() {
		if ( this.turnIndicator ) {
			this.turnIndicator.textContent = this.turn === 'player' ? 'Your Turn' : `${ this.boss?.name || 'Boss' }'s Turn`;
			this.turnIndicator.parentElement.className = `site-rpg-d20-turn-indicator site-rpg-d20-turn-indicator--${ this.turn }`;
		}

		this.manager.updateHUD( this.currentBossIndex + 1, this.bosses.length, this.score, this.player.hp, this.player.maxHp );
		if ( this.manager.waveDisplay ) {
			this.manager.waveDisplay.textContent = this.boss ? this.boss.name : 'Boss Rush';
		}
	}

	spawnParticles( x, y, color, count = 5 ) {
		for ( let i = 0; i < count; i++ ) {
			const angle = Math.random() * Math.PI * 2;
			this.particles.push( { x, y, dx: Math.cos( angle ) * 3, dy: Math.sin( angle ) * 3, color, life: 30 } );
		}
	}

	spawnFloatingText( text, x, y, color = '#e74c3c', isCrit = false ) {
		this.floatingText.push( {
			text,
			x: x + ( Math.random() - 0.5 ) * 20,
			y,
			color,
			life: 60,
			isCrit,
			scale: isCrit ? 1.5 : 1,
		} );
	}

	update() {
		// Update particles
		for ( let i = this.particles.length - 1; i >= 0; i-- ) {
			const p = this.particles[ i ];
			p.x += p.dx;
			p.y += p.dy;
			p.life--;
			if ( p.life <= 0 ) this.particles.splice( i, 1 );
		}

		// Update floating text
		for ( let i = this.floatingText.length - 1; i >= 0; i-- ) {
			const ft = this.floatingText[ i ];
			ft.y -= 1.5; // Float upward
			ft.life--;
			if ( ft.life <= 0 ) this.floatingText.splice( i, 1 );
		}

		if ( this.screenShake > 0 ) this.screenShake--;
	}

	handleKeyDown( e ) {
		// Pause toggle (Escape or P)
		if ( e.code === 'Escape' || e.code === 'KeyP' ) {
			e.preventDefault();
			this.togglePause();
			return;
		}

		// Don't process other inputs while paused
		if ( this.isPaused ) return;

		if ( ! this.canAct || this.turn !== 'player' || this.isRolling ) {
			return;
		}

		// Space or A = Attack
		if ( e.code === 'Space' || e.code === 'KeyA' ) {
			e.preventDefault();
			if ( ! this.player.isStunned ) {
				this.playerAttack();
			}
		}

		// D = Defend
		if ( e.code === 'KeyD' ) {
			e.preventDefault();
			if ( ! this.player.isStunned && ! this.player.defendLocked ) {
				this.playerDefend();
			}
		}
	}

	handleKeyUp() {}

	render() {
		const ctx = this.ctx;
		ctx.save();

		if ( this.screenShake > 0 ) {
			ctx.translate( ( Math.random() - 0.5 ) * this.screenShake, ( Math.random() - 0.5 ) * this.screenShake );
		}

		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

		const centerY = this.canvas.height / 2;

		// Player side
		ctx.font = '48px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText( this.playerClass.emoji, 120, centerY + 15 );

		this.drawHealthBar( ctx, 70, centerY + 40, 100, 12, this.player.hp, this.player.maxHp, '#27ae60' );
		ctx.font = '12px sans-serif';
		ctx.fillStyle = '#ccd6f6';
		ctx.fillText( this.playerClass.name, 120, centerY + 70 );
		ctx.fillText( `AC: ${ this.player.ac }`, 120, centerY + 85 );

		// VS text
		ctx.font = 'bold 24px sans-serif';
		ctx.fillStyle = '#f39c12';
		ctx.fillText( 'VS', this.canvas.width / 2, centerY + 10 );

		// Boss side
		if ( this.boss && this.boss.currentHp > 0 ) {
			ctx.font = '64px sans-serif';
			ctx.fillText( this.boss.emoji, this.canvas.width - 120, centerY + 20 );

			this.drawHealthBar( ctx, this.canvas.width - 170, centerY + 50, 100, 12, this.boss.currentHp, this.boss.maxHp, '#e74c3c' );
			ctx.font = '12px sans-serif';
			ctx.fillStyle = '#ccd6f6';
			ctx.fillText( `HP: ${ this.boss.currentHp }/${ this.boss.maxHp }`, this.canvas.width - 120, centerY + 80 );
			ctx.fillText( `AC: ${ this.boss.ac }`, this.canvas.width - 120, centerY + 95 );
		}

		// Particles
		for ( const p of this.particles ) {
			ctx.fillStyle = p.color;
			ctx.globalAlpha = p.life / 30;
			ctx.beginPath();
			ctx.arc( p.x, p.y, 4, 0, Math.PI * 2 );
			ctx.fill();
		}
		ctx.globalAlpha = 1;

		// Floating damage text
		for ( const ft of this.floatingText ) {
			ctx.save();
			ctx.globalAlpha = Math.min( 1, ft.life / 30 );
			ctx.font = `bold ${ Math.floor( 16 * ft.scale ) }px sans-serif`;
			ctx.textAlign = 'center';
			ctx.fillStyle = ft.color;
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 3;
			ctx.strokeText( ft.text, ft.x, ft.y );
			ctx.fillText( ft.text, ft.x, ft.y );
			ctx.restore();
		}

		// Pause overlay
		if ( this.isPaused ) {
			ctx.fillStyle = 'rgba(0,0,0,0.7)';
			ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );
			ctx.font = 'bold 28px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#f39c12';
			ctx.fillText( 'PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10 );
			ctx.font = '14px sans-serif';
			ctx.fillStyle = '#ccd6f6';
			ctx.fillText( 'Press P or ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 20 );
		}

		ctx.restore();
	}

	drawHealthBar( ctx, x, y, width, height, current, max, color ) {
		ctx.fillStyle = '#333';
		ctx.fillRect( x, y, width, height );
		const fillWidth = ( current / max ) * width;
		ctx.fillStyle = color;
		ctx.fillRect( x, y, fillWidth, height );
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.strokeRect( x, y, width, height );
	}
}
