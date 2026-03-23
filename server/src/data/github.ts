import { env } from '../config/env.js';

const GITHUB_USERNAME = 'ashnajain02';
const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  size: number;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
}

interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'aj-portfolio-agent',
};

// Cache layer — GitHub has rate limits (60/hr unauthenticated)
const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as T;
  cache.set(url, { data, fetchedAt: Date.now() });
  return data;
}

export async function fetchProfile(): Promise<GitHubProfile> {
  return cachedFetch<GitHubProfile>(`${GITHUB_API}/users/${GITHUB_USERNAME}`);
}

export async function fetchRepos(limit: number = 20): Promise<GitHubRepo[]> {
  const repos = await cachedFetch<GitHubRepo[]>(
    `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=${limit}`,
  );
  return repos.filter(r => !r.fork);
}

export async function fetchRecentCommits(repo: string, limit: number = 10): Promise<GitHubCommit[]> {
  return cachedFetch<GitHubCommit[]>(
    `${GITHUB_API}/repos/${GITHUB_USERNAME}/${repo}/commits?per_page=${limit}`,
  );
}

export async function fetchRepoLanguages(repo: string): Promise<Record<string, number>> {
  return cachedFetch<Record<string, number>>(
    `${GITHUB_API}/repos/${GITHUB_USERNAME}/${repo}/languages`,
  );
}

/**
 * Builds a comprehensive summary of the GitHub profile and repos.
 */
export async function getGitHubSummary(): Promise<string> {
  const [profile, repos] = await Promise.all([fetchProfile(), fetchRepos()]);

  const lines: string[] = [];

  lines.push(`GitHub profile: ${profile.login} (${profile.name || 'Ashna Jain'}). ${profile.public_repos} public repos. ${profile.followers} followers.`);

  if (profile.bio) {
    lines.push(`Bio: ${profile.bio}`);
  }

  lines.push(`\nRepositories (sorted by most recently pushed):`);
  for (const repo of repos) {
    const parts = [`- ${repo.name}`];
    if (repo.language) parts.push(`(${repo.language})`);
    if (repo.description) parts.push(`— ${repo.description}`);
    parts.push(`| Updated: ${repo.updated_at.slice(0, 10)}`);
    if (repo.stargazers_count > 0) parts.push(`| Stars: ${repo.stargazers_count}`);
    lines.push(parts.join(' '));
  }

  // Aggregate languages
  const langCounts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    }
  }
  const topLangs = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, count]) => `${lang} (${count} repos)`)
    .join(', ');
  lines.push(`\nTop languages across repos: ${topLangs}`);

  return lines.join('\n');
}
