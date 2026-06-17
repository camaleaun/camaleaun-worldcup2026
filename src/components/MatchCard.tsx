/**
 * MatchCard — versatile card component used in Calendar, Groups and Knockout views.
 *
 * Displays time, teams, optional score and an edit button.
 * When `isEditing` is true the card body is replaced with ScoreInput.
 */
import type { MatchWithPhase, MatchScore } from '../types';
import { getTeam, getStadium } from '../data';
import { fmtTime } from '../utils';
import ScoreInput from './ScoreInput';

interface MatchCardProps {
	match:          MatchWithPhase;
	timezone:       string;
	score?:         MatchScore;
	isEditing:      boolean;
	onEdit:         () => void;
	onSave:         ( score: MatchScore ) => void;
	onCancelEdit:   () => void;
	onClick:        () => void; // Click card body → detail panel
	onSyncMatch?:   ( id: number ) => Promise<unknown>; // Sync official result
}

export default function MatchCard( {
	match, timezone, score, isEditing, onEdit, onSave, onCancelEdit, onClick,
}: MatchCardProps ): JSX.Element {
	const homeTeam = getTeam( match.home );
	const awayTeam = getTeam( match.away );
	const stadium  = getStadium( match.stadium );
	const isKo     = match.phase !== 'group';
	const hasScore = score?.homeGoals !== null && score?.homeGoals !== undefined &&
	                 score?.awayGoals !== null && score?.awayGoals !== undefined;
	const isTied   = hasScore && score!.homeGoals === score!.awayGoals;
	const hasPens  = isTied && score?.homePenalties != null && score?.awayPenalties != null;

	if ( isEditing ) {
		return (
			<div className="wc2026-match-card wc2026-match-card--editing">
				<ScoreInput
					matchId={ match.id }
					home={ match.home }
					away={ match.away }
					isKnockout={ isKo }
					current={ score }
					onSave={ onSave }
					onCancel={ onCancelEdit }
				/>
			</div>
		);
	}

	function ScoreDisplay(): JSX.Element | null {
		if ( ! hasScore ) return null;
		return (
			<span className="wc2026-score-display">
				<span className="score-home">{ score!.homeGoals }</span>
				<span className="score-sep"> – </span>
				<span className="score-away">{ score!.awayGoals }</span>
				{ hasPens && (
					<span className="score-pens">
						({ score!.homePenalties } – { score!.awayPenalties } pens)
					</span>
				) }
			</span>
		);
	}

	return (
		<div
			className={ `wc2026-match-card${ hasScore ? ' has-score' : '' }` }
			role="button"
			tabIndex={ 0 }
			onClick={ onClick }
			onKeyDown={ e => { if ( e.key === 'Enter' || e.key === ' ' ) { e.preventDefault(); onClick(); } } }
		>
			<span className="wc2026-match-time">{ fmtTime( match.utc, timezone ) }</span>

			<span className="wc2026-match-teams">
				<img className="wc2026-match-flag" src={ homeTeam.flag_url } alt={ homeTeam.name } width="20" height="15" loading="lazy" />
				<span className="team-name">{ homeTeam.name }</span>

				{ hasScore ? (
					<ScoreDisplay />
				) : (
					<span className="wc2026-match-sep">×</span>
				) }

				<span className="team-name">{ awayTeam.name }</span>
				<img className="wc2026-match-flag" src={ awayTeam.flag_url } alt={ awayTeam.name } width="20" height="15" loading="lazy" />
			</span>

			<span className="wc2026-match-venue">{ stadium.city }</span>

			<button
				className="wc2026-edit-btn"
				aria-label="Edit score"
				onClick={ e => { e.stopPropagation(); onEdit(); } }
				title="Edit score"
			>
				✏️
			</button>
			{ onSyncMatch && match.match_status === 'finished' && (
				<button
					className="wc2026-sync-match-btn"
					aria-label="Sync official result"
					onClick={ e => { e.stopPropagation(); onSyncMatch( match.id ); } }
					title="Sync official result"
				>
					⬇️
				</button>
			) }
		</div>
	);
}
