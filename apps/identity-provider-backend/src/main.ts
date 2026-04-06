import { EventEmitter } from 'events'
import fs from 'fs'
import http from 'http'
import https from 'https'
import * as path from 'path'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

import * as sdk from '@futureverse/experience-sdk'
import AWS from 'aws-sdk'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import dotenv from 'dotenv'
import donenvExpand from 'dotenv-expand'
import * as ethers from 'ethers'
import express, { NextFunction, Request, Response } from 'express'

import useragent from 'express-useragent'
import { either as E } from 'fp-ts'
import helmet from 'helmet'

import * as jose from 'jose'
import * as njose from 'node-jose'
import { JWKS } from 'oidc-provider'

import passport from 'passport'
import { DynamoDBAdapter } from '../src/adapters/DynamodbAdapter'
import {
  MemoryOtpStorage,
  RedisOtpStorage,
} from '../src/services/otp/IOtpStorage'
import * as CO from './common'
import * as FoundationAPI from './foundation-api'
import {
  formActionDirectiveDefaultSrcList,
  FRONTEND_CSP_DIRECTIVES,
} from './frontendCspDirectives'
import { DynamodbFVUserStorage } from './FVUserStorage'
import { CodeSystem, identityProviderBackendLogger } from './logger'

import * as MDW from './middleware'
import { createOIDCRoutes } from './oidc'
import { FVPassport } from './passport'
import { FuturepassCreationQueue } from './queues/futurepassCreationQueue'
import { config as C } from './serverConfig'
import {
  getLinkedFuturePassForEoa,
  getLinkedEoasForFuturePass,
} from './services/accountIndexer/accountIndexer'
import LaunchdarklyService from './services/launchDarkly/LaunchDarkly'
import { RedisSubscribers } from './subscribers/redis'

import {
  ETHAddress,
  FVAdapter,
  FVCustodialAccount,
  FVSub,
  FVUser,
  FVUserProfile,
  JwsVerifiedTokenPayload,
  RedirectionPayload,
} from './types'
import { generateErrorRouteUri, isJwtFormat, safeIdentityOf } from './utils'
import {
  REDIS_FUTUREPASS_CREATED_CHANNEL_NAME,
  SERVICE_NAME,
} from './utils/constants'

const envConfigPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'apps/identity-provider-backend/.env'),
  path.resolve(process.cwd(), 'apps/identity-provider-backend/.env.local'),
]

const loadedEnvPaths = new Set<string>()

for (const envConfigPath of envConfigPaths) {
  if (!fs.existsSync(envConfigPath) || loadedEnvPaths.has(envConfigPath)) {
    continue
  }

  donenvExpand.expand(
    dotenv.config({
      path: envConfigPath,
      override: true,
    })
  )
  loadedEnvPaths.add(envConfigPath)
}

// XXX In order to make calls to the foundation API we must issue tokens from an
//     origin that is accessible to the foundation server. This rules out
//     localhost. Hence, as a work around, we may use a publicly accessible
//     origin that we know uses the same JWK key-set (in this case the UAT env.)
const ISSUER = C.ORIGIN
const ISSUER_ALT: string = C.isDevelopment ? C.DEV_ISSUER : ISSUER

const port = process.env['PORT'] ? parseInt(process.env['PORT']) : 4200

