/**
 * useTimezone — persists the selected IANA timezone to localStorage.
 */
import { useState, useCallback } from '@wordpress/element';

const STORAGE_KEY = 'wc2026_tz';

function readTz(): string {
	try {
		return localStorage.getItem( STORAGE_KEY ) || Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
}

export function useTimezone(): [ string, ( tz: string ) => void ] {
	const [ timezone, setTimezoneState ] = useState<string>( readTz );

	const setTimezone = useCallback( ( tz: string ) => {
		setTimezoneState( tz );
		try { localStorage.setItem( STORAGE_KEY, tz ); } catch { /* ignore */ }
	}, [] );

	return [ timezone, setTimezone ];
}

/** Curated list of common IANA timezones for the selector. */
export const COMMON_TIMEZONES: string[] = [
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Sao_Paulo',
	'America/Toronto',
	'America/Vancouver',
	'America/Mexico_City',
	'America/Bogota',
	'America/Buenos_Aires',
	'Atlantic/Reykjavik',
	'Europe/London',
	'Europe/Lisbon',
	'Europe/Madrid',
	'Europe/Paris',
	'Europe/Berlin',
	'Africa/Cairo',
	'Africa/Johannesburg',
	'Asia/Riyadh',
	'Asia/Tehran',
	'Asia/Dubai',
	'Asia/Kolkata',
	'Asia/Bangkok',
	'Asia/Singapore',
	'Asia/Tokyo',
	'Asia/Seoul',
	'Australia/Sydney',
	'Pacific/Auckland',
	'UTC',
];
