/**
 * KnockoutView — bracket navigation with score entry.
 *
 * Mobile: round-selector tabs + match grid.
 * Desktop (≥ 900px): classic bracket columns from R32 to Final.
 * Bracket slots resolve to real teams when upstream scores are entered.
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import type { ScoresMap, KnockoutPhase, MatchScore } from '../types';
import { wc26data, getTeam, getStadium, KNOCKOUT_LABELS, getAllMatches } from '../data';
import { fmtTime, fmtDateShort, resolveSlot } from '../utils';
import ScoreInput from '../components/ScoreInput';
import MatchDetail from '../components/MatchDetail';

interface KnockoutViewProps {
	timezone:        string;
	scores:          ScoresMap;
	selectedMatchId: number | null;
	onSelectMatch:   ( id: number | null ) => void;
	onSaveScore:     ( id: number, score: MatchScore ) => void;
	onDeleteScore:   ( id: number ) => void;
}

const PHASES: KnockoutPhase[] = [
	'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'finals',
];

const SHORT_LABELS: Record<KnockoutPhase, string> = {
	round_of_32:    'R32',
	round_of_16:    'R16',
	quarter_finals: 'QF',
	semi_finals:    'SF',
	finals:         '🏆',
};

export default function KnockoutView( {
	timezone, scores, selectedMatchId, onSelectMatch, onSaveScore, onDeleteScore,
}: KnockoutViewProps ): JSX.Element {
	const [ round, setRound ] = useState<KnockoutPhase>( 'round_of_32' );
	const [ editingId, setEditingId ] = useState<number | null>( null );
	const containerRef = useRef<HTMLDivElement>( null );
	const [ isDesktop, setIsDesktop ] = useState( false );

	useEffect( () => {
		function check() {
			setIsDesktop( ( containerRef.current?.offsetWidth ?? 0 ) >= 900 );
		}
		check();
		const ro = new ResizeObserver( check );
		if ( containerRef.current ) ro.observe( containerRef.current );
		return () => ro.disconnect();
	}, [] );

	// Build matchById map for slot resolution.
	const matchById = new Map(
		getAllMatches().map( m => [ m.id, { home: m.home, away: m.away } ] )
	);

	function resolveTeam( slot: string ): string {
		const resolved = resolveSlot( slot, scores, matchById );
		return resolved ?? slot;
	}

	// Detail panel.
	if ( selectedMatchId !== null ) {
		const match = getAllMatches().find( m => m.id === selectedMatchId );
		if ( match ) {
			return (
				<div ref={ containerRef }>
					<MatchDetail
						match={ match }
						timezone={ timezone }
						score={ scores[ match.id ] }
						onBack={ () => onSelectMatch( null ) }
						onSave={ onSaveScore }
						onDelete={ onDeleteScore }
					/>
				</div>
			);
		}
	}

	function KoMatchCard( { m }: { m: { id: number; round: string; utc: string; stadium: string; home: string; away: string; label?: string } } ) {
		const homeCode = resolveTeam( m.home );
		const awayCode = resolveTeam( m.away );
		const h   = getTeam( homeCode );
		const a   = getTeam( awayCode );
		const std = getStadium( m.stadium );
		const sc  = scores[ m.id ];
		const hasScore = sc?.homeGoals != null && sc?.awayGoals != null;
		const isTied   = hasScore && sc!.homeGoals === sc!.awayGoals;
		const hasPens  = isTied && sc?.homePenalties != null;

		if ( editingId === m.id ) {
			return (
				<div className="wc2026-ko-card wc2026-ko-card--editing">
					<ScoreInput
						matchId={ m.id }
						home={ homeCode }
						away={ awayCode }
						isKnockout={ true }
						current={ sc }
						onSave={ s => { onSaveScore( m.id, s ); setEditingId( null ); } }
						onCancel={ () => setEditingId( null ) }
					/>
				</div>
			);
		}

		return (
			<div
				className={ `wc2026-ko-card${ hasScore ? ' has-score' : '' }` }
				onClick={ () => onSelectMatch( m.id ) }
				role="button"
				tabIndex={ 0 }
				onKeyDown={ e => { if ( e.key === 'Enter' ) onSelectMatch( m.id ); } }
			>
				<div className="wc2026-ko-card-header">
					<span className="ko-id">#{ m.id }</span>
					<span>{ fmtDateShort( m.utc, timezone ) }</span>
					<span>{ fmtTime( m.utc, timezone ) }</span>
					<span>{ std.city }</span>
				</div>
				<div className="wc2026-ko-matchup">
					<div className="wc2026-ko-team">
						<img className="flag" src={ h.flag_url } alt={ h.name } width="28" height="21" loading="lazy" />
						<span className="name">{ h.name }</span>
					</div>
					{ hasScore ? (
						<span className="wc2026-ko-score">
							{ sc!.homeGoals }–{ sc!.awayGoals }
							{ hasPens && <small>({ sc!.homePenalties }–{ sc!.awayPenalties }p)</small> }
						</span>
					) : (
						<span className="wc2026-ko-vs">×</span>
					) }
					<div className="wc2026-ko-team">
						<img className="flag" src={ a.flag_url } alt={ a.name } width="28" height="21" loading="lazy" />
						<span className="name">{ a.name }</span>
					</div>
				</div>
				<div className="wc2026-ko-card-footer">
					<button
						className="wc2026-edit-btn"
						onClick={ e => { e.stopPropagation(); setEditingId( m.id ); } }
						title="Edit score"
					>✏️</button>
				</div>
			</div>
		);
	}

	// ── Desktop bracket ──────────────────────────────────────────────────
	if ( isDesktop ) {
		return (
			<div ref={ containerRef } className="wc2026-bracket-wrap">
				<div className="wc2026-bracket">
					{ PHASES.map( phase => (
						<div key={ phase } className="wc2026-bracket-col">
							<div className="bracket-col-label">{ KNOCKOUT_LABELS[ phase ] }</div>
							{ ( wc26data.knockout[ phase ] ?? [] ).map( m => (
								<KoMatchCard key={ m.id } m={ m } />
							) ) }
						</div>
					) ) }
				</div>
			</div>
		);
	}

	// ── Mobile: round tabs + grid ─────────────────────────────────────────
	return (
		<div ref={ containerRef }>
			<div className="wc2026-ko-rounds" role="tablist">
				{ PHASES.map( phase => (
					<button
						key={ phase }
						role="tab"
						className={ `wc2026-ko-btn${ round === phase ? ' is-active' : '' }` }
						onClick={ () => { setRound( phase ); setEditingId( null ); } }
						title={ KNOCKOUT_LABELS[ phase ] }
					>
						{ SHORT_LABELS[ phase ] }
					</button>
				) ) }
			</div>
			<div className="wc2026-section-title">{ KNOCKOUT_LABELS[ round ] }</div>
			<div className="wc2026-ko-grid">
				{ ( wc26data.knockout[ round ] ?? [] ).map( m => (
					<KoMatchCard key={ m.id } m={ m } />
				) ) }
			</div>
		</div>
	);
}
