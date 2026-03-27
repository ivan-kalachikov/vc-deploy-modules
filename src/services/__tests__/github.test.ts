import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchTags, parsePrUrl, fetchPrArtifact, RateLimitError } from '../github'

const mockHeaders = (overrides: Record<string, string> = {}) => ({
  get: (key: string) => overrides[key] ?? null,
})

const okResponse = (data: unknown, headers?: Record<string, string>) =>
  ({
    ok: true,
    status: 200,
    headers: mockHeaders({ 'x-ratelimit-remaining': '50', ...headers }),
    json: () => Promise.resolve(data),
  }) as unknown as Response

const errorResponse = (status: number, body = '', headers?: Record<string, string>) =>
  ({
    ok: false,
    status,
    headers: mockHeaders(headers ?? {}),
    text: () => Promise.resolve(body),
    json: () => Promise.resolve({}),
  }) as unknown as Response

describe('fetchTags', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns sorted, filtered tags', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse([
        { name: 'v1.0.0' },
        { name: '3.2.0' },
        { name: 'v2.5.1' },
        { name: 'invalid-tag' },
        { name: 'v1.0' },
      ]),
    )

    const result = await fetchTags('vc-module-order')
    expect(result).toEqual(['3.2.0', '2.5.1', '1.0.0'])
  })

  it('strips v prefix from tag names', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse([{ name: 'v5.0.0' }]),
    )

    const result = await fetchTags('vc-module-order')
    expect(result).toEqual(['5.0.0'])
  })

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(404, 'Not Found'),
    )

    await expect(fetchTags('nonexistent-repo')).rejects.toThrow(
      'GitHub API returned 404: Not Found',
    )
  })

  it('filters out invalid version tags', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse([
        { name: 'latest' },
        { name: 'beta' },
        { name: 'v1.0' },
        { name: '1.0.0' },
      ]),
    )

    const result = await fetchTags('vc-module-order')
    expect(result).toEqual(['1.0.0'])
  })

  it('throws RateLimitError on 429', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(429, '', { 'retry-after': '30' }),
    )

    await expect(fetchTags('vc-module-order')).rejects.toThrow(RateLimitError)
  })

  it('throws RateLimitError on 403 with remaining=0', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(403, '', { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 45) }),
    )

    await expect(fetchTags('vc-module-order')).rejects.toThrow(RateLimitError)
  })

  it('does not throw RateLimitError on 403 without remaining=0', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(403, 'Forbidden'),
    )

    await expect(fetchTags('vc-module-order')).rejects.toThrow(
      'GitHub API returned 403: Forbidden',
    )
  })
})

describe('parsePrUrl', () => {
  it('parses a valid PR URL', () => {
    const result = parsePrUrl(
      'https://github.com/VirtoCommerce/vc-module-order/pull/123',
    )
    expect(result).toEqual({ repo: 'vc-module-order', prNumber: '123' })
  })

  it('parses a URL with extra path segments', () => {
    const result = parsePrUrl(
      'https://github.com/VirtoCommerce/vc-module-catalog/pull/456/files',
    )
    expect(result).toEqual({ repo: 'vc-module-catalog', prNumber: '456' })
  })

  it('returns null for invalid URL', () => {
    expect(parsePrUrl('https://example.com/not-a-pr')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parsePrUrl('')).toBeNull()
  })

  it('returns null for URL without pull number', () => {
    expect(
      parsePrUrl('https://github.com/VirtoCommerce/vc-module-order/issues/123'),
    ).toBeNull()
  })
})

describe('fetchPrArtifact', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('extracts artifact info from PR body', async () => {
    const prBody =
      'Some description\nArtifact URL: https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.Orders_3.806.0-pr-62-df9c.zip\nMore text'

    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({ body: prBody }),
    )

    const result = await fetchPrArtifact('vc-module-order', '62')
    expect(result).toEqual({
      moduleId: 'VirtoCommerce.Orders',
      fileName: 'VirtoCommerce.Orders_3.806.0-pr-62-df9c.zip',
    })
  })

  it('returns null when no artifact URL in PR body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({ body: 'Just a regular PR description' }),
    )

    const result = await fetchPrArtifact('vc-module-order', '10')
    expect(result).toBeNull()
  })

  it('returns null when PR body is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      okResponse({ body: '' }),
    )

    const result = await fetchPrArtifact('vc-module-order', '10')
    expect(result).toBeNull()
  })

  it('throws on non-rate-limit API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(500, 'Server Error'),
    )

    await expect(fetchPrArtifact('vc-module-order', '10')).rejects.toThrow(
      'Failed to fetch PR description: 500',
    )
  })

  it('throws RateLimitError on 429', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      errorResponse(429, '', { 'retry-after': '60' }),
    )

    await expect(fetchPrArtifact('vc-module-order', '10')).rejects.toThrow(RateLimitError)
  })
})
