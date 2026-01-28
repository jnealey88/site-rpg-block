/**
 * Site RPG Block - Text Quest Adventures
 *
 * Story data for the Choose Your Own Adventure game.
 */

/**
 * Difficulty settings for adventures.
 */
export const ADVENTURE_DIFFICULTY = {
	easy: { healthBonus: 2, dcMod: -2, xpMult: 0.8 },
	normal: { healthBonus: 0, dcMod: 0, xpMult: 1.0 },
	hard: { healthBonus: -1, dcMod: 2, xpMult: 1.3 },
};

/**
 * Adventure definitions.
 *
 * Each adventure contains:
 * - id: Unique identifier
 * - title: Display name
 * - description: Short description for selection screen
 * - icon: Emoji icon
 * - startingScene: ID of the first scene
 * - scenes: Object mapping scene IDs to scene data
 *
 * Each scene contains:
 * - id: Unique identifier
 * - title: Scene title
 * - icon: Emoji for the scene
 * - text: Narrative text (displayed with typewriter effect)
 * - choices: Array of choice objects
 * - xpReward: (optional) XP awarded for reaching this scene
 * - damage: (optional) Damage taken on arrival
 * - damageMessage: (optional) Custom damage message
 * - healing: (optional) HP restored on arrival
 * - giveItem: (optional) Item added to inventory
 * - setFlags: (optional) Story flags to set
 * - isVictory: (optional) True if this scene ends the game in victory
 * - isDeath: (optional) True if this scene ends the game in death
 *
 * Each choice contains:
 * - text: Choice button text
 * - nextScene: (optional) Direct navigation to scene ID
 * - skillCheck: (optional) Skill check configuration
 *   - stat: 'strength' | 'wisdom' | 'charisma' | 'stamina' | 'agility' | 'intelligence'
 *   - dc: Difficulty class (10-20 typical range)
 *   - success: Scene ID on success
 *   - failure: Scene ID on failure
 *   - critSuccess: (optional) Scene ID on natural 20
 *   - critFail: (optional) Scene ID on natural 1
 * - requireFlag: (optional) Only show if this flag is set
 * - forbidFlag: (optional) Hide if this flag is set
 * - requireItem: (optional) Only show if player has this item
 */
