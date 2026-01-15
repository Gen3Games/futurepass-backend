import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'
import * as CO from '../../common'
import AuthOptionService from '../../services/authOptions/AuthOptionService'
import LaunchdarklyService from '../../services/launchDarkly/LaunchDarkly'
import {
  CustodialAuthLoginClientIdConfig,
  LoginClientIdConfig,
} from '../../types'
import { RouterController } from '../routerController'
import { ALL_AUTH_OPTIONS } from './authOptions'

export default class AuthOptionsRouterController extends RouterController {
  private readonly authOptionsConfigRouter: Router = express.Router()
  private provider: Provider

  constructor(provider: Provider) {
    super()
    this.provider = provider
  }

  private async getAuthOptions(req: Request, res: Response) {
    const clientId = req.header('x-client-id')

    if (!clientId) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Missing x-client-id header.',
        },
      })
    }

    const client = await this.provider.Client.find(clientId)

    if (!client) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid client id',
        },
      })
    }

    let allowedAuthLoginClientIds: CustodialAuthLoginClientIdConfig | null =
      null
    const launchdarklyService = await LaunchdarklyService.getInstance()

    if (launchdarklyService) {
      allowedAuthLoginClientIds = await launchdarklyService.variation(
        'custodial-auth-login-client-id-config',
        CustodialAuthLoginClientIdConfig
      )
    }

    if (allowedAuthLoginClientIds == null) {
      return res
        .status(200)
        .json(ALL_AUTH_OPTIONS.map((option) => option.apiResponse))
    }

    const authOptionService = AuthOptionService.getInstance()

    const isAuthTypeEnabled = (authOption) => {
      const loginClientIdConfig = CO.hush(
        LoginClientIdConfig.decode(allowedAuthLoginClientIds?.[authOption])
      )
      return loginClientIdConfig
        ? authOptionService.isCustodialAuthLoginEnabledForTarget(
            loginClientIdConfig,
            clientId
          )
        : true
    }

    return res
      .status(200)
      .json(
        ALL_AUTH_OPTIONS.filter((option) =>
          isAuthTypeEnabled(option.configId)
        ).map((option) => option.apiResponse)
      )
  }

  public getRouter() {
    this.authOptionsConfigRouter.get('/', this.getAuthOptions.bind(this))

    return this.authOptionsConfigRouter
  }
}
