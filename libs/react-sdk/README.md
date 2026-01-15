# @futureverse/react

# Introduction

The Futureverse Platform provides a comprehensive set of building blocks that can be used by developers to create high-quality experiences for the open Metaverse. With a focus on an experience familiar to web2 users, but built with web3 fundamentals.

These building blocks are designed to enable developers to easily create custom applications, leveraging a wide range of powerful tools and technologies in web, Unity and mobile.

## Non-React applications

If your application is not React-based, follow the [FuturePass Identity Provider Barebones Demo](https://github.com/futureversecom/futurepass-idp-barebones-demo).

## Authentication

The authentication solution offers experiences a solution for onboarding both Web2 and Web3 users into their experience.

It implements best practices for authentication on mobile devices and websites, which can maximise sign-in and sign-up conversion for your experience. It also handles tricky edge cases that can be security sensitive and error-prone to handle correctly.

Authentication integrates with the FuturePass custodial wallet and uses industry standards like OpenID Connect and OAuth 2.0 for a secure and uncomplicated onboarding experience.

FuturePass is already used in the following experiences:

- **[The Next Legends](https://play.thenextlegends.xyz/)**
- **[Gods and Goblins](https://godsandgoblins.com/)**
- **[The Fluf Underground](https://under.fluf.world/)**
- **[ATEM Car Club](https://garage.atemcarclub.com/)**

# Getting Started

Follow the below steps to install and integrate the library in your experience. If you prefer to dive directly into code, the examples and configuration from this document are also available in the [Experience Demo Next App](https://github.com/futureversecom/futureverse-experience-next-demo).

## Installation

### Peer Dependencies

This library requires the following peer dependencies:

```
    "react": "^18.2.0",
    "@polkadot/api": "^10.9.1",
    "@polkadot/types": "^10.9.1",
    "@polkadot/util": "^12.6.1",
    "@polkadot/util-crypto": "^12.6.1",
    "@therootnetwork/api": "1.0.8",
    "@therootnetwork/api-types": "1.0.3",
    "@therootnetwork/extrinsic": "1.0.9",
    "@futureverse/experience-sdk": "~0.11.0-alpha.1",
    "@futureverse/identity-contract-bindings": "~0.1.0",
    "@futureverse/rpc-kit": "~0.1.0",
    "@web3-react/eip1193": "^8.0.27-beta.0",
    "ethers": "5.7.2"
```

### Caveats

#### Create React App

[CRA has an ongoing issue with importing not fully specified ESM Modules](https://github.com/facebook/create-react-app/issues/11865#issuecomment-1363773752). The easiest way to deal with it is to use [this workaround](https://stackoverflow.com/questions/70964723/webpack-5-in-ceate-react-app-cant-resolve-not-fully-specified-routes/75109686#75109686). This doesn’t apply to the Experience Demo Next App.

#### Next.js

Please use:

```jsx
experimental: {
    esmExternals: false,
}
```

In your Next config.

##### App Router

This library does not officially support Next.js 14 using App Router at this time. However, you can use [the solution from the official Next.js documentation](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#using-third-party-packages-and-providers) to work around it.

#### Server-side Frameworks (SSR)

Due to nature of Web3 authentication, `@futureverse/react` operates on the client side. For users utilizing frameworks that support server-side rendering, such as Next.js, a dynamic import approach is necessary to ensure compatibility. This modification prevents the SDK from loading on the server side, which is crucial due to the browser-specific functionalities of the Xaman integration.

```tsx
import dynamic from 'next/dynamic'
const FutureverseProvider = dynamic(() => import('@futureverse/react').then((mod) => mod.FutureverseProvider), {
  ssr: false,
})
```

This updated import method ensures that the **`FutureverseProvider`** is only loaded in the browser environment, thus bypassing SSR execution and aligning with the new SDK constraints. This approach helps maintain smooth operation and user experience across all platforms while leveraging the new capabilities provided by the Xaman Wallet integration.

To further clarify, the example provided above is specifically tailored for applications using Next.js. If you are utilizing other frameworks that support server-side rendering (SSR), similar adjustments will be necessary to ensure compatibility with the browser-only requirements of the new SDK.

For frameworks other than Next.js, you should similarly configure dynamic imports or equivalent mechanisms provided by your specific framework to prevent the SDK from loading during the server-side rendering process. Each framework may have its own method or syntax for handling such cases, so it is recommended to consult the official documentation of the framework for precise instructions on bypassing SSR.

This step is crucial to ensure that all browser-specific functionalities, particularly those related to the Xaman Wallet integration, operate flawlessly without attempting to execute in non-browser environments where they are not supported. By adapting your application's import and initialization logic accordingly, you can maintain a robust and efficient application architecture that leverages the full capabilities of the updated SDK.

## Register your experience

Before using `FutureverseProvider` container you will need to register an OAuth2 client with the Futureverse Identity Provider using the Manage Clients Console:

- **Production:** https://login.futureverse.app/manageclients
- **Development / Staging:** https://login.passonline.cloud/manageclients
- **Audit (Canary):** https://login.passonline.kiwi/manageclients

You will need to provide two arguments:

- **Client Name:** the name of your application (e.g. `futureverse-experience-demo`). Don’t use any characters other than alphanumeric, `-` and `_`. This does not have to be unique, you can register again with the same name and you will receive a fresh set of credentials.
- **Redirect URLs:** The URL in your application to redirect to after a successful login. Please make sure to include protocol in the URL (`http` for development, `https` for production). You can provide multiple URLs by separating them with a comma. This may be useful if e.g. you’d like to register [localhost](http://localhost) for local development and a deployed URL for your staging environment. For example: `[http://localhost:3000/](http://localhost:3000/login)home,https://*-demo[.preview.com](http://futureverse.vercel.com/)/home,[https://futureverse-experience-demo.staging.com/home](https://identity-dashboard.futureverse.cloud/)` would register localhost for local development, a wildcarded preview URL for dynamic deployments and a staging URL.

**Note:** wildcards in Redirect URLs are only available when registering using the **Development** portal listed above. When registering your app for production you need to provide full Redirect URLs.

Upon successful registration, you’ll be presented with a Client ID, Name and an Access Token. Make sure to save these. You will need the Client ID and the Redirect URL in your application to configure the `FutureverseProvider`. Treat them as any other secrets in your application (so don’t commit them with your code!).

Experience Name and Access Token are used to view and edit this registration, they’re not required in the codebase.

## `FutureverseProvider` configuration

The core functionality is exposed through React Context, so you will need to wrap your application in a `FutureverseProvider` which has the following parameters:

Here's the corrected Markdown table:

| Parameter                 | Description                                                                                                                                                                                                      | Type                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `stage`                   | This controls which set of constants will be available to use. If you have more than two stages in your project (e.g. staging or testing you can decide whether you’d like development or production constants). | 'development', 'production'                |
| `Web3Provider`            | The Web3 Provider you’re using to interact with the blockchain in your app.                                                                                                                                      | 'wagmi'                                    |
| `authClient`              | An instance of FutureverseAuthClient with configured environment and any user state listeners.                                                                                                                   | See below for details.                     |
| `requiredChains`          | An array of chains your application supports, required by WalletConnect. Defaults to ['ETHEREUM'] if left undefined. When picking chains, mainnet and testnet (Goerli or Porcini) are included.                  | ['ETHEREUM'], ['TRN'], ['ETHEREUM', 'TRN'] |
| `walletConnectProjectId`  | Obtain it from WalletConnect Cloud, follow the instruction [here](https://docs.walletconnect.com/2.0/cloud/explorer#setting-up-a-new-project)                                                                    |                                            |
| `isCustodialLoginEnabled` | Set to true if you want to allow Custodial Accounts in your experience. Available only with version `1.1.0` and higher.                                                                                          | boolean                                    |
| `isXamanLoginEnabled`     | Set to true if you want to allow Xaman as an authentication option. Available only with version `1.1.6` and higher                                                                                               | boolean (defaults to `true`)               |
| `isTikTokLoginEnabled`    | Set to true if you want to allow TikTok as an authentication option. Available only with version `1.9.1` and higher                                                                                              | boolean (defaults to `false`)              |
| `isTwitterLoginEnabled`   | Set to true if you want to allow Twitter as an authentication option. Available only with version `1.9.1` and higher                                                                                             | boolean (defaults to `false`)              |
| `isAppleLoginEnabled`   | Set to true if you want to allow Apple as an authentication option. Available only with version `TBC` and higher                                                                                             | boolean (defaults to `false`)              |
| `defaultAuthOptions`      | Use to pick whether Web3 (crypto wallets) or Web2 (email, SSO etc.) should be the default ones.                                                                                                                  | `'web3' or 'web2'`                         |

### `FutureverseAuthClient` configuration

`FutureverseAuthClient` has the following parameters:

| Parameter              | Description                                                                                                                                                    | Type                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `clientId`             | The client ID you obtained when [integrating FuturePass Web SDK](https://www.notion.so/FuturePass-Web-SDK-Integration-ffc3fb455a6f449ea8610cde8b48e6d6?pvs=21) | string                                                              |
| `redirectUri`          | The URI in your application that the successful authentication should redirect to. It’s the main URI you registered above.                                     | string                                                              |
| `userStore` (optional) | This stores the user information in browser storage. Note: TTL for this store needs to be 7 days.                                                              | [Storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage) |
| `environment`          | An object containing the following properties:                                                                                                                 | object                                                              |
| `chain`                | The TRN chain you want to interact with                                                                                                                        | `mainnet` / `porcini`                                               |
| `idpURL`               | The identity provider URL you want to interact with.                                                                                                           | See below                                                           |
| `signerURL`            | The signer URL you want to interact with.                                                                                                                      | See below                                                           |

While the `environment` object is configurable and it can be especially useful if you’d like to point the app to a specific chain regardless of the `stage` you’re running in, in most cases it’s best to use one of the provided environments from the `@futureverse/experience-sdk` package:

- `sdk.ENVIRONMENTS.staging` - for use with testnet and staging Custodial Signer and Identity Provider services. Use this for staging and development builds.
- `sdk.ENVIRONMENTS.audit` - for use only in specific cases as advised by the FuturePass team
- `sdk.ENVIRONMENTS.production` - for use with mainnet and production Custodial Signer and Identity Provider services. Use this for the production build.

> **IMPORTANT:** `staging` and `audit` may be volatile, so never depend on them for your production build. The services may become unavailable without warning, the data can be cleared. It is purely for development and testing purposes.

> **Note:** Make sure to use the right client ID from the step “Register your experience” above. E.g. if you register your experience using the `Development / Staging` service and try to use it with your `environment` set to `sdk.ENVIRONMENTS.production` the service will respond with `invalid client` error.

### Custodial Auth Options

The SDK offers four distinct Identity Provider (IDP) authentication options:

1. **Google Login**
2. **Facebook Login**
3. **X (Twitter) Login**
4. **TikTok Login**

#### Default Configuration

By default, the SDK is configured to enable only the **Google** and **Facebook** login options as long as the **isCustodialLoginEnabled** is set to **true**

#### Feature Flags

To provide flexibility, the SDK includes feature flags that allow developers to enable or disable the additional IDP options:

- **isTikTokLoginEnabled**: Controls the availability of TikTok login.
- **isTwitterLoginEnabled**: Controls the availability of X (Twitter) login.
- **isAppleLoginEnabled**: Controls the availability of Apple login.

Please note that **isCustodialLoginEnabled** also needs to be set to **true** when you want to enable X (Twitter) and TikTok login

### Auth client user state listeners

Additionally, you can register listeners for user state changes on the `FutureverseAuthClient`. The `UserState` can be:

- `SignedIn`
- `SignedOut`
- `SignInFailed`

One common use case for a listener is to disable silent authentication on `SignedOut`.

### Example

```tsx
import * as React from 'react'
import {
  FutureverseAuthClient,
  FutureverseProvider,
  TrnApiProvider,
  UserState,
} from '@futureverse/react'
import * as fvSdk from '@futureverse/experience-sdk'

export default function MyFutureverseExperience(): JSX.Element {
  const authClient = React.useMemo(() => {
    const client = new FutureverseAuthClient({
      clientId: <YOUR CLIENT ID>,
      environment: process.env.NODE_ENV === 'production'
					? fvSdk.ENVIRONMENTS.production
					: fvSdk.ENVIRONMENTS.development,
      redirectUri: <YOUR REDIRECT URI>,
			responseType: 'code' // required for Custodial Auth
    })

		// This is not necessary, just an example of adding an user state change listener
    client.addUserStateListener(userState => {
      if (userState === UserState.SignedOut) {
        sessionStorage.setItem(<YOUR SILENT AUTH STORAGE FLAG KEY>, 'disabled')
      }
    })
    return client
  }, [])

  return (
      <FutureverseProvider
          stage={
            config.public.environment.stage === 'production'
             ? 'production'
             : 'development'
          }
          authClient={authClient}
          Web3Provider="wagmi"
          walletConnectProjectId={config.public.walletConnectProjectId}
					isCustodialLoginEnabled={true | false} // required for Custodial Auth
          isTikTokLoginEnabled={true | false} // enable TikTok Login
          isTwitterLoginEnabled={true | false} // enable Twitter Login
          isAppleLoginEnabled={true | false} // enable Apple Login
        >
          <Component {...pageProps} />
        </FutureverseProvider>
  )
}
```

Experience can pass in custom [cookie](https://www.npmjs.com/package/cookie-storage) UserStore like following:

```tsx
    const client = new FutureverseAuthClient({
      clientId: <YOUR CLIENT ID>,
      environment: process.env.NODE_ENV === 'production'
					? fvSdk.ENVIRONMENTS.production
					: fvSdk.ENVIRONMENTS.development,
      redirectUri: <YOUR REDIRECT URI>,
			responseType: 'code' // required for Custodial Auth,
			userStore: new CookieStorage({
        path: '/',
        sameSite: 'Strict',
        domain: (() => {
          return `.<YOUR HOSTNAME>`
        })(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
    })
```

## Authentication flow

The default authentication flow employs a client-side PKCE grant. All the details of handling that flow are abstracted as part of the library except mounting a callback handler.

### Mounting a callback handler

1. Add a route for handling the OAuth2 redirect (your `redirectUri`). This is where your application will redirect on success.
2. Create the `useSignInHandler` hook and call it where you want the authentication to be performed. Common places are in the Navigation or your Index route.

```jsx
import { useFutureverse, UserState } from '@futureverse/react'
import * as React from 'react'

export function useSignInHandler() {
  const { login, authClient } = useFutureverse()

  React.useEffect(() => {
    const userStateChange = (userState: UserState) => {
      if (userState === UserState.SignedIn) {
        // The user has successfully signed in, redirect them somewhere
      }

      if (userState === UserState.SignedOut) {
        // The user is not signed in, so do it
        login()
      }

      if (userState === UserState.SignInFailed) {
        // The sign is failed, either show an error or try again
      }
    }

    authClient.addUserStateListener(userStateChange)
    return () => {
      authClient.removeUserStateListener(userStateChange)
    }
  }, [account, authClient, login, router])
}
```

### Silent authentication

Silent authentication is a process where a user is authenticated without their direct involvement, typically after an initial login, improving the user experience by avoiding unnecessary login prompts.

To enable silent authentication, pass an `options` object to `login` function and provide the `{ silent: true, targetEOA: <ADDRESS OF LOGGED IN USER> }` properties.

The `silent` property should be set to `true` only if a user is (TODO)

### Example

```jsx
import { useFutureverse, UserState } from '@futureverse/react'
import * as React from 'react'
import * as wagmi from 'wagmi'

export const FV_AUTH_SILENT_LOGIN_KEY = 'fvAuthSilentLogin'
export const FV_AUTH_PREV_PATH_KEY = 'fvAuthPrevPath'

function Home() {
  const { login, authClient } = useFutureverse()
  const { address: accountAddress } = wagmi.useAccount()

  React.useEffect(() => {
    const userStateChange = (userState: UserState) => {
      if (userState === UserState.SignedIn) {
        sessionStorage.setItem(FV_AUTH_SILENT_LOGIN_KEY, 'enabled')
        const prevPath = sessionStorage.getItem(FV_AUTH_PREV_PATH_KEY)
        someRedirectFunction(prevPath ?? '/home')
      }
      if (userState === UserState.SignedOut) {
        const silentAuth = sessionStorage.getItem(FV_AUTH_SILENT_LOGIN_KEY)
        const isSilent = silentAuth !== 'disabled'
        if (!isSilent) {
          sessionStorage.setItem(FV_AUTH_PREV_PATH_KEY, router.pathname)
          someRedirectFunction('/')
        }
        login(isSilent ? { silent: true, targetEOA: accountAddress ?? null } : undefined)
      }
      if (userState === UserState.SignInFailed) {
        someRedirectFunction('/')
        sessionStorage.setItem(FV_AUTH_SILENT_LOGIN_KEY, 'disabled')
        login()
      }
    }
    authClient.addUserStateListener(userStateChange)
    return () => {
      authClient.removeUserStateListener(userStateChange)
    }
  }, [accountAddress, authClient, login])
}

export default Home
```

### Logging in and logging out

With the callback handler mounted, we can now start authenticating our users. Invoking `login` will display the standard Futureverse login prompt, offering a range of different login methods to the user. Here the user can choose to login / signup using an existing wallet or by letting us create and manage a wallet on their behalf (Coming Soon!).

If you configured the `useSignInHandler` hook as described above, the log in modal will pop up automatically if the user is not logged in. `login` and `logout` functions from `useFutureverse` give you a fine-grained control over the process.

```tsx
function FutureverseExperienceDemo() {
  const { login } = useFutureverse()

  return (
    <button
      onClick={() => {
        login()
      }}
    >
      Login!
    </button>
  )
}
```

### Accessing the user session

To access the user session query the `user` property on `useFutureverse` which will be available as long as the user is logged in.

```tsx
function FutureverseExperienceDemo() {
  const { userSession } = useFutureverse()

  if (userSession != null) {
		return <>You are logged in!</>
	}

  return {
		<>Not logged in</>
	}
}
```

### ID Token

ID token is a JSON Web Token (JWT) that is issued by identity provider to a client application as part of the user authentication process. The ID token serves as a proof of the user's identity and is used by the client application to obtain basic profile information about the user.

The payload of an ID token typically includes a set of claims about the authentication of an end-user by an Authorisation Server.

Here is the table described the claims that are included in an ID token payload according to the different login type:

| Login Type                      | Claim        | Description                                                                                                                                                               | Optional |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Custodial and non-Custodial     | `sub`        | A locally unique and never reassigned identifier within the Issuer for the End-User                                                                                       | No       |
| Custodial and non-Custodial     | `eoa`        | The externally owned account derived from public key                                                                                                                      | No       |
| Custodial and non-Custodial     | `futurepass` | The FuturePass account address associated with this account                                                                                                               | No       |
| Custodial and non-Custodial     | `chainId`    | The block chain id                                                                                                                                                        | No       |
| Custodial and non-Custodial     | `nonce`      | A string value used to associate a Client session with an ID Token, and to mitigate replay attacks                                                                        | No       |
| Custodial and non-Custodial     | `at_hash`    | A hash value verifies the integrity and authenticity of the access token                                                                                                  | No       |
| Custodial and non-Custodial     | `aud`        | Intended audience for the ID token                                                                                                                                        | No       |
| Custodial and non-Custodial     | `exp`        | The expiration time on or after which the ID token MUST NOT be accepted for processing                                                                                    | No       |
| Custodial and non-Custodial     | `iat`        | The time at which the ID token was issued                                                                                                                                 | No       |
| Custodial and non-Custodial     | `iss`        | The issuer of the response                                                                                                                                                | No       |
| Custodial                       | `auth_time`  | The time when the authentication occurred                                                                                                                                 | Yes      |
| Custodial and non-Custodial     | `custodian`  | self for non-custodial, fv for custodial                                                                                                                                  | No       |
| Custodial (Google and Facebook) | `email`      | When logged in with Google, this is the user's email address. The value of this claim may not be unique to the Google account used to log in, and could change over time. | Yes      |

When logged in with Facebook, this is the user's primary email address listed on their profile. If there is no valid email address is available, this claim is not included in the ID token.

Because the email may not be present, the experiences should not use this claim as the primary identifier to link to the user’s record.

## Web3 Integration

The `<FutureverseProvider/>` container wraps the app in the `wagmi` Web3Provider. Interacting with web3 apis is thus simply a matter of using the web3 react provider library’s API as per usual. This is true both for custodial and non-custodial authentication.

**Note**: The support for `web3react` provider is deprecated and will not be available in the future versions.

```jsx
import { useFutureverse } from '@futureverse/react'
import { useAccount, useBalance } from 'wagmi'

function Home() {
  const { login, logout, userSession } = useFutureverse()
  const account = useAccount()
  const accountBalance = useBalance({
    address: account.address,
  })

  return (
    <div>
      Home Route
      {userSession == null ? (
        <button
          onClick={() => {
            login()
          }}
        >
          Log In
        </button>
      ) : (
        <div>
          <p>User EOA: {userSession.eoa}</p>
          <p>User Chain ID: {userSession.chainId}</p>
          <p>User Balance: {accountBalance.data?.formatted ?? 'loading'} ETH</p>
          <button
            onClick={() => {
              logout()
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

export default Home
```

## Accessing Futureverse Constants

The Futureverse-specific constants are available as:

```jsx
const { CONSTANTS } = useFutureverse()
```

These constants will be matching the `stage` you defined when configuring `FutureverseProvider` (either `development` or `production`).

There are four categories of constants:

- `CONTRACTS` - all relevant Futureverse contract addresses
- `CHAINS` - Ethereum Mainnet, Ethereum Goerli Testnet, The Root Network Mainnet and The Root Network Porcini Testnet
- `ENDPOINTS` - all relevant Futureverse endpoint (e.g. the Asset Indexer)
- `MISC` - miscellaneous.

For example, you could use the `CHAINS` constant to get the chain ID of The Root Network and fetch the balance of XRP using Wagmi, like so:

```jsx
import { useFutureverse } from '@futureverse/react'
import { useAccount, useBalance } from 'wagmi'

function Home() {
  const { CONSTANTS } = useFutureverse()

  const xrpBalanceOnTrn = useBalance({
    address: account.address,
    chainId: CONSTANTS.CHAINS.TRN.id,
  })

  return (
    <div>
      <p>User Balance: {xrpBalanceOnTrn.data?.formatted ?? 'loading'} ETH</p>
    </div>
  )
}

export default Home
```

### Wagmi Signer caveat

The wagmi `useSinger` returns `null` after refreshing the page. To access the provider and signer, use the following hook:

```jsx
export function useConfigSigner() {
  const { data: signer } = useSigner()
  const provider = useProvider()
  const { isDisconnected } = useAccount()
  const { userSession, loginModal } = useFutureverse()
  const { disconnect } = useDisconnect()

  /**
   * This helps avoid the situation where the wagmi wallet can be connected, but
   * FuturePass is not.
   */
  useEffect(() => {
    if (!isDisconnected && !loginModal && !userSession) disconnect()
  }, [isDisconnected, userSession, loginModal, disconnect])

  useEffect(() => {
    // provider and signer are available here
  }, [provider, signer])
}
```

## Hooks

### useAuthenticationMethod

The `useAuthenticationMethod` hook is designed to retrieve the user's authentication method from their session. This hook is particularly useful when you need to determine how a user authenticated, whether via email, Google, Facebook, etc.

### Example

```jsx
import { useAuthenticationMethod } from '@futureverse/react'

const MyComponent = () => {
  const authenticationMethod = useAuthenticationMethod()

  if (!authenticationMethod) {
    return <div>No authentication method found</div>
  }

  return (
    <div>
      <p>Authentication Method: {authenticationMethod.method}</p>
      {authenticationMethod.email && <p>Email: {authenticationMethod.email}</p>}
      {authenticationMethod.eoa && <p>EOA: {authenticationMethod.eoa}</p>}
      {authenticationMethod.rAddress && <p>rAddress: {authenticationMethod.rAddress}</p>}
    </div>
  )
}
```

### Return Type

The returned object can have different structures based on the authentication method used:

- For 'fv:email', it includes the method and email:

  ```json
  {
    "method": "fv:email",
    "email": "user@example.com"
  }
  ```

- For 'fv:google' and 'fv:facebook', it includes the method and email:

  ```json
  {
    "method": "fv:google" | "fv:facebook",
    "email": "user@example.com" // Email is added back to the object
  }
  ```

- For 'wagmi', it includes the method and EOA (Ethereum address):

  ```json
  {
    "method": "wagmi",
    "eoa": "0x1234567890abcdef1234567890abcdef12345678"
  }
  ```

- For 'xaman', it includes the method and rAddress:
  ```json
  {
    "method": "xaman",
    "rAddress": "rExampleAddress"
  }
  ```

# Xaman Wallet integration

Starting from version `1.1.0` Xaman Wallet is one of the authentication options available to all experiences. The authentication is handled automatically by this SDK. See below for signing and sending transactions.

# Asset management

An integral part of any experience is being able to fetch assets that a user owns and allowing them to interact with them within an experience.

Users may fetch assets and token balances by utilising available hooks within the `@futureverse/react` library or manually through the FV graph. All react hooks have been built using an apollo query interface and allow for caching, custom configuration and more.

We recommend using `useTrnApi` hook and following the types and JSDocs for signing and sending transactions. The SDK automatically recognises the authentication type and handles the wallet connection and blockchain interaction.

**Fetching**

- Use hooks within `@futureverse/react` library
- Alternatively, use the FV graph directly

**Display balance**

- Use hooks with `@futureverse/react` to retrieve token balances and display them how you like
- Alternatively, use the FV graph directly

**Bridging**

- Wagmi/Web3 JS
- TRN /polkadot client
- Use `useTrnApi` hook and its methods

**Sending - coming soon**

- Wagmi/Web3 JS
- TRN /polkadot client
- Use `useTrnApi` hook and its methods

## useTrnApi hook

TRN API is a react hook exported from the `@futureverse/react` package that can be used to estimate transaction fees, sign and send transactions.

This hook provides a convenient way for experiences to interact with the root network without worrying about the connected wallet. It internally detects the connected wallet and communicates with it as per the request.

### Import useTrnApi

```
import { useFutureverse, useTrnApi } from '@futureverse/react'

export function YourReactFunction(){
  const {
    trnApi, // A polkadot api that can be used to communicate with the root node.
    createTrnDispatcher, // a helper function to create TrnDispatcher that is used to estimate fees, sign and submit a transaction.
  } = useTrnApi()
  ...
}
```

#### Create a new extrinsic

`trnApi` from `useTrnApi` hook can be used to create extrinsics on root network. following are some of sample transfer extrinsics.

```
  const tokenTransfer = trnApi.tx.balances.transfer(
    '0xabcdef1234567890abcdef1234567890abcdef12', // toAddress
    100 // amount
  )

  const tokenTransferOfAssetId = trnApi.tx.assets.transfer(
    1, // assetID
    '0xabcdef1234567890abcdef1234567890abcdef12', // toAddress
    100 // amount
  )

  const nftTransfer = trnApi.tx.nft.transfer(
    10, // collectionId
    ['1'], // tokenIds
    '0xabcdef1234567890abcdef1234567890abcdef12' // toAddress
  )
```

#### createTrnDispatcher

Creates a TRN transaction dispatcher for Wagmi or Xaman based on the detected authentication method.

##### Parameters

- `options` (Object): The options for creating the dispatcher.
  - `wagmiOptions` (Object): The options for the Wagmi signer.
    - `signer` (Object): The Wagmi signer instance.
    - `signerOptions` (Object, undefined): Additional options for the Wagmi signer.
  - `xamanOptions` (Object): The options for the Xaman signer.
    - `signMessageCallbacks` (Function, undefined): Callbacks for the sign message.
    - `instruction` (string, undefined): Custom instruction for the Xaman signer. Default is 'Sign extrinsic'.
  - `onSignatureSuccess` (Function, undefined): Callback to be called on successful signature.
  - `feeAssetId` (string, undefined): The asset ID to be used for fees. Default is XRP_ASSET_ID.
  - `wrapWithFuturePass` (boolean, undefined): Flag to wrap with Futurepass. Default is false. It always wraps with the Futurepass if a delegated login is detected

##### Returns

- `trnDispatcher` (Object|null): The dispatcher object with `estimate` and `signAndSend` methods, or null if the detected authentication method is custodial.

##### Throws

- `Error`: Throws an error if the API or user session is not ready.
- `Error`: Throws an error if the Wagmi signer is not provided.
- `Error`: Throws an error if the authentication method is unsupported.

##### Example

```
import {
  useAuthenticationMethod,
  useFuturePassAccountAddress,
  useTrnApi,
} from '@futureverse/react'
import { useMemo, useState } from 'react'
import * as fvSdk from '@futureverse/experience-sdk'
import * as wagmi from 'wagmi'

export function YourReactFunction() {
  const { createTrnDispatcher } = useTrnApi()
  const { data: futurePassAccount } = useFuturePassAccountAddress()
  const authenticationMethod = useAuthenticationMethod()

  // modify these two variables to match your use case
  const senderAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const feeOptions = {
    assetId: 2,
    slippage: 0.05,
  }

  const { data: signer } = wagmi.useSigner()

  const [signAndSubmitStep, setSignAndSubmitStep] = useState<string>()
  // Optionally use this to display a QR code for XRPL user to scan
  const [_xamanData, setXamanData] = useState<{
    qrCodeImg: string
    deeplink: string
  }>()

  const trnDispatcher = useMemo(() => {
    try {
      if (!futurePassAccount || !signer || !senderAddress)
        throw new Error(
          `${
            !futurePassAccount
              ? 'futurePassAccount'
              : !signer
                ? 'signer'
                : 'senderAddress'
          } was undefined`
        )

      return createTrnDispatcher({
        wrapWithFuturePass: fvSdk.addressEquals(
          senderAddress,
          futurePassAccount
        ),
        feeOptions: {
          assetId: feeOptions?.assetId ?? fvSdk.XRP_ASSET_ID,
          slippage: feeOptions?.slippage ?? 0.05,
        },
        wagmiOptions: {
          signer,
        },
        xamanOptions: {
          signMessageCallbacks: {
            onRejected: () => setSignAndSubmitStep(undefined),
            onCreated: createdPayload => {
              setXamanData({
                qrCodeImg: createdPayload.refs.qr_png,
                deeplink: createdPayload.next.always,
              })
              setSignAndSubmitStep('waitingForSignature')
            },
          },
        },
        onSignatureSuccess:
          authenticationMethod === 'xaman'
            ? () => {
                setSignAndSubmitStep('submittingToChain')
              }
            : undefined,
      })
    } catch (err: any) {
      console.warn('Unable to create dispatcher:', err.message)
    }
  }, [
    authenticationMethod,
    createTrnDispatcher,
    futurePassAccount,
    senderAddress,
    signer,
    feeOptions,
  ])
}
```

##### Estimate Transaction fees

The `trnDispatcher.estimate` function can be used to estimate the transaction fees for a given transaction.

###### Parameters

- `extrinsic` (Extrinsic): The extrinsic to be estimated.
- `assetId` (number|undefined): The asset ID to be used for fees.

###### Returns

- `Promise<bigint>`: A promise that resolves to the estimated fee.

###### Throws

- `Error`: If an error occurs during the estimation process.

###### Example

```
  ...
  const estimateFee = useCallback(
    async (extrinsic: fvSdk.Extrinsic) => {
      if (!trnDispatcher || !extrinsic)
        throw new Error(
          `Unable to submit extrinsic: ${
            !trnDispatcher ? 'dispatcher' : 'extrinsic'
          } was undefined`
        )

      const result = await trnDispatcher.estimate(
        extrinsic, // root extrinsic
        feeOptions?.assetId // assetId in which fees should be estimated.
      )
      if (!result.ok)
        throw new Error(`Error estimating fee: ${result.value.cause}`)

      return BigNumber.from(result.value)
    },
    [trnDispatcher, feeOptions]
  )
  ...
```

#### Sign and submit a transaction

`trnDispatcher.signAndSend` can be used to sign and send an extrinsic.

##### Parameters

- `extrinsic` (SubmittableExtrinsic<'promise'>): The extrinsic to be signed and sent.

##### Returns

- `Promise<Object>`: The result of the transaction.
  - `return.ok` (boolean): Indicates if the transaction was successful.
  - `return.value` (Object, undefined): Contains details of the transaction if successful.
    - `return.value.extrinsicId` (string): The ID of the extrinsic.
    - `return.value.transactionHash` (string): The hash of the transaction.
  - `Error` (Object, undefined): An error object if the transaction failed.

##### Throws

- `Error`: If an error occurs during the signing or sending process.

##### Example

```
...
  const submitExtrinsic = useCallback(
    async (extrinsic: fvSdk.Extrinsic) => {
      if (!trnDispatcher || !extrinsic)
        throw new Error(
          `Unable to submit extrinsic: ${
            !trnDispatcher ? 'dispatcher' : 'extrinsic'
          } was undefined`
        )

      const result = await trnDispatcher.signAndSend(extrinsic)

      if (!result.ok)
        throw new Error(`Error submitting extrinsic: ${result.value.cause}`)

      return result.value
    },
    [trnDispatcher]
  )
  ...
```

### Example

Complete example can be found in the [Futureverse Experience Next Demo](https://github.com/futureversecom/futureverse-experience-next-demo/blob/main/hooks/useTrnExtrinsic.ts)

## Custodial Accounts Transactions

### Introduction

Our system differentiates between custodial accounts and non-custodial accounts:

- **Non-custodial accounts**: When users log in using MetaMask, WalletConnect, or Xaman Wallet, they are utilizing non-custodial accounts.
- **Custodial accounts**: When users log in using Google, Facebook, or Email, they are utilizing custodial accounts. These accounts allow us to track and regulate transactions, making it easier for users without web3 wallets to access our system.

### Transaction Types

Transactions in our system cover a wide range of web3 transactions, including but not limited to:

- Sending ERC20 tokens
- Bridging ERC20 tokens
- Staking ERC20 tokens
- Sending ERC721 NFTs (collectibles)
- Bridging ERC721 NFTs (collectibles)

### Transaction Process for Custodial Accounts

Custodial account transactions are unique as these users cannot sign transactions using their web3 wallets. To ensure security and align with the characteristics of web3 transactions, we have developed a special application called the **Custodial Signer**. This application securely handles the transaction signing process by communicating with a server specifically designed to manage custodial account transactions.

### Integration Guide

To use custodial accounts to complete transactions, there are two approaches:

1. **Using the React SDK**:

   - This is the simpler method. The React SDK provides a wagmi provider and implements the Futureverse Connector, which can directly communicate with the custodial signer to complete the signing process and send the transaction to the blockchain.

2. **Using the Barebones Solution**:
   - This method is more complex. It requires users to implement a popup window and communicate with the custodial signer via post messages to obtain the signature. Then, the obtained signature is used to send the transaction to the blockchain.

### Code Example: Barebones Solution

#### Step 1: Get Signature by Communicating with Custodial Signer

```javascript
import { ethers } from 'ethers'

const rawTransactionWithoutSignature = {
  to: 'the destination wallet address',
  value: ethers.parseEther('0.01'),
  chainId: 'the chain id',
  gasLimit: 210000,
  gasPrice: ethers.parseUnits('10.0', 'gwei'),
}
let nonce = 0

const custodialSignerUrl = 'the custodial signer service url'

async function signTransaction() {
  if (typeof window === 'undefined') {
    return
  }

  const fromAccount = 'your own wallet address'

  const transactionCount = await provider.getTransactionCount(fromAccount)
  nonce = transactionCount + 1

  const serializedUnsignedTransaction = ethers.Transaction.from({
    ...rawTransactionWithoutSignature,
    nonce,
  }).unsignedSerialized

  const signTransactionPayload = {
    account: fromAccount,
    transaction: serializedUnsignedTransaction,
  }

  const id = 'client:2' // must be formatted as `client:${ an identifier number }`
  const tag = 'fv/sign-tx' // do not change this

  const encodedPayload = {
    id,
    tag,
    payload: signTransactionPayload,
  }

  window.open(
    `${custodialSignerUrl}?request=${base64UrlEncode(JSON.stringify(encodedPayload))}`,
    'futureverse_wallet', // don't change this
    'popup,right=0,width=290,height=286,menubar=no,toolbar=no,location=no,status=0'
  )

  window.addEventListener('message', (ev) => {
    if (ev.origin === custodialSignerUrl) {
      const dataR = signMessageType.decode(ev.data)

      if (E.isRight(dataR)) {
        transactionSignature = dataR.right.payload.response.signature
      }
    }
  })
}
```

#### Step 2: Send Transaction to Blockchain

```javascript
sync function sendTransaction() {
  if (transactionSignature == null || fromAccount == null) {
    return;
  }

  const rawTransactionWithSignature = {
    ...rawTransactionWithoutSignature,
    signature: transactionSignature,
    from: fromAccount,
    nonce,
  };

  const serializedSignedTransaction = ethers.Transaction.from(
    rawTransactionWithSignature
  ).serialized;

  const transactionResponse = await provider.broadcastTransaction(
    serializedSignedTransaction
  );
}
```
