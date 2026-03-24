import { toolRegistry } from './registry.js';
import { fetchJournalStats, fetchJournalEntries, formatJournalStats, formatJournalEntry } from '../data/journal.js';
import type { JournalStats } from '../data/journal.js';
import type { ToolDefinition } from '../types/index.js';
import { getErrorMessage } from '../utils/errors.js';

const searchJournalStats: ToolDefinition = {
  name: 'searchJournal',
  description: [
    'Fetch Ashna\'s aggregated journaling statistics from her Eternal Entries diary app.',
    'Returns: entry counts, streaks, mood distribution, favorite journaling times,',
    'music paired with entries, weather patterns, writing habits, last/first entry dates.',
    'Use for general questions about journaling habits, overall mood trends, or activity patterns.',
    'For specific entries (mood/weather/song on a particular date), use getJournalEntry instead.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['all', 'activity', 'streaks', 'mood', 'music', 'weather', 'timePatterns', 'writing'],
        description: 'Which category of journal stats to retrieve. Use "all" for a general question.',
      },
    },
    required: ['category'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const category = (args.category as string) || 'all';

    try {
      const stats = await fetchJournalStats();

      if (category === 'all') {
        return {
          success: true,
          data: { summary: formatJournalStats(stats), raw: stats },
          source: 'journal',
        };
      }

      const categoryData = (stats as unknown as Record<string, unknown>)[category];
      return {
        success: true,
        data: {
          category,
          stats: categoryData ?? stats,
          context: formatCategoryContext(category, stats),
        },
        source: 'journal',
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return { success: false, data: null, source: 'journal', error: message };
    }
  },
};

const getJournalEntry: ToolDefinition = {
  name: 'getJournalEntry',
  description: [
    'Fetch journal entry metadata for a specific date.',
    'Returns mood, weather (temperature, description, location),',
    'song (name, artist, album), and reflection prompt for entries on that date.',
    'Does NOT return actual journal text content.',
    'Use this when asked about a specific day\'s journal — mood, weather, song, time, location.',
    'To find the most recent entry date, first call searchJournal with category "activity" to get lastEntryDate,',
    'then call this tool with that date.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      year: {
        type: 'number',
        description: 'Year (e.g., 2026). Required.',
      },
      month: {
        type: 'number',
        description: 'Month (1-12). Optional — omit to get all entries for the year.',
      },
      day: {
        type: 'number',
        description: 'Day (1-31). Optional — omit to get all entries for the month.',
      },
    },
    required: ['year'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const year = args.year as number;
    const month = args.month as number | undefined;
    const day = args.day as number | undefined;

    try {
      const result = await fetchJournalEntries({ year, month, day });

      if (result.count === 0) {
        return {
          success: true,
          data: { message: `No journal entries found for ${year}${month ? `-${month}` : ''}${day ? `-${day}` : ''}.`, entries: [] },
          source: 'journal',
        };
      }

      const formatted = result.entries.map(formatJournalEntry);

      return {
        success: true,
        data: {
          count: result.count,
          entries: result.entries.map((e, i) => ({
            date: e.date,
            time: new Date(e.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            mood: e.mood,
            weather: e.weather ? `${e.weather.description}, ${e.weather.temperature}°C in ${e.weather.location}` : null,
            song: e.track ? `"${e.track.name}" by ${e.track.artist}` : null,
            reflection: e.reflection ? { question: e.reflection.question, answered: e.reflection.hasAnswer } : null,
            summary: formatted[i],
          })),
        },
        source: 'journal',
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return { success: false, data: null, source: 'journal', error: message };
    }
  },
};

function formatCategoryContext(category: string, stats: JournalStats): string {
  switch (category) {
    case 'activity':
      return `${stats.activity.totalEntries} total entries across ${stats.activity.totalDaysJournaled} days. Last entry: ${stats.activity.lastEntryDate}. First entry: ${stats.activity.firstEntryDate}. ${stats.activity.entriesThisWeek} this week. Average ${stats.activity.avgEntriesPerWeek}/week.`;
    case 'streaks':
      return `Current streak: ${stats.streaks.current} days. Longest: ${stats.streaks.longest} days.`;
    case 'mood':
      return `Current mood: ${stats.mood.current}. Most frequent: ${stats.mood.mostFrequent.mood} (${stats.mood.mostFrequent.count}x). Distribution: ${Object.entries(stats.mood.distribution).map(([m, c]) => `${m}: ${c}`).join(', ')}.`;
    case 'music':
      const song = stats.music.recentSong;
      return `Recent song: ${song ? `"${song.name}" by ${song.artist}` : 'none'}. ${stats.music.entriesWithSongs} entries with songs, ${stats.music.uniqueArtists} unique artists.`;
    case 'weather':
      return `Most common: ${stats.weather.mostCommonCondition.condition}. Avg temp: ${stats.weather.averageTemperatureCelsius}°C. Usually journals from ${stats.weather.mostCommonLocation.location}.`;
    case 'timePatterns':
      return `Favorite hour: ${stats.timePatterns.favoriteHour.hour}. Favorite day: ${stats.timePatterns.favoriteDay.day}.`;
    case 'writing':
      return `${stats.writing.totalWords} total words. Avg ${stats.writing.avgWordCount} words/entry. ${stats.writing.entriesWithReflections} entries with reflections.`;
    default:
      return '';
  }
}

export function registerJournalTools(): void {
  toolRegistry.register(searchJournalStats);
  toolRegistry.register(getJournalEntry);
}
