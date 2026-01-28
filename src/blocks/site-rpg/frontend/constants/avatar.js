/**
 * Default avatar configuration.
 */
export const DEFAULT_AVATAR = {
	head: 'default',
	hair: 'short',
	body: 'tunic',
	accessory: 'none',
	weapon: 'sword',
	colors: {
		skin: '#e0ac69',
		hair: '#3b3024',
		primary: '#3498db',
		secondary: '#2980b9',
	},
};

/**
 * Class to weapon mapping (default weapon by class).
 */
export const CLASS_WEAPONS = {
	knight: 'sword',
	wizard: 'staff',
	scout: 'bow',
	bard: 'staff',
	ranger: 'daggers',
};

/**
 * Class to body mapping (default body by class).
 */
export const CLASS_BODIES = {
	knight: 'armor_plate',
	wizard: 'robe',
	scout: 'armor_leather',
	bard: 'robe',
	ranger: 'armor_leather',
};
