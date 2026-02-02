/**
 * Type Definitions Tests
 */

import { 
  FVSub, 
  FVSubImpl,
  encodeSub, 
  decodeSub, 
  custodianOf,
  userStorageKey,
  userProfileStorageKey,
  ETHAddress,
  SocialSSOType,
} from '../types'
import { either as E } from 'fp-ts'

describe('FVSub', () => {
  describe('encoding and decoding', () => {
    describe('EOA (self-custody Ethereum)', () => {
      it('should encode and decode EOA sub', () => {
        const sub: FVSubImpl = { 
          type: 'eoa', 
          eoa: '0x1234567890abcdef1234567890abcdef12345678' 
        }
        
        const encoded = FVSub.encode(sub)
        expect(encoded).toBe('eoa:0x1234567890abcdef1234567890abcdef12345678')
        
        const decoded = FVSub.decode(encoded)
        expect(E.isRight(decoded)).toBe(true)
        if (E.isRight(decoded)) {
          expect(decoded.right).toEqual(sub)
        }
      })

      it('should reject empty EOA', () => {
        const decoded = FVSub.decode('eoa:')
        expect(E.isLeft(decoded)).toBe(true)
      })
    })

    describe('XRPL (self-custody XRP)', () => {
      it('should encode and decode XRPL sub', () => {
        const sub: FVSubImpl = { 
          type: 'xrpl', 
          publicKey: 'ED1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12',
          eoa: '0x5678abcd5678abcd5678abcd5678abcd5678abcd'
        }
        
        const encoded = FVSub.encode(sub)
        expect(encoded).toBe('xrpl:ED1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12:eoa:0x5678abcd5678abcd5678abcd5678abcd5678abcd')
        
        const decoded = FVSub.decode(encoded)
        expect(E.isRight(decoded)).toBe(true)
        if (E.isRight(decoded)) {
          expect(decoded.right).toEqual(sub)
        }
      })

      it('should reject invalid XRPL public key', () => {
        const decoded = FVSub.decode('xrpl::eoa:0x1234')
        expect(E.isLeft(decoded)).toBe(true)
      })
    })

    describe('Email (custodial)', () => {
      it('should encode and decode email sub', () => {
        const sub: FVSubImpl = { 
          type: 'email', 
          email: 'user@example.com' 
        }
        
        const encoded = FVSub.encode(sub)
        expect(encoded).toBe('email:user@example.com')
        
        const decoded = FVSub.decode(encoded)
        expect(E.isRight(decoded)).toBe(true)
        if (E.isRight(decoded)) {
          expect(decoded.right).toEqual(sub)
        }
      })

      it('should handle email with colons', () => {
        const sub: FVSubImpl = { 
          type: 'email', 
          email: 'user:special@example.com' 
        }
        
        const encoded = FVSub.encode(sub)
        const decoded = FVSub.decode(encoded)
        
        expect(E.isRight(decoded)).toBe(true)
        if (E.isRight(decoded)) {
          expect(decoded.right.type).toBe('email')
          if (decoded.right.type === 'email') {
            expect(decoded.right.email).toBe('user:special@example.com')
          }
        }
      })

      it('should reject empty email', () => {
        const decoded = FVSub.decode('email:')
        expect(E.isLeft(decoded)).toBe(true)
      })
    })

    describe('IDP (custodial social login)', () => {
      it('should encode and decode Google IDP sub', () => {
        const sub: FVSubImpl = { 
          type: 'idp', 
          idp: 'google',
          sub: '123456789'
        }
        
        const encoded = FVSub.encode(sub)
        expect(encoded).toBe('idp:google:123456789')
        
        const decoded = FVSub.decode(encoded)
        expect(E.isRight(decoded)).toBe(true)
        if (E.isRight(decoded)) {
          expect(decoded.right).toEqual(sub)
        }
      })

      it('should support all social providers', () => {
        const providers: Array<'google' | 'apple' | 'facebook' | 'twitter' | 'tiktok'> = 
          ['google', 'apple', 'facebook', 'twitter', 'tiktok']
        
        for (const provider of providers) {
          const sub: FVSubImpl = { type: 'idp', idp: provider, sub: 'test-sub' }
          const encoded = FVSub.encode(sub)
          const decoded = FVSub.decode(encoded)
          
          expect(E.isRight(decoded)).toBe(true)
        }
      })

      it('should reject invalid IDP provider', () => {
        const decoded = FVSub.decode('idp:invalid:123')
        expect(E.isLeft(decoded)).toBe(true)
      })

      it('should reject missing IDP sub', () => {
        const decoded = FVSub.decode('idp:google:')
        expect(E.isLeft(decoded)).toBe(true)
      })
    })

    describe('unknown types', () => {
      it('should reject unknown sub types', () => {
        const decoded = FVSub.decode('unknown:value')
        expect(E.isLeft(decoded)).toBe(true)
      })
    })
  })
})

