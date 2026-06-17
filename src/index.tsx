/**
 * Editor entry point — registers the wc2026/schedule block type.
 *
 * save() returns null because this is a dynamic block rendered by PHP.
 */
import { registerBlockType } from '@wordpress/blocks';
import Edit from './Edit';
import metadata from '../block.json';

import './editor.css';

registerBlockType( metadata.name as 'wc2026/schedule', {
	edit: Edit,
	save: () => null,
} );
