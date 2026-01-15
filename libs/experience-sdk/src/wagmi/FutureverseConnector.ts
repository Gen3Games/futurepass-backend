import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { Chain, Connector, ConnectorData } from 'wagmi'
import { Environment } from '../constants'
import { FutureverseSigner } from '../ethers/FutureverseSigner'
import { FVCustodialClient } from '../rpc'
import { Address, User } from '../types'

type GetProvider = (config?: {
  chainId?: number | undefined
}) => JsonRpcProvider

interface FutureverseConstructorArgs {
  user: User | null
  getProvider: GetProvider
  onError?: (error: Error) => void
  environment: Environment
}

// extend 'User' type with silly 0x type for the eoa
type _User = Omit<User, 'eoa'> & {
  eoa: Address
}

export class FutureverseConnector extends Connector<
  JsonRpcProvider,
  FutureverseConstructorArgs,
  FutureverseSigner
> {
  readonly id = 'Futureverse'
  readonly name = 'Futureverse Wallet'
  readonly ready = true

  #user: _User | null
  readonly #getProvider: GetProvider
  readonly #signerClient: FVCustodialClient
  #provider: Provider | null = null // late bound
  private readonly idpUrl: string

  constructor(config: {
    chains?: Chain[]
    options: FutureverseConstructorArgs
  }) {
    super(config)
    const { options } = config
    this.#provider = null
    this.#getProvider = options.getProvider
    this.#user = options.user
      ? {
          eoa: options.user.eoa,
          chainId: options.user.chainId,
          custodian: options.user.custodian,
          futurepass: options.user.futurepass,
        }
      : null
    this.#signerClient = new FVCustodialClient(
      options.environment.signerURL,
      options.environment.chain.id
    )

    this.idpUrl = options.environment.idpURL
  }

  #requireUser(): _User {
    if (this.#user == null) {
      throw new Error('No active user: not logged in')
    }
    return this.#user
  }

  override async connect(_config?: {
    chainId?: number
  }): Promise<Required<ConnectorData>> {
    const user = this.#requireUser()
    if (_config?.chainId != null) {
      this.#provider = this.#getProvider({ chainId: _config.chainId })
      this.#user = { ...user, chainId: _config.chainId }

      this.emit('connect', {
        account: user.eoa,
        chain: { id: _config.chainId, unsupported: false },
      })
    }

    return {
      account: user.eoa,
      chain: { id: _config?.chainId ?? user.chainId, unsupported: false },
      provider: this.#provider,
    }
  }

  override async disconnect(): Promise<void> {
    this.emit('disconnect')
  }

  override async getAccount(): Promise<`0x${string}`> {
    return this.#requireUser().eoa
  }

  override async getChainId(): Promise<number> {
    const network = await this.#provider?.getNetwork()
    if (network == null) {
      throw new Error('No network')
    }
    return network.chainId
  }

  override async getProvider(
    config?: { chainId?: number | undefined } | undefined
  ): Promise<JsonRpcProvider> {
    return this.#getProvider(config)
  }

  override async getSigner(
    config?: { chainId?: number | undefined } | undefined
  ): Promise<FutureverseSigner> {
    const account = await this.connect(config)

    if (account.provider == null) {
      throw new Error('No provider')
    }

    return new FutureverseSigner(
      this.#user ?? null,
      account.provider,
      this.#signerClient,
      this.idpUrl
    )
  }

  override async isAuthorized(): Promise<boolean> {
    return this.ready
  }

  protected override onAccountsChanged(_accounts: `0x${string}`[]): void {
    throw new Error('Account switching not supported')
  }

  override async switchChain(_chainId: number): Promise<Chain> {
    const chain = this.chains.find((c) => c.id === _chainId)
    if (chain == null) {
      throw new Error(`Unsupported chain ${_chainId}`)
    }
    await this.connect({ chainId: _chainId })

    this.emit('change', {
      chain: { id: chain.id, unsupported: false },
    })

    return chain
  }

  protected override isChainUnsupported(chainId: number) {
    return !this.chains.some((x) => x.id === chainId)
  }

  protected onChainChanged = (chainId: number | string) => {
    const id = normalizeChainId(chainId)
    const unsupported = this.isChainUnsupported(id)
    const user = this.#requireUser()
    this.#user = { ...user, chainId: id }
    this.emit('change', { chain: { id, unsupported } })
  }

  protected override onDisconnect(_error: Error): void {
    this.emit('disconnect')
  }
}

function normalizeChainId(chainId: string | number | bigint) {
  if (typeof chainId === 'string')
    return Number.parseInt(
      chainId,
      chainId.trim().substring(0, 2) === '0x' ? 16 : 10
    )
  if (typeof chainId === 'bigint') return Number(chainId)
  return chainId
}
