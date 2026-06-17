/**
 * MatchesView — DataViews-style table of all matches with filter chips.
 *
 * Filters: All | Group Stage | Knockout | Group A … Group L
 * Mobile: compact table with hidden venue/round columns.
 */
import { useState } from '@wordpress/element';
import type { ScoresMap, MatchFilter, MatchScore } from '../types';
import { getAllMatches, wc26data, getTeam, getStadium, KNOCKOUT_LABELS } from '../data';
import { fmtTime, fmtDateShort } from '../utils';
import MatchDetail from '../components/MatchDetail';

interface MatchesViewProps {
	timezone:        string;
	scores:          ScoresMap;
	selectedMatchId: number | null;
	onSelectMatch:   ( id: number | null ) => void;
	onSaveScore:     ( id: number, score: MatchScore ) => void;
	onDeleteScore:   ( id: number ) => void;
}

export default function MatchesView( {
	timezone, scores, selectedMatchId, onSelectMatch, onSaveScore, onDeleteScore,
}: MatchesViewProps ): JSX.Element {
	const [ filter, setFilter ] = useState<MatchFilter>( 'all' );
	const all = getAllMatches();

	// Detail panel.
	if ( selectedMatchId !== null ) {
		const match = all.find( m => m.id === selectedMatchId );
		if ( match ) {
			return (
				<MatchDetail
					match={ match }
					timezone={ timezone }
					score={ scores[ match.id ] }
					onBack={ () => onSelectMatch( null ) }
					onSave={ onSaveScore }
					onDelete={ onDeleteScore }
				/>
			);
		}
	}

	// Filter options.
	const groupIds = Object.keys( wc26data.groups );
	const filters: Array<{ key: MatchFilter; label: string }> = [
		{ key: 'all',      label: 'All Matches' },
		{ key: 'group',    label: 'Group Stage' },
		{ key: 'knockout', label: 'Knockout' },
		...groupIds.map( g => ( { key: `g_${ g }` as MatchFilter, label: `Grp ${ g }` } ) ),
	];

	const filtered = all.filter( m => {
		if ( filter === 'all'      ) return true;
		if ( filter === 'group'    ) return m.phase === 'group';
		if ( filter === 'knockout' ) return m.phase !== 'group';
		if ( filter.startsWith( 'g_' ) ) return m.group === filter.slice( 2 );
		return true;
	} );

	function roundLabel( m: typeof all[0] ): string {
		if ( m.phase === 'group' ) return `Grp ${ m.group } R${ m.round }`;
		return KNOCKOUT_LABELS[ m.phase ] ?? m.round;
	}

	function ScoreCell( { id }: { id: number } ): JSX.Element {
		const s = scores[ id ];
		if ( ! s || s.homeGoals === null ) return <span className="score-none">—</span>;
		const pens = s.homeGoals === s.awayGoals && s.homePenalties != null
			? ` (${ s.homePenalties }–${ s.awayPenalties } pen)` : '';
		return <span className="score-result">{ s.homeGoals }–{ s.awayGoals }{ pens }</span>;
	}

	return (
		<div className="wc2026-matches-view">
			{/* Filter chips */}
			<div className="wc2026-matches-filters" role="group" aria-label="Filter matches">
				{ filters.map( f => (
					<button
						key={ f.key }
						className={ `wc2026-filter-btn${ filter === f.key ? ' is-active' : '' }` }
						onClick={ () => setFilter( f.key ) }
					>
						{ f.label }
					</button>
				) ) }
			</div>

			{/* Table */}
			<div className="wc2026-table-scroll">
				<table className="wc2026-matches-table" role="grid">
					<thead>
						<tr>
							<th className="col-id col-hide-sm">#</th>
							<th className="col-dt">Date / Time</th>
							<th className="col-fixture">Fixture</th>
							<th className="col-score">Score</th>
							<th className="col-venue col-hide-md">Venue</th>
							<th className="col-round col-hide-md">Round</th>
						</tr>
					</thead>
					<tbody>
						{ filtered.map( m => {
							const h = getTeam( m.home );
							const a = getTeam( m.away );
							const s = getStadium( m.stadium );
							return (
								<tr
									key={ m.id }
									onClick={ () => onSelectMatch( m.id ) }
									className={ scores[ m.id ] ? 'has-score' : '' }
								>
									<td className="td-num col-hide-sm">{ m.id }</td>
									<td className="td-time">
										{ fmtDateShort( m.utc, timezone ) }
										<br />
										<small>{ fmtTime( m.utc, timezone ) }</small>
									</td>
									<td className="td-fixture">
										<img src={ h.flag_url } alt={ h.name } width="16" height="12" loading="lazy" /> { h.name }
										<span className="fixture-sep"> × </span>
										<img src={ a.flag_url } alt={ a.name } width="16" height="12" loading="lazy" /> { a.name }
									</td>
									<td className="td-score"><ScoreCell id={ m.id } /></td>
									<td className="td-venue col-hide-md">{ s.city }</td>
									<td className="td-round col-hide-md">{ roundLabel( m ) }</td>
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>
		</div>
	);
}
