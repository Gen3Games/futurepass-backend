import { either as E } from 'fp-ts'
import {
  AssetId,
  Address,
  ChainLocation,
  PublicKey,
  UserAuthenticationMethod,
  UserXamanAuthenticationType,
  UserWagmiAuthenticationType,
  UserEmailAuthenticationType,
  UserIdpAuthenticationType,
} from './types'
import { hush } from './utils'

describe('AssetId', () => {
  const testCases = [
    {
      input: 123,
      expected: true,
    },
    {
      input: '123',
      expected: true,
    },
    {
      // Should be a number format string
      input: 'abc',
      expected: false,
    },
  ]
  testCases.forEach(({ input, expected }) => {
    it(`${expected ? 'should' : 'should not'} decode a ${
      expected ? 'valid' : 'invalid'
    } AssetId`, () => {
      expect(E.isRight(AssetId.decode(input))).toBe(expected)
    })
  })
})

describe('Sdk types unit tests', () => {
  describe('ChainLocation type round trip tests', () => {
    const validChainLocationStringVal =
      '5:evm:0x7D05fbF91Ca3664A929FFeAa0DC0Bf3051513B3e'
    const invalidChainLocationStringVal =
      '9:eth:0x7D05fbF91Ca3664A929FFeAa0DC0Bf3051513B3e'

    it('it should successfully decode the valid chain location', () => {
      const chainLocation = hush(
        ChainLocation.decode(validChainLocationStringVal)
      )

      expect(chainLocation).toStrictEqual({
        chainId: '5',
        chainType: 'evm',
        chainAddress: hush(
          Address.decode('0x7D05fbF91Ca3664A929FFeAa0DC0Bf3051513B3e')
        ),
      })
    })

    it('it should successfully encode the valid chain location', () => {
      const address = hush(
        Address.decode('0x7D05fbF91Ca3664A929FFeAa0DC0Bf3051513B3e')
      )
      if (address) {
        expect(
          ChainLocation.encode({
            chainId: '5',
            chainType: 'evm',
            chainAddress: address,
          })
        ).toBe(validChainLocationStringVal)
      }
    })

    it('it should fail to decode the invalid chain location', () => {
      const chainLocation = hush(
        ChainLocation.decode(invalidChainLocationStringVal)
      )

      expect(chainLocation).toBeNull()
    })

    it('round-trip test', () => {
      const chainLocation = hush(
        ChainLocation.decode(validChainLocationStringVal)
      )

      if (chainLocation) {
        expect(ChainLocation.encode(chainLocation)).toBe(
          validChainLocationStringVal
        )
      }
    })
  })
})

describe('Public Key', () => {
  // test with ED25519 public key
  it('it should successfully decode a valid ED25519 public key', () => {
    const PUBLIC_KEY =
      'ED6E55832A159DB87C671061F8488B5B8686E82FAFF3FAF9AD0CA25C538ED21DCF'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(PUBLIC_KEY.toLowerCase())
  })

  it('it fail to decode a invalid ED25519 public key', () => {
    const PUBLIC_KEY = 'EDbarbarbar'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(null)
  })

  it('it should successfully encode a valid ED25519 public key', () => {
    const PUBLIC_KEY =
      'ED6E55832A159DB87C671061F8488B5B8686E82FAFF3FAF9AD0CA25C538ED21DCF'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    if (publicKey) {
      expect(PublicKey.encode(publicKey)).toBe(`${PUBLIC_KEY}`.toLowerCase())
    }
  })

  // test with SECP256K1 public key without 0x prefix
  it('it should successfully decode a valid SECP256K1 public key', () => {
    const PUBLIC_KEY =
      '035C080E3218FAEF37FFD21F7CD2EFF0E574D0FDCE703E15A590AE84DE42C5BB5F'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(`0x${PUBLIC_KEY}`.toLowerCase())
  })

  it('it fail to decode a invalid SECP256K1 public key', () => {
    const PUBLIC_KEY = 'barbarbar'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(null)
  })

  it('it should successfully encode a valid SECP256K1 public key', () => {
    const PUBLIC_KEY =
      '035C080E3218FAEF37FFD21F7CD2EFF0E574D0FDCE703E15A590AE84DE42C5BB5F'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    if (publicKey) {
      expect(PublicKey.encode(publicKey)).toBe(`0x${PUBLIC_KEY}`.toLowerCase())
    }
  })

  // test with SECP256K1 public key with 0x prefix
  it('it should successfully decode a valid SECP256K1 public key with 0x prefix', () => {
    const PUBLIC_KEY =
      '0x03c4a95bada4f0dc262bab0d3960587f392d574e6f2ba72fe5e60acaae0bc9f391'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(PUBLIC_KEY)
  })

  it('it fail to decode a invalid SECP256K1 public key with 0x prefix', () => {
    const PUBLIC_KEY = '0xbarbarbar'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    expect(publicKey).toStrictEqual(null)
  })

  it('it should successfully encode a valid SECP256K1 public key', () => {
    const PUBLIC_KEY =
      '0x03c4a95bada4f0dc262bab0d3960587f392d574e6f2ba72fe5e60acaae0bc9f391'
    const publicKey = hush(PublicKey.decode(PUBLIC_KEY))

    if (publicKey) {
      expect(PublicKey.encode(publicKey)).toBe(PUBLIC_KEY)
    }
  })
})

