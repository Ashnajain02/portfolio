import { Sandbox } from '@e2b/code-interpreter';
import { env } from '../config/env.js';
import { SANDBOX_TIMEOUT_MS } from '../config/constants.js';

export interface SandboxResult {
  success: boolean;
  output: string;
  error?: string;
  logs: string[];
}

/**
 * Executes Python code in an E2B sandboxed environment.
 * The code has access to pre-injected data via a `DATA` variable
 * and a set of approved helper functions.
 *
 * Strict rules:
 * - No arbitrary imports (only json, datetime, collections, statistics, re)
 * - No external network calls
 * - Must return structured JSON via print(json.dumps(...))
 * - Time-limited execution
 */
export async function executeSandbox(
  code: string,
  data: Record<string, unknown>,
): Promise<SandboxResult> {
  if (!env.E2B_API_KEY) {
    return {
      success: false,
      output: '',
      error: 'E2B API key not configured',
      logs: [],
    };
  }

  const sandbox = await Sandbox.create({
    apiKey: env.E2B_API_KEY,
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });

  try {
    // Inject data and helpers into the sandbox
    const setupCode = buildSetupCode(data);
    const fullCode = `${setupCode}\n\n# --- User Analysis Code ---\n${code}`;

    const execution = await sandbox.runCode(fullCode);

    const logs: string[] = [];
    if (execution.logs.stdout.length > 0) {
      logs.push(...execution.logs.stdout);
    }
    if (execution.logs.stderr.length > 0) {
      logs.push(...execution.logs.stderr.map(l => `[stderr] ${l}`));
    }

    if (execution.error) {
      return {
        success: false,
        output: '',
        error: `${execution.error.name}: ${execution.error.value}\n${execution.error.traceback}`,
        logs,
      };
    }

    // The last stdout line should be the JSON result
    const stdout = execution.logs.stdout.join('\n').trim();
    return {
      success: true,
      output: stdout,
      logs,
    };
  } finally {
    await sandbox.kill();
  }
}

/**
 * Builds the Python setup code that injects data and defines helpers.
 * Only approved modules and functions are available.
 */
function buildSetupCode(data: Record<string, unknown>): string {
  // Use base64 encoding to safely inject arbitrary JSON into Python
  // This avoids all string escaping issues with quotes, backslashes, etc.
  const dataJson = JSON.stringify(data);
  const base64Data = Buffer.from(dataJson, 'utf-8').toString('base64');

  return `
import json
import base64
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import statistics
import re

# ============================================================
# Injected data from the agent's tool calls
# ============================================================
DATA = json.loads(base64.b64decode("${base64Data}").decode("utf-8"))

# ============================================================
# Helper functions
# ============================================================

def get_github_repos():
    """Returns list of GitHub repos with metadata."""
    return DATA.get("github_repos", [])

def get_github_commits(repo_name=None):
    """Returns commits, optionally filtered by repo name."""
    commits = DATA.get("github_commits", [])
    if repo_name:
        return [c for c in commits if c.get("repo") == repo_name]
    return commits

def get_journal_stats():
    """Returns aggregated journal statistics."""
    return DATA.get("journal_stats", {})

def get_journal_entries():
    """Returns per-date journal entries with mood, weather, song.
    Each entry: {date, timestamp, mood, weather: {description, temperature, location}, song: {name, artist}}
    Covers the last 3 months of entries."""
    return DATA.get("journal_entries", [])

def get_mood_for_date(date_str):
    """Returns list of moods for a specific date (YYYY-MM-DD format).
    A date can have multiple entries with different moods."""
    entries = get_journal_entries()
    return [e["mood"] for e in entries if e.get("date") == date_str]

def get_entries_for_date(date_str):
    """Returns all journal entry metadata for a specific date (YYYY-MM-DD)."""
    entries = get_journal_entries()
    return [e for e in entries if e.get("date") == date_str]

def get_resume():
    """Returns resume data sections."""
    return DATA.get("resume", {})

def group_by_day(items, date_key="date"):
    """Groups items by day of week."""
    result = defaultdict(list)
    for item in items:
        d = item.get(date_key, "")
        if d:
            try:
                day = datetime.fromisoformat(d.replace("Z", "+00:00")).strftime("%A")
                result[day].append(item)
            except (ValueError, TypeError):
                pass
    return dict(result)

def group_by_month(items, date_key="date"):
    """Groups items by month."""
    result = defaultdict(list)
    for item in items:
        d = item.get(date_key, "")
        if d:
            try:
                month = datetime.fromisoformat(d.replace("Z", "+00:00")).strftime("%Y-%m")
                result[month].append(item)
            except (ValueError, TypeError):
                pass
    return dict(result)

def extract_mood(stats):
    """Extracts mood distribution from journal stats."""
    mood = stats.get("mood", {})
    return {
        "current": mood.get("current"),
        "distribution": mood.get("distribution", {}),
        "most_frequent": mood.get("mostFrequent", {}),
    }

def correlate_activity(github_data, journal_data):
    """
    Correlates GitHub push activity with journal mood/time patterns.
    Returns a dict mapping day-of-week to both commit count and journal count.
    """
    # GitHub commits by day
    commit_days = Counter()
    for item in github_data:
        d = item.get("date", "")
        if d:
            try:
                day = datetime.fromisoformat(d.replace("Z", "+00:00")).strftime("%A")
                commit_days[day] += 1
            except (ValueError, TypeError):
                pass

    # Journal entries by day
    journal_days = {}
    day_dist = journal_data.get("timePatterns", {}).get("dayDistribution", [])
    for entry in day_dist:
        journal_days[entry["day"]] = entry["entries"]

    # Combine
    all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    result = []
    for day in all_days:
        result.append({
            "day": day,
            "commits": commit_days.get(day, 0),
            "journal_entries": journal_days.get(day, 0),
        })
    return result

def output(result):
    """Prints the result as JSON. ALWAYS use this to return your answer."""
    print(json.dumps(result, indent=2, default=str))
`;
}
