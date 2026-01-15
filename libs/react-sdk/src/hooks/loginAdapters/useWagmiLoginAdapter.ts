import { JsonRpcSigner } from '@ethersproject/providers'
import { Address, decodedOrThrow } from '@futureverse/experience-sdk'
import { FutureverseConnector } from '@futureverse/experience-sdk/wagmi'
import { Signer } from 'ethers'
import * as E from 'fp-ts/Either'
import { useMemo } from 'react'
import * as Wagmi from 'wagmi'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { HexString, ILoginAdapter, WagmiConnectorId } from '../../interfaces'

type InternalWagmiConnector = Wagmi.Connector<
  unknown,
  unknown,
  JsonRpcSigner | Signer
>

const connectorLookup: Record<
  WagmiConnectorId,
  (c: Wagmi.Connector) => c is InternalWagmiConnector
> = {
  // type guard function sigs are not inferred
  // see https://github.com/microsoft/TypeScript/issues/38390
  MetaMask: (c): c is MetaMaskConnector => c instanceof MetaMaskConnector,
  WalletConnect: (c): c is WalletConnectConnector =>
    c instanceof WalletConnectConnector,
  Coinbase: (c): c is CoinbaseWalletConnector =>
    c instanceof CoinbaseWalletConnector,
  FutureverseConnector: (c): c is FutureverseConnector =>
    c instanceof FutureverseConnector,
}

function findConnector(
  client: Wagmi.Client,
  connectorId: WagmiConnectorId
): InternalWagmiConnector | null {
  for (const c of client.connectors) {
    if (connectorLookup[connectorId](c)) return c
  }
  return null
}

export function useWagmiLoginAdapter(): {
  wagmiClient: Wagmi.Client | null
  adapter: ILoginAdapter
} {
  const client = Wagmi.useClient()
  const { connectAsync } = Wagmi.useConnect()

  const loginAdapter = useMemo(() => {
    const adapter: ILoginAdapter = {
      connect: async (selectedConnectorId: WagmiConnectorId) => {
        if (client == null) throw new Error('Wagmi client not found')
        const connector = findConnector(client, selectedConnectorId)
        if (connector == null) {
          throw new Error(
            `Connector not found; selectedConnectorId=${selectedConnectorId}; have=${client.connectors
              .map((x) => x.id)
              .join(',')}`
          )
        }
        try {
          await connectAsync({ connector })
        } catch (e) {
          if (e instanceof Wagmi.ConnectorAlreadyConnectedError) {
            console.warn('[wagmi] already connected!')
            // ignore!
          } else {
            throw e
          }
        }
        const signer = await connector.getSigner()
        return signer.getAddress()
      },
      signMessage: async (payload) => {
        if (
          payload.connectorId !== 'FutureverseConnector' &&
          payload.connectorId !== 'MetaMask' &&
          payload.connectorId !== 'WalletConnect' &&
          payload.connectorId !== 'Coinbase'
        ) {
          throw new Error('Connector not supported')
        }

        const { connectorId: selectedConnectorId, body } = payload

        let connector: InternalWagmiConnector | null = null
        if (client == null) throw new Error('Wagmi client not found')
        for (const c of client.connectors ?? []) {
          if (
            selectedConnectorId === 'MetaMask' &&
            c instanceof MetaMaskConnector
          ) {
            connector = c
            break
          }
          if (
            selectedConnectorId === 'WalletConnect' &&
            c instanceof WalletConnectConnector
          ) {
            connector = c
            break
          }
          if (
            selectedConnectorId === 'Coinbase' &&
            c instanceof CoinbaseWalletConnector
          ) {
            connector = c
            break
          }
          if (
            selectedConnectorId === 'FutureverseConnector' &&
            c instanceof FutureverseConnector
          ) {
            connector = c
            break
          }
        }
        if (connector == null) {
          throw new Error(
            `Connector not found; selectedConnectorId=${selectedConnectorId}; have=${client.connectors
              .map((x) => x.id)
              .join(',')}`
          )
        }
        const signer = await connector.getSigner()
        const signature = await signer.signMessage(body.message)

        return {
          signedMessage: body.message,
          signature: decodedOrThrow(HexString.decode(signature)),
          details: null,
        }
      },
      getEthAccount: async (connectorId) => {
        if (client == null) throw new Error('Wagmi client not found')

        const wagmiConnectorId = WagmiConnectorId.decode(connectorId)

        if (E.isLeft(wagmiConnectorId)) {
          throw new Error(
            'Invalid connectorId passed to WagmiWeb3ProviderInner.getEthAccount, expected WagmiConnectorId'
          )
        }
        const connector = findConnector(client, wagmiConnectorId.right)
        if (connector == null) {
          throw new Error('No connector found')
        }
        const signer = await connector.getSigner()
        const address = await signer.getAddress()

        return {
          eoa: decodedOrThrow(Address.decode(address)),
          publicKey: null,
          transaction: null,
        }
      },
    }
    return adapter
  }, [client, connectAsync])

  return { adapter: loginAdapter, wagmiClient: client }
}
