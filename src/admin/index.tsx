/**
 * CWC26 Admin — Match management with @wordpress/dataviews.
 *
 * Mounted on #cwc26-admin-root by class-cwc26-admin.php.
 */
import { render, useState, useEffect, useCallback } from '@wordpress/element';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { Button, TextControl, Flex, FlexItem, Notice } from '@wordpress/components';
import type { View, Action } from '@wordpress/dataviews';

// ── Types ──────────────────────────────────────────────────────────────────

interface Match {
	id:           number;
	utc:          string;
	stadium:      string;
	round:        string;
	phase:        string;
	group:        string | null;
	home:         string;
	away:         string;
	home_score:   number | null;
	away_score:   number | null;
	match_status: string;
}

interface ScoreEdit {
	matchId:   number;
	homeScore: string;
	awayScore: string;
	status:    string;
}

declare const CWC26Admin: { restUrl: string; nonce: string };

// ── Helpers ────────────────────────────────────────────────────────────────

// Flag URL uses lowercase FIFA code — files live in assets/flags/
declare const wpApiSettings: { root: string };
function flagUrl( fifaCode: string ): string {
	return `${ ( window as any ).CWC26Admin?.pluginUrl ?? '' }assets/flags/${ fifaCode.toLowerCase() }.svg`;
}

function roundLabel( round: string ): string {
	const map: Record<string, string> = {
		'1': 'R1', '2': 'R2', '3': 'R3',
		r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', f: 'F', po: 'PO',
	};
	return map[ round ] ?? round;
}

// ── Main component ─────────────────────────────────────────────────────────

