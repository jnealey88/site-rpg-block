/**
 * Site RPG Block - Shared Constants
 */

// Re-export avatar constants for convenience.
export * from './avatar.js';

/**
 * Race definitions with stat modifiers and passive abilities.
 */
export const RACES = {
	human: {
		name: 'Human',
		icon: '👤',
		description: 'Versatile site administrators who excel through determination and adaptability.',
		statModifiers: {},
		flexiblePoints: 2,
		passive: 'adaptable',
		passiveName: 'Adaptable',
		passiveDesc: '+5% XP from all sources',
	},
	pixelkin: {
		name: 'Pixelkin',
		icon: '🧚',
		description: 'Small, fast digital sprites born from optimized code. They dart through data like lightning.',
		statModifiers: { agility: 2, intelligence: 1, stamina: -1 },
		flexiblePoints: 0,
		passive: 'cache_spirit',
		passiveName: 'Cache Spirit',
		passiveDesc: '10% chance to dodge damage in runner games',
	},
	ironforge: {
		name: 'Ironforge',
		icon: '🔩',
		description: 'Sturdy beings forged from server infrastructure. They are the backbone of any reliable system.',
		statModifiers: { stamina: 2, strength: 1, agility: -1 },
		flexiblePoints: 0,
		passive: 'firewall',
		passiveName: 'Firewall',
		passiveDesc: '+1 starting health in all games',
	},
	arcanet: {
		name: 'Arcanet',
		icon: '🔮',
		description: 'Magical entities who weave code like spells. Masters of APIs and arcane frameworks.',
		statModifiers: { intelligence: 2, wisdom: 1, strength: -1 },
		flexiblePoints: 0,
		passive: 'script_mastery',
		passiveName: 'Script Mastery',
		passiveDesc: '15% cooldown reduction on abilities',
	},
	trickster: {
		name: 'Trickster',
		icon: '🎭',
		description: 'Charismatic beings who manipulate social algorithms. They thrive on engagement.',
		statModifiers: { charisma: 2, agility: 1, wisdom: -1 },
		flexiblePoints: 0,
		passive: 'social_engineering',
		passiveName: 'Social Engineering',
		passiveDesc: '+20% XP from WordPress hooks (comments, shares)',
	},
};

/**
 * Class definitions with primary stats and abilities.
 */
export const CLASSES = {
	knight: {
		name: 'Knight',
		icon: '🛡️',
		description: 'Defenders of the realm. Knights excel at direct combat and protecting what matters.',
		primaryStats: [ 'strength', 'stamina' ],
		weapon: 'sword',
		abilities: [
			{ name: 'Shield Wall', desc: '+1 starting health in all games' },
			{ name: 'Power Strike', desc: '+15% damage in Hack & Slash' },
		],
	},
	wizard: {
		name: 'Wizard',
		icon: '🪄',
		description: 'Masters of arcane code. Wizards turn knowledge into power and experience into mastery.',
		primaryStats: [ 'intelligence', 'wisdom' ],
		weapon: 'staff',
		abilities: [
			{ name: 'Arcane Knowledge', desc: '+10% XP earned from games' },
			{ name: 'Penetrating Spell', desc: 'Ignore 1 AC in Boss Rush' },
		],
	},
	scout: {
		name: 'Scout',
		icon: '🏹',
		description: 'Swift reconnaissance experts. Scouts move fast and see opportunities others miss.',
		primaryStats: [ 'agility', 'intelligence' ],
		weapon: 'bow',
		abilities: [
			{ name: 'Quick Reflexes', desc: '+20% double-jump window in Runner' },
			{ name: 'Swift Movement', desc: '+1 movement speed in Hack & Slash' },
		],
	},
	bard: {
		name: 'Bard',
		icon: '🎸',
		description: 'Storytellers and community builders. Bards inspire others and turn engagement into legend.',
		primaryStats: [ 'charisma', 'wisdom' ],
		weapon: 'lute',
		abilities: [
			{ name: 'Inspiring Presence', desc: '+25% XP from WordPress hooks' },
			{ name: 'Party Buff', desc: '+5% XP for other players on site' },
		],
	},
	ranger: {
		name: 'Ranger',
		icon: '⚔️',
		description: 'Hunters of dangerous prey. Rangers specialize in taking down the biggest threats.',
		primaryStats: [ 'strength', 'agility' ],
		weapon: 'dual_blades',
		abilities: [
			{ name: 'Precision Strike', desc: 'Expanded crit range (18-20) in Boss Rush' },
			{ name: 'Giant Slayer', desc: '+10% damage to boss enemies' },
		],
	},
};

/**
 * Stat display info.
 */
export const STAT_INFO = {
	strength: { name: 'STR', fullName: 'Strength', icon: '💪', color: '#e74c3c' },
	wisdom: { name: 'WIS', fullName: 'Wisdom', icon: '🧠', color: '#9b59b6' },
	charisma: { name: 'CHA', fullName: 'Charisma', icon: '✨', color: '#f39c12' },
	stamina: { name: 'STA', fullName: 'Stamina', icon: '🛡️', color: '#27ae60' },
	agility: { name: 'AGI', fullName: 'Agility', icon: '⚡', color: '#3498db' },
	intelligence: { name: 'INT', fullName: 'Intelligence', icon: '📚', color: '#1abc9c' },
};

export const DIFFICULTY = {
	easy: { enemySpeedMult: 0.7, enemyHpMult: 0.8, spawnRateMult: 1.3, playerHealth: 5 },
	normal: { enemySpeedMult: 1, enemyHpMult: 1, spawnRateMult: 1, playerHealth: 3 },
	hard: { enemySpeedMult: 1.3, enemyHpMult: 1.2, spawnRateMult: 0.7, playerHealth: 2 },
};

export const BOSS_DIFFICULTY = {
	easy: { hpMult: 0.7, damageMult: 0.7, acMod: -2, abilityChance: 0.2 },
	normal: { hpMult: 1.0, damageMult: 1.0, acMod: 0, abilityChance: 0.35 },
	hard: { hpMult: 1.3, damageMult: 1.3, acMod: 2, abilityChance: 0.5 },
};

export const GAME_INFO = {
	hackslash: {
		icon: '⚔️',
		title: 'Hack & Slash',
		desc: 'Battle through waves of enemies to defend your site!',
		controls: '<strong>Desktop:</strong> Arrow keys/WASD to move, SPACE to attack<br><strong>Mobile:</strong> D-pad to move, sword button to attack',
	},
	runner: {
		icon: '🏃',
		title: 'Plugin Dash',
		desc: 'Run, jump, and collect plugins while avoiding bugs!',
		controls: '<strong>Desktop:</strong> SPACE or UP arrow to jump (double-jump available!)<br><strong>Mobile:</strong> Tap the JUMP button',
	},
	bossrush: {
		icon: '🐉',
		title: 'Boss Rush',
		desc: 'Face 5 fearsome bosses in D20 turn-based combat!',
		controls: '<strong>Click "Roll to Attack!"</strong> to roll a D20. Beat the boss AC to hit!',
	},
	adventure: {
		icon: '📖',
		title: 'Text Quest',
		desc: 'A choose your own adventure with D20 skill checks!',
		controls: '<strong>Click choices</strong> to progress the story. Some choices require dice rolls!',
	},
};
