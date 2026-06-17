/**
 * Utility functions — datetime formatting and standings calculation.
 */
import type { ScoresMap, Standing, GroupData } from './types';

// ── Datetime helpers ────────────────────────────────────────────────────────

/** Format a UTC ISO string with Intl.DateTimeFormat for a given IANA timezone. */
export function fmt( utcStr: string, tz: string, opts: Intl.DateTimeFormatOptions ): string {
	try {
		return new Intl.DateTimeFormat( 'en-US', { timeZone: tz, ...opts } ).format( new Date( utcStr ) );
	} catch {
		return new Intl.DateTimeFormat( 'en-US', opts ).format( new Date( utcStr ) );
	}
}

export function fmtTime( utcStr: string, tz: string ): string {
	return fmt( utcStr, tz, { hour: '2-digit', minute: '2-digit', hour12: false } );
}

export function fmtDateShort( utcStr: string, tz: string ): string {
	return fmt( utcStr, tz, { weekday: 'short', month: 'short', day: 'numeric' } );
}

export function fmtDateFull( utcStr: string, tz: string ): string {
	return fmt( utcStr, tz, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } );
}

/**
 * Returns a YYYY-MM-DD key in the given timezone — used to group matches by local day.
 * Intl formats as M/D/YYYY so we rearrange.
 */
export function dateKey( utcStr: string, tz: string ): string {
	const parts = new Intl.DateTimeFormat( 'en-CA', {
		timeZone: tz,
		year: 'numeric', month: '2-digit', day: '2-digit',
	} ).formatToParts( new Date( utcStr ) );
	const p: Record<string, string> = {};
	parts.forEach( ( { type, value } ) => { p[ type ] = value; } );
	return `${ p.year }-${ p.month }-${ p.day }`;
}

// ── Standings calculation ────────────────────────────────────────────────────

/** Compute live group standings from entered scores. */
export function calcStandings( group: GroupData, scores: ScoresMap ): Standing[] {
	const table: Record<string, Standing> = {};
	for ( const code of group.teams ) {
		table[ code ] = { code, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
	}

	for ( const m of group.matches ) {
		const s = scores[ m.id ];
		if ( ! s || s.homeGoals === null || s.awayGoals === null ) continue;

		const h = table[ m.home ];
		const a = table[ m.away ];
		if ( ! h || ! a ) continue;

		const hg = s.homeGoals, ag = s.awayGoals;
		h.mp++; a.mp++;
		h.gf += hg; h.ga += ag; h.gd = h.gf - h.ga;
		a.gf += ag; a.ga += hg; a.gd = a.gf - a.ga;

		if ( hg > ag )      { h.w++; h.pts += 3; a.l++; }
		else if ( hg < ag ) { a.w++; a.pts += 3; h.l++; }
		else                { h.d++; h.pts++; a.d++; a.pts++; }
	}

	return Object.values( table ).sort(
		( a, b ) =>
			b.pts - a.pts ||
			b.gd  - a.gd  ||
			b.gf  - a.gf  ||
			a.code.localeCompare( b.code )
	);
}

// ── Knockout bracket slot resolution ────────────────────────────────────────

/**
 * Resolve a knockout slot code to a team code if results are known.
 * Returns the team code (3-letter FIFA code) or null if undetermined.
 */
export function resolveSlot(
	slot: string,
	scores: ScoresMap,
	matchById: Map<number, { home: string; away: string }>,
): string | null {
	if ( /^[A-Z]{3}$/.test( slot ) ) return slot; // Already a team code

	if ( /^W\d+$/.test( slot ) ) {
		const id = parseInt( slot.slice( 1 ), 10 );
		const m  = matchById.get( id );
		const s  = m && scores[ id ];
		if ( ! s || s.homeGoals === null || s.awayGoals === null ) return null;

		if ( s.homeGoals > s.awayGoals ) return m!.home;
		if ( s.awayGoals > s.homeGoals ) return m!.away;
		// Tied after 90 — check penalties
		if ( s.homePenalties != null && s.awayPenalties != null ) {
			if ( s.homePenalties > s.awayPenalties ) return m!.home;
			if ( s.awayPenalties > s.homePenalties ) return m!.away;
		}
		return null;
	}

	if ( /^L\d+$/.test( slot ) ) {
		const id = parseInt( slot.slice( 1 ), 10 );
		const m  = matchById.get( id );
		const s  = m && scores[ id ];
		if ( ! s || s.homeGoals === null || s.awayGoals === null ) return null;

		if ( s.homeGoals > s.awayGoals ) return m!.away;
		if ( s.awayGoals > s.homeGoals ) return m!.home;
		return null;
	}

	return null; // Group-stage bracket slots (1A, 2B, etc.) — not resolved here
}
