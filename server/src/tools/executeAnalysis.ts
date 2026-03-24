import { toolRegistry } from './registry.js';
import { executeSandbox } from '../sandbox/executor.js';
import { fetchJournalStats, fetchJournalEntries } from '../data/journal.js';
import { fetchRepos, fetchRecentCommits, fetchProfile } from '../data/github.js';
import { getResumeRaw } from '../data/resume.js';
import { getErrorMessage } from '../utils/errors.js';
import type { ToolDefinition } from '../types/index.js';

/**
 * Gathers data from all requested sources and packages it
 * for injection into the sandbox.
 */
async function gatherData(sources: string[]): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  const tasks: Promise<void>[] = [];

  if (sources.includes('github')) {
    tasks.push(
      (async () => {
        const [repos, profile] = await Promise.all([fetchRepos(), fetchProfile()]);

        // Fetch recent commits for the top 5 most recently pushed repos
        const topRepos = repos.slice(0, 5);
        const commitResults = await Promise.all(
          topRepos.map(async (r) => {
            try {
              const commits = await fetchRecentCommits(r.name, 15);
              return commits.map(c => ({
                repo: r.name,
                message: c.commit.message,
                date: c.commit.author.date,
                author: c.commit.author.name,
              }));
            } catch {
              return [];
            }
          })
        );

        data.github_repos = repos.map(r => ({
          name: r.name,
          language: r.language,
          description: r.description,
          stars: r.stargazers_count,
          updatedAt: r.updated_at,
          pushedAt: r.pushed_at,
          createdAt: r.created_at,
        }));
        data.github_commits = commitResults.flat();
        data.github_profile = {
          login: profile.login,
          name: profile.name,
          bio: profile.bio,
          publicRepos: profile.public_repos,
          followers: profile.followers,
        };
      })()
    );
  }

  if (sources.includes('journal')) {
    tasks.push(
      (async () => {
        const stats = await fetchJournalStats();
        data.journal_stats = stats;

        // Also fetch per-date journal entries for recent months
        // so the sandbox can correlate specific dates with moods
        try {
          const now = new Date();
          const months: Array<{ year: number; month: number }> = [];
          for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
          }

          const entryResults = await Promise.all(
            months.map(m => fetchJournalEntries({ year: m.year, month: m.month }).catch(() => ({ entries: [], count: 0 })))
          );

          data.journal_entries = entryResults.flatMap(r => r.entries.map(e => ({
            date: e.date,
            timestamp: e.timestamp,
            mood: e.mood,
            weather: e.weather ? { description: e.weather.description, temperature: e.weather.temperature, location: e.weather.location } : null,
            song: e.track ? { name: e.track.name, artist: e.track.artist } : null,
          })));
        } catch {
          data.journal_entries = [];
        }
      })()
    );
  }

  if (sources.includes('resume')) {
    tasks.push(
      (async () => {
        data.resume = getResumeRaw();
      })()
    );
  }

  await Promise.all(tasks);
  return data;
}

const executeAnalysis: ToolDefinition = {
  name: 'executeAnalysis',
  description: [
    'Execute a Python analysis in a secure sandbox to answer complex questions',
    'that require cross-referencing multiple data sources or multi-step computation.',
    'Use this when a question requires correlating GitHub activity with journal moods,',
    'analyzing patterns across time, computing statistics, or any multi-step reasoning.',
    '',
    'The sandbox has access to:',
    '- get_github_repos(), get_github_commits(repo_name=None)',
    '- get_journal_stats() — aggregated stats',
    '- get_journal_entries() — per-date entries with mood, weather, song (last 3 months)',
    '- get_mood_for_date("YYYY-MM-DD") — returns list of moods for a specific date',
    '- get_entries_for_date("YYYY-MM-DD") — returns full entry metadata for a date',
    '- get_resume()',
    '- group_by_day(items, date_key), group_by_month(items, date_key)',
    '- extract_mood(stats), correlate_activity(github_data, journal_data)',
    '- output(result) — MUST call this to return results as JSON',
    '',
    'Available imports: json, datetime, timedelta, Counter, defaultdict, statistics, re',
    'Do NOT import anything else. Do NOT make network calls.',
    'ALWAYS call output({...}) at the end with your structured result.',
  ].join('\n'),
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Python code to execute. Must call output({...}) at the end.',
      },
      sources: {
        type: 'array',
        items: { type: 'string', enum: ['github', 'journal', 'resume'] },
        description: 'Which data sources to load into the sandbox.',
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of what this code does and why.',
      },
    },
    required: ['code', 'sources'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const code = args.code as string;
    const sources = args.sources as string[];
    const reasoning = (args.reasoning as string) || '';

    try {
      // Gather data from requested sources
      const data = await gatherData(sources);

      // Execute in sandbox
      const result = await executeSandbox(code, data);

      if (!result.success) {
        return {
          success: false,
          data: {
            error: result.error,
            logs: result.logs,
            reasoning,
          },
          source: 'general',
          error: result.error,
        };
      }

      // Parse the JSON output
      let parsed: unknown;
      try {
        parsed = JSON.parse(result.output);
      } catch {
        parsed = result.output;
      }

      return {
        success: true,
        data: {
          result: parsed,
          logs: result.logs,
          reasoning,
          sourcesUsed: sources,
        },
        source: 'general',
      };
    } catch (err) {
      const message = getErrorMessage(err);
      return {
        success: false,
        data: null,
        source: 'general',
        error: `Sandbox execution failed: ${message}`,
      };
    }
  },
};

export function registerAnalysisTools(): void {
  toolRegistry.register(executeAnalysis);
}
