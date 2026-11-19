import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACTIVE_TAB_KEY,
  FORCE_LANDING_KEY,
  LAB_SESSION_KEY,
  SKIP_INTRO_AFTER_AUTH_KEY,
  clearForceLandingFlag,
  clearLabNavigationState,
  clearSkipIntroAfterAuth,
  getActiveTab,
  landingAfterSignOutUrl,
  markSkipIntroAfterAuth,
  normalizeLabView,
  peekSkipIntroAfterAuth,
  prepareAuthReturnUrl,
  prepareLandingAfterSignOut,
  readAuthReturnTo,
  readLabSession,
  setActiveTab,
  writeLabSession,
} from './authReturnTo'

const valid = { 'day01-rendering-pipeline': {}, 'day02-reconciliation': {} }

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('normalizeLabView', () => {
  it('passes known views and defaults to exercises', () => {
    expect(normalizeLabView('community')).toBe('community')
    expect(normalizeLabView('settings')).toBe('settings')
    expect(normalizeLabView('support')).toBe('support')
    expect(normalizeLabView('zzz')).toBe('exercises')
    expect(normalizeLabView(undefined)).toBe('exercises')
  })
})

describe('simple flags', () => {
  it('active tab roundtrip', () => {
    expect(getActiveTab()).toBeNull()
    setActiveTab('practice')
    expect(getActiveTab()).toBe('practice')
  })

  it('skip intro flag', () => {
    expect(peekSkipIntroAfterAuth()).toBe(false)
    markSkipIntroAfterAuth()
    expect(peekSkipIntroAfterAuth()).toBe(true)
    clearSkipIntroAfterAuth()
    expect(peekSkipIntroAfterAuth()).toBe(false)
  })

  it('clearForceLandingFlag', () => {
    sessionStorage.setItem(FORCE_LANDING_KEY, '1')
    clearForceLandingFlag()
    expect(sessionStorage.getItem(FORCE_LANDING_KEY)).toBeNull()
  })

  it('landingAfterSignOutUrl uses origin', () => {
    expect(landingAfterSignOutUrl()).toBe(`${window.location.origin}/?rm=landing`)
  })

  it('tolerates sessionStorage failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('x')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('x')
    })
    expect(getActiveTab()).toBeNull()
    expect(() => setActiveTab('x')).not.toThrow()
    expect(() => clearForceLandingFlag()).not.toThrow()
    expect(readLabSession(valid)).toBeNull()
  })
})

describe('lab session', () => {
  it('write/read roundtrip with validation', () => {
    writeLabSession({ exercise: 'day02-reconciliation', view: 'community', tools: true })
    expect(readLabSession(valid)).toEqual({
      exercise: 'day02-reconciliation',
      view: 'community',
      tools: true,
    })
    expect(readLabSession({})).toBeNull()
  })

  it('returns null for empty / corrupt / missing exercise', () => {
    expect(readLabSession(valid)).toBeNull()
    sessionStorage.setItem(LAB_SESSION_KEY, '{bad')
    expect(readLabSession(valid)).toBeNull()
    sessionStorage.setItem(LAB_SESSION_KEY, JSON.stringify({ view: 'settings' }))
    expect(readLabSession(valid)).toBeNull()
  })
})

describe('clearing & sign-out', () => {
  it('clearLabNavigationState wipes keys and URL markers', () => {
    window.history.replaceState(null, '', '/app?rm=lab&ex=x&tab=y&view=z&tools=1&keep=1#rm=lab')
    sessionStorage.setItem(LAB_SESSION_KEY, '{}')
    sessionStorage.setItem(ACTIVE_TAB_KEY, 'x')
    sessionStorage.setItem(FORCE_LANDING_KEY, '1')
    clearLabNavigationState()
    expect(sessionStorage.getItem(LAB_SESSION_KEY)).toBeNull()
    expect(sessionStorage.getItem(ACTIVE_TAB_KEY)).toBeNull()
    expect(sessionStorage.getItem(FORCE_LANDING_KEY)).toBeNull()
    expect(window.location.search).toBe('?keep=1')
    expect(window.location.hash).toBe('')
  })

  it('prepareLandingAfterSignOut sets flags and URL', () => {
    sessionStorage.setItem(LAB_SESSION_KEY, '{}')
    prepareLandingAfterSignOut()
    expect(sessionStorage.getItem(FORCE_LANDING_KEY)).toBe('1')
    expect(peekSkipIntroAfterAuth()).toBe(true)
    expect(sessionStorage.getItem(LAB_SESSION_KEY)).toBeNull()
    expect(window.location.search).toContain('rm=landing')
  })

  it('swallows replaceState errors', () => {
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
      throw new Error('x')
    })
    expect(() => clearLabNavigationState()).not.toThrow()
    expect(() => prepareLandingAfterSignOut()).not.toThrow()
    expect(() => prepareAuthReturnUrl()).not.toThrow()
  })
})

