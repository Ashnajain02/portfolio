import { toolRegistry } from './registry.js';
import { fetchJournalStats, fetchJournalEntries, formatJournalStats, formatJournalEntry } from '../data/journal.js';
import type { ToolDefinition } from '../types/index.js';
import { getErrorMessage } from '../utils/errors.js';

const searchJournalStats: ToolDefinition = {
  name: 'searchJournal',
  description: [
    'Fetch all of Ashna\'s aggregated journaling statistics.',
    'Returns everything: entry counts, streaks, mood distribution, favorite time/day,',
    'music stats, weather patterns, location, writing habits, last/first entry dates.',
    'For specific entries on a date (mood/weather/song), use getJournalEntry instead.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  execute: async () => {
    try {
      const stats = await fetchJournalStats();
      const timeRange = `Aggregate stats over ${stats.activity.totalEntries} entries from ${stats.activity.firstEntryDate?.slice(0, 10) || 'unknown'} to ${stats.activity.lastEntryDate?.slice(0, 10) || 'unknown'}`;

      return {
        success: true,
        data: { timeRange, summary: formatJournalStats(stats) },
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

export function registerJournalTools(): void {
  toolRegistry.register(searchJournalStats);
  toolRegistry.register(getJournalEntry);
}