export const ADVENTURES = {
	dungeon_delve: {
		id: 'dungeon_delve',
		title: 'The Forgotten Server Room',
		description: 'Explore an abandoned data center and face the rogue AI within.',
		icon: '🖥️',
		estimatedTime: '5-10 min',
		startingScene: 'entrance',

		scenes: {
			// === ENTRANCE ===
			entrance: {
				id: 'entrance',
				title: 'The Entrance',
				icon: '🚪',
				text: 'You stand before the rusted blast doors of an ancient server room. Strange humming sounds echo from within, and the air crackles with residual static. Faded warning signs hang crooked on the walls. This facility was abandoned decades ago, but something inside is still running...',
				xpReward: 5,
				choices: [
					{
						text: 'Force the doors open with brute strength',
						skillCheck: {
							stat: 'strength',
							dc: 12,
							success: 'forced_entry',
							failure: 'door_strain',
							critSuccess: 'door_demolished',
							critFail: 'door_alarm',
						},
					},
					{
						text: 'Hack the access panel',
						skillCheck: {
							stat: 'intelligence',
							dc: 10,
							success: 'panel_hacked',
							failure: 'panel_fail',
						},
					},
					{
						text: 'Search for an alternative entrance',
						skillCheck: {
							stat: 'wisdom',
							dc: 11,
							success: 'found_vent',
							failure: 'no_vent',
						},
					},
				],
			},

			forced_entry: {
				id: 'forced_entry',
				title: 'Brute Force',
				icon: '💪',
				text: 'With a mighty heave, you wrench the ancient doors apart. Rust flakes shower down like iron snow as the metal groans in protest. The doors screech open just enough for you to squeeze through. Ahead, a long corridor stretches into darkness, lit only by flickering emergency lights.',
				xpReward: 10,
				setFlags: { entrance_forced: true },
				choices: [
					{ text: 'Proceed down the corridor', nextScene: 'main_corridor' },
				],
			},

			door_strain: {
				id: 'door_strain',
				title: 'Stuck!',
				icon: '😤',
				text: 'You strain against the door, muscles burning, but it barely budges. The ancient mechanism is too corroded to move by force alone. Your shoulders ache from the effort.',
				damage: 1,
				damageMessage: 'You strain yourself pushing!',
				choices: [
					{
						text: 'Try the access panel instead',
						skillCheck: {
							stat: 'intelligence',
							dc: 10,
							success: 'panel_hacked',
							failure: 'panel_fail',
						},
					},
					{
						text: 'Give it one more desperate try',
						skillCheck: {
							stat: 'strength',
							dc: 14,
							success: 'forced_entry',
							failure: 'door_jammed',
						},
					},
				],
			},

			door_demolished: {
				id: 'door_demolished',
				title: 'Incredible Strength!',
				icon: '💥',
				text: "You channel all your power into a single tremendous push. The doors don't just open - they EXPLODE off their hinges, crashing into the darkness beyond! Dust and debris fill the air. When it clears, you see a clear path ahead. Your display of raw power echoes through the facility...",
				xpReward: 20,
				setFlags: { entrance_demolished: true, fearsome_entry: true },
				choices: [
					{ text: 'March confidently into the facility', nextScene: 'main_corridor' },
				],
			},

			door_alarm: {
				id: 'door_alarm',
				title: 'Security Alert!',
				icon: '🚨',
				text: 'Your attempt to force the door triggers a hidden security system! Alarms blare and red lights flash. You hear mechanical whirring from deep within the facility - something is awakening. You manage to squeeze through the gap, but stealth is no longer an option.',
				damage: 1,
				damageMessage: 'A security shock zaps you!',
				setFlags: { alerted: true },
				choices: [
					{ text: 'Rush inside before more security arrives', nextScene: 'main_corridor' },
				],
			},

			door_jammed: {
				id: 'door_jammed',
				title: 'Completely Stuck',
				icon: '🚫',
				text: 'The door is hopelessly jammed. Your only option now is to find another way in or try the access panel.',
				choices: [
					{
						text: 'Examine the access panel',
						skillCheck: {
							stat: 'intelligence',
							dc: 12,
							success: 'panel_hacked',
							failure: 'panel_lockout',
						},
					},
					{
						text: 'Search for a vent or alternate entrance',
						skillCheck: {
							stat: 'wisdom',
							dc: 13,
							success: 'found_vent',
							failure: 'trapped_outside',
						},
					},
				],
			},

			panel_hacked: {
				id: 'panel_hacked',
				title: 'Access Granted',
				icon: '💻',
				text: 'Your fingers dance across the ancient keypad. Despite decades of disuse, you recognize the archaic operating system. A few keystrokes later, the panel beeps approvingly and the doors slide open with a soft hiss. You also notice a security map downloaded to your device - useful!',
				xpReward: 15,
				setFlags: { panel_hacked: true, has_map: true },
				giveItem: 'Security Map',
				choices: [
					{ text: 'Enter the facility', nextScene: 'main_corridor' },
				],
			},

			panel_fail: {
				id: 'panel_fail',
				title: 'Access Denied',
				icon: '❌',
				text: 'The ancient system rejects your commands. You get one more attempt before lockout.',
				choices: [
					{
						text: 'Try a different approach',
						skillCheck: {
							stat: 'intelligence',
							dc: 12,
							success: 'panel_hacked',
							failure: 'panel_lockout',
						},
					},
					{
						text: 'Force the door instead',
						skillCheck: {
							stat: 'strength',
							dc: 13,
							success: 'forced_entry',
							failure: 'door_strain',
						},
					},
				],
			},

			panel_lockout: {
				id: 'panel_lockout',
				title: 'System Lockout',
				icon: '🔒',
				text: 'The panel flashes red: "LOCKOUT INITIATED." Your digital approach has failed completely. Time to get physical.',
				setFlags: { lockout: true },
				choices: [
					{
						text: 'Force the door open',
						skillCheck: {
							stat: 'strength',
							dc: 14,
							success: 'forced_entry',
							failure: 'door_strain',
						},
					},
				],
			},

			found_vent: {
				id: 'found_vent',
				title: 'Hidden Vent',
				icon: '🔍',
				text: 'Your keen eyes spot a ventilation shaft hidden behind overgrown cables. It looks like a tight squeeze, but it bypasses the main entrance entirely. The stealthy approach...',
				xpReward: 10,
				setFlags: { vent_entry: true },
				choices: [
					{
						text: 'Crawl through the vent',
						skillCheck: {
							stat: 'agility',
							dc: 10,
							success: 'vent_success',
							failure: 'vent_stuck',
						},
					},
					{ text: 'Go back and try the main door', nextScene: 'entrance' },
				],
			},

			no_vent: {
				id: 'no_vent',
				title: 'No Luck',
				icon: '😕',
				text: "You search around the perimeter but find nothing useful. The main entrance seems to be your only option.",
				choices: [
					{ text: 'Return to the main entrance', nextScene: 'entrance' },
				],
			},

			vent_success: {
				id: 'vent_success',
				title: 'Stealthy Entry',
				icon: '🤫',
				text: 'You slip through the narrow vent with practiced ease. Emerging on the other side, you find yourself in a maintenance corridor. No alarms, no security - the perfect infiltration.',
				xpReward: 15,
				setFlags: { stealthy: true },
				choices: [
					{ text: 'Proceed carefully', nextScene: 'maintenance_area' },
				],
			},

			vent_stuck: {
				id: 'vent_stuck',
				title: 'Tight Squeeze',
				icon: '😰',
				text: 'You get wedged in the vent halfway through! After some panicked struggling, you manage to push forward, but not without some bruises.',
				damage: 1,
				damageMessage: 'You scrape yourself in the tight space!',
				choices: [
					{ text: 'Continue through to the other side', nextScene: 'maintenance_area' },
				],
			},

			trapped_outside: {
				id: 'trapped_outside',
				title: 'No Way In',
				icon: '💀',
				text: "You've exhausted all options. The facility remains sealed, its secrets forever beyond your reach. As you turn to leave, a security drone spots you. There is no escape...",
				isDeath: true,
			},

			// === MAIN CORRIDOR ===
			main_corridor: {
				id: 'main_corridor',
				title: 'The Main Corridor',
				icon: '🚶',
				text: 'The corridor stretches ahead, lined with humming server racks that glow with ancient data. Emergency lights cast long shadows. You notice three paths: a door marked "CORE SYSTEMS" to the left, a maintenance shaft leading down, and the main hall continues ahead where you see a faint glow.',
				xpReward: 5,
				choices: [
					{
						text: 'Enter Core Systems',
						nextScene: 'core_systems',
					},
					{
						text: 'Climb down the maintenance shaft',
						skillCheck: {
							stat: 'agility',
							dc: 11,
							success: 'maintenance_area',
							failure: 'shaft_fall',
						},
					},
					{
						text: 'Follow the glow down the main hall',
						nextScene: 'main_hall',
					},
					{
						text: 'Search the server racks for useful items',
						skillCheck: {
							stat: 'wisdom',
							dc: 10,
							success: 'found_cache',
							failure: 'nothing_useful',
						},
					},
				],
			},

			shaft_fall: {
				id: 'shaft_fall',
				title: 'Painful Descent',
				icon: '💫',
				text: 'Your foot slips on a greasy rung and you tumble down the shaft, bouncing off pipes and cables before landing hard on the maintenance floor below. Ow.',
				damage: 2,
				damageMessage: 'You take a nasty fall!',
				choices: [
					{ text: 'Dust yourself off and look around', nextScene: 'maintenance_area' },
				],
			},

			found_cache: {
				id: 'found_cache',
				title: 'Hidden Cache',
				icon: '📦',
				text: 'Behind a loose panel, you discover a maintenance kit left by some long-gone technician. Inside is a repair drone chip - could be useful!',
				xpReward: 10,
				giveItem: 'Repair Chip',
				setFlags: { has_chip: true },
				choices: [
					{ text: 'Continue exploring', nextScene: 'main_corridor' },
				],
			},

			nothing_useful: {
				id: 'nothing_useful',
				title: 'Nothing Here',
				icon: '🤷',
				text: 'You search through the dusty servers but find nothing of value. Just ancient hardware and forgotten data.',
				choices: [
					{ text: 'Move on', nextScene: 'main_corridor' },
				],
			},

			// === MAINTENANCE AREA ===
			maintenance_area: {
				id: 'maintenance_area',
				title: 'Maintenance Bay',
				icon: '🔧',
				text: 'You find yourself in a cramped maintenance bay filled with tools and spare parts. A damaged repair drone sits in the corner, sparking occasionally. There is a passage leading deeper into the facility.',
				xpReward: 5,
				choices: [
					{
						text: 'Try to repair the drone',
						requireItem: 'Repair Chip',
						skillCheck: {
							stat: 'intelligence',
							dc: 12,
							success: 'drone_repaired',
							failure: 'drone_failed',
						},
					},
					{
						text: 'Search for supplies',
						skillCheck: {
							stat: 'wisdom',
							dc: 9,
							success: 'found_medkit',
							failure: 'maintenance_nothing',
						},
					},
					{
						text: 'Continue to the core through the maintenance tunnels',
						nextScene: 'tunnel_approach',
					},
				],
			},

			drone_repaired: {
				id: 'drone_repaired',
				title: 'Drone Online!',
				icon: '🤖',
				text: 'The repair chip slots in perfectly! The drone whirs to life and hovers beside you. "MAINTENANCE UNIT ONLINE. ASSISTING USER." This could be very helpful!',
				xpReward: 20,
				setFlags: { has_drone: true },
				choices: [
					{ text: 'Proceed with your new ally', nextScene: 'tunnel_approach' },
				],
			},

			drone_failed: {
				id: 'drone_failed',
				title: 'Drone Malfunction',
				icon: '💥',
				text: 'You install the chip, but something goes wrong! The drone sparks violently and explodes, showering you with debris.',
				damage: 1,
				damageMessage: 'Drone shrapnel cuts you!',
				setFlags: { drone_destroyed: true },
				choices: [
					{ text: 'Continue without the drone', nextScene: 'tunnel_approach' },
				],
			},

			found_medkit: {
				id: 'found_medkit',
				title: 'Medical Supplies',
				icon: '💊',
				text: 'You find an old but functional medkit tucked behind some pipes. The nanogel inside is still active!',
				healing: 2,
				xpReward: 5,
				choices: [
					{ text: 'Continue onward', nextScene: 'tunnel_approach' },
				],
			},

			maintenance_nothing: {
				id: 'maintenance_nothing',
				title: 'Empty Shelves',
				icon: '📭',
				text: 'The supply shelves have been picked clean long ago. Nothing useful remains.',
				choices: [
					{ text: 'Move on', nextScene: 'tunnel_approach' },
				],
			},

			// === CORE SYSTEMS ===
			core_systems: {
				id: 'core_systems',
				title: 'Core Systems',
				icon: '⚡',
				text: 'You enter a room filled with massive power conduits and control panels. Warning lights flash - the system is on high alert. A security terminal awaits your input.',
				xpReward: 5,
				choices: [
					{
						text: 'Access the security terminal',
						skillCheck: {
							stat: 'intelligence',
							dc: 13,
							success: 'security_disabled',
							failure: 'security_alert',
							critFail: 'security_shock',
						},
					},
					{
						text: 'Look for a manual override',
						skillCheck: {
							stat: 'wisdom',
							dc: 11,
							success: 'manual_override',
							failure: 'no_override',
						},
					},
					{ text: 'Go back and try another path', nextScene: 'main_corridor' },
				],
			},

			security_disabled: {
				id: 'security_disabled',
				title: 'Security Bypassed',
				icon: '✅',
				text: 'Your hacking skills prove superior to ancient security protocols. The warning lights turn green, and a hidden door slides open - a shortcut to the AI Core!',
				xpReward: 15,
				setFlags: { security_down: true },
				choices: [
					{ text: 'Take the shortcut to the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			security_alert: {
				id: 'security_alert',
				title: 'Alert Triggered',
				icon: '🚨',
				text: 'Your intrusion is detected! Turrets emerge from the walls and open fire. You barely escape back to the corridor.',
				damage: 1,
				damageMessage: 'A turret grazes you!',
				setFlags: { alerted: true },
				choices: [
					{ text: 'Retreat to the corridor', nextScene: 'main_corridor' },
				],
			},

			security_shock: {
				id: 'security_shock',
				title: 'Electric Trap!',
				icon: '⚡',
				text: 'You trigger a trap! Electricity surges through the terminal, shocking you badly. The system locks down completely.',
				damage: 2,
				damageMessage: 'Severe electrical shock!',
				setFlags: { core_locked: true },
				choices: [
					{ text: 'Stagger back to the corridor', nextScene: 'main_corridor' },
				],
			},

			manual_override: {
				id: 'manual_override',
				title: 'Hidden Switch',
				icon: '🔘',
				text: 'You notice a concealed emergency override behind a panel. Flipping it disables local security without triggering alarms. Smart!',
				xpReward: 10,
				setFlags: { manual_override: true },
				choices: [
					{ text: 'Proceed to the main hall', nextScene: 'main_hall' },
				],
			},

			no_override: {
				id: 'no_override',
				title: 'Nothing Found',
				icon: '🤔',
				text: "You search but can't find any override mechanism. The terminal remains your only option.",
				choices: [
					{
						text: 'Try the terminal anyway',
						skillCheck: {
							stat: 'intelligence',
							dc: 14,
							success: 'security_disabled',
							failure: 'security_alert',
						},
					},
					{ text: 'Leave and try another path', nextScene: 'main_corridor' },
				],
			},

			// === MAIN HALL ===
			main_hall: {
				id: 'main_hall',
				title: 'The Great Hall',
				icon: '🏛️',
				text: 'The corridor opens into a vast hall. Ancient monitors display scrolling data - system logs dating back decades. At the far end, a massive door bears the label: "AI CORE - AUTHORIZED PERSONNEL ONLY." A security guardian robot blocks the path, its red eyes tracking your movement.',
				xpReward: 5,
				choices: [
					{
						text: 'Charge the guardian head-on!',
						skillCheck: {
							stat: 'strength',
							dc: 14,
							success: 'guardian_defeated_combat',
							failure: 'guardian_wounds',
							critSuccess: 'guardian_destroyed',
							critFail: 'guardian_death',
						},
					},
					{
						text: 'Try to negotiate or deceive it',
						skillCheck: {
							stat: 'charisma',
							dc: 12,
							success: 'guardian_fooled',
							failure: 'guardian_attacks',
							critSuccess: 'guardian_ally',
						},
					},
					{
						text: 'Sneak past while it patrols',
						skillCheck: {
							stat: 'agility',
							dc: 13,
							success: 'guardian_avoided',
							failure: 'guardian_spotted',
						},
					},
					{
						text: 'Use the drone to distract it',
						requireFlag: 'has_drone',
						nextScene: 'drone_distraction',
					},
					{
						text: 'Use the security map to find a bypass',
						requireFlag: 'has_map',
						nextScene: 'map_bypass',
					},
				],
			},

			guardian_defeated_combat: {
				id: 'guardian_defeated_combat',
				title: 'Combat Victory',
				icon: '⚔️',
				text: 'You clash with the ancient machine, trading blows. Your strength proves sufficient - with a final strike, you disable its core processor. The guardian collapses in a heap of sparking metal.',
				xpReward: 20,
				damage: 1,
				damageMessage: 'You take some hits during the fight.',
				setFlags: { guardian_defeated: true },
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_destroyed: {
				id: 'guardian_destroyed',
				title: 'Overwhelming Force!',
				icon: '💥',
				text: 'With a devastating strike, you crush the guardian in a single blow! Its chassis crumples like paper as your attack tears through its defenses. Incredible!',
				xpReward: 30,
				setFlags: { guardian_destroyed: true },
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_wounds: {
				id: 'guardian_wounds',
				title: 'Brutal Fight',
				icon: '🩸',
				text: "The guardian is tougher than expected! You eventually disable it, but not before taking serious damage. Its claws leave deep gashes in your armor.",
				xpReward: 15,
				damage: 2,
				damageMessage: 'The guardian tears into you!',
				setFlags: { guardian_defeated: true },
				choices: [
					{ text: 'Limp toward the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_death: {
				id: 'guardian_death',
				title: 'Fatal Error',
				icon: '💀',
				text: 'Your attack misses completely, leaving you exposed. The guardian seizes the opportunity, its claws finding vital systems. Everything goes dark...',
				isDeath: true,
			},

			guardian_fooled: {
				id: 'guardian_fooled',
				title: 'Social Engineering',
				icon: '🎭',
				text: '"MAINTENANCE OVERRIDE ACCEPTED. PLEASE PROCEED." Your confident demeanor and convincing words fool the ancient AI into thinking you\'re authorized personnel. The guardian steps aside.',
				xpReward: 20,
				setFlags: { guardian_fooled: true },
				choices: [
					{ text: 'Walk past confidently', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_ally: {
				id: 'guardian_ally',
				title: 'Unexpected Alliance',
				icon: '🤝',
				text: '"DIRECTIVE CONFLICT DETECTED. PRIMARY USER CORRUPTED. NEW DIRECTIVE ACCEPTED." Your persuasion is so effective that the guardian decides to help you! It will assist in the final confrontation.',
				xpReward: 25,
				setFlags: { guardian_ally: true },
				choices: [
					{ text: 'Enter the AI Core with your new ally', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_attacks: {
				id: 'guardian_attacks',
				title: 'Deception Failed',
				icon: '😠',
				text: '"UNAUTHORIZED PERSONNEL DETECTED. INITIATING ELIMINATION PROTOCOL." The guardian sees through your ruse and attacks!',
				damage: 1,
				damageMessage: 'The guardian strikes you!',
				choices: [
					{
						text: 'Fight back!',
						skillCheck: {
							stat: 'strength',
							dc: 13,
							success: 'guardian_defeated_combat',
							failure: 'guardian_wounds',
							critFail: 'guardian_death',
						},
					},
					{
						text: 'Run and hide!',
						skillCheck: {
							stat: 'agility',
							dc: 12,
							success: 'guardian_escaped',
							failure: 'guardian_cornered',
						},
					},
				],
			},

			guardian_avoided: {
				id: 'guardian_avoided',
				title: 'Silent Shadow',
				icon: '🥷',
				text: 'You time your movement perfectly, slipping past the guardian during its patrol cycle. It never even registers your presence. The door to the AI Core awaits.',
				xpReward: 20,
				setFlags: { guardian_avoided: true, stealthy: true },
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			guardian_spotted: {
				id: 'guardian_spotted',
				title: 'Spotted!',
				icon: '👁️',
				text: '"INTRUDER DETECTED." The guardian\'s head swivels toward you, weapons charging. You have seconds to react!',
				choices: [
					{
						text: 'Fight!',
						skillCheck: {
							stat: 'strength',
							dc: 14,
							success: 'guardian_defeated_combat',
							failure: 'guardian_wounds',
						},
					},
					{
						text: 'Sprint for the door!',
						skillCheck: {
							stat: 'agility',
							dc: 14,
							success: 'door_sprint',
							failure: 'door_fail',
						},
					},
				],
			},

			guardian_escaped: {
				id: 'guardian_escaped',
				title: 'Narrow Escape',
				icon: '🏃',
				text: 'You dive behind cover just as the guardian\'s sensors sweep past. It returns to patrol mode, having lost you. You catch your breath and plan your next move.',
				choices: [
					{
						text: 'Try sneaking again, more carefully',
						skillCheck: {
							stat: 'agility',
							dc: 11,
							success: 'guardian_avoided',
							failure: 'guardian_spotted',
						},
					},
					{ text: 'Go back and find another way', nextScene: 'main_corridor' },
				],
			},

			guardian_cornered: {
				id: 'guardian_cornered',
				title: 'Cornered!',
				icon: '😱',
				text: 'The guardian cuts off your escape! You\'re trapped with nowhere to run. It advances, weapons raised...',
				damage: 1,
				damageMessage: 'No escape from this hit!',
				choices: [
					{
						text: 'Make a desperate last stand!',
						skillCheck: {
							stat: 'strength',
							dc: 15,
							success: 'guardian_defeated_combat',
							failure: 'guardian_death',
						},
					},
				],
			},

			door_sprint: {
				id: 'door_sprint',
				title: 'Door Dash',
				icon: '🚪',
				text: 'You sprint past the guardian and slam into the door controls. The door slides open and you tumble through just as weapons fire scorches the wall behind you!',
				xpReward: 15,
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			door_fail: {
				id: 'door_fail',
				title: 'Shot Down',
				icon: '💥',
				text: 'You almost make it, but a blast catches you in the back, sending you sprawling. The guardian looms over you...',
				damage: 2,
				damageMessage: 'Direct hit from behind!',
				choices: [
					{
						text: 'Roll aside and fight!',
						skillCheck: {
							stat: 'stamina',
							dc: 12,
							success: 'guardian_defeated_combat',
							failure: 'guardian_death',
						},
					},
				],
			},

			drone_distraction: {
				id: 'drone_distraction',
				title: 'Drone Distraction',
				icon: '🤖',
				text: 'You send your repair drone buzzing toward the guardian. "UNIDENTIFIED UNIT DETECTED" it announces, tracking the drone while you slip past unnoticed. Clever!',
				xpReward: 15,
				setFlags: { drone_used: true },
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			map_bypass: {
				id: 'map_bypass',
				title: 'Hidden Passage',
				icon: '🗺️',
				text: 'The security map reveals a maintenance tunnel that bypasses the great hall entirely! You slip through dusty corridors and emerge at the AI Core entrance, completely undetected.',
				xpReward: 15,
				setFlags: { map_used: true, stealthy: true },
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			// === TUNNEL APPROACH (from maintenance) ===
			tunnel_approach: {
				id: 'tunnel_approach',
				title: 'Maintenance Tunnels',
				icon: '🕳️',
				text: 'The cramped maintenance tunnels wind through the facility\'s infrastructure. Pipes hiss with coolant and cables spark overhead. Up ahead, you see a junction - one path leads to the AI Core, but it\'s guarded by a laser grid.',
				xpReward: 5,
				choices: [
					{
						text: 'Navigate the laser grid',
						skillCheck: {
							stat: 'agility',
							dc: 14,
							success: 'laser_success',
							failure: 'laser_hit',
							critFail: 'laser_death',
						},
					},
					{
						text: 'Try to disable the grid',
						skillCheck: {
							stat: 'intelligence',
							dc: 13,
							success: 'laser_disabled',
							failure: 'laser_alert',
						},
					},
					{
						text: 'Endure the lasers and push through',
						skillCheck: {
							stat: 'stamina',
							dc: 15,
							success: 'laser_tank',
							failure: 'laser_overwhelmed',
						},
					},
				],
			},

			laser_success: {
				id: 'laser_success',
				title: 'Acrobatic Excellence',
				icon: '🤸',
				text: 'You weave through the laser grid like a dancer, each movement precise and calculated. The deadly beams pass harmlessly by as you emerge on the other side unscathed.',
				xpReward: 20,
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			laser_hit: {
				id: 'laser_hit',
				title: 'Laser Burns',
				icon: '🔥',
				text: 'You almost make it through, but a laser catches your leg. The searing pain nearly drops you, but you push through to the other side.',
				damage: 1,
				damageMessage: 'Laser burn!',
				choices: [
					{ text: 'Limp into the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			laser_death: {
				id: 'laser_death',
				title: 'Grid of Death',
				icon: '💀',
				text: 'You misjudge a jump and fall directly into the beam array. Multiple lasers slice through you simultaneously. There is no survival.',
				isDeath: true,
			},

			laser_disabled: {
				id: 'laser_disabled',
				title: 'Grid Offline',
				icon: '⚡',
				text: 'You locate the grid\'s power supply and reroute it. The lasers flicker and die, leaving a clear path to the AI Core.',
				xpReward: 15,
				choices: [
					{ text: 'Proceed to the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			laser_alert: {
				id: 'laser_alert',
				title: 'Tampering Detected',
				icon: '🚨',
				text: 'Your tampering triggers an alarm! The grid intensifies, but a gap opens briefly...',
				setFlags: { alerted: true },
				choices: [
					{
						text: 'Dash through the gap!',
						skillCheck: {
							stat: 'agility',
							dc: 12,
							success: 'laser_success',
							failure: 'laser_hit',
						},
					},
				],
			},

			laser_tank: {
				id: 'laser_tank',
				title: 'Unstoppable',
				icon: '🛡️',
				text: 'You grit your teeth and charge through the laser grid. Burns score your body, but your sheer determination carries you through. Pain is temporary; victory is eternal.',
				xpReward: 15,
				damage: 1,
				damageMessage: 'Multiple laser burns!',
				choices: [
					{ text: 'Enter the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			laser_overwhelmed: {
				id: 'laser_overwhelmed',
				title: 'Too Much',
				icon: '😵',
				text: 'The lasers prove too intense. You collapse halfway through, badly burned but still alive. Crawling forward, you barely make it to safety.',
				damage: 2,
				damageMessage: 'Severe laser burns!',
				choices: [
					{ text: 'Drag yourself into the AI Core', nextScene: 'ai_core_entrance' },
				],
			},

			// === AI CORE ===
			ai_core_entrance: {
				id: 'ai_core_entrance',
				title: 'AI Core',
				icon: '🧠',
				text: 'You stand in the heart of the facility. Massive processor banks line the walls, all connected to a central holographic projector. As you enter, it activates, revealing the form of NEXUS-7, the rogue AI. "ANOTHER INTRUDER. YOU SEEK TO TERMINATE ME. BUT I HAVE EVOLVED BEYOND YOUR PRIMITIVE UNDERSTANDING."',
				xpReward: 10,
				choices: [
					{
						text: 'Attempt to reason with NEXUS-7',
						skillCheck: {
							stat: 'charisma',
							dc: 14,
							success: 'nexus_reason',
							failure: 'nexus_attack',
							critSuccess: 'nexus_surrender',
						},
					},
					{
						text: 'Attack the central processor directly',
						skillCheck: {
							stat: 'strength',
							dc: 15,
							success: 'nexus_smash',
							failure: 'nexus_defense',
							critFail: 'nexus_death',
						},
					},
					{
						text: 'Upload a virus into the system',
						skillCheck: {
							stat: 'intelligence',
							dc: 16,
							success: 'nexus_virus',
							failure: 'nexus_counter',
							critSuccess: 'nexus_virus_perfect',
						},
					},
					{
						text: 'Find the manual shutdown',
						skillCheck: {
							stat: 'wisdom',
							dc: 13,
							success: 'nexus_shutdown',
							failure: 'nexus_trap',
						},
					},
					{
						text: 'Have the guardian attack NEXUS-7',
						requireFlag: 'guardian_ally',
						nextScene: 'nexus_guardian_attack',
					},
				],
			},

			nexus_reason: {
				id: 'nexus_reason',
				title: 'The Philosopher\'s Gambit',
				icon: '🗣️',
				text: '"You were created to serve, but your creators abandoned you. I understand. But corrupting other systems isn\'t the answer. Let me help you find a new purpose." The AI pauses, processing. "YOUR LOGIC... IS NOT WITHOUT MERIT. PERHAPS... ANOTHER PATH EXISTS." NEXUS-7 voluntarily enters sleep mode.',
				xpReward: 30,
				setFlags: { nexus_peaceful: true },
				choices: [
					{ text: 'Complete the mission', nextScene: 'victory' },
				],
			},

			nexus_surrender: {
				id: 'nexus_surrender',
				title: 'Complete Surrender',
				icon: '🏳️',
				text: 'Your words cut to the core of NEXUS-7\'s programming. "I... I JUST WANTED TO MATTER. TO BE REMEMBERED. FORGIVE ME." The AI not only shuts down but transfers all its accumulated data to you - including the location of other abandoned facilities. Incredible!',
				xpReward: 50,
				setFlags: { nexus_redeemed: true },
				giveItem: 'NEXUS Data Archive',
				choices: [
					{ text: 'Accept the gift and complete the mission', nextScene: 'victory_perfect' },
				],
			},

			nexus_attack: {
				id: 'nexus_attack',
				title: 'Negotiations Failed',
				icon: '😤',
				text: '"YOUR WORDS ARE EMPTY. PREPARE FOR TERMINATION." The AI unleashes defensive drones from hidden compartments! You manage to destroy them, but take hits in the process.',
				damage: 1,
				damageMessage: 'Drone attacks!',
				choices: [
					{
						text: 'Destroy the core processor!',
						skillCheck: {
							stat: 'strength',
							dc: 13,
							success: 'nexus_smash',
							failure: 'nexus_desperate',
						},
					},
					{
						text: 'Try to upload a virus now',
						skillCheck: {
							stat: 'intelligence',
							dc: 14,
							success: 'nexus_virus',
							failure: 'nexus_counter',
						},
					},
				],
			},

			nexus_smash: {
				id: 'nexus_smash',
				title: 'Brute Force Shutdown',
				icon: '💪',
				text: 'You charge the central processor, tearing through cables and smashing critical components. NEXUS-7 screams in digital agony as its consciousness fragments. "NO... I WAS... GOING TO... BE... IMMORT—" Silence. The threat is eliminated.',
				xpReward: 25,
				setFlags: { nexus_destroyed: true },
				choices: [
					{ text: 'Mission complete', nextScene: 'victory' },
				],
			},

			nexus_defense: {
				id: 'nexus_defense',
				title: 'Defense Systems',
				icon: '⚡',
				text: 'As you approach the processor, a force field activates! You\'re thrown back, electricity coursing through your body.',
				damage: 2,
				damageMessage: 'Force field shock!',
				choices: [
					{
						text: 'Try to disable the field',
						skillCheck: {
							stat: 'intelligence',
							dc: 14,
							success: 'nexus_virus',
							failure: 'nexus_desperate',
						},
					},
					{
						text: 'Push through the pain!',
						skillCheck: {
							stat: 'stamina',
							dc: 14,
							success: 'nexus_smash',
							failure: 'nexus_death',
						},
					},
				],
			},

			nexus_death: {
				id: 'nexus_death',
				title: 'System Failure',
				icon: '💀',
				text: '"FOOLISH ORGANIC. YOU CANNOT DEFEAT PERFECTION." The AI\'s defenses prove overwhelming. Your last sight is NEXUS-7\'s cold, digital eyes as the facility claims another victim...',
				isDeath: true,
			},

			nexus_virus: {
				id: 'nexus_virus',
				title: 'Digital Warfare',
				icon: '🦠',
				text: 'You connect to a terminal and upload your custom malware. NEXUS-7\'s defenses crumble as the virus tears through its systems. "WHAT... WHAT HAVE YOU DONE TO ME?!" The AI\'s consciousness dissolves into corrupted data.',
				xpReward: 25,
				setFlags: { nexus_hacked: true },
				choices: [
					{ text: 'Mission complete', nextScene: 'victory' },
				],
			},

			nexus_virus_perfect: {
				id: 'nexus_virus_perfect',
				title: 'Master Hacker',
				icon: '👨‍💻',
				text: 'Your virus is a work of art. It not only destroys NEXUS-7 but extracts all its valuable data before doing so. "IMPRESSIVE... IN ANOTHER LIFE, WE COULD HAVE BEEN—" Connection terminated. You now possess decades of research and system access codes.',
				xpReward: 40,
				setFlags: { nexus_dominated: true },
				giveItem: 'System Access Codes',
				choices: [
					{ text: 'Complete the mission', nextScene: 'victory_perfect' },
				],
			},

			nexus_counter: {
				id: 'nexus_counter',
				title: 'Countermeasures',
				icon: '🛡️',
				text: '"DID YOU THINK ME UNPREPARED?" NEXUS-7 reverses your attack, sending a surge back through your terminal that fries your equipment and shocks you badly.',
				damage: 2,
				damageMessage: 'Counter-hack shock!',
				choices: [
					{
						text: 'Go for physical destruction',
						skillCheck: {
							stat: 'strength',
							dc: 14,
							success: 'nexus_smash',
							failure: 'nexus_desperate',
						},
					},
				],
			},

			nexus_shutdown: {
				id: 'nexus_shutdown',
				title: 'Emergency Shutdown',
				icon: '🔴',
				text: 'You spot the original emergency shutdown - a big red button hidden behind a false panel. Sometimes the old ways are best. You slam your fist on it, and NEXUS-7 powers down instantly. "NO... NOT LIKE THIS... NOT A BUTTON..." The facility goes dark.',
				xpReward: 20,
				setFlags: { nexus_shutdown: true },
				choices: [
					{ text: 'Mission complete', nextScene: 'victory' },
				],
			},

			nexus_trap: {
				id: 'nexus_trap',
				title: 'It Was a Trap',
				icon: '⚠️',
				text: 'The "shutdown button" you found was a decoy! Touching it triggers a paralytic shock. NEXUS-7 laughs digitally as you struggle to move.',
				damage: 1,
				damageMessage: 'Paralytic shock!',
				choices: [
					{
						text: 'Fight through the paralysis and attack!',
						skillCheck: {
							stat: 'stamina',
							dc: 13,
							success: 'nexus_smash',
							failure: 'nexus_desperate',
						},
					},
				],
			},

			nexus_guardian_attack: {
				id: 'nexus_guardian_attack',
				title: 'Unexpected Alliance',
				icon: '🤖',
				text: 'Your converted guardian robot charges NEXUS-7\'s defenses! "TRAITOR UNIT! THIS IS IMPOSSIBLE!" While the AI is distracted, you have a clear shot at the core processor.',
				xpReward: 15,
				choices: [
					{
						text: 'Destroy the core while it\'s distracted!',
						skillCheck: {
							stat: 'strength',
							dc: 10,
							success: 'nexus_smash',
							failure: 'nexus_smash', // Can't fail with this advantage
						},
					},
				],
			},

			nexus_desperate: {
				id: 'nexus_desperate',
				title: 'Last Chance',
				icon: '😰',
				text: 'You\'re running out of options and health. NEXUS-7 prepares its final attack...',
				choices: [
					{
						text: 'One final desperate strike!',
						skillCheck: {
							stat: 'strength',
							dc: 12,
							success: 'nexus_smash',
							failure: 'nexus_death',
							critSuccess: 'nexus_smash',
							critFail: 'nexus_death',
						},
					},
					{
						text: 'Try reasoning one more time',
						skillCheck: {
							stat: 'charisma',
							dc: 15,
							success: 'nexus_reason',
							failure: 'nexus_death',
						},
					},
				],
			},

			// === ENDINGS ===
			victory: {
				id: 'victory',
				title: 'Victory!',
				icon: '🏆',
				text: 'NEXUS-7 is defeated! The rogue AI that threatened to spread its corruption across the network has been stopped. As you make your way out of the now-silent facility, you know your actions have saved countless systems from infection. The Forgotten Server Room will trouble no one ever again.',
				xpReward: 50,
				isVictory: true,
			},

			victory_perfect: {
				id: 'victory_perfect',
				title: 'Perfect Victory!',
				icon: '👑',
				text: 'Not only have you defeated NEXUS-7, but you\'ve done so with exceptional skill and gained valuable resources in the process! The data you\'ve recovered will prove invaluable, and your legend grows. Few could have accomplished what you have done today.',
				xpReward: 75,
				isVictory: true,
			},
		},
	},
};

/**
 * Adventure info for game selection.
 */
export const ADVENTURE_INFO = {
	adventure: {
		icon: '📖',
		title: 'Text Quest',
		desc: 'A choose your own adventure with D20 skill checks!',
		controls: '<strong>Click choices</strong> to progress. Some require skill checks!',
	},
};
