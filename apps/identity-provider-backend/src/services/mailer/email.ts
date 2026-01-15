import { MailService } from '@sendgrid/mail'
import * as t from 'io-ts'
import LaunchdarklyService from '../launchDarkly/LaunchDarkly'

export interface Mailer {
  sendEmail(
    email: string,
    otp: string,
    clientId: string,
    hostname: string
  ): Promise<void>
}

export function createMailer(config: {
  apiKey: string
  from: string
  defaultTemplateId: string
}): Mailer {
  return {
    async sendEmail(
      email: string,
      otp: string,
      clientId: string,
      hostname: string
    ) {
      const mailer = new MailService()
      mailer.setApiKey(config.apiKey)

      const templateId = await getTemplateId(clientId, config.defaultTemplateId)

      const senderEmail = await getSenderEmail(hostname, config.from)

      await mailer.send({
        to: email,
        from: senderEmail,
        templateId,
        dynamicTemplateData: {
          otp,
        },
      })
    },
  }
}

async function getTemplateId(clientId: string, defaultTemplateId: string) {
  const launchdarklyService = await LaunchdarklyService.getInstance()
  if (!launchdarklyService) {
    return defaultTemplateId
  }

  const clientIdMap = await launchdarklyService.variation(
    'custom-otp-email-templates',
    t.record(t.string, t.string)
  )

  if (!clientIdMap) {
    return defaultTemplateId
  }
  const customTemplateId = clientIdMap[clientId]
  if (!customTemplateId) {
    return defaultTemplateId
  }

  return customTemplateId
}

async function getSenderEmail(hostname: string, defaultSenderEmail: string) {
  const launchdarklyService = await LaunchdarklyService.getInstance()
  if (!launchdarklyService) {
    return defaultSenderEmail
  }

  const senderEmailMap = await launchdarklyService.variation(
    'custom-otp-email-senders',
    t.record(
      t.string, // hostname
      t.string // sender email
    )
  )

  if (!senderEmailMap) {
    return defaultSenderEmail
  }

  const senderEmail = senderEmailMap[hostname]
  if (!senderEmail) {
    return defaultSenderEmail
  }
  return senderEmail
}
