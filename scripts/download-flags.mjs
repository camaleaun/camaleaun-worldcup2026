/**
 * download-flags.mjs
 *
 * Downloads SVG flag files from flagcdn.com and saves them as
 * assets/flags/{FIFA_CODE}.svg — files are gitignored but bundled
 * in the release zip by the CI workflow.
 *
 * Usage:
 *   npm run flags
 */

import https from 'https';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const OUT_DIR   = path.resolve( __dirname, '../assets/flags' );

/** FIFA code → ISO 3166-1 alpha-2 (flagcdn.com path segment). */
const FIFA_ISO = {
	ALG: 'dz', ARG: 'ar', AUS: 'au', AUT: 'at',
	BEL: 'be', BIH: 'ba', BRA: 'br', CAN: 'ca',
	CIV: 'ci', COD: 'cd', COL: 'co', CPV: 'cv',
	CRO: 'hr', CUW: 'cw', CZE: 'cz', ECU: 'ec',
	EGY: 'eg', ENG: 'gb-eng', ESP: 'es', FRA: 'fr',
	GER: 'de', GHA: 'gh', HAI: 'ht', IRN: 'ir',
	IRQ: 'iq', JOR: 'jo', JPN: 'jp', KOR: 'kr',
	KSA: 'sa', MAR: 'ma', MEX: 'mx', NED: 'nl',
	NOR: 'no', NZL: 'nz', PAN: 'pa', PAR: 'py',
	POR: 'pt', QAT: 'qa', RSA: 'za', SCO: 'gb-sct',
	SEN: 'sn', SUI: 'ch', SWE: 'se', TUN: 'tn',
	TUR: 'tr', URU: 'uy', USA: 'us', UZB: 'uz',
};

function download( url, dest ) {
	return new Promise( ( resolve, reject ) => {
		const file = fs.createWriteStream( dest );
		https.get( url, res => {
			if ( res.statusCode !== 200 ) {
				file.close();
				fs.unlinkSync( dest );
				return reject( new Error( `HTTP ${ res.statusCode } for ${ url }` ) );
			}
			res.pipe( file );
			file.on( 'finish', () => { file.close(); resolve(); } );
		} ).on( 'error', err => {
			file.close();
			if ( fs.existsSync( dest ) ) fs.unlinkSync( dest );
			reject( err );
		} );
	} );
}

async function main() {
	fs.mkdirSync( OUT_DIR, { recursive: true } );

	const entries = Object.entries( FIFA_ISO );
	let ok = 0, fail = 0;

	for ( const [ fifa, iso ] of entries ) {
		const url  = `https://flagcdn.com/${ iso }.svg`;
		const dest = path.join( OUT_DIR, `${ fifa.toLowerCase() }.svg` );

		try {
			await download( url, dest );
			process.stdout.write( `  ✔ ${ fifa } (${ iso })\n` );
			ok++;
		} catch ( err ) {
			process.stderr.write( `  ✖ ${ fifa }: ${ err.message }\n` );
			fail++;
		}
	}

	console.log( `\nDone: ${ ok } downloaded, ${ fail } failed.\n` );
	if ( fail > 0 ) process.exit( 1 );
}

main();
