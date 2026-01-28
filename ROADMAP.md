# Site RPG Block - Development Roadmap

A fun, beginner-friendly way to gamify your WordPress site and learn about site health through play.

---

## Current State (v1.0)

**Hack & Slash Mini-Game**
- Side-scrolling beat 'em up with pixel knight
- 5 enemy types (Spam Bot, 404 Phantom, Broken Link Goblin, Bounce Rate Troll, DDoS Dragon)
- 5 waves of wave-based combat
- Desktop (arrow keys + Space) and mobile (D-pad + attack) controls

**RPG Character Card**
- 6 stats based on real site metrics
- XP system with level progression
- 3 visual themes (Classic, Pixel Art, Modern)

---

## Phase 1: Game Polish & Enhanced Combat

### Enemy Improvements
- [ ] Unique attack patterns for each enemy type
- [ ] 404 Phantom: Phases through attacks briefly
- [ ] Broken Link Goblin: Spawns in groups of 3
- [ ] Bounce Rate Troll: Charges at player
- [ ] DDoS Dragon: Fires projectiles, summons minions

### New Enemy Types
| Enemy | Behavior | XP |
|-------|----------|-----|
| Malware Slime | Splits into 2 when hit | +12 |
| Outdated Plugin Zombie | Slow but tough, revives once | +20 |
| Hacker Ninja | Fast, dodges first attack | +18 |
| SEO Spam Spider | Creates web traps that slow player | +15 |

### Power-Ups (drop from enemies)
| Power-Up | Effect | Duration |
|----------|--------|----------|
| ⚡ Speed Boost | 2x movement speed | 5 seconds |
| 🛡️ Shield | Block next hit | One-time |
| ⚔️ Power Strike | 2x damage | 3 attacks |
| ❤️ Health Potion | Restore 1 heart | Instant |
| 🌟 XP Multiplier | 2x XP earned | 10 seconds |

### Visual & Audio Polish
- [ ] Attack slash animation effect
- [ ] Enemy death explosion particles
- [ ] Screen shake on boss hits
- [ ] Simple sound effects (attack, hit, defeat, level up)
- [ ] Background music toggle option
- [ ] Improved pixel knight animations (idle, walk, attack, hurt)

### Quality of Life
- [ ] Pause menu with controls reminder
- [ ] Difficulty settings (Easy/Normal/Hard)
- [ ] Tutorial overlay for first-time players
- [ ] High score display per session

---

## Phase 2: Mini-Game Variety

### Game 1: Tower Defense - "Firewall Fortress"
Protect your server from waves of attackers by placing defensive towers.

**Mechanics:**
- Grid-based tower placement
- Tower types: Antivirus Turret, Firewall Wall, Cache Accelerator, CDN Booster
- Enemies follow paths toward your server core
- Upgrade towers between waves
- Boss waves every 5 rounds

**Educational Tie-in:** Learn about web security concepts (firewalls, caching, CDNs)

### Game 2: Endless Runner - "Plugin Dash"
Your site mascot runs through an endless WordPress landscape.

**Mechanics:**
- Auto-running, tap/click to jump
- Double-jump with upgrade
- Collect plugins for points, avoid bugs
- Distance = XP earned
- Unlockable character skins

**Educational Tie-in:** Plugin icons teach plugin categories (SEO, security, performance)

### Game 3: Match-3 Puzzle - "Content Crusher"
Match content blocks to clear the board and earn XP.

**Mechanics:**
- Match posts, pages, images, comments
- Special combos create power blocks
- Timed challenge mode
- Endless zen mode
- Daily puzzle challenges

**Educational Tie-in:** Content types and their value to a site

### Game 4: Boss Rush - "Dragon Slayer"
Face increasingly difficult bosses one after another.

**Mechanics:**
- Learn boss patterns, dodge attacks, strike weak points
- 10 unique bosses representing site threats
- No healing between fights
- Leaderboard for fastest times
- Unlock boss lore/tips after defeating

**Bosses:**
1. Spam Golem (easy)
2. 404 Wraith
3. Slow Load Snail
4. Broken Link Hydra
5. Bounce Rate Beast
6. Malware Dragon
7. Hacker Shadow
8. DDoS Titan
9. Algorithm Demon
10. Final Boss: "The Downtime" (site crash personified)

---

## Phase 3: Beginner-Friendly Education

### "Site Health" Explanations
Each stat links to a simple tooltip explaining what it means:

