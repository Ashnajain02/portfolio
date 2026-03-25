import { toolRegistry } from './registry.js';
import { fetchRepos, fetchRecentCommits, fetchReadme, getGitHubSummary } from '../data/github.js';
import { getErrorMessage } from '../utils/errors.js';
import type { ToolDefinition } from '../types/index.js';

const searchGithub: ToolDefinition = {
  name: 'searchGithub',
  description: [
    'Search Ashna\'s GitHub profile, repositories, and recent activity.',
    'Use this for questions about her coding projects, open source work,',
    'programming languages, recent commits, GitHub stats, or repos.',
    'Can fetch profile overview, list repos, recent commits, or README for a specific repo.',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['overview', 'repos', 'commits', 'readme', 'recent_activity'],
        description: '"overview" = profile + repos. "repos" = repo list. "commits" = commits for a specific repo (requires repo param). "readme" = README for a repo. "recent_activity" = recent commits across ALL active repos (no repo param needed).',
      },
      repo: {
        type: 'string',
        description: 'Repository name (required when action is "commits" or "readme"). e.g., "echo", "twix", "portfolio".',
      },
    },
    required: ['action'],
    additionalProperties: false,
  },
  execute: async (args) => {
    const action = args.action as string;
    const repo = args.repo as string | undefined;

    try {
      switch (action) {
        case 'overview': {
          const summary = await getGitHubSummary();
          return {
            success: true,
            data: { summary },
            source: 'github',
          };
        }

        case 'repos': {
          const repos = await fetchRepos();
          return {
            success: true,
            data: repos.map(r => ({
              name: r.name,
              language: r.language,
              description: r.description,
              url: r.html_url,
              stars: r.stargazers_count,
              updatedAt: r.updated_at.slice(0, 10),
              topics: r.topics,
            })),
            source: 'github',
          };
        }

        case 'commits': {
          if (!repo) {
            return {
              success: false,
              data: null,
              source: 'github',
              error: 'Repo name required for fetching commits. Try action "repos" first to see available repos.',
            };
          }
          const commits = await fetchRecentCommits(repo);
          const dates = commits.map(c => c.commit.author.date.slice(0, 10));
          const dateRange = dates.length > 0 ? `${dates[dates.length - 1]} to ${dates[0]}` : 'none';
          return {
            success: true,
            data: {
              note: `Last ${commits.length} commits for ${repo} (${dateRange}). This is recent activity only, not all-time.`,
              commits: commits.map(c => ({
                message: c.commit.message,
                date: c.commit.author.date.slice(0, 10),
              })),
            },
            source: 'github',
          };
        }

        case 'readme': {
          if (!repo) {
            return {
              success: false,
              data: null,
              source: 'github',
              error: 'Repo name required for fetching README. Try action "repos" first.',
            };
          }
          const readme = await fetchReadme(repo);
          if (!readme) {
            return {
              success: true,
              data: { message: `No README found for ${repo}.` },
              source: 'github',
            };
          }
          // Truncate very long READMEs to avoid token bloat
          const truncated = readme.length > 3000 ? readme.slice(0, 3000) + '\n\n[truncated]' : readme;
          return {
            success: true,
            data: { repo, readme: truncated },
            source: 'github',
          };
        }

        case 'recent_activity': {
          const repos = await fetchRepos();
          const topRepos = repos.slice(0, 3);
          const allCommits = await Promise.all(
            topRepos.map(async (r) => {
              try {
                const commits = await fetchRecentCommits(r.name, 5);
                return commits.map(c => ({
                  repo: r.name,
                  message: c.commit.message,
                  date: c.commit.author.date.slice(0, 10),
                }));
              } catch { return []; }
            })
          );
          const merged = allCommits.flat().sort((a, b) => b.date.localeCompare(a.date));
          const dateRange = merged.length > 0 ? `${merged[merged.length - 1].date} to ${merged[0].date}` : 'none';
          return {
            success: true,
            data: {
              note: `Recent commits across top ${topRepos.length} repos (${dateRange}).`,
              commits: merged,
            },
            source: 'github',
          };
        }

        default:
          return {
            success: false,
            data: null,
            source: 'github',
            error: `Unknown action: ${action}`,
          };
      }
    } catch (err) {
      const message = getErrorMessage(err);
      return {
        success: false,
        data: null,
        source: 'github',
        error: `GitHub API error: ${message}`,
      };
    }
  },
};

export function registerGithubTools(): void {
  toolRegistry.register(searchGithub);
}
