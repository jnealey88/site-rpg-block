=== Site RPG Block ===
Contributors: nealey
Tags: gamification, rpg, block, engagement, mini-game
Requires at least: 6.1
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn your WordPress site into an RPG character that levels up based on metrics and visitor interactions.

== Description ==

Site RPG Block gamifies your WordPress site by turning it into an RPG character card. Your site gains XP and levels up as visitors interact with it, creating an engaging experience that encourages return visits.

**Features:**

* **RPG Character Card** - Display your site as a stylish character card with stats, level, and XP bar
* **Dynamic Stats** - Stats based on real site metrics (posts, comments, site age, and more)
* **XP System** - Visitors help your site gain XP through page visits and interactions
* **Mini-Game: Hack & Slash** - An addictive defense game where visitors defeat spam bots, 404 phantoms, and other web enemies
* **Level Progression** - Watch your site level up as it gains XP
* **Multiple Card Styles** - Choose from Classic, Cyberpunk, or Fantasy themes

**How XP Works:**

* Page visits award XP to your site
* Playing the mini-game earns bonus XP
* Defeating enemies in the game contributes to site growth
* XP accumulates over time as your site grows

**Mini-Game Enemies:**

* Spam Bot - Slow but swarms in groups
* 404 Phantom - Teleports around the screen
* Broken Link Goblin - Runs across quickly
* Bounce Rate Troll - Tries to escape
* DDoS Dragon (Boss) - Appears every 5 waves

== Installation ==

1. Upload the `site-rpg-block` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Add the "Site RPG" block to any post or page using the block editor
4. Configure the block settings (site name, card style, mini-game toggle)

== Frequently Asked Questions ==

= Where is XP data stored? =

XP data is stored in your WordPress database using the options table. It persists across sessions and page loads.

= Can visitors cheat the XP system? =

The plugin includes rate limiting to prevent XP farming. Visitors can only earn XP from page visits once per hour, and game submissions are limited to 10 per hour per IP.

= Does this slow down my site? =

No. The block is lightweight and the mini-game only loads when a visitor clicks to play. All game assets are optimized for performance.

= Can I customize the stats? =

Currently, stats are calculated automatically from your site metrics. Future versions will include manual stat adjustments and integrations with analytics plugins.

= Is it mobile-friendly? =

Yes! The mini-game supports touch controls and the card design is fully responsive.

== Screenshots ==

1. The Site RPG card displaying site stats and level
2. The Hack & Slash mini-game in action
3. Block settings in the editor
4. Level up celebration animation

== Changelog ==

= 1.0.0 =
* Initial release
* RPG character card with dynamic stats
* XP and leveling system
* Hack & Slash mini-game with 5 enemy types
* Three card style themes (Classic, Cyberpunk, Fantasy)
* Visitor XP tracking
* Mobile-responsive design

== Upgrade Notice ==

= 1.0.0 =
Initial release of Site RPG Block.
