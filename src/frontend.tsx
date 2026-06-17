/**
 * Frontend entry point — mounts the React App into every .wc2026-schedule
 * container found on the page (supports multiple blocks per page).
 *
 * `window.WC2026Data` is inlined by the PHP render callback before this
 * script executes. React + ReactDOM come from the WordPress asset bundle.
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import type { TabKey } from './types';

import './frontend.css';

document.querySelectorAll<HTMLDivElement>( '.wc2026-schedule' ).forEach( container => {
	const defaultTab = ( container.dataset.defaultTab || 'calendar' ) as TabKey;
	const resultsUrl = container.dataset.resultsUrl || '';

	const root = createRoot( container );
	root.render(
		<App
			defaultTab={ defaultTab }
			resultsUrl={ resultsUrl }
		/>
	);
} );
