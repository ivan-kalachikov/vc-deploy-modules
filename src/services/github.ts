import { isValidVersion } from '../utils/validation'

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined

function getHeaders(): Record<string, string> {
  if (!GITHUB_TOKEN) return {}
  return {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  }
}

export async function fetchTags(repoName: string): Promise<string[]> {
  let allTags: Array<{ name: string }> = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const response = await fetch(
      `https://api.github.com/repos/VirtoCommerce/${repoName}/tags?per_page=100&page=${page}`,
      { headers: getHeaders() },
    )
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`)
    }

    const pageTags = await response.json()
    allTags = [...allTags, ...pageTags]
    hasNext = pageTags.length === 100
    page++
  }

  return allTags
    .map((tag: { name: string }) => tag.name.replace(/^v/, ''))
    .filter((tag: string) => isValidVersion(tag))
    .sort((a: string, b: string) => b.localeCompare(a))
}

export interface PrInfo {
  number: number
  title: string
}

export async function fetchOpenPrs(repoName: string): Promise<PrInfo[]> {
  const response = await fetch(
    `https://api.github.com/repos/VirtoCommerce/${repoName}/pulls?state=open&per_page=30`,
    { headers: getHeaders() },
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
  const response = await fetch(
    `https://api.github.com/repos/VirtoCommerce/${repo}/pulls/${prNumber}`,
    { headers: getHeaders() },
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
