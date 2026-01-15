import * as AccountLib from 'xrpl-accountlib'

const newAccount = AccountLib.generate.familySeed({
  algorithm: 'secp256k1',
})
console.log(newAccount)
