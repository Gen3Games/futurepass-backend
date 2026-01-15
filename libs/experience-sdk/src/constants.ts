import { Address, AssetId, Stage } from './types'
import { decodedOrThrow, deepFreeze } from './utils'

/**
 * The below is adjusted version of Chain from Wagmi to avoid Wagmi dependency in this package.
 * It also renders `blockExplorers` mandatory.
 */
type RpcUrls = {
  http: readonly string[]
  webSocket?: readonly string[]
}

type BlockExplorer = {
  name: string
  url: string
}

type Contract = {
  address: `0x${string}`
  blockCreated?: number
}

type Chain = {
  /** ID in number form */
  id: number
  /** Human-readable name */
  name: string
  /** Internal network name */
  network: string
  /** Currency used by chain */
  nativeCurrency: {
    name: string
    /** 2-6 characters long */
    symbol: string
    decimals: number
  }
  /** Collection of RPC endpoints */
  rpcUrls: {
    [key: string]: RpcUrls
    default: RpcUrls
    public: RpcUrls
  }
  /** Collection of block explorers */
  blockExplorers: {
    [key: string]: BlockExplorer
    default: BlockExplorer
  }
  /** Collection of contracts */
  contracts?: {
    ensRegistry?: Contract
    ensUniversalResolver?: Contract
    multicall3?: Contract
  }
  /** Flag for test networks */
  testnet?: boolean
}

interface XrplChain {
  apiUrl: string
  explorerUrl: string
}

// Properties are not capitalised because they adhere to Wagmi Chain type
export const CHAINS: {
  ETHEREUM: {
    HOMESTEAD: Chain
    SEPOLIA: Chain
  }
  TRN: {
    PORCINI: Chain
    MAINNET: Chain
    // DEVNET_PORCINI: Chain
    DEVNET_MAINNET: Chain
  }
  XRPL: {
    MAINNET: XrplChain
    TESTNET: XrplChain
  }
} = deepFreeze({
  ETHEREUM: {
    HOMESTEAD: {
      id: 1,
      network: 'homestead',
      name: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        alchemy: {
          http: ['https://eth-mainnet.g.alchemy.com/v2'],
          webSocket: ['wss://eth-mainnet.g.alchemy.com/v2'],
        },
        infura: {
          http: ['https://mainnet.infura.io/v3'],
          webSocket: ['wss://mainnet.infura.io/ws/v3'],
        },
        default: {
          http: [resolveSupportedChainRpcHttpUrl(1)],
        },
        public: {
          http: [resolveSupportedChainRpcHttpUrl(1)],
        },
      },
      blockExplorers: {
        etherscan: {
          name: 'Etherscan',
          url: 'https://etherscan.io',
        },
        default: {
          name: 'Etherscan',
          url: 'https://etherscan.io',
        },
      },
      contracts: {
        ensRegistry: {
          address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        },
        multicall3: {
          address: '0xca11bde05977b3631167028862be2a173976ca11',
          blockCreated: 14353601,
        },
      },
    },
    SEPOLIA: {
      id: 11_155_111,
      network: 'sepolia',
      name: 'Sepolia test network',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
      rpcUrls: {
        alchemy: {
          http: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
        },
        infura: {
          http: ['https://sepolia.infura.io/v3'],
          webSocket: ['wss://sepolia.infura.io/ws/v3'],
        },
        default: {
          http: [resolveSupportedChainRpcHttpUrl(11_155_111)],
        },
        public: {
          http: [resolveSupportedChainRpcHttpUrl(11_155_111)],
        },
      },
      blockExplorers: {
        etherscan: {
          name: 'Etherscan',
          url: 'https://sepolia.etherscan.io',
        },
        default: {
          name: 'Etherscan',
          url: 'https://sepolia.etherscan.io',
        },
      },
      contracts: {
        multicall3: {
          address: '0xca11bde05977b3631167028862be2a173976ca11',
          blockCreated: 751_532,
        },
        ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
        ensUniversalResolver: {
          address: '0xBaBC7678D7A63104f1658c11D6AE9A21cdA09725',
          blockCreated: 5_043_334,
        },
      },
      testnet: true,
    },
  },
  TRN: {
    MAINNET: {
      id: 7668,
      name: 'The Root Network',
      network: 'root-mainnet',
      nativeCurrency: {
        name: 'XRP',
        symbol: 'XRP',
        decimals: 18, // XRP has 6 decimals, but the EVM layer of TRN handles the conversion
      },
      rpcUrls: {
        default: {
          http: [resolveSupportedChainRpcHttpUrl(7668)],
          webSocket: ['wss://root.rootnet.live/ws'],
        },
        public: {
          http: [resolveSupportedChainRpcHttpUrl(7668)],
          webSocket: ['wss://root.rootnet.live/ws'],
        },
        archive: {
          http: ['https://root.rootnet.live/archive'],
          webSocket: ['wss://root.rootnet.live/archive/ws'],
        },
      },
      blockExplorers: {
        default: { name: 'rootMainnet', url: 'https://rootscan.io/' },
      },
      contracts: {
        // TODO: do we need contracts here ?
      },
      testnet: false,
    },
    PORCINI: {
      id: 7672,
      name: 'Porcini (Testnet)',
      network: 'root-porcini',
      nativeCurrency: {
        name: 'XRP',
        symbol: 'XRP',
        decimals: 18, // XRP has 6 decimals, but the EVM layer of TRN handles the conversion
      },
      rpcUrls: {
        default: {
          http: [resolveSupportedChainRpcHttpUrl(7672)],
          webSocket: ['wss://porcini.rootnet.app/ws'],
        },
        public: {
          http: [resolveSupportedChainRpcHttpUrl(7672)],
          webSocket: ['wss://porcini.rootnet.app/ws'],
        },
        archive: {
          http: ['https://porcini.rootnet.app/archive'],
          webSocket: ['wss://porcini.rootnet.app/archive/ws'],
        },
      },

      blockExplorers: {
        default: {
          name: 'rootPorcini',
          url: 'https://porcini.rootscan.io/',
        },
      },
      contracts: {
        // TODO: do we need contracts here ?
      },
      testnet: true,
    },
    DEVNET_MAINNET: {
      id: 17668,
      name: 'The Root Network (DevNet)',
      network: 'sprout-2',
      nativeCurrency: {
        name: 'XRP',
        symbol: 'XRP',
        decimals: 18, // XRP has 6 decimals, but the EVM layer of TRN handles the conversion
      },
      rpcUrls: {
        default: {
          http: [resolveSupportedChainRpcHttpUrl(17668)],
          webSocket: ['wss://root.rootnet.live/ws'],
        },
        public: {
          http: [resolveSupportedChainRpcHttpUrl(17668)],
          webSocket: ['wss://root.rootnet.live/ws'],
        },
      },
      blockExplorers: {
        default: {
          name: 'rootMainnet',
          url: 'https://portal.rootnet.live/?rpc=wss://root.devnet.rootnet.app/ws#/explorer',
        },
      },
      contracts: {
        // TODO: do we need contracts here ?
      },
      testnet: false,
    },
    // DEVNET_PORCINI: {
    //   id: 17672,
    //   name: 'Porcini (DevNet)',
    //   network: 'sprout-1',
    //   nativeCurrency: {
    //     name: 'XRP',
    //     symbol: 'XRP',
    //     decimals: 18, // XRP has 6 decimals, but the EVM layer of TRN handles the conversion
    //   },
    //   rpcUrls: {
    //     default: {
    //       http: [resolveSupportedChainRpcHttpUrl(17672)],
    //       webSocket: ['wss://porcini.devnet.rootnet.app/ws'],
    //     },
    //     public: {
    //       http: [resolveSupportedChainRpcHttpUrl(17672)],
    //       webSocket: ['wss://porcini.devnet.rootnet.app/ws'],
    //     },
    //   },

    //   blockExplorers: {
    //     default: {
    //       name: 'devNetPorcini',
    //       url: 'https://portal.rootnet.live/?rpc=wss://porcini.devnet.rootnet.app/ws#/explorer',
    //     },
    //   },
    //   contracts: {
    //     // TODO: do we need contracts here ?
    //   },
    //   testnet: true,
    // },
  },
  XRPL: {
    MAINNET: {
      apiUrl: 'wss://s1.ripple.com/',
      explorerUrl: 'https://livenet.xrpl.org',
    },
    TESTNET: {
      apiUrl: 'wss://s.altnet.rippletest.net/',
      explorerUrl: 'https://testnet.xrpl.org',
    },
  },
} as const)

