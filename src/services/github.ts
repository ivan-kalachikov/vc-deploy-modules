import { isValidVersion } from '../utils/validation'

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Rate limited. Retry after ${retryAfterSeconds}s`)
    this.name = 'RateLimitError'
  }
}

export function getGitHubToken(): string | null {
  try {
    return localStorage.getItem('github-token') || null
  } catch {
    return null
  }
}

export function setGitHubToken(token: string | null) {
  try {
    if (token) localStorage.setItem('github-token', token)
    else localStorage.removeItem('github-token')
  } catch { /* ignore */ }
}

function getHeaders(): Record<string, string> {
  const token = getGitHubToken()
  if (!token) return {}
  return {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
  }
}

function parseIntSafe(value: string | null): number | null {
  if (!value) return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

function isRateLimited(response: Response): boolean {
  if (response.status === 429) return true
  if (response.status === 403) {
    const remaining = parseIntSafe(response.headers.get('x-ratelimit-remaining'))
    return remaining === 0
  }
  return false
}

function parseRateLimitWait(response: Response): number {
  const retryAfter = parseIntSafe(response.headers.get('retry-after'))
  if (retryAfter && retryAfter > 0) return retryAfter

  const resetEpoch = parseIntSafe(response.headers.get('x-ratelimit-reset'))
  if (resetEpoch) {
    const wait = resetEpoch - Math.floor(Date.now() / 1000)
    return Math.max(wait, 1)
  }

  return 60
}

let rateLimitRemaining: number | null = null

function updateRateLimit(response: Response) {
  const remaining = parseIntSafe(response.headers.get('x-ratelimit-remaining'))
  if (remaining !== null) rateLimitRemaining = remaining
}

export function getRateLimitRemaining(): number | null {
  return rateLimitRemaining
}

async function githubFetch(url: string): Promise<Response> {
  const response = await fetch(url, { headers: getHeaders() })

  if (isRateLimited(response)) {
    rateLimitRemaining = 0
    throw new RateLimitError(parseRateLimitWait(response))
  }

  updateRateLimit(response)
  return response
}

export async function fetchTags(repoName: string): Promise<string[]> {
  // Single page fetch — first 100 tags is enough for version selection
  const response = await githubFetch(
    `https://api.github.com/repos/VirtoCommerce/${repoName}/tags?per_page=100`,
  )
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`)
  }

  const tags = await response.json()
  return tags
    .map((tag: { name: string }) => tag.name.replace(/^v/, ''))
    .filter((tag: string) => isValidVersion(tag))
    .sort((a: string, b: string) => b.localeCompare(a))
}

export interface PrInfo {
  number: number
  title: string
}

export async function fetchOpenPrs(repoName: string): Promise<PrInfo[]> {
  const response = await githubFetch(
    `https://api.github.com/repos/VirtoCommerce/${repoName}/pulls?state=open&per_page=30`,
  )
  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}`)
  }
  const prs = await response.json()
  return prs.map((pr: { number: number; title: string }) => ({
    number: pr.number,
    title: pr.title,
  }))
}

export interface ArtifactInfo {
  moduleId: string
  fileName: string
}

export function parsePrUrl(url: string): { repo: string; prNumber: string } | null {
  const match = url.match(/github\.com\/VirtoCommerce\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  return { repo: match[1], prNumber: match[2] }
}

export async function fetchPrArtifact(
  repo: string,
  prNumber: string,
): Promise<ArtifactInfo | null> {
  const response = await githubFetch(
    `https://api.github.com/repos/VirtoCommerce/${repo}/pulls/${prNumber}`,
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch PR description: ${response.status}`)
  }

  const prData = await response.json()
  return parseArtifactUrl(prData.body || '')
}

function parseArtifactUrl(description: string): ArtifactInfo | null {
  const normalized = description.replace(/[\r\n]+/g, ' ')
  const match = normalized.match(
    /Artifact URL:\s*https:\/\/vc3prerelease\.blob\.core\.windows\.net\/packages\/([^/\s]+_([\d.]+(?:-[\w.-]+)?\.zip))/i,
  )
  if (!match) return null

  const fullFileName = match[1]
  const moduleId = fullFileName.split('_')[0]
  return { moduleId, fileName: fullFileName }
}
