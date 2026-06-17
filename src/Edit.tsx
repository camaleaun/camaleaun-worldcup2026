/**
 * Edit — Gutenberg editor component for the wc2026/schedule block.
 *
 * Shows a static preview card. InspectorControls expose defaultTab and
 * the optional GitHub results URL.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import type { BlockAttributes } from './types';

const TAB_OPTIONS = [
	{ label: __( 'Calendar',  'camaleaun-worldcup2026' ), value: 'calendar'  },
	{ label: __( 'Matches',   'camaleaun-worldcup2026' ), value: 'matches'   },
	{ label: __( 'Groups',    'camaleaun-worldcup2026' ), value: 'groups'    },
	{ label: __( 'Knockout',  'camaleaun-worldcup2026' ), value: 'knockout'  },
];

export default function Edit( { attributes, setAttributes }: BlockEditProps<BlockAttributes> ): JSX.Element {
	const { defaultTab, resultsUrl } = attributes;
	const blockProps = useBlockProps( { className: 'wc2026-editor-preview' } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Schedule Settings', 'camaleaun-worldcup2026' ) } initialOpen>
					<SelectControl
						label={ __( 'Default tab', 'camaleaun-worldcup2026' ) }
						value={ defaultTab }
						options={ TAB_OPTIONS }
						onChange={ ( value: string ) => setAttributes( { defaultTab: value as BlockAttributes['defaultTab'] } ) }
					/>
					<TextControl
						label={ __( 'Results URL (GitHub raw)', 'camaleaun-worldcup2026' ) }
						help={ __( 'URL to a raw JSON file with match scores. Leave empty to disable sync.', 'camaleaun-worldcup2026' ) }
						value={ resultsUrl }
						onChange={ ( value: string ) => setAttributes( { resultsUrl: value } ) }
						type="url"
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="wc2026-editor-badge">
					<span className="wc2026-editor-trophy">🏆</span>
					<strong>FIFA World Cup 2026™</strong>
					<span className="wc2026-editor-sub">
						{ __( 'Interactive Schedule Block', 'camaleaun-worldcup2026' ) }
					</span>
				</div>
				<p className="wc2026-editor-hint">
					{ __( 'The full schedule renders on the front end with score entry, calendar, matches, groups and knockout bracket.', 'camaleaun-worldcup2026' ) }
				</p>
				<div className="wc2026-editor-tabs">
					{ TAB_OPTIONS.map( t => (
						<span
							key={ t.value }
							className={ `wc2026-editor-tab${ t.value === defaultTab ? ' is-active' : '' }` }
						>
							{ t.label }
						</span>
					) ) }
				</div>
				{ resultsUrl && (
					<p className="wc2026-editor-hint wc2026-editor-hint--url">
						⬇️ Sync URL: <code>{ resultsUrl }</code>
					</p>
				) }
			</div>
		</>
	);
}