describe('prepareAuthReturnUrl', () => {
  it('encodes landing hash by default and returns hash-free URL', () => {
    const url = prepareAuthReturnUrl()
    expect(url).toBe(`${window.location.origin}/`)
    expect(window.location.hash).toBe('#rm=landing')
    expect(peekSkipIntroAfterAuth()).toBe(true)
    expect(getActiveTab()).toBe('learn')
  })

  it('encodes lab state and persists session', () => {
    const url = prepareAuthReturnUrl({
      inLab: true,
      exercise: 'day02-reconciliation',
      view: 'settings',
      tools: true,
      tab: 'practice',
    })
    expect(url).not.toContain('#')
    const params = new URLSearchParams(window.location.hash.slice(1))
    expect(params.get('rm')).toBe('lab')
    expect(params.get('ex')).toBe('day02-reconciliation')
    expect(params.get('tab')).toBe('practice')
    expect(params.get('view')).toBe('settings')
    expect(params.get('tools')).toBe('1')
    expect(readLabSession(valid)?.exercise).toBe('day02-reconciliation')
  })

  it('derives state from existing lab session and active tab', () => {
    writeLabSession({ exercise: 'day01-rendering-pipeline', view: 'support', tools: false })
    setActiveTab('quiz')
    prepareAuthReturnUrl()
    const params = new URLSearchParams(window.location.hash.slice(1))
    expect(params.get('rm')).toBe('lab')
    expect(params.get('tab')).toBe('quiz')
    expect(params.get('view')).toBe('support')
    expect(params.get('tools')).toBeNull()
  })

  it('survives a corrupt lab session', () => {
    sessionStorage.setItem(LAB_SESSION_KEY, '{bad')
    prepareAuthReturnUrl()
    expect(window.location.hash).toBe('#rm=landing')
  })
})

describe('readAuthReturnTo', () => {
  it('returns null with no markers or session', () => {
    expect(readAuthReturnTo(valid)).toBeNull()
  })

  it('restores lab from session when no marker', () => {
    writeLabSession({ exercise: 'day02-reconciliation', view: 'community', tools: true })
    setActiveTab('practice')
    expect(readAuthReturnTo(valid)).toEqual({
      inLab: true,
      exercise: 'day02-reconciliation',
      view: 'community',
      tools: true,
      tab: 'practice',
    })
  })

  it('restores lab from session with default tab', () => {
    writeLabSession({ exercise: 'day02-reconciliation', view: 'community', tools: false })
    expect(readAuthReturnTo(valid)?.tab).toBe('learn')
  })

  it('force landing wipes lab state', () => {
    writeLabSession({ exercise: 'day02-reconciliation', view: 'community', tools: true })
    sessionStorage.setItem(FORCE_LANDING_KEY, '1')
    const res = readAuthReturnTo(valid)
    expect(res).toMatchObject({ inLab: false, exercise: 'day01-rendering-pipeline', tab: 'learn' })
    expect(sessionStorage.getItem(LAB_SESSION_KEY)).toBeNull()
    expect(sessionStorage.getItem(FORCE_LANDING_KEY)).toBeNull()
  })

  it('landing marker in query returns landing and strips URL', () => {
    window.history.replaceState(null, '', '/?rm=landing')
    expect(readAuthReturnTo(valid)?.inLab).toBe(false)
    expect(window.location.search).toBe('')
  })

  it('lab marker in hash restores exercise and persists', () => {
    window.history.replaceState(
      null,
      '',
      '/#rm=lab&ex=day02-reconciliation&tab=quiz&view=community&tools=1',
    )
    expect(readAuthReturnTo(valid)).toEqual({
      inLab: true,
      exercise: 'day02-reconciliation',
      view: 'community',
      tools: true,
      tab: 'quiz',
    })
    expect(getActiveTab()).toBe('quiz')
    expect(readLabSession(valid)?.exercise).toBe('day02-reconciliation')
  })

  it('lab marker in query works', () => {
    window.history.replaceState(null, '', '/?rm=lab&ex=day02-reconciliation')
    expect(readAuthReturnTo(valid)).toMatchObject({
      inLab: true,
      exercise: 'day02-reconciliation',
      view: 'exercises',
      tab: 'learn',
    })
  })

  it('falls back to session exercise when marker exercise is invalid', () => {
    writeLabSession({ exercise: 'day01-rendering-pipeline', view: 'exercises', tools: false })
    window.history.replaceState(null, '', '/#rm=lab&ex=bogus')
    expect(readAuthReturnTo(valid)?.exercise).toBe('day01-rendering-pipeline')
  })

  it('returns null for lab marker with no valid exercise', () => {
    window.history.replaceState(null, '', '/#rm=lab&ex=bogus')
    expect(readAuthReturnTo(valid)).toBeNull()
  })

  it('ignores unrelated hashes and unknown rm values', () => {
    window.history.replaceState(null, '', '/#something')
    expect(readAuthReturnTo(valid)).toBeNull()
    window.history.replaceState(null, '', '/#rm=other')
    expect(readAuthReturnTo(valid)).toBeNull()
  })
})

describe('keys', () => {
  it('exports stable storage keys', () => {
    expect(SKIP_INTRO_AFTER_AUTH_KEY).toBe('rm-skip-intro-after-auth')
  })
})
