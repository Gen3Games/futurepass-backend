import { DeterministicLocalCustodyProvider, normalizeSubject } from './provider'

describe('DeterministicLocalCustodyProvider', () => {
  it('normalizes subjects to lowercase', () => {
    expect(normalizeSubject(' Email:User@Example.com ')).toBe(
      'email:user@example.com'
    )
  })

  it('derives the same account for the same subject and issuer', async () => {
    const provider = new DeterministicLocalCustodyProvider('test-seed')
    const first = await provider.ensureAccount({
      subject: 'email:user@example.com',
      issuer: 'login.pass.online',
      createIfMissing: true,
    })
    const second = await provider.ensureAccount({
      subject: 'EMAIL:USER@EXAMPLE.COM',
      issuer: 'LOGIN.PASS.ONLINE',
      createIfMissing: true,
    })

    expect(first.account.address).toBe(second.account.address)
    expect(first.account.publicKey).toBe(second.account.publicKey)
  })
})