describe('custodianOf', () => {
  it('should return "self" for EOA', () => {
    const sub: FVSubImpl = { type: 'eoa', eoa: '0x1234' }
    expect(custodianOf(sub)).toBe('self')
  })

  it('should return "self" for XRPL', () => {
    const sub: FVSubImpl = { type: 'xrpl', publicKey: 'ED1234', eoa: '0x5678' }
    expect(custodianOf(sub)).toBe('self')
  })

  it('should return "fv" for email', () => {
    const sub: FVSubImpl = { type: 'email', email: 'user@example.com' }
    expect(custodianOf(sub)).toBe('fv')
  })

  it('should return "fv" for IDP', () => {
    const sub: FVSubImpl = { type: 'idp', idp: 'google', sub: '123' }
    expect(custodianOf(sub)).toBe('fv')
  })
})

describe('storage key generation', () => {
  describe('userStorageKey', () => {
    it('should generate lowercase storage key', () => {
      const sub: FVSubImpl = { type: 'eoa', eoa: '0xABCDEF' }
      const key = userStorageKey(sub)
      
      expect(key).toBe('USER:eoa:0xabcdef')
    })
  })

  describe('userProfileStorageKey', () => {
    it('should generate lowercase profile storage key', () => {
      const sub: FVSubImpl = { type: 'eoa', eoa: '0xABCDEF' }
      const key = userProfileStorageKey(sub)
      
      expect(key).toBe('USER_PROFILE:eoa:0xabcdef')
    })
  })
})

describe('helper functions', () => {
  describe('encodeSub', () => {
    it('should encode sub to string', () => {
      const sub: FVSubImpl = { type: 'eoa', eoa: '0x1234' }
      expect(encodeSub(sub)).toBe('eoa:0x1234')
    })
  })

  describe('decodeSub', () => {
    it('should decode valid string to sub', () => {
      const result = decodeSub('eoa:0x1234')
      expect(result).toEqual({ type: 'eoa', eoa: '0x1234' })
    })

    it('should return null for invalid string', () => {
      const result = decodeSub('invalid')
      expect(result).toBeNull()
    })
  })
})

describe('ETHAddress', () => {
  it('should accept valid Ethereum address', () => {
    const result = ETHAddress.decode('0x1234567890abcdef1234567890abcdef12345678')
    expect(E.isRight(result)).toBe(true)
  })

  it('should normalize address to lowercase', () => {
    const result = ETHAddress.decode('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')
    expect(E.isRight(result)).toBe(true)
    if (E.isRight(result)) {
      expect(result.right).toBe('0xabcdef1234567890abcdef1234567890abcdef12')
    }
  })

  it('should reject address without 0x prefix', () => {
    const result = ETHAddress.decode('1234567890abcdef1234567890abcdef12345678')
    expect(E.isLeft(result)).toBe(true)
  })

  it('should reject address with wrong length', () => {
    const result = ETHAddress.decode('0x1234')
    expect(E.isLeft(result)).toBe(true)
  })
})

describe('SocialSSOType', () => {
  it('should accept valid social providers', () => {
    const providers = ['google', 'apple', 'facebook', 'twitter', 'tiktok']
    
    for (const provider of providers) {
      const result = SocialSSOType.decode(provider)
      expect(E.isRight(result)).toBe(true)
    }
  })

  it('should reject invalid provider', () => {
    const result = SocialSSOType.decode('linkedin')
    expect(E.isLeft(result)).toBe(true)
  })
})
