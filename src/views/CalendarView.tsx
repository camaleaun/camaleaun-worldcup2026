/**
 * CalendarView — groups all 104 matches by local date (timezone-aware).
 *
 * Clicking a card → MatchDetail. Clicking ✏️ → inline ScoreInput.
 */
import type { ScoresMap, MatchScore } from '../types';
import { getAllMatches } from '../data';
import { dateKey, fmtDateShort } from '../utils';
import MatchCard from '../components/MatchCard';
import MatchDetail from '../components/MatchDetail';

interface CalendarViewProps {
	timezone:        string;
	scores:          ScoresMap;
	selectedMatchId: number | null;
	editingMatchId:  number | null;
	onSelectMatch:   ( id: number | null ) => void;
	onEditMatch:     ( id: number | null ) => void;
	onSaveScore:     ( id: number, score: MatchScore ) => void;
	onDeleteScore:   ( id: number ) => void;
}

export default function CalendarView( {
	timezone, scores, selectedMatchId, editingMatchId,
	onSelectMatch, onEditMatch, onSaveScore, onDeleteScore,
}: CalendarViewProps ): JSX.Element {
	const all = getAllMatches();

	// Show full detail when a match is selected.
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

	// Group by local date key.
	const days = new Map<string, typeof all>();
	for ( const m of all ) {
		const key = dateKey( m.utc, timezone );
		if ( ! days.has( key ) ) days.set( key, [] );
		days.get( key )!.push( m );
	}

	return (
		<div className="wc2026-calendar">
			{ Array.from( days.entries() ).map( ( [ dk, matches ] ) => (
				<div key={ dk } className="wc2026-day-group">
					<div className="wc2026-day-header">
						{ fmtDateShort( matches[ 0 ].utc, timezone ) }
						<span className="day-year">{ dk.slice( 0, 4 ) }</span>
						<span className="day-count">{ matches.length } match{ matches.length > 1 ? 'es' : '' }</span>
					</div>
					{ matches.map( m => (
						<MatchCard
							key={ m.id }
							match={ m }
							timezone={ timezone }
							score={ scores[ m.id ] }
							isEditing={ editingMatchId === m.id }
							onEdit={ () => onEditMatch( m.id ) }
							onSave={ s => { onSaveScore( m.id, s ); onEditMatch( null ); } }
							onCancelEdit={ () => onEditMatch( null ) }
							onClick={ () => onSelectMatch( m.id ) }
						/>
					) ) }
				</div>
			) ) }
		</div>
	);
}
