import { describe, it, expect } from 'vitest'
import { kebabCase, getModuleId, formatModuleId } from '../helpers'

describe('kebabCase', () => {
  it('converts PascalCase to kebab-case', () => {
    expect(kebabCase('Orders')).toBe('orders')
  })

  it('handles multi-word PascalCase', () => {
    expect(kebabCase('DynamicAssociations')).toBe('dynamic-associations')
  })

  it('inserts hyphens between acronyms and words', () => {
    expect(kebabCase('OpenIdConnect')).toBe('open-id-connect')
  })

  it('handles all-caps acronyms (edge case, handled by MODULE_REPO_MAPPING)', () => {
    // The regex-based kebabCase doesn't split consecutive capitals individually;
    // MODULE_REPO_MAPPING provides the correct repo name for these edge cases.
    expect(kebabCase('XCMS')).toBe('xcms')
  })

  it('handles single lowercase word', () => {
    expect(kebabCase('orders')).toBe('orders')
  })

  it('handles already-kebab string', () => {
    expect(kebabCase('my-module')).toBe('my-module')
  })

  it('handles PageBuilderModule', () => {
    expect(kebabCase('PageBuilderModule')).toBe('page-builder-module')
  })
})

describe('getModuleId', () => {
  it('returns Id when present', () => {
    expect(getModuleId({ Id: 'VirtoCommerce.Orders' })).toBe('VirtoCommerce.Orders')
  })

  it('extracts module id from BlobName when no Id', () => {
    expect(getModuleId({ BlobName: 'VirtoCommerce.Orders_3.806.0.zip' })).toBe(
      'VirtoCommerce.Orders',
    )
  })

  it('returns empty string when neither Id nor BlobName', () => {
    expect(getModuleId({})).toBe('')
  })

  it('prefers Id over BlobName', () => {
    expect(
      getModuleId({
        Id: 'FromId',
        BlobName: 'FromBlob_1.0.0.zip',
      }),
    ).toBe('FromId')
  })
})

describe('formatModuleId', () => {
  it('strips VirtoCommerce. prefix', () => {
    expect(formatModuleId('VirtoCommerce.Orders')).toBe('Orders')
  })

  it('returns unchanged if no prefix', () => {
    expect(formatModuleId('SomethingElse')).toBe('SomethingElse')
  })

  it('only strips first occurrence of prefix', () => {
    expect(formatModuleId('VirtoCommerce.VirtoCommerce.Test')).toBe('VirtoCommerce.Test')
  })

  it('handles empty string', () => {
    expect(formatModuleId('')).toBe('')
  })
})
