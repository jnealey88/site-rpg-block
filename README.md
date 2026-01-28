# Site RPG Block

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![WordPress](https://img.shields.io/badge/WordPress-6.1%2B-21759b)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777bb4)
![License](https://img.shields.io/badge/license-GPL--2.0--or--later-green)

> Turn your WordPress site into an RPG character that levels up as your site grows!

Site RPG Block gamifies website growth by transforming your site into an RPG character with stats, levels, and mini-games. Watch your site gain XP from content creation, visitor engagement, and interactive games.

## Features

### RPG Character Card

- **6 dynamic stats** based on real site metrics (posts, pages, comments, site age)
- **XP system** with 10+ level tiers from "Novice Site" to "Legendary Destination"
- **Three visual themes**: Classic, Pixel Art, and Modern

### Hack & Slash Mini-Game

- **Side-scrolling beat 'em up** action game
- Control a pixel knight to defeat enemies
- **5 enemy types** including the DDoS Dragon boss
- **5 waves** of enemies to defeat
- Arrow keys + Space to attack (desktop)
- Virtual D-pad + attack button (mobile)
- XP rewards capped to prevent abuse

### Visitor Interaction Tracking

- Page visits, scroll depth, time on page
- Rate-limited XP rewards (1 action per hour per type)
- localStorage spam prevention

### REST API

- `GET /site-rpg/v1/stats` - Retrieve current site stats
- `POST /site-rpg/v1/game/complete` - Submit game results
- `POST /site-rpg/v1/visitor/action` - Track visitor actions

## Screenshots

*Coming soon*

- Editor block settings panel
- Frontend character card display
- Hack & Slash mini-game in action

## Installation

### From WordPress Admin

1. Go to **Plugins → Add New**
2. Search for "Site RPG Block"
3. Click **Install Now**, then **Activate**

### Manual Installation

1. Download the latest release ZIP from the releases page
2. Go to **Plugins → Add New → Upload Plugin**
3. Upload the ZIP file and click **Install Now**
4. Activate the plugin

## Usage

### Adding the Block

1. Edit any page or post in the Block Editor
2. Click the **+** button to add a new block
3. Search for "Site RPG" or "Character Card"
4. Insert the block where you want it to appear

### Configuration Options

| Option | Description |
|--------|-------------|
| **Site Name** | Customize your site's RPG character name |
| **Card Style** | Choose from Classic, Pixel Art, or Modern themes |
| **Enable Mini-Game** | Toggle the Hack & Slash game on or off |

### How XP Works

| Action | XP Earned | Limit |
|--------|-----------|-------|
| Page visit | +2 | Once per hour |
| Scroll depth (>75%) | +3 | Once per hour |
| Time on page (2 min) | +5 | Once per hour |
| Mini-game session | Up to +200 | 10 games per hour |

### Stats Explained

| Stat | Source | Calculation |
|------|--------|-------------|
| **Strength** | Published posts | 1 point per post (max 20) |
| **Wisdom** | Published pages | 1 point per page (max 20) |
| **Charisma** | Approved comments | 1 point per 5 comments (max 20) |
| **Stamina** | Site age | 1 point per 30 days (max 20) |
| **Agility** | *Coming soon* | PageSpeed integration planned |
| **Intelligence** | *Coming soon* | SEO score integration planned |

### Level Progression

XP required for each level follows an exponential curve: `100 * 1.5^(level-1)`

| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Novice Site | 0 |
| 2 | Apprentice Site | 100 |
| 3 | Journeyman Site | 150 |
| 5 | Expert Site | 506 |
| 10 | Legendary Destination | 3,844 |

## Development

### Prerequisites

- Node.js 18+
- npm
- Docker (for wp-env)

### Setup

```bash
git clone https://github.com/yourusername/site-rpg-block.git
cd site-rpg-block
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npx wp-env start` | Start local WordPress at localhost:8888 |
| `npx wp-env stop` | Stop the local environment |
| `npm start` | Watch mode for development |
| `npm run build` | Production build |
| `npm run lint:js` | Lint JavaScript files |
| `npm run lint:css` | Lint CSS/SCSS files |

### Local Development Access

- **Frontend**: http://localhost:8888
- **Admin**: http://localhost:8888/wp-admin
- **Credentials**: admin / password

### Project Structure

```
site-rpg-block/
├── site-rpg-block.php          # Main plugin file
├── includes/
│   ├── class-xp-tracker.php    # XP storage & level calculations
│   └── class-rest-api.php      # REST API endpoints
├── src/blocks/site-rpg/
│   ├── block.json              # Block metadata
│   ├── index.js                # Block registration
│   ├── edit.js                 # Editor component
│   ├── save.js                 # Save component
│   ├── view.js                 # Frontend interactivity & game
│   ├── render.php              # Server-side rendering
│   ├── style.scss              # Frontend styles
│   └── editor.scss             # Editor styles
└── build/                      # Compiled assets
```

## Roadmap

The plugin has ambitious plans for future development including:

- Real analytics integrations (PageSpeed, SEO plugins, Google Analytics)
- WooCommerce integration (orders as quests, revenue milestones)
- Cross-site leaderboards
- Daily quest system
- Additional mini-games (Tower Defense, Match-3, Boss Rush)
- Achievement system (200+ achievements planned)
- Multiplayer features (co-op defense, PvP arena)

See [ROADMAP.md](ROADMAP.md) for the full development roadmap.

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- Run `npm run lint:js` and `npm run lint:css` before committing
- Add appropriate inline documentation for new functions

## License

This plugin is licensed under the [GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html) license.

---

Made for the WordPress Plugin Jam
