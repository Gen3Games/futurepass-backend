import { Bytes, concat } from '@ethersproject/bytes'
import { keccak256 } from '@ethersproject/keccak256'
import { toUtf8Bytes } from '@ethersproject/strings'
import { arrayify } from 'ethers/lib/utils.js'

export const messagePrefix = '\x19Ethereum Signed Message:\n'

export function hashMessage(data: {
  message: Bytes | string
  isUTF8Encoded: boolean
}): string {
  const message =
    typeof data.message === 'string'
      ? data.isUTF8Encoded
        ? toUtf8Bytes(data.message)
        : arrayify(data.message)
      : data.message

  return keccak256(
    concat([
      toUtf8Bytes(messagePrefix),
      toUtf8Bytes(String(message.length)),
      message,
    ])
  )
}
