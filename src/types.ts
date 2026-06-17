/**
 * TypeScript type definitions for the WC2026 Schedule block.
 */

// ── Raw data shapes (from data.json) ────────────────────────────────────────

export interface Team {
	flag_url: string; // https://flagcdn.com/{iso}.svg
	name:     string;
	ranking:  number | null;
}

export interface Stadium {
	city: string;
	name: string;
}

export interface RawMatch {
	id:           number;
	round:        string;
	utc:          string;
	stadium:      string;
	home:         string;
	away:         string;
	label?:       string;        // Knockout bracket label e.g. "W74xW77"
	// Official results (from DB via REST — read-only on frontend)
	home_score?:      number | null;
	away_score?:      number | null;
	home_penalties?:  number | null;
	away_penalties?:  number | null;
	match_status?:    'scheduled' | 'live' | 'finished';
}

export interface GroupData {
	teams:   string[];
	matches: RawMatch[];
}

export type KnockoutPhase =
	| 'round_of_32'
	| 'round_of_16'
	| 'quarter_finals'
	| 'semi_finals'
	| 'finals';

export interface WC2026Data {
	teams:    Record<string, Team>;
	stadiums: Record<string, Stadium>;
	groups:   Record<string, GroupData>;
	knockout: Record<KnockoutPhase, RawMatch[]>;
}

// ── Enriched match (used throughout the app) ──────────────────────────────

export type MatchPhase = 'group' | KnockoutPhase;

export interface MatchWithPhase extends RawMatch {
	phase: MatchPhase;
	group?: string; // Group letter (A-L) for group-stage matches
}

// ── Score data (persisted to localStorage) ───────────────────────────────

export interface MatchScore {
	homeGoals:     number | null;
	awayGoals:     number | null;
	/** Only applicable in knockout when scores are level after 90 min. */
	homePenalties?: number | null;
	awayPenalties?: number | null;
}

/** Map of match ID → score. */
export type ScoresMap = Record<number, MatchScore>;

/** Format returned by the GitHub results JSON file. */
export interface GitHubResults {
	version?: string;
	updated?: string;
	scores: Record<
		string,
		{
			home:            number;
			away:            number;
			homePenalties?:  number | null;
			awayPenalties?:  number | null;
		}
	>;
}

// ── Standings ─────────────────────────────────────────────────────────────

export interface Standing {
	code: string;
	mp:   number;
	w:    number;
	d:    number;
	l:    number;
	gf:   number;
	ga:   number;
	gd:   number;
	pts:  number;
}

// ── UI state ──────────────────────────────────────────────────────────────

export type TabKey = 'calendar' | 'matches' | 'groups' | 'knockout';

export type MatchFilter = 'all' | 'group' | 'knockout' | `g_${string}`;

export type KoRound = KnockoutPhase;

/** Block editor attributes (mirrors block.json). */
export interface BlockAttributes {
	defaultTab:  TabKey;
	resultsUrl:  string;
	align?:      string;
}
