import * as utils from '..'

const testAddress = '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'

describe('Utils', () => {
  it('test toChainLocation', () => {
    expect(utils.toChainLocation(1, testAddress)).toEqual({
      chainId: '1',
      chainType: 'evm',
      chainAddress: testAddress,
    })
    expect(utils.toChainLocation(11_155_111, testAddress)).toEqual({
      chainId: '11155111',
      chainType: 'evm',
      chainAddress: testAddress,
    })
    expect(utils.toChainLocation(7668, testAddress)).toEqual({
      chainId: '7668',
      chainType: 'root',
      chainAddress: testAddress,
    })
    expect(utils.toChainLocation(7672, testAddress)).toEqual({
      chainId: '7672',
      chainType: 'root',
      chainAddress: testAddress,
    })
  })
})
