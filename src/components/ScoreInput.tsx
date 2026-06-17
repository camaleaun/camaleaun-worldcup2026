/**
 * ScoreInput — inline score editor embedded within a match card.
 *
 * Shows two number spinners (home / away goals). For knockout matches where
 * goals are level after 90 min, a "Penalties" toggle reveals two extra inputs.
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import type { MatchScore } from '../types';
import { getTeam } from '../data';
import { knockoutCanHavePenalties } from '../data';

interface ScoreInputProps {
	matchId:    number;
	home:       string; // FIFA code or bracket slot
	away:       string;
	isKnockout: boolean;
	current?:   MatchScore;
	onSave:     ( score: MatchScore ) => void;
	onCancel:   () => void;
}

export default function ScoreInput( {
	home, away, isKnockout, current, onSave, onCancel,
}: ScoreInputProps ): JSX.Element {
	const homeTeam = getTeam( home );
	const awayTeam = getTeam( away );

	const [ homeGoals, setHomeGoals ] = useState<string>( current?.homeGoals?.toString() ?? '' );
	const [ awayGoals, setAwayGoals ] = useState<string>( current?.awayGoals?.toString() ?? '' );
	const [ showPens, setShowPens ] = useState( false );
	const [ homePens, setHomePens ] = useState<string>( current?.homePenalties?.toString() ?? '' );
	const [ awayPens, setAwayPens ] = useState<string>( current?.awayPenalties?.toString() ?? '' );
	const homeRef = useRef<HTMLInputElement>( null );

	// Auto-focus home goals input on mount.
	useEffect( () => { homeRef.current?.focus(); }, [] );

	// Show penalty section automatically if existing score was tied.
	useEffect( () => {
		if (
			current?.homeGoals !== null && current?.homeGoals !== undefined &&
			current?.awayGoals !== null && current?.awayGoals !== undefined &&
			current.homeGoals === current.awayGoals &&
			isKnockout
		) {
			setShowPens( true );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const isTied = homeGoals !== '' && awayGoals !== '' && homeGoals === awayGoals;
	const canShowPens = isKnockout && isTied;

	function handleSave( e: React.FormEvent ) {
		e.preventDefault();
		const hg = homeGoals !== '' ? parseInt( homeGoals, 10 ) : null;
		const ag = awayGoals !== '' ? parseInt( awayGoals, 10 ) : null;

		const score: MatchScore = { homeGoals: hg, awayGoals: ag };

		if ( isKnockout && showPens && isTied ) {
			score.homePenalties = homePens !== '' ? parseInt( homePens, 10 ) : null;
			score.awayPenalties = awayPens !== '' ? parseInt( awayPens, 10 ) : null;
		}

		onSave( score );
	}

	function numInput(
		value: string,
		setter: ( v: string ) => void,
		ref?: React.RefObject<HTMLInputElement>,
	) {
		return (
			<input
				ref={ ref }
				type="number"
				min={ 0 }
				max={ 30 }
				value={ value }
				onChange={ e => setter( e.target.value ) }
				className="wc2026-score-input"
				aria-label="Goals"
			/>
		);
	}

	return (
		<form className="wc2026-score-form" onSubmit={ handleSave }>
			<div className="wc2026-score-row">
				<span className="wc2026-score-team">
					<img className="flag" src={ homeTeam.flag_url } alt={ homeTeam.name } width="16" height="12" loading="lazy" />
					<span className="name">{ homeTeam.name }</span>
				</span>
				{ numInput( homeGoals, setHomeGoals, homeRef ) }
				<span className="wc2026-score-sep">–</span>
				{ numInput( awayGoals, setAwayGoals ) }
				<span className="wc2026-score-team wc2026-score-team--away">
					<span className="name">{ awayTeam.name }</span>
					<img className="flag" src={ awayTeam.flag_url } alt={ awayTeam.name } width="16" height="12" loading="lazy" />
				</span>
			</div>

			{ canShowPens && (
				<div className="wc2026-pens-toggle">
					<label className="wc2026-pens-label">
						<input
							type="checkbox"
							checked={ showPens }
							onChange={ e => setShowPens( e.target.checked ) }
						/>
						{ ' ' }⚡ Penalties
					</label>
					{ showPens && (
						<div className="wc2026-score-row wc2026-score-row--pens">
							<span className="wc2026-score-team">
								<span className="name">{ homeTeam.name }</span>
							</span>
							{ numInput( homePens, setHomePens ) }
							<span className="wc2026-score-sep">–</span>
							{ numInput( awayPens, setAwayPens ) }
							<span className="wc2026-score-team wc2026-score-team--away">
								<span className="name">{ awayTeam.name }</span>
							</span>
						</div>
					) }
				</div>
			) }

			<div className="wc2026-score-actions">
				<button type="submit" className="wc2026-btn wc2026-btn--save">💾 Save</button>
				<button type="button" className="wc2026-btn wc2026-btn--cancel" onClick={ onCancel }>✕ Cancel</button>
			</div>
		</form>
	);
}