async function main() {
  // TODO remove dependency on node-jose and use only jose
  const keystore = await njose.JWK.asKeyStore(C.KEYSTORE)

  const server = express()

  server.set('trust proxy', 1) // trust first proxy

  server.use(bodyParser.json())
  server.use(bodyParser.urlencoded({ extended: true }))
  server.use(cookieParser())
  server.use(useragent.express())

  server.get('/health', (req, res) => {
    //this is the one just used for health checking
    return res.status(200).send()
  })

  server.use(MDW.idpDomainVerifier)
  server.use(MDW.instagramBrowserRedirect)
  server.use(MDW.custodialAuthBlocker)

  // select first key from JWKS for signing foundation api tokens
  const foundationAPISigningKey = (() => {
    const k = keystore.all()[0]
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- keystore.all() could be undefined at runtime
    if (k == null) {
      throw new Error('no signing key found for use with foundation api')
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the output is untyped, however, it fits the jose.JWK interface (standard)
    return k.toJSON(true) as jose.JWK
  })()

  const wallet = C.wallet
  AWS.config.update({
    cloudwatch: {},
  })

  // dynamodb document client for oidc adapter
  const oidcConfigDynamodbClient = new AWS.DynamoDB.DocumentClient({
    // This is undefined in any environment that is not local
    endpoint: C.DYNAMODB_ENDPOINT,
  })

  // dynamodb document client for oidc config
  const documentClient = DynamoDBDocument.from(
    new DynamoDBClient({
      // This is undefined in any environment that is not local
      endpoint: C.DYNAMODB_ENDPOINT,
    })
  )

  const userDB = new DynamodbFVUserStorage(documentClient)

  const custodyTableName = 'foundation-key-ownership'
  const legacyCustodyIssuerFallbacks = [
    'https://login.futureverse.app',
    'https://login.pass.online',
  ]

  const findGen3CustodyRecord = async (
    sub: FVSub
  ): Promise<
    | {
        iss: string
        userId: string
        address: string
        keyId: string
      }
    | null
  > => {
    if (sub.type !== 'email' && sub.type !== 'idp') {
      return null
    }

    const userId = FVSub.encode(sub).toLowerCase()
    const issuerCandidates = [ISSUER_ALT, ...legacyCustodyIssuerFallbacks]
      .map((issuer) => issuer.trim().toLowerCase())
      .filter((issuer, index, all) => issuer !== '' && all.indexOf(issuer) === index)

    for (const iss of issuerCandidates) {
      const response = await documentClient.get({
        TableName: custodyTableName,
        Key: {
          iss,
          userId,
        },
      })

      const item = response.Item as
        | {
            iss?: string
            userId?: string
            address?: string
            keyId?: string
          }
        | undefined

      if (
        item?.iss != null &&
        item.userId != null &&
        item.address != null &&
        item.keyId != null
      ) {
        return {
          iss: item.iss,
          userId: item.userId,
          address: item.address,
          keyId: item.keyId,
        }
      }
    }

    return null
  }

  const eventEmitter = new EventEmitter()

  const futurepassCreationQueue = new FuturepassCreationQueue(
    C.redisClient,
    wallet.privateKey,
    C.TRN_RPCURL_WEBSOCKET,
    identityProviderBackendLogger,
    parseInt(C.FP_CREATION_BATCH_SIZE)
  )

  const redisSubscriber = new RedisSubscribers(C.redisClient, eventEmitter)

  // todo move the fvAdapter def for better project structure
  const fvAdapter: FVAdapter = {
    updateUserData: async (user: FVUser) => {
      await userDB.updateUserData(user.sub, user)
    },
    updateUserProfile: async (sub: FVSub, profile: FVUserProfile) => {
      await userDB.updateUserProfile(sub, profile)
    },
    async findUserBySub(sub: FVSub): Promise<FVUser | null> {
      const userData = await userDB.findUserDataBySub(sub)

      if (sub.type === 'eoa') {
        // cannot find user from local database (redis) by EOA type

        const eoaR = sdk.Address.decode(sub.eoa)
        if (E.isLeft(eoaR)) {
          identityProviderBackendLogger.warn(
            JSON.stringify(`invalid sub eoa: ${eoaR.left.toString()}`),
            {
              methodName: `${fvAdapter.findUserBySub.name}`,
              code: 4005001,
            }
          )

          return null
        }

        const decodedSubEoa = eoaR.right

        if (userData == null) {
          if (C.disableExternalDependencies) {
            return null
          }

          // it is probably becasue the user login with delegated EOA
          // query the delegated account indexer to find the correct mapping

          // if user login with delegated EOA,
          // the EOA should not own its own futurepass
          // the EOA must have a linked futurepass

          const linkedFuturepassForEoa = await getLinkedFuturePassForEoa(
            decodedSubEoa
          )

          if (
            linkedFuturepassForEoa == null ||
            linkedFuturepassForEoa.ownedFuturepass != null ||
            linkedFuturepassForEoa.linkedFuturepass == null
          ) {
            // an delegated EOA has it own futurepass
            // or
            // an delegated EOA has not linked futurepass
            return null
          }

          // query all the EOA(s) linked to this futurepass
          const linkedEoasForFuturePass = await getLinkedEoasForFuturePass(
            linkedFuturepassForEoa.linkedFuturepass
          )

          if (linkedEoasForFuturePass == null) {
            return null
          }

          const ownedEoaUserData = await userDB.findUserDataBySub({
            type: 'eoa',
            eoa: linkedEoasForFuturePass.ownerEoa,
          })

          if (ownedEoaUserData == null) {
            // the owner EOA of this futurepass cannot be not found in local data
            // return to creating new account
            return null
          }

          // save all the EOA(s) linked to this futurepass to local so next time when user login with delegated EOA, we don't have to query the delegated account indexer
          linkedEoasForFuturePass.linkedEoas.forEach(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises -- the inline func has nothing to do with the promise return
            async (linkedEoa) => {
              // const eoaR = ChainLocationString.decode(linkedEoa.eoa)

              const linkedUser: FVUser = {
                sub: {
                  type: 'eoa',
                  eoa: linkedEoa.eoa,
                },
                eoa: linkedEoa.eoa,
                hasAcceptedTerms: true,
              }

              await userDB.updateUserData(linkedUser.sub, linkedUser)
            }
          )

          // return current delegated EOA after update user data in local database
          return {
            sub,
            eoa: sub.eoa,
            hasAcceptedTerms: true,
          }
        } else {
          if (C.disableExternalDependencies) {
            return {
              sub,
              eoa: sub.eoa,
              hasAcceptedTerms: userData.hasAcceptedTerms,
            }
          }

          const foundFuturepass = await safeIdentityOf(decodedSubEoa)

          if (foundFuturepass == null) {
            // this is linked deligated eoa

            // if finding the user from local, we will still have to double check if the given eoa has either owned fp or linked fp
            const delegatedAccountlinkedFuturepassResponse =
              await getLinkedFuturePassForEoa(decodedSubEoa)

            if (
              delegatedAccountlinkedFuturepassResponse == null ||
              (delegatedAccountlinkedFuturepassResponse.ownedFuturepass ==
                null &&
                delegatedAccountlinkedFuturepassResponse.linkedFuturepass ==
                  null)
            ) {
              // an EOA doens't have owned futurepass nor linked futurepass
              // will have to remove it from local database
              await userDB.removeUserDataBySub(sub)

              return null
            }
          }

          return {
            sub,
            eoa: sub.eoa,
            hasAcceptedTerms: userData.hasAcceptedTerms,
          }
        }
      }
      // this block is identical to above `eoa` block except the linked accounts case.
      // we can merge both when linked accounts are required for xaman.
      if (sub.type === 'xrpl') {
        const eoaR = sdk.Address.decode(sub.eoa)
        if (E.isLeft(eoaR)) {
          identityProviderBackendLogger.warn(
            JSON.stringify(`invalid sub eoa: ${eoaR.left.toString()}`),
            {
              methodName: `${fvAdapter.findUserBySub.name}`,
              code: 4005001,
            }
          )

          return null
        }

        return {
          sub,
          eoa: eoaR.right,
          hasAcceptedTerms:
            userData == null ? false : userData.hasAcceptedTerms,
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the condition make the code more readable
      if (sub.type === 'email' || sub.type === 'idp') {
        if (sub.type === 'idp') {
          if (!sub.sub) {
            return null
          }
        }
        if (sub.type === 'email') {
          if (!sub.email) {
            return null
          }
        }

        if (C.disableExternalDependencies) {
          return null
        }

        const gen3CustodyRecord = await findGen3CustodyRecord(sub)
        if (gen3CustodyRecord != null) {
          return {
            sub,
            eoa: gen3CustodyRecord.address,
            hasAcceptedTerms:
              userData == null ? false : userData.hasAcceptedTerms,
          }
        }

        // TODO we could cache this look up
        const info = await FoundationAPI.keyInfo(
          C.FOUNDATION_API_BASE_URL,
          await FoundationAPI.createAuthToken({
            issuer: ISSUER_ALT,
            subject: FVSub.encode(sub).toLowerCase(),
            secretKey: foundationAPISigningKey, // TODO fix type (see node-jose docs),
          })
        )

        if (info == null) return null // not found

        const eoa = ethers.utils.computeAddress(info.publicKey)
        return {
          sub,
          eoa,
          hasAcceptedTerms:
            userData == null ? false : userData.hasAcceptedTerms,
        }
      }

      identityProviderBackendLogger.warn(
        `invalid sub: ${JSON.stringify(sub)}`,
        {
          methodName: `findUserBySub`,
          code: 4004105,
        }
      )
      return null
    },
    async findUserProfileBySub(sub: FVSub): Promise<FVUserProfile | null> {
      return userDB.findUserProfileBySub(sub)
    },
    async requestFuturepassCreation(eoa: ETHAddress): Promise<void> {
      if (C.disableExternalDependencies) {
        identityProviderBackendLogger.info(
          `[POST /login/accept_terms][E][${eoa}] skipping FuturePass creation because external dependencies are disabled`
        )
        return
      }

      const actionStart = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${eoa}] Action start: get fp at: ${actionStart}`,
        {
          methodName: `${fvAdapter.requestFuturepassCreation.name}`,
        }
      )
      const actionEnd = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${eoa}] Action end: get fp ends at: ${actionEnd}, duration: ${
          actionEnd - actionStart
        } milliseconds`,
        {
          methodName: `${fvAdapter.requestFuturepassCreation.name}`,
        }
      )

      const accountAddress = await safeIdentityOf(eoa)
      if (accountAddress) {
        return
      }
      await new Promise((resolve, reject) => {
        const eventHandler = (data) => {
          const { eoa: _eoa } = JSON.parse(data)
          if (_eoa === eoa) {
            resolve(true)
            eventEmitter.off(
              REDIS_FUTUREPASS_CREATED_CHANNEL_NAME,
              eventHandler
            )
          }
        }
        eventEmitter.on(REDIS_FUTUREPASS_CREATED_CHANNEL_NAME, eventHandler)

        setTimeout(() => {
          eventEmitter.off(REDIS_FUTUREPASS_CREATED_CHANNEL_NAME, eventHandler)
          reject(Error('FP_CREATION_TIMEOUT'))
        }, 300000)

        futurepassCreationQueue
          .addToQueue(eoa)
          .catch((err) =>
            identityProviderBackendLogger.error(
              `error_adding_eoa_to_redis_queue - ${err.message}`,
              4007001
            )
          )
      })
    },
    async findOrCreateCustodialAccount(
      sub: FVSub
    ): Promise<FVCustodialAccount> {
      if (C.disableExternalDependencies) {
        throw new Error(
          `Custodial account creation is unavailable when external dependencies are disabled for local rebuild: ${FVSub.encode(
            sub
          )}`
        )
      }

      const gen3CustodyRecord = await findGen3CustodyRecord(sub)
      if (gen3CustodyRecord != null) {
        return gen3CustodyRecord.address
      }

      const { publicKey } = await FoundationAPI.getOrCreateKey(
        C.FOUNDATION_API_BASE_URL,
        await FoundationAPI.createAuthToken({
          issuer: ISSUER_ALT,
          subject: FVSub.encode(sub).toLowerCase(),
          secretKey: foundationAPISigningKey, // TODO fix type (see node-jose docs),
        })
      )
      return ethers.utils.computeAddress(publicKey)
    },
  }
  const config = {
    issuer: ISSUER_ALT,
    sessionSecret: C.SESSION_SECRET,
    redis: C.redisClient,
    adapter: C.isDevelopment
      ? undefined
      : (name) =>
          new DynamoDBAdapter(
            name,
            oidcConfigDynamodbClient,
            'futureverse-oauth'
          ),
    fv: fvAdapter,
    chainId: C.ETH_CHAIN_ID,
    mailer: C.mailer,
    csrfSecret: C.CSRF_SECRET,
    hostname: C.ORIGIN,
    otpStorage:
      C.redisClient == null
        ? new MemoryOtpStorage()
        : new RedisOtpStorage(C.redisClient),
    wellKnownClients: C.wellKnownClients,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the output is untyped, however, it fits the JWKS interface (standard)
    jwks: keystore.toJSON(true) as JWKS,
    safeIdentityOf,
  }

  const oidcProvider = await createOIDCRoutes(server, config)

  new FVPassport().init()
  server.use(passport.initialize())
  server.use(passport.session())
  server.use(passport.authenticate('session'))

  const identityProviderFrontendPrivateRoutes = [
    '/login/terms',
    '/login/auth/sms',
    '/login/social',
    '/login/email',
    '/fvlogin',
  ]

  const identityProviderFrontendPublicRoutes = [
    '/',
    '/logout',
    '/manageclients',
    '/unsupported-browser',
    '/error/:errorCode?',
  ]

  const identityProviderFrontendProxiesRoutes = [
    '/login/terms',
    '/login/auth/sms',
    '/login/auth/sms/verify',
    '/login/email',
    '/login/email/verify',
  ]

  const createForwardedProxyHeaders = (req: Request, signedToken: string) => {
    const forwardedHeaders: Record<string, string> = {
      Authorization: `Bearer ${signedToken}`,
    }

    const headerAllowList = new Set([
      'accept',
      'accept-language',
      'cookie',
      'content-type',
      'origin',
      'referer',
      'user-agent',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-real-ip',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'sec-fetch-dest',
      'sec-fetch-mode',
      'sec-fetch-site',
    ])

    Object.entries(req.headers).forEach(([key, value]) => {
      if (!headerAllowList.has(key) || typeof value !== 'string') {
        return
      }

      forwardedHeaders[key] = value
    })

    return forwardedHeaders
  }

  const forwardFrontendProxyRequest = async (
    forwardOrigin: string,
    forwardUri: string,
    headers: Record<string, string>,
    body: unknown
  ) => {
    const targetUrl = new URL(`${forwardOrigin}${forwardUri}`)
    const requestBody = JSON.stringify(body)
    const requestHeaders = {
      ...headers,
      'content-length': Buffer.byteLength(requestBody).toString(),
    }

    return await new Promise<{
      status: number
      headers: http.IncomingHttpHeaders
      body: unknown
    }>((resolve, reject) => {
      const transport = targetUrl.protocol === 'https:' ? https : http
      const proxyRequest = transport.request(
        targetUrl,
        {
          method: 'POST',
          headers: requestHeaders,
        },
        (proxyResponse) => {
          const chunks: Buffer[] = []

          proxyResponse.on('data', (chunk: Buffer | string) => {
            chunks.push(
              typeof chunk === 'string' ? Buffer.from(chunk) : chunk
            )
          })

          proxyResponse.on('end', () => {
            const rawBody = Buffer.concat(chunks).toString('utf8')
            const parsedBody =
              rawBody.length === 0 ? null : JSON.parse(rawBody)

            resolve({
              status: proxyResponse.statusCode ?? 500,
              headers: proxyResponse.headers,
              body: parsedBody,
            })
          })
        }
      )

      proxyRequest.on('error', reject)
      proxyRequest.write(requestBody)
      proxyRequest.end()
    })
  }

  /**
   *
   * Load the default identity provider frontend csp directives and dynamically add more if required
   *
   */
  const frontendCSP = (req: Request, res: Response, next: NextFunction) => {
    const referer = req.get('Referer')

    if (referer) {
      const refererUrl = new URL(referer)
      formActionDirectiveDefaultSrcList.push(refererUrl.origin)
      const cspDirectives = {
        ...FRONTEND_CSP_DIRECTIVES,
        'form-action': formActionDirectiveDefaultSrcList,
      }

      helmet.contentSecurityPolicy({ directives: cspDirectives })(
        req,
        res,
        next
      )
    } else {
      helmet.contentSecurityPolicy({
        directives: {
          ...FRONTEND_CSP_DIRECTIVES,
          'form-action': formActionDirectiveDefaultSrcList,
        },
      })(req, res, next)
    }
  }

  const createLaunchdarklyHash = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const launchdarklyService = await LaunchdarklyService.getInstance()
    if (launchdarklyService) {
      res.cookie(
        'ld_hash',
        launchdarklyService.generateSecureModeHashForFrontend(),
        {
          path: `${req.path}`,
          httpOnly: false,
          secure: true,
          sameSite: 'strict',
        }
      )
    }

    next()
  }

  server.get(
    identityProviderFrontendPrivateRoutes,
    frontendCSP,
    createLaunchdarklyHash,
    async (req, res) => {
      // this middleware ensures that no one can access the frontend directly
      // the frontend pages are only vilid through redirection
      const { token = '' } = req.query

      let verifiedToken: njose.JWS.VerificationResult
      try {
        if (typeof token !== 'string' || !isJwtFormat(token)) {
          throw new Error()
        }
        verifiedToken = await njose.JWS.createVerify(keystore).verify(token)
      } catch (err) {
        identityProviderBackendLogger.error(
          'The input is not a valid JWT',
          2005005
        )
        return res.status(400).redirect(generateErrorRouteUri(2005005))
      }

      const verifiedPayload = CO.hush(
        JwsVerifiedTokenPayload.decode(
          JSON.parse(verifiedToken.payload.toString())
        )
      )

      // Check expiration (exp) claim
      if (verifiedPayload?.exp && Date.now() >= verifiedPayload.exp * 1000) {
        identityProviderBackendLogger.error('Token has expired', 2005006)
        return res.status(401).redirect(generateErrorRouteUri(2005006))
      }

      if (verifiedPayload != null) {
        res.cookie('nonce', verifiedPayload.nonce, {
          path: `${req.path}`,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })
        res.cookie('account', verifiedPayload.account, {
          path: `${req.path}`,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        })

        return MDW.resolveHTMLDocument(req, res)
      }

      identityProviderBackendLogger.error('Invalid token', 2005005)
      return res.status(500).redirect(generateErrorRouteUri(2005005))
    }
  )

  server.get(
    identityProviderFrontendPublicRoutes,
    createLaunchdarklyHash,
    (req, res) => {
      return MDW.resolveHTMLDocument(req, res)
    }
  )

  server.use(
    express.static(path.join(__dirname, '..', 'identity-provider-frontend'))
  )

  server.post(identityProviderFrontendProxiesRoutes, async (req, res) => {
    const redirectionPayload = await (async () => {
      const tokenFromQuery =
        typeof req.query.token === 'string' ? req.query.token : null
      if (tokenFromQuery != null && isJwtFormat(tokenFromQuery)) {
        try {
          const verifiedToken = await njose.JWS.createVerify(keystore).verify(
            tokenFromQuery
          )
          const verifiedPayload = CO.hush(
            JwsVerifiedTokenPayload.decode(
              JSON.parse(verifiedToken.payload.toString())
            )
          )

          if (
            verifiedPayload != null &&
            Date.now() < verifiedPayload.exp * 1000
          ) {
            identityProviderBackendLogger.warn(
              `Frontend proxy used query token for ${req.path}`,
              2001106
            )

            return {
              account: verifiedPayload.account,
              nonce: verifiedPayload.nonce,
            }
          }
        } catch {
          // Fall through to cookie/referer-based validation.
        }
      }

      const verifiedCookies = CO.hush(RedirectionPayload.decode(req.cookies))
      if (verifiedCookies != null) {
        return verifiedCookies
      }

      const referer = req.get('referer')
      if (referer == null) {
        return null
      }

      try {
        const refererUrl = new URL(referer)
        const token = refererUrl.searchParams.get('token')
        if (token == null || !isJwtFormat(token)) {
          return null
        }

        const verifiedToken = await njose.JWS.createVerify(keystore).verify(token)
        const verifiedPayload = CO.hush(
          JwsVerifiedTokenPayload.decode(
            JSON.parse(verifiedToken.payload.toString())
          )
        )

        if (verifiedPayload == null) {
          return null
        }

        if (Date.now() >= verifiedPayload.exp * 1000) {
          return null
        }

        identityProviderBackendLogger.warn(
          `Frontend proxy fallback used referer token for ${req.path}`,
          2001105
        )

        return {
          account: verifiedPayload.account,
          nonce: verifiedPayload.nonce,
        }
      } catch {
        return null
      }
    })()

    if (redirectionPayload != null) {
      const payload = {
        account: redirectionPayload.account,
        nonce: redirectionPayload.nonce,
        exp: new Date(new Date().getTime() + 3 * 60000).getTime(),
      }
      const signedToken = String(
        await njose.JWS.createSign(
        { format: 'compact' },
        keystore.all()
      )
        .update(JSON.stringify(payload), 'utf8')
        .final()
      )

      const forwaredUri = (() => {
        switch (req.path) {
          case '/login/terms':
            return '/login/accept_terms'
          case '/login/auth/sms':
            return '/login/2fa/otp/sms'
          case '/login/auth/sms/verify':
            return '/login/2fa/otp/sms/verify'
          case '/login/email':
            return '/login/email/otp'
          case '/login/email/verify':
            return '/login/email/otp/verify'
          default:
            identityProviderBackendLogger.error(
              'Invalid frontend proxy url detected',
              2001104
            )
            return `${generateErrorRouteUri(2001104)}`
        }
      })()

      const forwardedHeaders = createForwardedProxyHeaders(req, signedToken)

      const forwardOrigin = res.locals.idpOrigin ?? C.ORIGIN
      try {
        const response = await forwardFrontendProxyRequest(
          forwardOrigin,
          forwaredUri,
          forwardedHeaders,
          req.body
        )

        // todo: update the following logic with the following steps：
        // 1, formalize the response. The response from backend endpoints could have redirection or different code, we should only process the response.ok with the current logic
        // 2, add logic the handle response based on its code accordingly

        res.status(response.status)
        Object.entries(response.headers).forEach(([key, value]) => {
          if (value == null) {
            return
          }

          res.setHeader(key, value)
        })
        return res.send(response.body)
      } catch (err) {
        identityProviderBackendLogger.error(
          `Frontend proxy request failed for ${req.path}: ${JSON.stringify({
            error: err instanceof Error ? err.message : err,
            forwardOrigin,
            forwardUri: forwaredUri,
          })}`,
          4004801
        )

        return res.status(500).redirect(generateErrorRouteUri(4004801))
      }
    }

    identityProviderBackendLogger.error(
      `Invalid frontend proxy credentials for ${req.path}`,
      4004800
    )

    return res.status(500).send({
      code: CodeSystem.getCode(4004800, 'Response'),
      error: 'Invalid credentials',
    })
  })

  server.use(oidcProvider.callback())

  await redisSubscriber.start()
  futurepassCreationQueue
    .startQueue()
    .catch((err) =>
      identityProviderBackendLogger.error(
        `queue initialization failed ${err.message}`,
        4007000
      )
    )

  const cleanUpTasks = async () => {
    await futurepassCreationQueue.unLockQueue()
    process.exit(1)
  }

  // Listen for server stopping errors
  server.on('err', cleanUpTasks)
  server.on('close', cleanUpTasks)

  // Listen for SIGINT (Ctrl+C) signal
  process.on('SIGINT', cleanUpTasks)

  // Listen for SIGTERM (kill) signal
  process.on('SIGTERM', cleanUpTasks)

  server.use((err: Error, req: Request, res: Response) => {
    // we have thrown lots of errors, this error handler middleware ensures that all of them are captured
    // todo: we should differentiate those errors, but for now we just send user to the error page
    identityProviderBackendLogger.error(
      `Captured an error ${err.message}`,
      4005998
    )

    return res.status(500).redirect('/error')
  })

  server.listen(port)

  identityProviderBackendLogger.info(`[ ready ] on ${C.ORIGIN}`)
}

main().catch(async (err) => {
  identityProviderBackendLogger.error(err.message, 4005999, {
    methodName: `${main.name}`,
  })

  const launchdarklyService = await LaunchdarklyService.getInstance()
  if (launchdarklyService) {
    await launchdarklyService.shutdown()
  }

  process.exit(1)
})