export function resolveSupportedChainRpcHttpUrl(chainId: number): string {
  if (chainId === 1) {
    return 'https://cloudflare-eth.com'
  } else if (chainId === 11_155_111) {
    return 'https://rpc.sepolia.org'
  } else if (chainId === 7668) {
    return 'https://root.rootnet.live/'
  } else if (chainId === 7672) {
    return 'https://porcini.rootnet.app'
  } else if (chainId === 17672) {
    return 'https://porcini.devnet.rootnet.app/'
  } else if (chainId === 17668) {
    return 'https://root.devnet.rootnet.app/'
  }

  throw new Error(`Found invalid chainId=${chainId}`)
}

export type Environment = { idpURL: string; signerURL: string; chain: Chain }

// Properties are not capitalised because they adhere to NODE_ENV casing
export const ENVIRONMENTS = deepFreeze({
  production: {
    chain: CHAINS.TRN.MAINNET,
    idpURL: 'https://login.pass.online',
    signerURL: 'https://signer.pass.online',
  },
  staging: {
    chain: CHAINS.TRN.PORCINI,
    idpURL: 'https://login.passonline.cloud',
    signerURL: 'https://signer.passonline.cloud',
  },
  audit: {
    chain: CHAINS.TRN.PORCINI,
    idpURL: 'https://login.passonline.kiwi',
    signerURL: 'https://signer.passonline.kiwi',
  },
  preview: {
    chain: CHAINS.TRN.PORCINI,
    idpURL: 'https://login.passonline.dev',
    signerURL: 'https://signer.passonline.dev',
  },
  neptune: {
    chain: CHAINS.TRN.PORCINI,
    idpURL: 'https://login.passonline.red',
    signerURL: 'https://signer.passonline.red',
  },
  development: {
    chain: CHAINS.TRN.PORCINI,
    idpURL: 'http://localhost:4200',
    signerURL: 'http://localhost:4202',
  },
} as const)

