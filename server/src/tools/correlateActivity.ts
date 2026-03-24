import { toolRegistry } from './registry.js';
import { fetchJournalStats, fetchJournalEntries } from '../data/journal.js';
import { fetchRepos, fetchRecentCommits } from '../data/github.js';
import { getErrorMessage } from '../utils/errors.js';
import type { ToolDefinition } from '../types/index.js';

/**
 * Fetches commit dates (YYYY-MM-DD) across top repos.
 */
async function getCommitDates(): Promise<Map<string, number>> {
  const repos = await fetchRepos();
  const topRepos = repos.slice(0, 5);

  const commitsByDate = new Map<string, number>();
  const results = await Promise.all(
    topRepos.map(r =>
      fetchRecentCommits(r.name, 15).catch(() => [])
    )
  );

  for (const commits of results) {
    for (const c of commits) {
      const date = c.commit.author.date.slice(0, 10);
      commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
    }
  }

  return commitsByDate;
}

/**
 * Fetches journal entries for the last 3 months.
 */
async function getRecentJournalEntries() {
  const now = new Date();
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  const results = await Promise.all(
    months.map(m => fetchJournalEntries({ year: m.year, month: m.month }).catch(() => ({ entries: [], count: 0 })))
  );

  return results.flatMap(r => r.entries);
}

const correlateActivity: ToolDefinition = {
  name: 'correlateActivity',
  description: [
    'Cross-reference GitHub coding activity with journal entries.',
    'Finds overlapping days, correlates moods with commits, and analyzes patterns.',
    'Use this for questions like: "do I journal on days I code?",',
    '"what is my mood when I push code?", "compare coding vs journaling patterns".',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      analysis: {
        type: 'string',
        enum: ['overlap', 'mood_on_commit_days', 'day_of_week', 'summary'],
        description: '"overlap" = dates with both commits and journal entries. "mood_on_commit_days" = moods on days with commits. "day_of_week" = activity by day of week. "summary" = all of the above.',
      },
    },
    required: ['analysis'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const analysis = args.analysis as string;

    try {
      const [commitDates, journalEntries, stats] = await Promise.all([
        getCommitDates(),
        getRecentJournalEntries(),
        fetchJournalStats(),
      ]);

      // Build journal date -> entries map
      const journalByDate = new Map<string, typeof journalEntries>();
      for (const entry of journalEntries) {
        const date = entry.date;
        if (!journalByDate.has(date)) journalByDate.set(date, []);
        journalByDate.get(date)!.push(entry);
      }

      // Find overlapping dates
      const journalDates = new Set(journalByDate.keys());
      const overlapDates = [...commitDates.keys()].filter(d => journalDates.has(d)).sort();

      // Mood on commit days
      const moodOnCommitDays = overlapDates.map(date => ({
        date,
        commitCount: commitDates.get(date) || 0,
        moods: (journalByDate.get(date) || []).map(e => e.mood),
        songs: (journalByDate.get(date) || [])
          .filter(e => e.track)
          .map(e => `${e.track!.name} by ${e.track!.artist}`),
      }));

      // Day of week analysis
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const commitsByDay: Record<string, number> = {};
      for (const [dateStr, count] of commitDates) {
        const day = dayNames[new Date(dateStr).getDay()];
        commitsByDay[day] = (commitsByDay[day] || 0) + count;
      }

      const journalDayDist = stats.timePatterns?.dayDistribution || [];
      const dayOfWeek = dayNames.map(day => ({
        day,
        commits: commitsByDay[day] || 0,
        journalEntries: journalDayDist.find(d => d.day === day)?.entries || 0,
      }));

      switch (analysis) {
        case 'overlap':
          return {
            success: true,
            data: {
              overlapDates,
              overlapCount: overlapDates.length,
              totalCommitDays: commitDates.size,
              totalJournalDays: journalDates.size,
              summary: `${overlapDates.length} days with both commits and journal entries (out of ${commitDates.size} commit days and ${journalDates.size} journal days).`,
            },
            source: 'github',
          };

        case 'mood_on_commit_days':
          return {
            success: true,
            data: {
              days: moodOnCommitDays,
              summary: moodOnCommitDays.length > 0
                ? `Found ${moodOnCommitDays.length} days with both coding and journaling. Moods: ${moodOnCommitDays.flatMap(d => d.moods).join(', ')}.`
                : 'No overlapping days found in the last 3 months.',
            },
            source: 'journal',
          };

        case 'day_of_week':
          return {
            success: true,
            data: {
              dayOfWeek,
              summary: dayOfWeek.map(d => `${d.day}: ${d.commits} commits, ${d.journalEntries} journal entries`).join('. '),
            },
            source: 'github',
          };

        case 'summary':
        default:
          return {
            success: true,
            data: {
              overlapDates,
              overlapCount: overlapDates.length,
              moodOnCommitDays,
              dayOfWeek,
              totalCommitDays: commitDates.size,
              totalJournalDays: journalDates.size,
            },
            source: 'general',
          };
      }
    } catch (err) {
      return {
        success: false,
        data: null,
        source: 'general',
        error: `Cross-source analysis failed: ${getErrorMessage(err)}`,
      };
    }
  },
};

export function registerCorrelationTools(): void {
  toolRegistry.register(correlateActivity);
}
