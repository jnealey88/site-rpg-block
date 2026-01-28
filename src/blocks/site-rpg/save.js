/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Save component - renders placeholder for PHP render
 */
export default function save( { attributes } ) {
	const { siteName, showMiniGame, cardStyle } = attributes;
	const blockProps = useBlockProps.save( { className: 'site-rpg-block' } );

	return (
		<div
			{ ...blockProps }
			data-site-name={ siteName }
			data-show-mini-game={ showMiniGame }
			data-card-style={ cardStyle }
		>
			{/* Content rendered by PHP/JS */}
		</div>
	);
}