| Stat | Explanation |
|------|-------------|
| Strength | "Posts are the backbone of your site. More posts = stronger site!" |
| Wisdom | "Pages provide essential info. About, Contact, Services pages add wisdom." |
| Charisma | "Comments mean visitors are engaged. A charismatic site sparks conversation!" |
| Stamina | "Older sites have proven staying power. Keep publishing to build stamina!" |
| Agility | "Fast sites rank better. Agility measures your loading speed." |
| Intelligence | "SEO helps people find you. Intelligence reflects your search visibility." |

### Achievement Tutorials
Achievements that teach WordPress basics:

| Achievement | Requirement | Lesson |
|-------------|-------------|--------|
| "First Post!" | Publish 1 post | How to create content |
| "Picture Perfect" | Add featured image | Why images matter |
| "Category King" | Use 3 categories | Organizing content |
| "Tag Team" | Add 5 tags | Discoverability |
| "Comment Champion" | Reply to a comment | Community building |
| "Speed Demon" | Score 90+ PageSpeed | Performance basics |

### Contextual Tips
- Random tips appear on the card: "Did you know? Adding alt text to images helps blind users AND improves SEO!"
- Tips rotate daily
- Link to beginner resources (WordPress.org docs)

---

## Phase 4: Engagement & Retention

### Daily Login Bonus
- Day 1: +10 XP
- Day 2: +15 XP
- Day 3: +20 XP
- Day 7: +100 XP + "Dedicated" badge
- Day 30: +500 XP + "Loyal" badge

### Weekly Challenges
| Challenge | Reward |
|-----------|--------|
| Play 5 mini-game sessions | +50 XP |
| Defeat 100 enemies | +75 XP |
| Publish a new post | +100 XP |
| Complete all daily quests | Mystery reward |

### Unlockable Cosmetics
- Knight skins (colors, armor styles)
- Card themes (seasonal, holidays)
- Enemy skins (cute mode, pixel mode, realistic mode)
- Victory animations

---

## Phase 5: Social & Sharing

### Shareable Stats Cards
- Auto-generated image showing your site's RPG card
- "My site is Level 15! Can you beat that?"
- Share to Twitter, Facebook, LinkedIn
- Embed code for blog posts

### Simple Leaderboards
- Opt-in weekly leaderboard
- Categories: Highest Level, Most XP This Week, Longest Streak
- No personal data shared, just site name + level
- Badge for top 10 finishers

### Friend Challenges
- Challenge a friend's site to a score duel
- Both sites have 1 week to earn more XP
- Winner gets bonus XP + bragging rights badge

---

## Phase 6: Plugin Integrations (Beginner-Friendly)

### Auto-Detected Integrations
When these plugins are active, stats automatically connect:

| Plugin | Stat Affected | How |
|--------|---------------|-----|
| Yoast SEO | Intelligence | SEO score → stat value |
| RankMath | Intelligence | SEO score → stat value |
| Jetpack | Multiple | Stats API for visitor data |
| WP Super Cache | Agility | Cache status = speed boost |
| Wordfence | New "Defense" stat | Security score |

### WooCommerce (if detected)
- Orders = "Quests Completed"
- Revenue milestones = Achievement unlocks
- New customers = "Allies Recruited"
- Product reviews = Charisma boost

### Contact Form 7 / WPForms / Gravity Forms
- Form submissions = +XP events
- "Lead Magnet" achievement for 10 submissions

---

## Technical Improvements

### Performance
- [ ] Lazy load games until "Play" clicked
- [ ] Compress sprite assets
- [ ] Optional WebGL rendering for smoother gameplay
- [ ] Service worker for offline play

### Accessibility
- [ ] Keyboard-only navigation for card
- [ ] Screen reader support for stats
- [ ] Reduced motion option
- [ ] High contrast mode
- [ ] Colorblind-friendly palettes

### Internationalization
- [ ] Translation-ready strings
- [ ] RTL layout support
- [ ] Community translations (start with Spanish, French, German)

### Testing
- [ ] Jest unit tests for XP calculations
- [ ] Playwright E2E tests for game flow
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing

---

## Future Ideas (Backlog)

- Multiplayer co-op mode (visitors team up)
- Seasonal events (Halloween enemies, holiday themes)
- Site mascot customization
- Voice line unlocks for characters
- Story mode with narrative
- Pro tier with advanced analytics dashboard
- Agency white-label option
- WordPress.org profile integration

---

## Success Metrics

### Engagement Goals
- Average game session: 2+ minutes
- Return players: 40% play again within 7 days
- Completion rate: 60% finish at least 3 waves
- Tutorial completion: 80% of first-time players

### Growth Goals
- WordPress.org installs: 5K in first 6 months
- 5-star reviews: 50+ with detailed feedback
- Social shares: 500+ in first year
- Community translations: 5+ languages

---

*This roadmap prioritizes fun, education, and accessibility for WordPress beginners. Features may be reordered based on community feedback.*
