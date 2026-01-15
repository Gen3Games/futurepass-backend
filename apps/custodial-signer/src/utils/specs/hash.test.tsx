import { hashMessage } from '..'
import * as ethers from 'ethers'
describe('hashMessage', () => {
  it('should hash a string message with UTF-8 encoding', () => {
    const message = 'Test signing message 0xabc123'
    const expectedHash =
      '0x71ab501b9cffdbc178803ac239a2bd8f218094fd2bf8d7365a184e7150bb77b7'

    const result = hashMessage({ message, isUTF8Encoded: true })
    expect(result).toEqual(expectedHash)
  })

  it('should hash a string message without UTF-8 encoding', () => {
    const message = '0x123456789abcdefa'
    const expectedHash =
      '0x78a57fe0f517cc9a23db82f80eeb0059a2277bcc6a2a6accc40850cd9f29a8c5'

    const result = hashMessage({ message, isUTF8Encoded: false })
    expect(result).toEqual(expectedHash)
  })

  it('should hash a non-utf8 bytes message', () => {
    const message = '0x123456789abcdefa'
    const expectedHash =
      '0x78a57fe0f517cc9a23db82f80eeb0059a2277bcc6a2a6accc40850cd9f29a8c5'

    const result = hashMessage({
      message: ethers.utils.arrayify(message),
      isUTF8Encoded: false,
    })

    expect(result).toEqual(expectedHash)
  })
  it('should hash a utf8 bytes message', () => {
    const message = 'Test signing message 0xabc123'
    const expectedHash =
      '0x71ab501b9cffdbc178803ac239a2bd8f218094fd2bf8d7365a184e7150bb77b7'

    const result = hashMessage({
      message: ethers.utils.toUtf8Bytes(message),
      isUTF8Encoded: true,
    })

    expect(result).toEqual(expectedHash)
  })
})
