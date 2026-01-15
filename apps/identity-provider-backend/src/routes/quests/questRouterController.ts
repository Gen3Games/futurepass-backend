import { Address } from '@futureverse/experience-sdk'
import cors from 'cors'
import express, { Router, Request, Response } from 'express'

import * as t from 'io-ts'
import * as CO from '../../common'
import * as M from '../../middleware'
import { config as C } from '../../serverConfig'
import { RouterController } from '../routerController'
import QuestRouterService from './questRouterService'

export default class QuestRouterController extends RouterController {
  private readonly questRouter: Router = express.Router()

  private getCorsOptions() {
    const origins: (string | RegExp)[] = CO.parseClientRedirectUrls(
      C.IDENTITY_DASHBOARD_HOSTNAME
    )

    if (C.ALLOW_WILDCARDS) {
      origins.push(
        /^https:\/\/futureverse-identity-dashboard-(.+)-futureverse.vercel.app$/
      )
    }

    return {
      origin: origins,
    }
  }

  private async runCallbacks(req: Request, res: Response) {
    const questRequest = CO.hush(QuestRequest.decode(req.body))
    if (questRequest == null) {
      return res.status(401).send({
        error: `Cannot find eoa`,
      })
    }
    const runQuestResult = await QuestRouterService.runQuest(
      questRequest.verifiedEoa,
      req.query
    )

    return res.send(runQuestResult)
  }

  private async completionCallbacks(req: Request, res: Response) {
    const questRequest = CO.hush(QuestRequest.decode(req.body))
    if (questRequest == null) {
      return res.status(401).send({
        error: `Cannot find eoa`,
      })
    }
    const futurepass = await QuestRouterService.getFuturePass(
      questRequest.verifiedEoa
    )

    if (futurepass == null) {
      return res.status(401).send({
        error: `Cannot find futurepass for the account: ${questRequest.verifiedEoa}`,
      })
    }

    if (C.redisClient == null) {
      return res.status(401).send({
        error: `Cannot check quest completion status`,
      })
    }

    const result = await QuestRouterService.checkQuestCompletion(
      questRequest.verifiedEoa,
      futurepass,
      C.redisClient
    )
    return res.status(200).send(result)
  }

  public getRouter() {
    this.questRouter.all('/*', cors(this.getCorsOptions()), M.verifyAuthToken)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.questRouter.get('/run', this.runCallbacks.bind(this))

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.questRouter.get('/completion', this.completionCallbacks.bind(this))

    return this.questRouter
  }
}

const QuestRequest = t.type({
  verifiedEoa: Address,
})
