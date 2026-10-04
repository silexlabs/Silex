import { describe, expect, it } from '@jest/globals'
import { getAvailableLocales, resolveLocale } from './index'

describe('resolveLocale', () => {
  it('registers the simplified core locale identifiers', () => {
    expect(getAvailableLocales()).toEqual(['en', 'fr'])
    expect(resolveLocale('fr-FR')).toBe('fr')
    expect(resolveLocale('en-US')).toBe('en')
  })

  it('uses exact bare language locales', () => {
    expect(resolveLocale('fr', ['en', 'fr'])).toBe('fr')
  })

  it('resolves regional requests to a shipped bare language locale', () => {
    expect(resolveLocale('fr-FR', ['en', 'fr'])).toBe('fr')
  })

  it('prefers an exact regional locale when available', () => {
    expect(resolveLocale('fr-CA', ['en', 'fr', 'fr-CA'])).toBe('fr-CA')
  })

  it('resolves a bare language to its regional locale when needed', () => {
    expect(resolveLocale('fr', ['en', 'fr-FR'])).toBe('fr-FR')
  })

  it('matches locale identifiers without regard to casing', () => {
    expect(resolveLocale('FR-fr', ['en', 'fr-FR'])).toBe('fr-FR')
  })

  it('falls back to English for an unsupported language', () => {
    expect(resolveLocale('de-DE', ['en', 'fr'])).toBe('en')
    expect(resolveLocale(undefined, ['en', 'fr'])).toBe('en')
  })
})