/**
 * SIWE Authentication Strategy Tests
 */

import { SiweAuthStrategy, SiweConfig } from '../strategies/siwe'
import { either as E } from 'fp-ts'

describe('SiweAuthStrategy', () => {
  const config: SiweConfig = {
    csrfSecret: 'test-csrf-secret',
    domain: 'login.futureverse.dev',
    uri: 'https://login.futureverse.dev',
    chainId: 7672,
    maxAge: 300,
  }

  let strategy: SiweAuthStrategy

  beforeEach(() => {
    strategy = new SiweAuthStrategy(config)
  })

  describe('generateNonce', () => {
    it('should generate a valid nonce string', () => {
      const nonce = strategy.generateNonce()
      
      expect(typeof nonce).toBe('string')
      expect(nonce.length).toBeGreaterThan(0)
    })

    it('should generate unique nonces', () => {
      const nonce1 = strategy.generateNonce()
      const nonce2 = strategy.generateNonce()
      
      // While not guaranteed to be different, they should be in practice
      expect(nonce1).not.toBe(nonce2)
    })
  })

  describe('verifyNonce', () => {
    it('should verify a valid nonce', () => {
      const nonce = strategy.generateNonce()
      
      expect(strategy.verifyNonce(nonce)).toBe(true)
    })

    it('should reject an invalid nonce', () => {
      expect(strategy.verifyNonce('invalid-nonce')).toBe(false)
    })

    it('should reject an empty nonce', () => {
      expect(strategy.verifyNonce('')).toBe(false)
    })
  })

  describe('validateHeaders', () => {
    it('should accept valid headers with x-csrf-token', () => {
      const headers = { 'x-csrf-token': 'test-token' }
      const result = strategy.validateHeaders(headers)
      
      expect(E.isRight(result)).toBe(true)
      if (E.isRight(result)) {
        expect(result.right.csrfToken).toBe('test-token')
      }
    })

    it('should reject headers without x-csrf-token', () => {
      const headers = { 'content-type': 'application/json' }
      const result = strategy.validateHeaders(headers)
      
      expect(E.isLeft(result)).toBe(true)
    })

    it('should reject null headers', () => {
      const result = strategy.validateHeaders(null)
      
      expect(E.isLeft(result)).toBe(true)
    })
  })

  describe('validateBody', () => {
    it('should accept valid body with message and signature', () => {
      const body = {
        message: '{"domain":"login.futureverse.dev",...}',
        signature: '0x1234567890abcdef',
      }
      const result = strategy.validateBody(body)
      
      expect(E.isRight(result)).toBe(true)
      if (E.isRight(result)) {
        expect(result.right.message).toBe(body.message)
        expect(result.right.signature).toBe(body.signature)
      }
    })

    it('should reject body without message', () => {
      const body = { signature: '0x1234' }
      const result = strategy.validateBody(body)
      
      expect(E.isLeft(result)).toBe(true)
    })

    it('should reject body without signature', () => {
      const body = { message: '{}' }
      const result = strategy.validateBody(body)
      
      expect(E.isLeft(result)).toBe(true)
    })

    it('should reject empty body', () => {
      const result = strategy.validateBody({})
      
      expect(E.isLeft(result)).toBe(true)
    })
  })

  describe('createMessage', () => {
    it('should create a valid SIWE message', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const nonce = strategy.generateNonce()
      
      const message = strategy.createMessage(address, nonce)
      
      expect(message.domain).toBe(config.domain)
      expect(message.address).toBe(address)
      expect(message.uri).toBe(config.uri)
      expect(message.version).toBe('1')
      expect(message.chainId).toBe(config.chainId)
      expect(message.nonce).toBe(nonce)
    })

    it('should include custom statement', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const nonce = strategy.generateNonce()
      const statement = 'Custom sign-in statement'
      
      const message = strategy.createMessage(address, nonce, statement)
      
      expect(message.statement).toBe(statement)
    })

    it('should set expiration time based on maxAge', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const nonce = strategy.generateNonce()
      
      const beforeCreate = new Date()
      const message = strategy.createMessage(address, nonce)
      
      expect(message.issuedAt).toBeDefined()
      expect(message.expirationTime).toBeDefined()
      
      // Expiration should be issuedAt + maxAge seconds
      const issuedAt = new Date(message.issuedAt!)
      const expirationTime = new Date(message.expirationTime!)
      const diffSeconds = (expirationTime.getTime() - issuedAt.getTime()) / 1000
      
      expect(diffSeconds).toBe(config.maxAge)
    })
  })

  // Integration test - requires actual wallet signature
  describe('verify (integration)', () => {
    it.skip('should verify a valid SIWE message and signature', async () => {
      // This test requires an actual signed message from a wallet
      // In a real test, you would use a test wallet to sign
      
      const nonce = strategy.generateNonce()
      // ... generate signed message with test wallet
      // const result = await strategy.verify(message, signature, nonce)
      // expect(E.isRight(result)).toBe(true)
    })

    it('should reject invalid CSRF token', async () => {
      const message = JSON.stringify({
        domain: config.domain,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        statement: 'Sign in',
        uri: config.uri,
        version: '1',
        chainId: config.chainId,
        nonce: 'invalid-nonce',
        issuedAt: new Date().toISOString(),
      })
      
      const result = await strategy.verify(message, '0xfakesig', 'invalid-csrf')
      
      expect(E.isLeft(result)).toBe(true)
      if (E.isLeft(result)) {
        expect(result.left.code).toBe(4005001) // Invalid CSRF
      }
    })
  })
})
