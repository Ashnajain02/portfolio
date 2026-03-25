import { env } from '../config/env.js';
import { CACHE_TTL_SHORT } from '../config/constants.js';

/**
 * Raw response type from the Eternal Entries journal stats API.
 * Only aggregated statistics — never raw entry content.
 */
export interface JournalStats {
  streaks: {
    current: number;
    longest: number;
  };
  activity: {
    totalEntries: number;
    lastEntryDate: string;
    firstEntryDate: string;
    entriesThisWeek: number;
    entriesThisMonth: number;
    entriesThisYear: number;
    avgEntriesPerWeek: number;
    totalDaysJournaled: number;
  };
  timePatterns: {
    favoriteHour: { hour: string; count: number };
    favoriteDay: { day: string; count: number };
    dayDistribution: Array<{ day: string; entries: number }>;
  };
  mood: {
    current: string;
    mostFrequent: { mood: string; count: number };
    mostFrequentThisMonth: { mood: string; count: number };
    distribution: Record<string, number>;
  };
  music: {
    recentSong: {
      name: string;
      artist: string;
      album: string;
      albumArt: string;
    } | null;
    topArtist: { artist: string; count: number } | null;
    entriesWithSongs: number;
    entriesWithoutSongs: number;
    uniqueArtists: number;
  };
  weather: {
    mostCommonCondition: { condition: string; count: number };
    averageTemperatureCelsius: number;
    mostCommonLocation: { location: string; count: number };
  };
  writing: {
    totalWords: number;
    avgWordCount: number;
    longestEntry: { words: number; date: string };
    entriesWithReflections: number;
    entriesWithTasks: number;
  };
  habits: Record<string, unknown> | null;
}

// ============================================================
// Journal entry types (from /journal-info endpoint)
// ============================================================
export interface JournalEntry {
  id: string;
  timestamp: string;
  date: string;
  mood: string;
  weather: {
    temperature: number;
    description: string;
    icon: string;
    location: string;
  } | null;
  track: {
    name: string;
    artist: string;
    album: string;
    albumArt: string;
  } | null;
  reflection: {
    question: string;
    hasAnswer: boolean;
  } | null;
}

export interface JournalInfoResponse {
  entries: JournalEntry[];
  count: number;
}

let cachedStats: { data: JournalStats; fetchedAt: number } | null = null;

/**
 * Fetches journal stats from the Eternal Entries API.
 * Caches results for 5 minutes to avoid hammering the endpoint.
 */
export async function fetchJournalStats(): Promise<JournalStats> {
  if (!env.JOURNAL_API_URL || !env.JOURNAL_API_KEY) {
    throw new Error('Journal API not configured');
  }

  // Return cached data if fresh
  if (cachedStats && Date.now() - cachedStats.fetchedAt < CACHE_TTL_SHORT) {
    return cachedStats.data;
  }

  const response = await fetch(env.JOURNAL_API_URL, {
    headers: {
      Authorization: `Bearer ${env.JOURNAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Journal API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as JournalStats;
  cachedStats = { data, fetchedAt: Date.now() };
  return data;
}

function getJournalInfoBase(): string {
  if (!env.JOURNAL_API_URL) throw new Error('JOURNAL_API_URL not configured');
  return env.JOURNAL_API_URL.replace('journal-stats', 'journal-info');
}

/**
 * Fetches journal entry metadata for a specific date (or year/month).
 * Returns mood, weather, song, reflection — but never entry content.
 */
export async function fetchJournalEntries(params: {
  year?: number;
  month?: number;
  day?: number;
}): Promise<JournalInfoResponse> {
  if (!env.JOURNAL_API_KEY) {
    throw new Error('Journal API not configured');
  }

  const searchParams = new URLSearchParams();
  if (params.year) searchParams.set('year', String(params.year));
  if (params.month) searchParams.set('month', String(params.month));
  if (params.day) searchParams.set('day', String(params.day));

  if (searchParams.toString() === '') {
    throw new Error('At least one of year, month, or day is required');
  }

  const url = `${getJournalInfoBase()}?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.JOURNAL_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Journal info API returned ${response.status}: ${response.statusText}`);
  }

  return await response.json() as JournalInfoResponse;
}

/**
 * Formats a journal entry into a human-readable string.
 */
export function formatJournalEntry(entry: JournalEntry): string {
  const date = new Date(entry.timestamp);
  const lines: string[] = [];

  lines.push(`Journal entry on ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`);
  lines.push(`Mood: ${entry.mood}.`);

  if (entry.weather) {
    lines.push(`Weather: ${entry.weather.description}, ${entry.weather.temperature}°C in ${entry.weather.location}.`);
  }

  if (entry.track) {
    lines.push(`Song: "${entry.track.name}" by ${entry.track.artist} (album: ${entry.track.album}).`);
  } else {
    lines.push(`No song linked to this entry.`);
  }

  if (entry.reflection) {
    lines.push(`Reflection prompt: "${entry.reflection.question}" — ${entry.reflection.hasAnswer ? 'answered' : 'not answered'}.`);
  }

  return lines.join(' ');
}

/**
 * Formats journal stats into a human-readable summary
 * that the LLM can use to answer questions.
 */
export function formatJournalStats(stats: JournalStats): string {
  const song = stats.music.recentSong;
  const moods = Object.entries(stats.mood.distribution)
    .sort(([, a], [, b]) => b - a)
    .map(([mood, count]) => `${mood}(${count})`)
    .join(', ');

  // Structured key-value format — easier for LLM to scan and extract specific values
  return [
    `ACTIVITY: ${stats.activity.totalEntries} total entries | ${stats.activity.totalDaysJournaled} days journaled | avg ${stats.activity.avgEntriesPerWeek}/week`,
    `THIS PERIOD: ${stats.activity.entriesThisWeek} this week | ${stats.activity.entriesThisMonth} this month | ${stats.activity.entriesThisYear} this year`,
    `LAST ENTRY: ${stats.activity.lastEntryDate} | FIRST ENTRY: ${stats.activity.firstEntryDate}`,
    `STREAKS: current ${stats.streaks.current} days | longest ${stats.streaks.longest} days`,
    `TIME PATTERNS: favorite hour ${stats.timePatterns.favoriteHour.hour} (${stats.timePatterns.favoriteHour.count}x) | favorite day ${stats.timePatterns.favoriteDay.day} (${stats.timePatterns.favoriteDay.count}x)`,
    `MOOD: current=${stats.mood.current} | most frequent=${stats.mood.mostFrequent.mood}(${stats.mood.mostFrequent.count}x) | this month=${stats.mood.mostFrequentThisMonth.mood}`,
    `MOOD DISTRIBUTION: ${moods}`,
    `MUSIC: ${song ? `recent="${song.name}" by ${song.artist}` : 'no recent song'} | ${stats.music.entriesWithSongs} entries with songs | ${stats.music.uniqueArtists} artists`,
    `WEATHER: most common=${stats.weather.mostCommonCondition.condition}(${stats.weather.mostCommonCondition.count}x) | avg temp=${stats.weather.averageTemperatureCelsius}°C`,
    `LOCATION: most common=${stats.weather.mostCommonLocation.location} (${stats.weather.mostCommonLocation.count} entries)`,
    `WRITING: ${stats.writing.totalWords} words total | avg ${stats.writing.avgWordCount}/entry | ${stats.writing.entriesWithReflections} with reflections`,
    `NOTE: For per-entry details (mood/weather/song on a specific date), use getJournalEntry tool.`,
  ].join('\n');
}
