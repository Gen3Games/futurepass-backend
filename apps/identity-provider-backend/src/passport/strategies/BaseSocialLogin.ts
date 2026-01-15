import { Request, Response, NextFunction } from 'express'
import Provider from 'oidc-provider'
import passport from 'passport'

export abstract class BaseSocialLoginHandler {
  constructor(protected provider: Provider) {}

  public abstract authenticate(
    _req: Request,
    _res: Response,
    _next: NextFunction
  ): Promise<void>
  public abstract callback(
    _req: Request,
    _res: Response,
    _next: NextFunction
  ): Promise<void>
}
export interface SocialLogin {
  getStrategy: (origin: string) => passport.Strategy
  handler: new (provider: Provider) => BaseSocialLoginHandler
}
