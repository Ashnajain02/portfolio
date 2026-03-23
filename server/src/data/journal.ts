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
    entriesThisWeek: number;
    entriesThisMonth: number;
    entriesThisYear: number;
    avgEntriesPerWeek: number;
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

/**
 * Formats journal stats into a human-readable summary
 * that the LLM can use to answer questions.
 */
export function formatJournalStats(stats: JournalStats): string {
  const lines: string[] = [];

  // Activity
  lines.push(`Ashna has written ${stats.activity.totalEntries} journal entries total.`);
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
