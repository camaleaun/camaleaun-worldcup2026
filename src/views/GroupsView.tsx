/**
 * GroupsView — grid of 12 group cards → click → detail with live standings.
 *
 * Standings are computed live from entered scores. Round switcher navigates
 * between the 3 group-stage rounds.
 */
import { useState } from '@wordpress/element';
import type { ScoresMap, MatchScore } from '../types';
import { wc26data, getTeam, getStadium } from '../data';
import { calcStandings, fmtTime } from '../utils';
import ScoreInput from '../components/ScoreInput';

interface GroupsViewProps {
	timezone:      string;
	scores:        ScoresMap;
	onSaveScore:   ( id: number, score: MatchScore ) => void;
	onDeleteScore: ( id: number ) => void;
}

function GroupDetail( {
	groupId, timezone, scores, onSaveScore, onDeleteScore, onBack,
}: GroupsViewProps & { groupId: string; onBack: () => void } ): JSX.Element {
	const [ round, setRound ]       = useState( '1' );
	const [ editingId, setEditingId ] = useState<number | null>( null );

	const group     = wc26data.groups[ groupId ];
	const standings = calcStandings( group, scores );
	const roundMatches = group.matches.filter( m => m.round === round );

	return (
		<div className="wc2026-group-detail">
			<div className="wc2026-group-detail-header">
				<button className="wc2026-group-back" onClick={ onBack }>← All Groups</button>
				<span className="wc2026-group-title">Group { groupId }</span>
			</div>

			{/* Standings */}
			<div className="wc2026-section-title">Standings</div>
			<table className="wc2026-standings">
				<thead>
					<tr>
						<th>#</th>
						<th>Team</th>
						<th title="Matches Played">MP</th>
						<th title="Wins">W</th>
						<th title="Draws">D</th>
						<th title="Losses">L</th>
						<th title="Goals For">GF</th>
						<th title="Goals Against">GA</th>
						<th title="Goal Difference">GD</th>
						<th title="Points" className="s-pts">Pts</th>
					</tr>
				</thead>
				<tbody>
					{ standings.map( ( s, i ) => {
						const t = getTeam( s.code );
						const qualified = i < 2; // Top 2 advance (simplified)
						return (
							<tr key={ s.code } className={ qualified ? 'row-qualified' : '' }>
								<td className="s-muted">{ i + 1 }</td>
								<td><div className="s-team"><span>{ t.flag }</span><span>{ t.name }</span></div></td>
								<td className="s-muted">{ s.mp }</td>
								<td className="s-muted">{ s.w  }</td>
								<td className="s-muted">{ s.d  }</td>
								<td className="s-muted">{ s.l  }</td>
								<td className="s-muted">{ s.gf }</td>
								<td className="s-muted">{ s.ga }</td>
								<td className="s-muted">{ s.gd }</td>
								<td className="s-pts">{ s.pts }</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>

			{/* Round switcher */}
			<div className="wc2026-round-switcher">
				{ [ '1', '2', '3' ].map( r => (
					<button
						key={ r }
						className={ `wc2026-round-btn${ r === round ? ' is-active' : '' }` }
						onClick={ () => { setRound( r ); setEditingId( null ); } }
					>
						Round { r }
					</button>
				) ) }
			</div>

			{/* Matches */}
			<div className="wc2026-section-title">Matches — Round { round }</div>
			{ roundMatches.map( m => {
				const h = getTeam( m.home );
				const a = getTeam( m.away );
				const std = getStadium( m.stadium );
				const sc  = scores[ m.id ];
				const hasScore = sc?.homeGoals != null && sc?.awayGoals != null;

				if ( editingId === m.id ) {
					return (
						<div key={ m.id } className="wc2026-match-card wc2026-match-card--editing">
							<ScoreInput
								matchId={ m.id }
								home={ m.home }
								away={ m.away }
								isKnockout={ false }
								current={ sc }
								onSave={ s => { onSaveScore( m.id, s ); setEditingId( null ); } }
								onCancel={ () => setEditingId( null ) }
							/>
						</div>
					);
				}

				return (
					<div key={ m.id } className={ `wc2026-match-card${ hasScore ? ' has-score' : '' }` }>
						<span className="wc2026-match-time">{ fmtTime( m.utc, timezone ) }</span>
						<span className="wc2026-match-teams">
							<span className="wc2026-match-flag">{ h.flag }</span>
							<span className="team-name">{ h.name }</span>
							{ hasScore ? (
								<span className="wc2026-score-display">
									<span className="score-home">{ sc!.homeGoals }</span>
									<span className="score-sep"> – </span>
									<span className="score-away">{ sc!.awayGoals }</span>
								</span>
							) : (
								<span className="wc2026-match-sep">×</span>
							) }
							<span className="team-name">{ a.name }</span>
							<span className="wc2026-match-flag">{ a.flag }</span>
						</span>
						<span className="wc2026-match-venue">{ std.city }</span>
						<button
							className="wc2026-edit-btn"
							onClick={ () => setEditingId( m.id ) }
							title="Edit score"
						>✏️</button>
					</div>
				);
			} ) }
		</div>
	);
}

export default function GroupsView( props: GroupsViewProps ): JSX.Element {
	const [ selected, setSelected ] = useState<string | null>( null );

	if ( selected ) {
		return (
			<GroupDetail
				{ ...props }
				groupId={ selected }
				onBack={ () => setSelected( null ) }
			/>
		);
	}

	return (
		<div className="wc2026-groups-grid">
			{ Object.entries( wc26data.groups ).map( ( [ gid, g ] ) => {
				const played = g.matches.filter( m => props.scores[ m.id ]?.homeGoals != null ).length;
				return (
					<button
						key={ gid }
						className="wc2026-group-card"
						onClick={ () => setSelected( gid ) }
						aria-label={ `Group ${ gid }` }
					>
						<div className="wc2026-group-label">Group { gid }</div>
						<div className="wc2026-group-teams">
							{ g.teams.map( code => {
								const t = getTeam( code );
								return (
									<div key={ code } className="wc2026-group-team">
										<span className="flag">{ t.flag }</span>
										<span>{ t.name }</span>
									</div>
								);
							} ) }
						</div>
						{ played > 0 && (
							<div className="wc2026-group-progress">
								{ played }/{ g.matches.length } played
							</div>
						) }
					</button>
				);
			} ) }
		</div>
	);
}
