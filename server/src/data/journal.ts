import { env } from '../config/env.js';

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
  habits: unknown;
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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches journal stats from the Eternal Entries API.
 * Caches results for 5 minutes to avoid hammering the endpoint.
 */
export async function fetchJournalStats(): Promise<JournalStats> {
  if (!env.JOURNAL_API_URL || !env.JOURNAL_API_KEY) {
    throw new Error('Journal API not configured');
  }

  // Return cached data if fresh
  if (cachedStats && Date.now() - cachedStats.fetchedAt < CACHE_TTL_MS) {
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

const JOURNAL_INFO_BASE = 'https://veorhexddrwlwxtkuycb.supabase.co/functions/v1/journal-info';

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

  const url = `${JOURNAL_INFO_BASE}?${searchParams.toString()}`;
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
  const lines: string[] = [];

  // Activity
  lines.push(`Ashna has written ${stats.activity.totalEntries} journal entries total across ${stats.activity.totalDaysJournaled} days.`);
  const lastDate = new Date(stats.activity.lastEntryDate);
  const firstDate = new Date(stats.activity.firstEntryDate);
  lines.push(`Last journal entry date and time: ${lastDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${lastDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. (raw: ${stats.activity.lastEntryDate})`);
  lines.push(`First ever journal entry: ${firstDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);
  lines.push(`NOTE: The API only provides the DATE of the last entry. Mood, weather, location, and song for specific entries are NOT available — only aggregate stats. Do NOT guess per-entry details from aggregate data.`);
  lines.push(`This week: ${stats.activity.entriesThisWeek} entries. This month: ${stats.activity.entriesThisMonth}. This year: ${stats.activity.entriesThisYear}.`);
  lines.push(`Average: ${stats.activity.avgEntriesPerWeek} entries per week.`);

  // Streaks
  lines.push(`Current journaling streak: ${stats.streaks.current} days. Longest streak ever: ${stats.streaks.longest} days.`);

  // Time patterns
  lines.push(`Favorite time to journal: ${stats.timePatterns.favoriteHour.hour} (${stats.timePatterns.favoriteHour.count} entries).`);
  lines.push(`Most active day: ${stats.timePatterns.favoriteDay.day} (${stats.timePatterns.favoriteDay.count} entries).`);

  // Mood
  lines.push(`Current mood: ${stats.mood.current}.`);
  lines.push(`Most frequent mood overall: ${stats.mood.mostFrequent.mood} (${stats.mood.mostFrequent.count} times).`);
  lines.push(`Most frequent mood this month: ${stats.mood.mostFrequentThisMonth.mood} (${stats.mood.mostFrequentThisMonth.count} times).`);

  const moodEntries = Object.entries(stats.mood.distribution)
    .sort(([, a], [, b]) => b - a)
    .map(([mood, count]) => `${mood}: ${count}`)
    .join(', ');
  lines.push(`Mood distribution: ${moodEntries}.`);

  // Music
  if (stats.music.recentSong) {
    lines.push(`Most recent song paired with a journal entry: "${stats.music.recentSong.name}" by ${stats.music.recentSong.artist} (album: ${stats.music.recentSong.album}).`);
  }
  lines.push(`${stats.music.entriesWithSongs} entries have songs attached (${stats.music.uniqueArtists} unique artists). ${stats.music.entriesWithoutSongs} entries have no song.`);

  // Weather
  lines.push(`Most common weather when journaling: ${stats.weather.mostCommonCondition.condition} (${stats.weather.mostCommonCondition.count} times).`);
  lines.push(`Average temperature: ${stats.weather.averageTemperatureCelsius}°C.`);
  lines.push(`Most common location: ${stats.weather.mostCommonLocation.location} (${stats.weather.mostCommonLocation.count} entries).`);

  // Writing
  lines.push(`Total words written: ${stats.writing.totalWords}. Average word count per entry: ${stats.writing.avgWordCount}.`);
  lines.push(`${stats.writing.entriesWithReflections} entries include reflections.`);

  return lines.join(' ');
}
