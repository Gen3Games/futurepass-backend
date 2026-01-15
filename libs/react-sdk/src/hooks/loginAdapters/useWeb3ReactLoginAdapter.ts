import { Web3Provider } from '@ethersproject/providers'
import { decodedOrThrow } from '@futureverse/experience-sdk'
import { unreachable } from '@futureverse/rpc-kit'
import { HexString } from '@sylo/io-ts'
import { CoinbaseWallet as Web3React_CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask as Web3React_MetaMask } from '@web3-react/metamask'
import { WalletConnect as Web3React_WalletConnectV2 } from '@web3-react/walletconnect-v2'
import * as React from 'react'
import { ConnectorId, ILoginAdapter } from '../../interfaces'

export function useWeb3ReactLoginAdapter(opts: {
  metaMask: Web3React_MetaMask
  walletConnect: Web3React_WalletConnectV2
  coinbase: Web3React_CoinbaseWallet
}): ILoginAdapter {
  const loginAdapter = React.useMemo(() => {
    const adapter: ILoginAdapter = {
      async signMessage(payload) {
        if (
          payload.connectorId !== 'FutureverseConnector' &&
          payload.connectorId !== 'MetaMask' &&
          payload.connectorId !== 'WalletConnect' &&
          payload.connectorId !== 'Coinbase'
        ) {
          throw new Error('Connector not supported')
        }
        const { connectorId: type, body } = payload
        // TODO this code could be DRY-ied up ...
        if (type === 'MetaMask') {
          if (!opts.metaMask.provider) {
            throw new Error('No wallet connected')
          }
          const provider = new Web3Provider(opts.metaMask.provider)
          const signature = decodedOrThrow(
            HexString.decode(
              await provider.getSigner().signMessage(body.message)
            )
          )
          return { signedMessage: body.message, signature, details: null }
        }
        if (type === 'WalletConnect') {
          if (!opts.walletConnect.provider) {
            throw new Error('No wallet connected')
          }
          const provider = new Web3Provider(opts.walletConnect.provider)
          const signature = decodedOrThrow(
            HexString.decode(
              await provider.getSigner().signMessage(body.message)
            )
          )
          return { signedMessage: body.message, signature, details: null }
        }
        if (type === 'Coinbase') {
          if (!opts.coinbase.provider) {
            throw new Error('No wallet connected')
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- ''
          const provider = new Web3Provider(opts.coinbase.provider as any)
          const signature = decodedOrThrow(
            HexString.decode(
              await provider.getSigner().signMessage(body.message)
            )
          )
          return { signedMessage: body.message, signature, details: null }
        }
        if (type === 'FutureverseConnector') {
          throw new Error('FutureverseConnector not supported for Web3React')
        }

        return unreachable(type)
      },
      async connect(type: ConnectorId) {
        if (
          type !== 'FutureverseConnector' &&
          type !== 'MetaMask' &&
          type !== 'WalletConnect' &&
          type !== 'Coinbase'
        ) {
          throw new Error('Connector not supported')
        }
        // TODO this code could be DRY-ied up ...
        if (type === 'MetaMask') {
          await opts.metaMask.activate()
          if (opts.metaMask.provider == null) {
            // TODO error handling
            throw new Error('Failed to activate Metamask')
          }
          const provider = new Web3Provider(opts.metaMask.provider)
          return provider.getSigner().getAddress()
        }

        if (type === 'WalletConnect') {
          await opts.walletConnect.activate()
          if (opts.walletConnect.provider == null) {
            // TODO error handling
            throw new Error('Failed to activate WalletConnect')
          }
          const provider = new Web3Provider(opts.walletConnect.provider)
          return provider.getSigner().getAddress()
        }

        if (type === 'Coinbase') {
          await opts.coinbase.activate()
          if (opts.coinbase.provider == null) {
            // TODO error handling
            throw new Error('Failed to activate WalletConnect')
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- ''
          const provider = new Web3Provider(opts.coinbase.provider as any)
          return provider.getSigner().getAddress()
        }

        if (type === 'FutureverseConnector') {
          throw new Error('FutureverseConnector not supported for Web3React')
        }

        return unreachable(type)
      },
      async getEthAccount() {
        throw new Error('Not supported')
      },
    }
    return adapter
  }, [opts.coinbase, opts.metaMask, opts.walletConnect])
  return loginAdapter
}