// Not using our codecs (e.g. Address, URL) to avoid enforcing their usage in downstream experiences.
/**
 * Futureverse constants.
 */
export interface Constants {
  // TODO: We cant expose ASSETS, until we have all the assets on mainnet and testnet.
  // readonly ASSETS: {
  //   readonly ETHEREUM: Record<
  //     keyof (typeof ASSETS)['ETHEREUM']['HOMESTEAD'],
  //     Asset
  //   >;
  //   readonly TRN: Record<keyof (typeof ASSETS)['TRN']['MAINNET'], Asset>;
  // };
  readonly CHAINS: {
    readonly ETHEREUM: Chain
    readonly TRN: Chain
    readonly XRPL: XrplChain
  }
  readonly TOKEN_IDENTIFIERS: {
    readonly ETHEREUM: Record<
      keyof (typeof TOKEN_IDENTIFIERS)['ETHEREUM']['HOMESTEAD'],
      Address
    >
    readonly TRN: Record<
      keyof (typeof TOKEN_IDENTIFIERS)['TRN']['MAINNET'],
      AssetId
    >
  }
  readonly CONTRACTS: {
    readonly ETHEREUM: Record<
      keyof (typeof CONTRACTS)['ETHEREUM']['HOMESTEAD'],
      string
    >
    readonly TRN: Record<keyof (typeof CONTRACTS)['TRN']['MAINNET'], string>
  }
  readonly ENDPOINTS: Record<keyof (typeof ENDPOINTS)['PRODUCTION'], string>
  readonly MISC: Record<keyof (typeof MISC)['PRODUCTION'], string>
}

// This is used by OIDC so needs to be separately exported. Once we have another `internal-sdk` app,
// it should be moved there.
export const FUTUREPASS_REGISTRAR = '0x000000000000000000000000000000000000FFFF'

