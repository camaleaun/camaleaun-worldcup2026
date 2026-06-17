/**
 * App — root component for the WC2026 Schedule block.
 *
 * Manages global state (active tab, selected match, timezone, scores)
 * and renders the shell (header + tabs + panel).
 */
import { useState } from '@wordpress/element';
import type { TabKey, MatchScore } from './types';
import { useScores }   from './hooks/useScores';
import { useTimezone, COMMON_TIMEZONES } from './hooks/useTimezone';
import CalendarView  from './views/CalendarView';
import MatchesView   from './views/MatchesView';
import GroupsView    from './views/GroupsView';
import KnockoutView  from './views/KnockoutView';

const TABS: Array<{ key: TabKey; label: string }> = [
	{ key: 'calendar',  label: 'Calendar'  },
	{ key: 'matches',   label: 'Matches'   },
	{ key: 'groups',    label: 'Groups'    },
	{ key: 'knockout',  label: 'Knockout'  },
];

interface AppProps {
	defaultTab:  TabKey;
	resultsUrl:  string;
}

export default function App( { defaultTab, resultsUrl }: AppProps ): JSX.Element {
	const [ tab,          setTab          ] = useState<TabKey>( defaultTab );
	const [ selectedMatch, setSelectedMatch] = useState<number | null>( null );
	const [ editingMatch,  setEditingMatch ] = useState<number | null>( null );
	const [ syncMsg,       setSyncMsg      ] = useState<string>( '' );

	const [ timezone, setTimezone ] = useTimezone();
	const { scores, updateScore, deleteScore, clearScores, syncFromUrl, syncMatchFromRest, syncing } = useScores();

	function switchTab( next: TabKey ) {
		setTab( next );
		setSelectedMatch( null );
		setEditingMatch( null );
	}

	function handleSaveScore( id: number, score: MatchScore ) {
		updateScore( id, score );
		setEditingMatch( null );
	}

	async function handleGitHubSync() {
		if ( ! resultsUrl ) { setSyncMsg( 'No results URL configured.' ); return; }
		setSyncMsg( '⏳ Syncing…' );
		try {
			const { count, updated } = await syncFromUrl( resultsUrl );
			setSyncMsg( `✅ ${ count } results loaded (updated ${ updated.slice( 0, 10 ) })` );
		} catch ( e ) {
			setSyncMsg( `❌ ${ e instanceof Error ? e.message : 'Sync failed' }` );
		}
		setTimeout( () => setSyncMsg( '' ), 6000 );
	}

	const commonProps = {
		timezone,
		scores,
		onSaveScore:      handleSaveScore,
		onDeleteScore:    deleteScore,
		onSyncMatch:      syncMatchFromRest,
	};

	return (
		<div className="wc2026-inner">
			{/* ── Header ──────────────────────────────────────────────── */}
			<div className="wc2026-header">
				<div className="wc2026-title">
					<span className="wc2026-trophy">🏆</span>
					<span>FIFA World Cup 2026™</span>
				</div>
				<div className="wc2026-header-controls">
					{/* Timezone picker */}
					<div className="wc2026-tz-wrap">
						<span aria-hidden="true">🕐</span>
						<select
							className="wc2026-tz"
							aria-label="Timezone"
							value={ timezone }
							onChange={ e => setTimezone( e.target.value ) }
						>
							{ COMMON_TIMEZONES.map( tz => (
								<option key={ tz } value={ tz }>{ tz.replace( /_/g, ' ' ) }</option>
							) ) }
						</select>
					</div>

					{/* GitHub sync */}
					{ resultsUrl && (
						<button
							className="wc2026-sync-btn"
							onClick={ handleGitHubSync }
							disabled={ syncing }
							title="Load results from GitHub"
						>
							{ syncing ? '⏳' : '⬇️' } Sync
						</button>
					) }
				</div>
			</div>

			{/* Sync status message */}
			{ syncMsg && <div className="wc2026-sync-msg">{ syncMsg }</div> }

			{/* ── Tabs ────────────────────────────────────────────────── */}
			<nav className="wc2026-tabs" role="tablist" aria-label="Schedule views">
				{ TABS.map( t => (
					<button
						key={ t.key }
						role="tab"
						className={ `wc2026-tab${ tab === t.key ? ' is-active' : '' }` }
						aria-selected={ tab === t.key }
						onClick={ () => switchTab( t.key ) }
					>
						{ t.label }
					</button>
				) ) }
			</nav>

			{/* ── Panel ───────────────────────────────────────────────── */}
			<div className="wc2026-panel" role="tabpanel">
				{ tab === 'calendar' && (
					<CalendarView
						{ ...commonProps }
						selectedMatchId={ selectedMatch }
						editingMatchId={ editingMatch }
						onSelectMatch={ setSelectedMatch }
						onEditMatch={ setEditingMatch }
					/>
				) }
				{ tab === 'matches' && (
					<MatchesView
						{ ...commonProps }
						selectedMatchId={ selectedMatch }
						onSelectMatch={ setSelectedMatch }
					/>
				) }
				{ tab === 'groups' && (
					<GroupsView { ...commonProps } />
				) }
				{ tab === 'knockout' && (
					<KnockoutView
						{ ...commonProps }
						selectedMatchId={ selectedMatch }
						onSelectMatch={ setSelectedMatch }
					/>
				) }
			</div>
		</div>
	);
}