describe('User Login Wallet', () => {
  it('it should successfully decode a user sub when login with MM', () => {
    const USER_SUB = 'eoa:0xf61dfb33eb48ab750603741e0653d3341bde342e'
    const userWagmiAuthentication = hush(
      UserAuthenticationMethod.decode(USER_SUB)
    )

    expect(userWagmiAuthentication).not.toBeNull()

    const userWagmiAuthenticationType = hush(
      UserWagmiAuthenticationType.decode(userWagmiAuthentication)
    )
    expect(userWagmiAuthenticationType).not.toBeNull()
    expect(userWagmiAuthenticationType?.method).toStrictEqual('wagmi')
    expect(userWagmiAuthenticationType?.eoa.toLowerCase()).toStrictEqual(
      '0xf61dfb33eb48ab750603741e0653d3341bde342e'
    )
  })

  it('it should successfully decode a user sub when login with email', () => {
    const USER_SUB = 'email:stress_test_user_v12_1_5844307@test000000.com'

    const userEmailAuthentication = hush(
      UserAuthenticationMethod.decode(USER_SUB)
    )

    expect(userEmailAuthentication).not.toBeNull()

    const userEmailAuthenticationType = hush(
      UserEmailAuthenticationType.decode(userEmailAuthentication)
    )
    expect(userEmailAuthenticationType).not.toBeNull()
    expect(userEmailAuthenticationType?.method).toStrictEqual('fv:email')
    expect(userEmailAuthenticationType?.email).toStrictEqual(
      'stress_test_user_v12_1_5844307@test000000.com'
    )
  })

  it('it should successfully decode a user sub when login with google', () => {
    const USER_SUB = 'idp:google:100278486380070601307'

    const userIdpAuthentication = hush(
      UserAuthenticationMethod.decode(USER_SUB)
    )

    expect(userIdpAuthentication).not.toBeNull()

    const userIpdAuthenticationType = hush(
      UserIdpAuthenticationType.decode(userIdpAuthentication)
    )
    expect(userIpdAuthenticationType).not.toBeNull()
    expect(userIpdAuthenticationType?.method).toStrictEqual('fv:google')
    expect(userIpdAuthenticationType?.email).toBeUndefined()
  })

  it('it should successfully decode a user user sub when login with facebook', () => {
    const USER_SUB = 'idp:facebook:2414967335363481'
    const userIdpAuthentication = hush(
      UserAuthenticationMethod.decode(USER_SUB)
    )

    expect(userIdpAuthentication).not.toBeNull()

    const userIpdAuthenticationType = hush(
      UserIdpAuthenticationType.decode(userIdpAuthentication)
    )
    expect(userIpdAuthenticationType).not.toBeNull()
    expect(userIpdAuthenticationType?.method).toStrictEqual('fv:facebook')
    expect(userIpdAuthenticationType?.email).toBeUndefined()
  })

  it('it should successfully decode a user sub when login with xaman', () => {
    const USER_SUB =
      'xrpl:035C080E3218FAEF37FFD21F7CD2EFF0E574D0FDCE703E15A590AE84DE42C5BB5F:eoa:0x31127AD7D79Ca721D6ef1E00Bd9E43981caD92C8'
    const userXamanAuthentication = hush(
      UserAuthenticationMethod.decode(USER_SUB)
    )

    expect(userXamanAuthentication).not.toBeNull()

    const userXamanAuthenticationType = hush(
      UserXamanAuthenticationType.decode(userXamanAuthentication)
    )
    expect(userXamanAuthenticationType).not.toBeNull()
    expect(userXamanAuthenticationType?.method).toStrictEqual('xaman')
    expect(userXamanAuthenticationType?.rAddress).toStrictEqual(
      'rnJjAa6uJqwkfztFeyxTvxj1NdsCyCNuD7'
    )
  })

  it('it should failed decode a null or undefined user sub', () => {
    const NULL_USER_SUB = null
    const nullUserSubType = hush(UserAuthenticationMethod.decode(NULL_USER_SUB))

    expect(nullUserSubType).toStrictEqual(null)

    const UNDEFINED_USER_SUB = undefined
    const undefinedUserSubType = hush(
      UserAuthenticationMethod.decode(UNDEFINED_USER_SUB)
    )

    expect(undefinedUserSubType).toStrictEqual(null)
  })
})
