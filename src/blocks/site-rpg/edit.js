/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl, Button, Card, CardBody } from '@wordpress/components';

/**
 * Internal dependencies
 */

/**
 * Stats configuration
 */
const STATS = [
	{ key: 'strength', label: 'STR', name: 'Strength', color: '#e74c3c', icon: '💪', tooltip: 'Content engagement power' },
	{ key: 'wisdom', label: 'WIS', name: 'Wisdom', color: '#9b59b6', icon: '🧠', tooltip: 'Site knowledge depth' },
	{ key: 'charisma', label: 'CHA', name: 'Charisma', color: '#e91e63', icon: '✨', tooltip: 'Social appeal' },
	{ key: 'stamina', label: 'STA', name: 'Stamina', color: '#27ae60', icon: '🛡️', tooltip: 'Site uptime resilience' },
	{ key: 'agility', label: 'AGI', name: 'Agility', color: '#3498db', icon: '⚡', tooltip: 'Page load speed' },
	{ key: 'intelligence', label: 'INT', name: 'Intelligence', color: '#f39c12', icon: '📚', tooltip: 'Content quality' },
];

/**
 * Level titles
 */
const LEVEL_TITLES = {
	1: 'Newcomer',
	2: 'Adventurer',
	3: 'Explorer',
	4: 'Champion',
	5: 'Hero',
	6: 'Legend',
	7: 'Master',
	8: 'Grandmaster',
	9: 'Mythic',
	10: 'Immortal',
};

/**
 * Level options for coupon rewards
 */
const LEVEL_OPTIONS = [
	{ label: 'Level 2', value: 2 },
	{ label: 'Level 3', value: 3 },
	{ label: 'Level 4', value: 4 },
	{ label: 'Level 5', value: 5 },
	{ label: 'Level 6', value: 6 },
	{ label: 'Level 7', value: 7 },
	{ label: 'Level 8', value: 8 },
	{ label: 'Level 9', value: 9 },
	{ label: 'Level 10', value: 10 },
];

/**
 * Edit component
 */
