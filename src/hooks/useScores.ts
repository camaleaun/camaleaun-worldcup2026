/**
 * useScores — localStorage-backed score state.
 *
 * Scores are stored under `wc2026_scores_v1` as a JSON map of
 * { [matchId]: MatchScore }. Supports manual entry and bulk import
 * from a GitHub-hosted results JSON file.
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import type { ScoresMap, MatchScore, GitHubResults } from '../types';

const STORAGE_KEY = 'wc2026_scores_v1';

function readStorage(): ScoresMap {
	try {
		const raw = localStorage.getItem( STORAGE_KEY );
		return raw ? ( JSON.parse( raw ) as ScoresMap ) : {};
	} catch {
		return {};
	}
}

export interface UseScoresReturn {
	scores:        ScoresMap;
	updateScore:   ( id: number, score: MatchScore ) => void;
	deleteScore:   ( id: number ) => void;
	clearScores:   () => void;
	/** Bulk-load scores from a GitHub results URL. Throws on failure. */
	syncFromUrl:   ( url: string ) => Promise<{ count: number; updated: string }>;
	syncing:       boolean;
}

export function useScores(): UseScoresReturn {
	const [ scores, setScores ] = useState<ScoresMap>( readStorage );
	const [ syncing, setSyncing ] = useState( false );

	// Persist every change to localStorage.
	useEffect( () => {
		try {
			localStorage.setItem( STORAGE_KEY, JSON.stringify( scores ) );
		} catch { /* storage full or private mode */ }
	}, [ scores ] );

	const updateScore = useCallback( ( id: number, score: MatchScore ) => {
		setScores( prev => ( { ...prev, [ id ]: score } ) );
	}, [] );

	const deleteScore = useCallback( ( id: number ) => {
		setScores( prev => {
			const next = { ...prev };
			delete next[ id ];
			return next;
		} );
	}, [] );

	const clearScores = useCallback( () => setScores( {} ), [] );

	const syncFromUrl = useCallback( async ( url: string ): Promise<{ count: number; updated: string }> => {
		setSyncing( true );
		try {
			const res = await fetch( url, { cache: 'no-cache' } );
			if ( ! res.ok ) throw new Error( `HTTP ${ res.status } — ${ res.statusText }` );

			const payload = ( await res.json() ) as GitHubResults;
			if ( ! payload?.scores ) throw new Error( 'Invalid results file: missing "scores" key' );

			const incoming: ScoresMap = {};
			for ( const [ key, val ] of Object.entries( payload.scores ) ) {
				const id = parseInt( key, 10 );
				if ( isNaN( id ) ) continue;
				incoming[ id ] = {
					homeGoals:     val.home  ?? null,
					awayGoals:     val.away  ?? null,
					homePenalties: val.homePenalties ?? null,
					awayPenalties: val.awayPenalties ?? null,
				};
			}

			// Merge: incoming overrides local but local-only entries survive.
			setScores( prev => ( { ...prev, ...incoming } ) );

			return {
				count:   Object.keys( incoming ).length,
				updated: payload.updated ?? new Date().toISOString(),
			};
		} finally {
			setSyncing( false );
		}
	}, [] );

	return { scores, updateScore, deleteScore, clearScores, syncFromUrl, syncing };
}
