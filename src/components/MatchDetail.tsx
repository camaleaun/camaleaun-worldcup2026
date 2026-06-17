/**
 * MatchDetail — full-screen panel for a single match.
 *
 * Shows teams, score (with edit capability), date/time and venue.
 * Rendered by CalendarView, MatchesView and KnockoutView when a match is selected.
 */
import type { MatchWithPhase, MatchScore } from '../types';
import { getTeam, getStadium, KNOCKOUT_LABELS } from '../data';
import { fmtTime, fmtDateFull } from '../utils';
import ScoreInput from './ScoreInput';
import { useState } from '@wordpress/element';

interface MatchDetailProps {
	match:    MatchWithPhase;
	timezone: string;
	score?:   MatchScore;
	onBack:   () => void;
	onSave:   ( id: number, score: MatchScore ) => void;
	onDelete: ( id: number ) => void;
}

export default function MatchDetail( {
	match, timezone, score, onBack, onSave, onDelete,
}: MatchDetailProps ): JSX.Element {
	const [ editing, setEditing ] = useState( false );

	const homeTeam = getTeam( match.home );
	const awayTeam = getTeam( match.away );
	const stadium  = getStadium( match.stadium );
	const isKo     = match.phase !== 'group';
	const hasScore = score?.homeGoals !== null && score?.homeGoals !== undefined &&
	                 score?.awayGoals !== null && score?.awayGoals !== undefined;
	const isTied   = hasScore && score!.homeGoals === score!.awayGoals;
	const hasPens  = isTied && score?.homePenalties != null;

	function roundLabel(): string {
		if ( match.phase === 'group' ) {
			return `Group ${ match.group } — Round ${ match.round }`;
		}
		return KNOCKOUT_LABELS[ match.phase ] ?? match.round;
	}

	return (
		<div className="wc2026-detail">
			<button className="wc2026-detail-back" onClick={ onBack }>← Back</button>

			<div className="wc2026-detail-badge">{ roundLabel() }</div>

			<div className="wc2026-detail-hero">
				<div className="wc2026-detail-team">
					<img className="wc2026-detail-flag" src={ homeTeam.flag_url } alt={ homeTeam.name } width="52" height="39" loading="lazy" />
					<span className="wc2026-detail-name">{ homeTeam.name }</span>
				</div>

				<div className="wc2026-detail-score">
					{ hasScore ? (
						<>
							<span className="detail-score-main">
								{ score!.homeGoals } – { score!.awayGoals }
							</span>
							{ hasPens && (
								<span className="detail-score-pens">
									({ score!.homePenalties } – { score!.awayPenalties } pens)
								</span>
							) }
						</>
					) : (
						<span className="detail-score-vs">×</span>
					) }
				</div>

				<div className="wc2026-detail-team">
					<img className="wc2026-detail-flag" src={ awayTeam.flag_url } alt={ awayTeam.name } width="52" height="39" loading="lazy" />
					<span className="wc2026-detail-name">{ awayTeam.name }</span>
				</div>
			</div>

			{ editing ? (
				<ScoreInput
					matchId={ match.id }
					home={ match.home }
					away={ match.away }
					isKnockout={ isKo }
					current={ score }
					onSave={ s => { onSave( match.id, s ); setEditing( false ); } }
					onCancel={ () => setEditing( false ) }
				/>
			) : (
				<div className="wc2026-detail-actions">
					<button className="wc2026-btn wc2026-btn--edit" onClick={ () => setEditing( true ) }>
						✏️ { hasScore ? 'Edit score' : 'Enter score' }
					</button>
					{ hasScore && (
						<button
							className="wc2026-btn wc2026-btn--delete"
							onClick={ () => { onDelete( match.id ); onBack(); } }
						>
							🗑 Remove score
						</button>
					) }
				</div>
			) }

			<ul className="wc2026-detail-meta">
				<li>
					<span className="meta-icon">📅</span>
					<span className="meta-label">Date</span>
					<span className="meta-value">{ fmtDateFull( match.utc, timezone ) }</span>
				</li>
				<li>
					<span className="meta-icon">🕐</span>
					<span className="meta-label">Time</span>
					<span className="meta-value">
						{ fmtTime( match.utc, timezone ) }
						{ ' ' }
						<span className="meta-tz">({ timezone.replace( /_/g, ' ' ) })</span>
					</span>
				</li>
				<li>
					<span className="meta-icon">📍</span>
					<span className="meta-label">Venue</span>
					<span className="meta-value">{ stadium.city } — { stadium.name }</span>
				</li>
			</ul>
		</div>
	);
}
