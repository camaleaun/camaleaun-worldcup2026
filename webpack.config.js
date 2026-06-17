/**
 * Custom webpack config extending @wordpress/scripts defaults.
 * Adds a second entry point (frontend) for the block's front-end React app.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		index:    './src/index.tsx',    // Editor block registration
		frontend: './src/frontend.tsx', // Front-end interactive app
	},
};
