import { toolRegistry } from './registry.js';
import { fetchJournalStats, formatJournalStats } from '../data/journal.js';
import type { ToolDefinition } from '../types/index.js';

const searchJournal: ToolDefinition = {
  name: 'searchJournal',
  description: [
    'Fetch Ashna\'s journaling statistics from her Eternal Entries diary app.',
    'Returns aggregated stats: entry counts, streaks, mood distribution,',
    'favorite journaling times, music paired with entries, weather patterns,',
    'and writing habits. Use this for questions about her journaling habits,',
    'mood, music taste, daily routines, or the Eternal Entries project itself.',
    'Does NOT return actual journal entry content — only statistics.',
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

      // Return full formatted summary or specific section
      if (category === 'all') {
        return {
          success: true,
          data: {
            summary: formatJournalStats(stats),
            raw: stats,
          },
          source: 'journal',
        };
      }

      // Return specific category
      const categoryData = (stats as Record<string, unknown>)[category];
      if (!categoryData) {
        return {
          success: true,
          data: { summary: formatJournalStats(stats), raw: stats },
          source: 'journal',
        };
      }

      return {
        success: true,
        data: {
          category,
          stats: categoryData,
          context: formatCategoryContext(category, stats),
        },
        source: 'journal',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        data: null,
        source: 'journal',
        error: `Failed to fetch journal stats: ${message}`,
      };
    }
  },
};

function formatCategoryContext(category: string, stats: any): string {
  switch (category) {
    case 'activity':
      return `${stats.activity.totalEntries} total entries. ${stats.activity.entriesThisWeek} this week. Average ${stats.activity.avgEntriesPerWeek}/week.`;
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
  toolRegistry.register(searchJournal);
}
