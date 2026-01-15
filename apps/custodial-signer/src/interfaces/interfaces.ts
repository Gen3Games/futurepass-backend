import { SignRequest } from '@futureverse/experience-sdk'

export type InteractiveSignRequest = {
  type: 'sign'
  request: SignRequest
  origin: string
  accept: () => void
  reject: () => void
}

export type AppHost = {
  appName: string
  appUrl: string
  appImage?: string
}