function MatchesAdmin(): JSX.Element {
	const [ matches, setMatches ] = useState<Match[]>( [] );
	const [ loading, setLoading ] = useState( true );
	const [ notice,  setNotice  ] = useState<{ type: 'success' | 'error'; msg: string } | null>( null );
	const [ editing, setEditing ] = useState<ScoreEdit | null>( null );

	const [ view, setView ] = useState<View>( {
		type:    'table',
		perPage: 20,
		page:    1,
		sort:    { field: 'utc', direction: 'asc' },
		filters: [],
		fields:  [ 'utc', 'fixture', 'round', 'score', 'status' ],
	} );

	// Fetch all matches.
	const fetchMatches = useCallback( async () => {
		setLoading( true );
		try {
			const res = await fetch( `${ CWC26Admin.restUrl }/matches?per_page=104`, {
				headers: { 'X-WP-Nonce': CWC26Admin.nonce },
			} );
			const data = await res.json();
			setMatches( Array.isArray( data ) ? data : [] );
		} catch {
			setNotice( { type: 'error', msg: 'Failed to load matches.' } );
		} finally {
			setLoading( false );
		}
	}, [] );

	useEffect( () => { fetchMatches(); }, [ fetchMatches ] );

	// Save score.
	const saveScore = useCallback( async () => {
		if ( ! editing ) return;

		const body: Record<string, unknown> = {
			home_score:   parseInt( editing.homeScore, 10 ),
			away_score:   parseInt( editing.awayScore, 10 ),
			match_status: editing.status,
		};

		try {
			const res = await fetch( `${ CWC26Admin.restUrl }/matches/${ editing.matchId }/score`, {
				method:  'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CWC26Admin.nonce },
				body:    JSON.stringify( body ),
			} );

			if ( ! res.ok ) throw new Error( await res.text() );

			const updated: Match = await res.json();
			setMatches( prev => prev.map( m => m.id === updated.id ? updated : m ) );
			setNotice( { type: 'success', msg: `Match ${ editing.matchId } saved.` } );
			setEditing( null );
		} catch ( e ) {
			setNotice( { type: 'error', msg: String( e ) } );
		}
	}, [ editing ] );

	// ── DataViews config ────────────────────────────────────────────────

	const fields = [
		{
			id:    'utc',
			label: 'Date / Time (UTC)',
			getValue: ( { item }: { item: Match } ) =>
				new Date( item.utc ).toLocaleString( 'en-GB', { dateStyle: 'short', timeStyle: 'short' } ),
			enableSorting: true,
		},
		{
			id:    'fixture',
			label: 'Fixture',
			getValue: ( { item }: { item: Match } ) => `${ item.home } × ${ item.away }`,
			render: ( { item }: { item: Match } ) => (
				<span style={ { display: 'flex', gap: 6, alignItems: 'center' } }>
					<span>{ item.home }</span>
					<span style={ { opacity: .4 } }>×</span>
					<span>{ item.away }</span>
				</span>
			),
			enableSorting: false,
		},
		{
			id:    'round',
			label: 'Round',
			getValue: ( { item }: { item: Match } ) => roundLabel( item.round ),
			enableSorting: true,
			filterBy: { operators: [ 'is' ] },
			elements: [
				{ value: '1', label: 'Group R1' }, { value: '2', label: 'Group R2' },
				{ value: '3', label: 'Group R3' }, { value: 'r32', label: 'Round of 32' },
				{ value: 'r16', label: 'Round of 16' }, { value: 'qf', label: 'Quarter-finals' },
				{ value: 'sf', label: 'Semi-finals' }, { value: 'f', label: 'Final' },
			],
		},
		{
			id:    'score',
			label: 'Score',
			getValue: ( { item }: { item: Match } ) =>
				item.home_score !== null ? `${ item.home_score } – ${ item.away_score }` : '–',
			enableSorting: false,
		},
		{
			id:    'status',
			label: 'Status',
			getValue: ( { item }: { item: Match } ) => item.match_status,
			enableSorting: true,
			filterBy: { operators: [ 'is' ] },
			elements: [
				{ value: 'scheduled', label: 'Scheduled' },
				{ value: 'live',      label: 'Live' },
				{ value: 'finished',  label: 'Finished' },
			],
		},
	];

	const actions: Action<Match>[] = [
		{
			id:    'edit-score',
			label: 'Edit score',
			icon:  '✏️',
			callback: ( [ item ]: Match[] ) => {
				setEditing( {
					matchId:   item.id,
					homeScore: item.home_score !== null ? String( item.home_score ) : '',
					awayScore: item.away_score !== null ? String( item.away_score ) : '',
					status:    item.match_status,
				} );
			},
		},
	];

	const { data: viewData, paginationInfo } = filterSortAndPaginate( matches, view, fields );

	return (
		<div style={ { padding: '1.5rem' } }>
			<h1>{ 'WC2026 Matches' }</h1>

			{ notice && (
				<Notice
					status={ notice.type }
					isDismissible
					onRemove={ () => setNotice( null ) }
				>
					{ notice.msg }
				</Notice>
			) }

			{ /* Score edit panel */ }
			{ editing && (
				<div style={ { background: '#f6f7f7', border: '1px solid #ddd', borderRadius: 4, padding: '1rem', marginBottom: '1rem' } }>
					<strong>{ `Edit match #${ editing.matchId }` }</strong>
					<Flex style={ { marginTop: 8 } }>
						<FlexItem>
							<TextControl
								label="Home score"
								type="number"
								value={ editing.homeScore }
								onChange={ v => setEditing( e => e && { ...e, homeScore: v } ) }
								min={ 0 }
							/>
						</FlexItem>
						<FlexItem>
							<TextControl
								label="Away score"
								type="number"
								value={ editing.awayScore }
								onChange={ v => setEditing( e => e && { ...e, awayScore: v } ) }
								min={ 0 }
							/>
						</FlexItem>
						<FlexItem>
							<label style={ { display: 'block', marginBottom: 4, fontSize: 11 } }>Status</label>
							<select
								value={ editing.status }
								onChange={ e => setEditing( ed => ed && { ...ed, status: e.target.value } ) }
								style={ { height: 30 } }
							>
								<option value="scheduled">Scheduled</option>
								<option value="live">Live</option>
								<option value="finished">Finished</option>
							</select>
						</FlexItem>
						<FlexItem>
							<Button variant="primary" onClick={ saveScore } style={ { marginTop: 20 } }>Save</Button>
						</FlexItem>
						<FlexItem>
							<Button variant="tertiary" onClick={ () => setEditing( null ) } style={ { marginTop: 20 } }>Cancel</Button>
						</FlexItem>
					</Flex>
				</div>
			) }

			{ loading ? (
				<p>Loading…</p>
			) : (
				<DataViews<Match>
					data={ viewData }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					actions={ actions }
					paginationInfo={ paginationInfo }
					getItemId={ ( item ) => String( item.id ) }
					defaultLayouts={ { table: {} } }
				/>
			) }
		</div>
	);
}

// ── Mount ─────────────────────────────────────────────────────────────────

const root = document.getElementById( 'cwc26-admin-root' );
if ( root ) {
	render( <MatchesAdmin />, root );
}
