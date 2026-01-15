import { Router } from 'express'

export abstract class RouterController {
  abstract getRouter(): Router
}
