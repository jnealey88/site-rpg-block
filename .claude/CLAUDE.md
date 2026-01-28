# Site RPG Block - WordPress Plugin

WordPress Gutenberg block that gamifies websites with RPG stats, levels, and mini-games.

## Tech Stack

- **WordPress Block Plugin** using `@wordpress/scripts`
- **React** for editor (`edit.js`) / **Vanilla JS** for frontend (`view.js`)
- **SCSS** with BEM naming / **PHP** for server-side rendering

## Build Commands

```bash
npm install     # Install dependencies
npm run build   # Production build
npm run start   # Development with watch
```

## Project Structure

```
includes/                          # PHP classes
├── class-database.php             # DB tables: {prefix}_site_rpg_characters, {prefix}_site_rpg_xp_log
├── class-character.php            # Character CRUD (create, get_by_user_id, add_xp, allocate_stat_point)
├── class-races-classes.php        # Race/class definitions and stat modifiers
├── class-user-xp-actions.php      # WP hooks for XP rewards
├── class-rest-api.php             # REST endpoints
└── class-xp-tracker.php           # Site XP tracking

src/blocks/site-rpg/
├── block.json                     # Block registration
├── edit.js                        # React editor component
├── render.php                     # Server-side HTML
├── view.js → frontend/init.js     # JS entry point
├── frontend/
│   ├── constants/index.js         # RACES, CLASSES, STAT_INFO, DIFFICULTY, GAME_INFO
│   ├── constants/avatar.js        # AVATAR_PARTS, COLOR_PRESETS, CLASS_WEAPONS
│   ├── managers/
│   │   ├── CharacterManager.js    # User character state, level-ups, guest claiming
│   │   ├── CreationWizard.js      # 5-step wizard (race → class → stats → avatar → confirm)
│   │   ├── GameManager.js         # Game states, transitions, score submission
│   │   └── StatRoller.js          # Guest stat rolling with localStorage
│   ├── games/
│   │   ├── BaseGame.js            # Abstract base with game loop
│   │   ├── HackSlashGame.js       # Wave-based combat
│   │   ├── RunnerGame.js          # Endless runner
│   │   └── BossRushGame.js        # D20 turn-based combat
│   └── utils/                     # analytics, tooltips, highscores, particles
└── styles/                        # SCSS partials (base/, components/, games/, modals/, states/)
```

## Core Concepts

### Stats (6 total)

STR, WIS, CHA, STA, AGI, INT - tracked for site and user characters, displayed in compact row.

### Races (5)

Human, Pixelkin, Ironforge, Arcanet, Trickster - each has stat modifiers and passive ability.
Definitions in `frontend/constants/index.js` (JS) and `class-races-classes.php` (PHP).

### Classes (5)

Knight, Wizard, Scout, Bard, Ranger - each has +1 to two primary stats and abilities.
Classes get stat bonuses applied after race modifiers, capped at 20.

### Character Creation

5-step wizard: Race → Class → Stat Roll (4d6 drop lowest, 3 re-rolls) → Avatar → Name/Confirm.
Legacy characters (pre-race/class) use 2-step wizard via `showLegacyMode()`.

### Mini-Games

- **Hack & Slash** - Wave combat, stats affect damage/health/speed/cooldown
- **Plugin Dash** - Endless runner, stats affect jump/shield/XP/collectibles
- **Boss Rush** - D20 combat, stats affect damage/accuracy/HP/AC

Games accept `bonuses` and `effects` objects in constructor for race/class abilities.

## REST API (`/wp-json/site-rpg/v1/`)

| Method | Endpoint                    | Description                                  |
| ------ | --------------------------- | -------------------------------------------- |
| GET    | `/stats`                    | Site stats + user character                  |
| GET    | `/character`                | Current user's character                     |
| GET    | `/races-classes`            | Available races/classes                      |
| POST   | `/character/create`         | Create character (race, class, avatar, stats)|
| POST   | `/character/set-race-class` | Set race/class for legacy characters         |
| POST   | `/character/avatar`         | Update avatar                                |
| POST   | `/character/allocate-stat`  | Spend stat point                             |
| POST   | `/character/claim-guest`    | Claim localStorage progress                  |
| POST   | `/character/reset`          | Delete character                             |
| POST   | `/game/complete`            | Submit game score                            |

## Frontend Data (`window.siteRpgData`)

```js
{ restUrl, nonce, siteData, character, isLoggedIn, userId, userDisplayName }
```

Character includes: race, raceName, characterClass, className, stats, statBonuses, level, xp, xpToNextLevel, avatarData.

## Block Attributes

`siteName`, `showMiniGame`, `cardStyle` (classic/pixel/modern), `couponEnabled`, `couponCode`, `couponMessage`

## Development Notes

- **SCSS**: Use `@use` imports (not deprecated `@import`), BEM naming (`.site-rpg-card__stat-icon`)
- **Key animations**: `avatarFloat`, `avatarRingSpin`, `shimmer`, `diceShake`, `levelupPop`
- **Mobile breakpoint**: 480px (see `_responsive.scss`)
- **Race/class sync**: Keep `frontend/constants/index.js` and `class-races-classes.php` in sync
- **XP sources**: Games apply multipliers from race/class via `getXpMultiplier(source)`
