/**
 * Data access helpers — wraps window.WC2026Data with typed getters.
 *
 * All functions are pure / memoised where appropriate so view components
 * can call them freely without performance concerns.
 */
import type {
	WC2026Data, Team, Stadium, MatchWithPhase, KnockoutPhase,
} from './types';

declare global {
	interface Window { WC2026Data: WC2026Data; }
}

/** Typed reference to the globally inlined JSON blob. */
export const wc26data: WC2026Data = window.WC2026Data;

// Stable order for knockout phases.
export const KNOCKOUT_PHASES: KnockoutPhase[] = [
	'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'finals',
];

export const KNOCKOUT_LABELS: Record<KnockoutPhase, string> = {
	round_of_32:    'Round of 32',
	round_of_16:    'Round of 16',
	quarter_finals: 'Quarter-finals',
	semi_finals:    'Semi-finals',
	finals:         'Finals',
};

/** Placeholder team objects for bracket slots that are not yet resolved. */
export function getTeam( code: string ): Team {
	if ( wc26data.teams[ code ] ) return wc26data.teams[ code ];

	if ( /^W\d+$/.test( code ) ) {
		return { flag: '🏆', name: `W#${ code.slice( 1 ) }`, name_ptb: `V#${ code.slice( 1 ) }` };
	}
	if ( /^L\d+$/.test( code ) ) {
		return { flag: '🥉', name: `L#${ code.slice( 1 ) }`, name_ptb: `P#${ code.slice( 1 ) }` };
	}
	const m = code.match( /^(\d)([A-Z]+)$/ );
	if ( m ) {
		const pos   = m[ 1 ] === '1' ? '1st' : m[ 1 ] === '2' ? '2nd' : 'Best 3rd';
		const label = `${ pos } Grp ${ m[ 2 ] }`;
		return { flag: '🏳️', name: label, name_ptb: label };
	}
	return { flag: '🏳️', name: code, name_ptb: code };
}

export function getStadium( key: string ): Stadium {
	return wc26data.stadiums[ key ] ?? { city: '—', name: '—' };
}

/** Returns all 104 matches sorted by UTC datetime, each annotated with phase/group. */
let _cache: MatchWithPhase[] | null = null;
export function getAllMatches(): MatchWithPhase[] {
	if ( _cache ) return _cache;

	const list: MatchWithPhase[] = [];

	for ( const [ gid, g ] of Object.entries( wc26data.groups ) ) {
		for ( const m of g.matches ) {
			list.push( { ...m, phase: 'group', group: gid } );
		}
	}

	for ( const phase of KNOCKOUT_PHASES ) {
		const arr = wc26data.knockout[ phase ];
		if ( arr ) {
			for ( const m of arr ) {
				list.push( { ...m, phase, group: undefined } );
			}
		}
	}

	_cache = list.sort( ( a, b ) => ( a.utc < b.utc ? -1 : 1 ) );
	return _cache;
}

/** Returns whether a knockout match can have penalties (i.e. not Third-place always... but FIFA applies ET+pens from R32 on). */
export function knockoutCanHavePenalties( round: string ): boolean {
	return [ 'r32', 'r16', 'qf', 'sf', 'f', 'po' ].includes( round );
}