export default function Edit( { attributes, setAttributes } ) {
	const { siteName, showMiniGame, cardStyle, couponEnabled, couponCode, couponMessage, levelCoupons = [] } = attributes;

	// Level coupon helpers
	const addLevelCoupon = () => {
		const usedLevels = levelCoupons.map( ( c ) => c.level );
		const nextLevel = [ 2, 3, 4, 5, 6, 7, 8, 9, 10 ].find( ( l ) => ! usedLevels.includes( l ) ) || 2;
		setAttributes( {
			levelCoupons: [
				...levelCoupons,
				{
					level: nextLevel,
					code: '',
					message: __( 'Congratulations! You unlocked a reward:', 'site-rpg-block' ),
					icon: '🎁',
				},
			],
		} );
	};

	const removeLevelCoupon = ( index ) => {
		setAttributes( {
			levelCoupons: levelCoupons.filter( ( _, i ) => i !== index ),
		} );
	};

	const updateLevelCoupon = ( index, field, value ) => {
		const updated = levelCoupons.map( ( coupon, i ) =>
			i === index ? { ...coupon, [ field ]: value } : coupon
		);
		setAttributes( { levelCoupons: updated } );
	};
	const blockProps = useBlockProps( { className: 'site-rpg-block' } );

	// Get site data from localized script (or use defaults for preview)
	const siteData = window.siteRpgData?.siteData || {
		level: 1,
		xp: 0,
		xpToNextLevel: 100,
		stats: {
			strength: 10,
			wisdom: 8,
			charisma: 5,
			stamina: 12,
			agility: 7,
			intelligence: 9,
		},
	};

	const xpProgress = ( siteData.xp / siteData.xpToNextLevel ) * 100;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'site-rpg-block' ) }>
					<TextControl
						label={ __( 'Site Name', 'site-rpg-block' ) }
						value={ siteName }
						onChange={ ( value ) => setAttributes( { siteName: value } ) }
						placeholder={ __( 'My Awesome Site', 'site-rpg-block' ) }
					/>
					<SelectControl
						label={ __( 'Card Style', 'site-rpg-block' ) }
						value={ cardStyle }
						options={ [
							{ label: 'Classic RPG', value: 'classic' },
							{ label: 'Pixel Art', value: 'pixel' },
							{ label: 'Modern', value: 'modern' },
						] }
						onChange={ ( value ) => setAttributes( { cardStyle: value } ) }
					/>
					<ToggleControl
						label={ __( 'Show Mini-Game', 'site-rpg-block' ) }
						checked={ showMiniGame }
						onChange={ ( value ) => setAttributes( { showMiniGame: value } ) }
						help={ __( 'Allow visitors to play Hack & Slash to earn XP for your site.', 'site-rpg-block' ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Coupon Reward', 'site-rpg-block' ) } initialOpen={ false }>
					<ToggleControl
						label={ __( 'Enable Coupon Reward', 'site-rpg-block' ) }
						checked={ couponEnabled }
						onChange={ ( value ) => setAttributes( { couponEnabled: value } ) }
						help={ __( 'Reward first-time players with a coupon code.', 'site-rpg-block' ) }
					/>
					{ couponEnabled && (
						<>
							<TextControl
								label={ __( 'Coupon Code', 'site-rpg-block' ) }
								value={ couponCode }
								onChange={ ( value ) => setAttributes( { couponCode: value } ) }
								placeholder={ __( 'SAVE20', 'site-rpg-block' ) }
								help={ __( 'The code to reveal after playing.', 'site-rpg-block' ) }
							/>
							<TextControl
								label={ __( 'Reward Message', 'site-rpg-block' ) }
								value={ couponMessage }
								onChange={ ( value ) => setAttributes( { couponMessage: value } ) }
								placeholder={ __( 'Congratulations! Here\'s your reward:', 'site-rpg-block' ) }
							/>
						</>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Level Rewards', 'site-rpg-block' ) } initialOpen={ false }>
					<p className="components-base-control__help" style={ { marginTop: 0 } }>
						{ __( 'Configure coupons that unlock when users reach specific levels.', 'site-rpg-block' ) }
					</p>

					{ levelCoupons.map( ( coupon, index ) => (
						<Card key={ index } className="site-rpg-level-coupon-card" style={ { marginBottom: '12px' } }>
							<CardBody>
								<div style={ { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }>
									<strong>{ __( 'Level', 'site-rpg-block' ) } { coupon.level } { __( 'Reward', 'site-rpg-block' ) }</strong>
									<Button
										icon="trash"
										label={ __( 'Remove', 'site-rpg-block' ) }
										onClick={ () => removeLevelCoupon( index ) }
										isDestructive
										size="small"
									/>
								</div>
								<SelectControl
									label={ __( 'Unlock Level', 'site-rpg-block' ) }
									value={ coupon.level }
									options={ LEVEL_OPTIONS }
									onChange={ ( value ) => updateLevelCoupon( index, 'level', parseInt( value, 10 ) ) }
								/>
								<TextControl
									label={ __( 'Coupon Code', 'site-rpg-block' ) }
									value={ coupon.code }
									onChange={ ( value ) => updateLevelCoupon( index, 'code', value ) }
									placeholder={ __( 'LEVEL5', 'site-rpg-block' ) }
								/>
								<TextControl
									label={ __( 'Reward Message', 'site-rpg-block' ) }
									value={ coupon.message }
									onChange={ ( value ) => updateLevelCoupon( index, 'message', value ) }
									placeholder={ __( 'Congratulations! You unlocked a reward:', 'site-rpg-block' ) }
								/>
							</CardBody>
						</Card>
					) ) }

					<Button
						variant="secondary"
						onClick={ addLevelCoupon }
						disabled={ levelCoupons.length >= 9 }
						style={ { marginTop: '8px' } }
					>
						{ __( '+ Add Level Reward', 'site-rpg-block' ) }
					</Button>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className={ `site-rpg-card site-rpg-card--${ cardStyle }` }>
					{/* Header */}
					<div className="site-rpg-card__header">
						<div className="site-rpg-card__avatar-container">
							<div className="site-rpg-card__avatar">
								<div className="site-rpg-card__avatar-ring"></div>
								<div className="site-rpg-card__avatar-icon">🏰</div>
								<div className="site-rpg-card__avatar-level">{ siteData.level }</div>
							</div>
							<div className="site-rpg-card__avatar-particles"></div>
						</div>
						<div className="site-rpg-card__info">
							<h3 className="site-rpg-card__name">
								{ siteName || __( 'Your Site', 'site-rpg-block' ) }
							</h3>
							<div className="site-rpg-card__level">
								<span className="site-rpg-card__level-badge">Level { siteData.level }</span>
								<span className="site-rpg-card__level-title">{ LEVEL_TITLES[ siteData.level ] || 'Adventurer' }</span>
							</div>
						</div>
					</div>

					{/* XP Bar */}
					<div className="site-rpg-card__xp">
						<div className="site-rpg-card__xp-label">
							<span>XP</span>
							<span>{ siteData.xp } / { siteData.xpToNextLevel }</span>
						</div>
						<div className="site-rpg-card__xp-bar">
							<div
								className="site-rpg-card__xp-fill"
								style={ { width: `${ xpProgress }%` } }
							/>
						</div>
					</div>

					{/* Stats */}
					<div className="site-rpg-card__stats">
						{ STATS.map( ( stat ) => (
							<div key={ stat.key } className="site-rpg-card__stat" data-stat={ stat.key } data-value={ siteData.stats[ stat.key ] }>
								<div
									className="site-rpg-card__stat-icon"
									style={ { backgroundColor: `${ stat.color }20` } }
								>
									<span className="site-rpg-card__stat-emoji">{ stat.icon }</span>
								</div>
								<div className="site-rpg-card__stat-content">
									<div className="site-rpg-card__stat-header">
										<span
											className="site-rpg-card__stat-label"
											style={ { color: stat.color } }
										>
											{ stat.label }
										</span>
										<span className="site-rpg-card__stat-value">
											{ siteData.stats[ stat.key ] }<span className="site-rpg-card__stat-max">/20</span>
										</span>
									</div>
									<div className="site-rpg-card__stat-bar">
										<div
											className="site-rpg-card__stat-fill"
											style={ {
												width: `${ Math.min( siteData.stats[ stat.key ] * 5, 100 ) }%`,
												backgroundColor: stat.color,
											} }
										/>
										<div className="site-rpg-card__stat-glow"></div>
									</div>
								</div>
								<div className="site-rpg-card__stat-tooltip">
									<span className="site-rpg-card__stat-tooltip-title">{ stat.name }</span>
									<span className="site-rpg-card__stat-tooltip-desc">{ stat.tooltip }</span>
								</div>
							</div>
						) ) }
					</div>

					{/* Mini-game button preview */}
					{ showMiniGame && (
						<div className="site-rpg-card__game">
							<button className="site-rpg-card__game-btn" disabled>
								⚔️ { __( 'Defend the Site!', 'site-rpg-block' ) }
							</button>
							<p className="site-rpg-card__game-hint">
								{ __( 'Visitors can play to help you level up!', 'site-rpg-block' ) }
							</p>
						</div>
					) }
				</div>
			</div>
		</>
	);
}
