import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchTags, parsePrUrl, fetchPrArtifact } from '../github'

describe('fetchTags', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns sorted, filtered tags from a single page', async () => {
    const mockTags = [
      { name: 'v1.0.0' },
      { name: '3.2.0' },
      { name: 'v2.5.1' },
      { name: 'invalid-tag' },
      { name: 'v1.0' }, // two-part, should be filtered out
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTags),
    } as Response)

    const result = await fetchTags('vc-module-order')
    // Should strip 'v', filter valid versions, sort descending
    expect(result).toEqual(['3.2.0', '2.5.1', '1.0.0'])
  })

  it('handles pagination (fetches multiple pages)', async () => {
    // First page: 100 items triggers next page
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      name: `v1.0.${i}`,
    }))
    // Second page: fewer than 100 items, stops pagination
    const page2 = [{ name: 'v2.0.0' }, { name: 'v3.0.0' }]

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page1),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(page2),
      } as Response)

    const result = await fetchTags('vc-module-order')
    // All 102 tags processed
    expect(result.length).toBe(102)
    // First item should be the highest version (descending sort)
    expect(result[0]).toBe('3.0.0')
  })

  it('strips v prefix from tag names', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ name: 'v5.0.0' }]),
    } as Response)

    const result = await fetchTags('vc-module-order')
    expect(result).toEqual(['5.0.0'])
  })

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    } as unknown as Response)

    await expect(fetchTags('nonexistent-repo')).rejects.toThrow(
      'GitHub API returned 404: Not Found',
    )
  })

  it('filters out invalid version tags', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { name: 'latest' },
          { name: 'beta' },
          { name: 'v1.0' },
          { name: '1.0.0' },
        ]),
    } as Response)

    const result = await fetchTags('vc-module-order')
    expect(result).toEqual(['1.0.0'])
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

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ body: prBody }),
    } as Response)

    const result = await fetchPrArtifact('vc-module-order', '62')
    expect(result).toEqual({
      moduleId: 'VirtoCommerce.Orders',
      fileName: 'VirtoCommerce.Orders_3.806.0-pr-62-df9c.zip',
    })
  })

  it('returns null when no artifact URL in PR body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ body: 'Just a regular PR description' }),
    } as Response)

    const result = await fetchPrArtifact('vc-module-order', '10')
    expect(result).toBeNull()
  })

  it('returns null when PR body is empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ body: '' }),
    } as Response)

    const result = await fetchPrArtifact('vc-module-order', '10')
    expect(result).toBeNull()
  })

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response)

    await expect(fetchPrArtifact('vc-module-order', '10')).rejects.toThrow(
      'Failed to fetch PR description: 403',
    )
  })
})