const TOKEN_IDENTIFIERS = deepFreeze({
  ETHEREUM: {
    HOMESTEAD: {
      ASTO: decodedOrThrow(
        Address.decode('0x823556202e86763853b40e9cDE725f412e294689')
      ),
      ROOT: decodedOrThrow(
        Address.decode('0xa3d4BEe77B05d4a0C943877558Ce21A763C4fa29')
      ),
      USDC: decodedOrThrow(
        Address.decode('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
      ),
      USDT: decodedOrThrow(
        Address.decode('0xdAC17F958D2ee523a2206206994597C13D831ec7')
      ),
      IMX: decodedOrThrow(
        Address.decode('0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF')
      ),
      WBTC: decodedOrThrow(
        Address.decode('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599')
      ),
      DAI: decodedOrThrow(
        Address.decode('0x6B175474E89094C44Da98b954EedeAC495271d0F')
      ),
      PRIME: decodedOrThrow(
        Address.decode('0xb23d80f5FefcDDaa212212F028021B41DEd428CF')
      ),
      PEPE: decodedOrThrow(
        Address.decode('0x6982508145454Ce325dDbE47a25d4ec3d2311933')
      ),
      WSTETH: decodedOrThrow(
        Address.decode('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0')
      ),
      DYTX: decodedOrThrow(
        Address.decode('0x92D6C1e31e14520e676a687F0a93788B716BEff5')
      ),
      LINK: decodedOrThrow(
        Address.decode('0x514910771AF9Ca656af840dff83E8264EcF986CA')
      ),
      HEX: decodedOrThrow(
        Address.decode('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')
      ),
      LDO: decodedOrThrow(
        Address.decode('0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32')
      ),
      BLUR: decodedOrThrow(
        Address.decode('0x5283D291DBCF85356A21bA090E6db59121208b44')
      ),
      CBETH: decodedOrThrow(
        Address.decode('0xBe9895146f7AF43049ca1c1AE358B0541Ea49704')
      ),
      UNI: decodedOrThrow(
        Address.decode('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
      ),
      FRAX: decodedOrThrow(
        Address.decode('0x853d955aCEf822Db058eb8505911ED77F175b99e')
      ),
      MATIC: decodedOrThrow(
        Address.decode('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0')
      ),
      RLB: decodedOrThrow(
        Address.decode('0x046eee2cc3188071c02bfc1745a6b17c656e3f3d')
      ),
      PNDC: decodedOrThrow(
        Address.decode('0x423f4e6138E475D85CF7Ea071AC92097Ed631eea')
      ),
      FET: decodedOrThrow(
        Address.decode('0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85')
      ),
      LUSD: decodedOrThrow(
        Address.decode('0x5f98805A4E8be255a32880FDeC7F6728C6568bA0')
      ),
      BITCOIN: decodedOrThrow(
        Address.decode('0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9')
      ),
      RETH: decodedOrThrow(
        Address.decode('0xae78736Cd615f374D3085123A210448E74Fc6393')
      ),
      AGEUR: decodedOrThrow(
        Address.decode('0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8')
      ),
      RPL: decodedOrThrow(
        Address.decode('0xD33526068D116cE69F19A9ee46F0bd304F21A51f')
      ),
      SHIB: decodedOrThrow(
        Address.decode('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE')
      ),
      BONE: decodedOrThrow(
        Address.decode('0x9813037ee2218799597d83D4a5B6F3b6778218d9')
      ),
      FUN: decodedOrThrow(
        Address.decode('0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b')
      ),
    },
    SEPOLIA: {
      ROOT: decodedOrThrow(
        Address.decode('0x2E3B1351F37C8E5a97706297302E287A93ff4986')
      ),
      ASTO: decodedOrThrow(
        Address.decode('0x212b2f30e6fb204e504e6a4e1ba4e21b49468ada')
      ),
      USDC: decodedOrThrow(
        Address.decode('0x8267cf9254734c6eb452a7bb9aaf97b392258b21')
      ),

      // TODO:
      // TODO:
      // TODO: THESE ARE ALL MAINNET ADDRESSES BECAUSE WE DONT HAVE THE SEPOLIA ONES
      USDT: decodedOrThrow(
        Address.decode('0xdAC17F958D2ee523a2206206994597C13D831ec7')
      ),
      IMX: decodedOrThrow(
        Address.decode('0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF')
      ),
      WBTC: decodedOrThrow(
        Address.decode('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599')
      ),
      DAI: decodedOrThrow(
        Address.decode('0x6B175474E89094C44Da98b954EedeAC495271d0F')
      ),
      PRIME: decodedOrThrow(
        Address.decode('0xb23d80f5FefcDDaa212212F028021B41DEd428CF')
      ),
      PEPE: decodedOrThrow(
        Address.decode('0x6982508145454Ce325dDbE47a25d4ec3d2311933')
      ),
      WSTETH: decodedOrThrow(
        Address.decode('0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0')
      ),
      DYTX: decodedOrThrow(
        Address.decode('0x92D6C1e31e14520e676a687F0a93788B716BEff5')
      ),
      LINK: decodedOrThrow(
        Address.decode('0x514910771AF9Ca656af840dff83E8264EcF986CA')
      ),
      HEX: decodedOrThrow(
        Address.decode('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')
      ),
      LDO: decodedOrThrow(
        Address.decode('0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32')
      ),
      BLUR: decodedOrThrow(
        Address.decode('0x5283D291DBCF85356A21bA090E6db59121208b44')
      ),
      CBETH: decodedOrThrow(
        Address.decode('0xBe9895146f7AF43049ca1c1AE358B0541Ea49704')
      ),
      UNI: decodedOrThrow(
        Address.decode('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
      ),
      FRAX: decodedOrThrow(
        Address.decode('0x853d955aCEf822Db058eb8505911ED77F175b99e')
      ),
      MATIC: decodedOrThrow(
        Address.decode('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0')
      ),
      RLB: decodedOrThrow(
        Address.decode('0x046eee2cc3188071c02bfc1745a6b17c656e3f3d')
      ),
      PNDC: decodedOrThrow(
        Address.decode('0x423f4e6138E475D85CF7Ea071AC92097Ed631eea')
      ),
      FET: decodedOrThrow(
        Address.decode('0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85')
      ),
      LUSD: decodedOrThrow(
        Address.decode('0x5f98805A4E8be255a32880FDeC7F6728C6568bA0')
      ),
      BITCOIN: decodedOrThrow(
        Address.decode('0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9')
      ),
      RETH: decodedOrThrow(
        Address.decode('0xae78736Cd615f374D3085123A210448E74Fc6393')
      ),
      AGEUR: decodedOrThrow(
        Address.decode('0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8')
      ),
      RPL: decodedOrThrow(
        Address.decode('0xD33526068D116cE69F19A9ee46F0bd304F21A51f')
      ),
      SHIB: decodedOrThrow(
        Address.decode('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE')
      ),
      BONE: decodedOrThrow(
        Address.decode('0x9813037ee2218799597d83D4a5B6F3b6778218d9')
      ),
      FUN: decodedOrThrow(
        Address.decode('0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b')
      ),
    },
  },
  TRN: {
    MAINNET: {
      ASTO: decodedOrThrow(AssetId.decode('4196')),
      ROOT: decodedOrThrow(AssetId.decode('1')),
      XRP: decodedOrThrow(AssetId.decode('2')),
      VTX: decodedOrThrow(AssetId.decode('3')),
      USDC: decodedOrThrow(AssetId.decode('3172')),

      USDT: decodedOrThrow(AssetId.decode('6244')),
      IMX: decodedOrThrow(AssetId.decode('7268')),
      WBTC: decodedOrThrow(AssetId.decode('8292')),
      DAI: decodedOrThrow(AssetId.decode('9316')),
      PRIME: decodedOrThrow(AssetId.decode('10340')),
      PEPE: decodedOrThrow(AssetId.decode('11364')),
      WSTETH: decodedOrThrow(AssetId.decode('12388')),
      DYTX: decodedOrThrow(AssetId.decode('13412')),
      LINK: decodedOrThrow(AssetId.decode('14436')),
      HEX: decodedOrThrow(AssetId.decode('15460')),
      LDO: decodedOrThrow(AssetId.decode('16484')),
      BLUR: decodedOrThrow(AssetId.decode('17508')),
      CBETH: decodedOrThrow(AssetId.decode('18532')),
      UNI: decodedOrThrow(AssetId.decode('19556')),
      FRAX: decodedOrThrow(AssetId.decode('20580')),
      MATIC: decodedOrThrow(AssetId.decode('21604')),
      RLB: decodedOrThrow(AssetId.decode('22628')),
      PNDC: decodedOrThrow(AssetId.decode('23652')),
      FET: decodedOrThrow(AssetId.decode('24676')),
      LUSD: decodedOrThrow(AssetId.decode('25700')),
      BITCOIN: decodedOrThrow(AssetId.decode('26724')),
      RETH: decodedOrThrow(AssetId.decode('27748')),
      AGEUR: decodedOrThrow(AssetId.decode('28772')),
      RPL: decodedOrThrow(AssetId.decode('29796')),
      SHIB: decodedOrThrow(AssetId.decode('30820')),
      BONE: decodedOrThrow(AssetId.decode('31844')),
      FUN: decodedOrThrow(AssetId.decode('32868')),
      PORKJET: decodedOrThrow(AssetId.decode('54372')),
      ZRP: decodedOrThrow(AssetId.decode('121956')),
    },
    PORCINI: {
      ASTO: decodedOrThrow(AssetId.decode('17508')),
      ROOT: decodedOrThrow(AssetId.decode('1')),
      XRP: decodedOrThrow(AssetId.decode('2')),
      VTX: decodedOrThrow(AssetId.decode('3')),
      USDC: decodedOrThrow(AssetId.decode('2148')),
      PORKJET: decodedOrThrow(AssetId.decode('59492')),
      ZRP: decodedOrThrow(AssetId.decode('200804')),

      // TODO: Remove or update these assetIds. They are mainnet assetIds.
      USDT: decodedOrThrow(AssetId.decode('6244')),
      IMX: decodedOrThrow(AssetId.decode('7268')),
      WBTC: decodedOrThrow(AssetId.decode('8292')),
      DAI: decodedOrThrow(AssetId.decode('9316')),
      PRIME: decodedOrThrow(AssetId.decode('10340')),
      PEPE: decodedOrThrow(AssetId.decode('11364')),
      WSTETH: decodedOrThrow(AssetId.decode('12388')),
      DYTX: decodedOrThrow(AssetId.decode('13412')),
      LINK: decodedOrThrow(AssetId.decode('14436')),
      HEX: decodedOrThrow(AssetId.decode('15460')),
      LDO: decodedOrThrow(AssetId.decode('16484')),
      BLUR: decodedOrThrow(AssetId.decode('17508')),
      CBETH: decodedOrThrow(AssetId.decode('18532')),
      UNI: decodedOrThrow(AssetId.decode('19556')),
      FRAX: decodedOrThrow(AssetId.decode('20580')),
      MATIC: decodedOrThrow(AssetId.decode('21604')),
      RLB: decodedOrThrow(AssetId.decode('22628')),
      PNDC: decodedOrThrow(AssetId.decode('23652')),
      FET: decodedOrThrow(AssetId.decode('24676')),
      LUSD: decodedOrThrow(AssetId.decode('25700')),
      BITCOIN: decodedOrThrow(AssetId.decode('26724')),
      RETH: decodedOrThrow(AssetId.decode('27748')),
      AGEUR: decodedOrThrow(AssetId.decode('28772')),
      RPL: decodedOrThrow(AssetId.decode('29796')),
      SHIB: decodedOrThrow(AssetId.decode('30820')),
      BONE: decodedOrThrow(AssetId.decode('31844')),
      FUN: decodedOrThrow(AssetId.decode('32868')),
    },
  },
})

const CONTRACTS = deepFreeze({
  ETHEREUM: {
    HOMESTEAD: {
      BRIDGE: '0x110fd9a44a056cb418D07F7d9957D0303F0020e4',
      ERC20_PEG: '0xE9410B5AA32b270154c37752EcC0607c8c7aBC5F',
      ERC721_PEG: '0xc90Eda4C3aF49717dfCeb4CB237A05ee4DfE3C4d',
      ROOT_PEG: '0x7556085E8e6A1Dabbc528fbcA2C7699fA5Ee6e11',
    },
    SEPOLIA: {
      BRIDGE: '0x3F27C938507874829B33Db354D40d32DB8756b01',
      ERC20_PEG: '0x881339EeFd1DC8D60CEFBfE93294D0eeC24Fb8Cc',
      ERC721_PEG: '0x476ECf2ffDDad5F9beb2Ae44C8D420a90AAefAF8',
      ROOT_PEG: '0x5C752e9D3ECC8DB4B4B5A84052399f3618C332BF',
    },
    // Contracts for bridging between TRN Devnet (Porcini Sprout-1) and Sepolia
    SEPOLIA_DEVNET: {
      BRIDGE: '0x4caafCf4B8D1812CE3ce537966C20716aE742eeA',
      ERC20_PEG: '0xFc628170d01c072910142D92ecaA86d8335Ff22e',
      ERC721_PEG: '0xc9c6E2637b36CE4dc5120C5273b095bc9566ABd5',
      ROOT_PEG: '0x8D2aE3da4f255Bc4b99E6816461f12412D0d3c1f',
    },
  },

  TRN: {
    MAINNET: {
      FUTUREPASS_REGISTRAR, // It's the same address on mainnet and porcini
    },

    PORCINI: {
      FUTUREPASS_REGISTRAR, // It's the same address on mainnet and porcini
    },
  },
} as const)

const ENDPOINTS = deepFreeze({
  PRODUCTION: {
    // ASSET_INDEXER_GRAPHQL_URL: 'https://graph.futureverse.app',
    ASSET_INDEXER_GRAPHQL_URL:
      'https://adx1wewtnh.execute-api.us-west-2.amazonaws.com/',
    BRIDGE_GRAPHQL_URL:
      'https://ap-southeast-2.aws.realm.mongodb.com/api/client/v2.0/app/mainnet-web-apps-fdmlm/graphql',
    ARCHIVE_GRAPHQL_URL: 'https://rootnet-mainnet.hasura.app/v1/graphql',
    FUTURESCORE_URL:
      'https://ynw1ud7uyb.execute-api.us-west-2.amazonaws.com/api/v2/futurescore',
    FUTURESCORE_CACHE_URL:
      'https://wvpco1ntg8.execute-api.us-west-2.amazonaws.com/api/v1/cache',
    ACCOUNTS_INDEXER_URL:
      'https://account-indexer.api.futurepass.futureverse.app/api/v1',
    FUTURESCORE_COMBINER_URL:
      'https://account-linker.api.futurepass.futureverse.app/api/v1',
    BRIDGE_MONGO_URL:
      'https://ap-southeast-2.aws.data.mongodb-api.com/app/data-etbhg/endpoint/data/v1',
    ASSET_REGISTRY_URL:
      'https://6b20qa1273.execute-api.us-west-2.amazonaws.com/graphql',
  },
  DEVELOPMENT: {
    ASSET_INDEXER_GRAPHQL_URL:
      'https://w1jv6xw3jh.execute-api.us-west-2.amazonaws.com/',
    BRIDGE_GRAPHQL_URL:
      'https://ap-southeast-2.aws.realm.mongodb.com/api/client/v2.0/app/porcini-web-apps-hvfnd/graphql',
    ARCHIVE_GRAPHQL_URL: 'https://rootnet-porcini.hasura.app/v1/graphql',
    FUTURESCORE_URL:
      'https://pljs0td9ya.execute-api.us-west-2.amazonaws.com/api/v2/futurescore',
    FUTURESCORE_CACHE_URL:
      'https://iyatsjkgt4.execute-api.us-west-2.amazonaws.com/api/v1/cache',
    ACCOUNTS_INDEXER_URL:
      'https://account-indexer.api.futurepass.futureverse.dev/api/v1',
    FUTURESCORE_COMBINER_URL:
      'https://account-linker.api.futurepass.futureverse.dev/api/v1',
    BRIDGE_MONGO_URL:
      'https://ap-southeast-2.aws.data.mongodb-api.com/app/data-etbhg/endpoint/data/v1',
    ASSET_REGISTRY_URL:
      'https://saybx2ywpd.execute-api.us-west-2.amazonaws.com/graphql',
  },
  // NEPTUNE: {
  //   ASSET_INDEXER_GRAPHQL_URL:
  //     'https://w1jv6xw3jh.execute-api.us-west-2.amazonaws.com/',
  //   BRIDGE_GRAPHQL_URL:
  //     'https://ap-southeast-2.aws.services.cloud.mongodb.com/api/client/v2.0/app/devnet-web-app-ywdgldq/graphql',
  //   ARCHIVE_GRAPHQL_URL: 'https://guided-kodiak-26.hasura.app/v1/graphql',
  //   // This is the Porcini endpoint, sprout-1 version isn't ready yet.
  //   FUTURESCORE_URL:
  //     'https://pljs0td9ya.execute-api.us-west-2.amazonaws.com/api/v2/futurescore',
  //   //TODO: update this once it's ready. Currently, it is the same as DEVELOPMENT.
  //   FUTURESCORE_CACHE_URL:
  //     'https://iyatsjkgt4.execute-api.us-west-2.amazonaws.com/api/v1/cache',
  //   ACCOUNTS_INDEXER_URL:
  //     'https://devnet.account-indexer.api.futurepass.futureverse.dev/api/v1',
  //   FUTURESCORE_COMBINER_URL:
  //     'https://devnet.account-linker.api.futurepass.futureverse.dev/api/v1',
  //   BRIDGE_MONGO_URL:
  //     'https://ap-southeast-2.aws.data.mongodb-api.com/app/data-etbhg/endpoint/data/v1',
  //   ASSET_REGISTRY_URL: 'https://ar-api.futureverse.dev/graphql',
  // },
} as const)

const MISC = deepFreeze({
  PRODUCTION: {
    MONGO_APP_ID: 'mainnet-web-apps-fdmlm',
  },
  DEVELOPMENT: {
    MONGO_APP_ID: 'porcini-web-apps-hvfnd',
  },
  NEPTUNE: {
    MONGO_APP_ID: 'devnet-web-app-ywdgldq',
  },
} as const)

export function getConstantsForStage(stage: Stage): Constants {
  switch (stage) {
    case 'audit':
    case 'preview':
    case 'staging':
    case 'development':
    case 'neptune': {
      return deepFreeze({
        // TODO: Uncomment and use once the testnet assets are present
        // ASSETS: {
        //   ETHEREUM: ASSETS.ETHEREUM.SEPOLIA,
        //   TRN: ASSETS.TRN.PORCINI,
        // },
        CHAINS: {
          ETHEREUM: CHAINS.ETHEREUM.SEPOLIA,
          TRN: CHAINS.TRN.PORCINI,
          XRPL: CHAINS.XRPL.TESTNET,
        },
        TOKEN_IDENTIFIERS: {
          ETHEREUM: TOKEN_IDENTIFIERS.ETHEREUM.SEPOLIA,
          TRN: TOKEN_IDENTIFIERS.TRN.PORCINI,
        },
        CONTRACTS: {
          ETHEREUM: CONTRACTS.ETHEREUM.SEPOLIA,
          TRN: CONTRACTS.TRN.PORCINI,
        },
        ENDPOINTS: ENDPOINTS.DEVELOPMENT,
        MISC: MISC.DEVELOPMENT,
      } as const)
    }

    // case 'neptune': {
    //   return deepFreeze({
    //     CHAINS: {
    //       ETHEREUM: CHAINS.ETHEREUM.SEPOLIA,
    //       TRN: CHAINS.TRN.DEVNET_PORCINI,
    //       XRPL: CHAINS.XRPL.TESTNET,
    //     },
    //     TOKEN_IDENTIFIERS: {
    //       ETHEREUM: TOKEN_IDENTIFIERS.ETHEREUM.SEPOLIA,
    //       // Devnet Porcini was forked from Porcini so all the assetIds are the same.
    //       TRN: TOKEN_IDENTIFIERS.TRN.PORCINI,
    //     },
    //     CONTRACTS: {
    //       ETHEREUM: CONTRACTS.ETHEREUM.SEPOLIA_DEVNET,
    //       TRN: CONTRACTS.TRN.PORCINI,
    //     },
    //     ENDPOINTS: ENDPOINTS.NEPTUNE,
    //     MISC: MISC.NEPTUNE,
    //   } as const)
    // }

    default:
    case 'production': {
      return deepFreeze({
        // TODO: Uncomment and use once the testnet assets are present
        // ASSETS: {
        //   ETHEREUM: ASSETS.ETHEREUM.HOMESTEAD,
        //   TRN: ASSETS.TRN.MAINNET,
        // },
        CHAINS: {
          ETHEREUM: CHAINS.ETHEREUM.HOMESTEAD,
          TRN: CHAINS.TRN.MAINNET,
          XRPL: CHAINS.XRPL.MAINNET,
        },
        TOKEN_IDENTIFIERS: {
          ETHEREUM: TOKEN_IDENTIFIERS.ETHEREUM.HOMESTEAD,
          TRN: TOKEN_IDENTIFIERS.TRN.MAINNET,
        },
        CONTRACTS: {
          ETHEREUM: CONTRACTS.ETHEREUM.HOMESTEAD,
          TRN: CONTRACTS.TRN.MAINNET,
        },
        ENDPOINTS: ENDPOINTS.PRODUCTION,
        MISC: MISC.PRODUCTION,
      } as const)
    }
  }
}

// interface Asset {
//   readonly NAME: string;
//   readonly LOCATION: string;
// }

// TODO: Uncomment and use once the testnet assets are present and use deepFreeze
// const ASSETS = Object.freeze({
//   ETHEREUM: Object.freeze({
//     HOMESTEAD: Object.freeze({
//       AIFA_ALLSTARS: Object.freeze({
//         NAME: 'AIFA Allstars',
//         LOCATION: '0x96be46c50e882dbd373081d08e0cde2b055adf6c',
//       }),
//       ASM_AIFA_GENESIS: Object.freeze({
//         NAME: 'ASM AIFA Genesis',
//         LOCATION: '0x26437d312fb36bdd7ac9f322a6d4ccfe0c4fa313',
//       }),
//       ASM_BRAINS: Object.freeze({
//         NAME: 'ASM Brains',
//         LOCATION: '0xd0318da435dbce0b347cc6faa330b5a9889e3585',
//       }),
//       ASM_GEN_II_BRAINS: Object.freeze({
//         NAME: 'ASM Gen II Brains',
//         LOCATION: '0x86599b800e23036d761f43d7516092447295659f',
//       }),
//       ATEM_CAR_CLUB_MEMBERSHIP_CARDS: Object.freeze({
//         NAME: 'ATEM Car Club Membership Cards',
//         LOCATION: '0x020cdc4775366ae436f13a7d333143432e884934',
//       }),
//       ATEM_ON_TRACK: Object.freeze({
//         NAME: 'ATEM On Track',
//         LOCATION: '0x40dda1fe34ddea62be817ff481378c0cb54a93b4',
//       }),
//       BURROWS: Object.freeze({
//         NAME: 'Burrows',
//         LOCATION: '0xe51aac67b09eaed6d3d43e794d6bae679cbe09d8',
//       }),
//       BUZZIES: Object.freeze({
//         NAME: 'Buzzies',
//         LOCATION: '0x2308742aa28cc460522ff855d24a365f99deba7b',
//       }),
//       EGGS: Object.freeze({
//         NAME: 'EGGs',
//         LOCATION: '0x575ec01a9e70bf3e192a774eb265c46ec993e4cc',
//       }),
//       FLUF_WORLD: Object.freeze({
//         NAME: 'Fluf World',
//         LOCATION: '0xccc441ac31f02cd96c153db6fd5fe0a2f4e6a68d',
//       }),
//       MNTGE_PASS: Object.freeze({
//         NAME: 'MNTGE Pass',
//         LOCATION: '0xf8c72628bd822e54e1fb2bf0c3484c10d1963e28',
//       }),
//       NFLCREDITSPURCHASE: Object.freeze({
//         NAME: 'NFLCreditsPurchase',
//         LOCATION: '0x16d297c661540d6a15f4cb561ea58315fcba7b19',
//       }),
//       PARTY_BEARS: Object.freeze({
//         NAME: 'Party Bears',
//         LOCATION: '0x35471f47c3c0bc5fc75025b97a19ecdde00f78f8',
//       }),
//       POSTERS: Object.freeze({
//         NAME: 'Posters',
//         LOCATION: '0x19bfcdea24062e7db4e92c6742032cd89a3c8e07',
//       }),
//       POTAS: Object.freeze({
//         NAME: 'POTAs',
//         LOCATION: '0x8f126b06cf9d0e651e1114779c8d966d1a5ddf6e',
//       }),
//       RAYGUNS: Object.freeze({
//         NAME: 'Rayguns',
//         LOCATION: '0xe176a13b59a6ee59348a417607f2881baad402ea',
//       }),
//       SACRIFICE: Object.freeze({
//         NAME: 'Sacrifice',
//         LOCATION: '0x8cf70100ee87a3105a4db1b5a941e3e43b004a94',
//       }),
//       SCENES_AND_SOUNDS: Object.freeze({
//         NAME: 'Scenes and Sounds',
//         LOCATION: '0x6fad73936527d2a82aea5384d252462941b44042',
//       }),
//       SEEKERS: Object.freeze({
//         NAME: 'Seekers',
//         LOCATION: '0xaaf03a65cbd8f01b512cd8d530a675b3963de255',
//       }),
//       THE_NEXT_LEGENDS_BAGS: Object.freeze({
//         NAME: 'The Next Legends Bags',
//         LOCATION: '0x1ea66a857de297471bc12dd12d93853ff6617284',
//       }),
//       THE_NEXT_LEGENDS_BOXERS: Object.freeze({
//         NAME: 'The Next Legends Boxers',
//         LOCATION: '0x6bca6de2dbdc4e0d41f7273011785ea16ba47182',
//       }),
//       THINGIES: Object.freeze({
//         NAME: 'Thingies',
//         LOCATION: '0x1afef6b252cc35ec061efe6a9676c90915a73f18',
//       }),
//     }),
//     SEPOLIA: Object.freeze({
//       ASM_GEN_II_BRAINS: Object.freeze({
//         NAME: 'ASM Gen II Brains',
//         LOCATION: '0xAB742b8e60BFb10C5ce7d580eA9128Ec754B2E75',
//       }),
//       SACRIFICE: Object.freeze({
//         NAME: 'Sacrifice',
//         LOCATION: '0x50bbbea64dc376bc57ff425ce696d13bc57bf859',
//       }),
//       SEEKERS: Object.freeze({
//         NAME: 'Seekers',
//         LOCATION: '0x1caC32d9893deCA7769A2E64edC186163125d43b',
//       }),
//       THE_NEXT_LEGENDS_BAGS: Object.freeze({
//         NAME: 'The Next Legends Bags',
//         LOCATION: '0x403e6eBD2148E0EA209B37048Fbc2D368C2044C4',
//       }),
//       THE_NEXT_LEGENDS_BOXERS: Object.freeze({
//         NAME: 'The Next Legends Boxers',
//         LOCATION: '0x59029213099dF720676bf0991a57e49518b00D72',
//       }),
//     }),
//   }),
//   TRN: Object.freeze({
//     MAINNET: Object.freeze({
//       THE_NEXT_LEGENDS_BOXERS: Object.freeze({
//         NAME: 'The Next Legends Boxers',
//         LOCATION: '1124',
//       }),
//       GOBLINS: Object.freeze({
//         NAME: 'Goblins',
//         LOCATION: '3172',
//       }),
//       AMULETS: Object.freeze({
//         NAME: 'Amulets',
//         LOCATION: '2148',
//       }),
//       FUTUREVERSE_LOGOS: Object.freeze({
//         NAME: 'Futureverse Logos',
//         LOCATION: '70756',
//       }),
//     }),
//     PORCINI: Object.freeze({
//       THE_NEXT_LEGENDS_BOXERS: Object.freeze({
//         NAME: 'The Next Legends Boxers',
//         LOCATION: '9316',
//       }),
//       GOBLINS: Object.freeze({
//         NAME: 'Goblins',
//         LOCATION: '54372',
//       }),
//       AMULETS: Object.freeze({
//         NAME: 'Amulets',
//         LOCATION: '36964',
//       }),
//       FUTUREVERSE_LOGOS: Object.freeze({
//         NAME: 'Futureverse Logos',
//         LOCATION: '70756',
//       }),
//       // SEEKERS: Object.freeze({
//       //   NAME: 'Seekers',
//       //   LOCATION: '6244',
//       // }),
//     }),
//   }),
// } as const);
