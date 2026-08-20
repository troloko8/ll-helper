import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './token-storage'

describe('token-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('removes the token on clearToken', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
