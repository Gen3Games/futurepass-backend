import * as t from '@sylo/io-ts'
import pino from 'pino'
import 'pino-pretty'
import * as CO from './common'
import { ExperienceManager } from './experienceManager'

const getTraceData = () => {
  return {
    xray_trace_id: 'N/A',
  }
}

const isDevelopment = process.env['NODE_ENV'] !== 'production'
const loggerLevel = process.env['LOGGER_LEVEL'] ?? 'debug'
/**
 *
 * Identity provider loggin code system
 *
 * The code system helps us quickly check the log and identify the issue
 *
 * Length   : 8
 * Format   : (L|R|S)ABCDEFG
 *
 * Explain  :
 *  L|R|S   : Indicate what is the code used for, it must be either L or R but cannot both
 *      L   : The code is for logging purpose only
 *      R   : The code is for api response only
 *      S   : The code is for metering and the log is streamed to AWS OpenSearch
 *
 *  AB      : Digital value possibly from 02 to 99. ( 01 is reserved )
 *            It defines the main categories which are pre-defined including SECURITY, PERFORMANCE and FUNCTIONALITY
 *
 *  CD      : Digital value possibly from 01 to 99.
 *            It defines the sub-categories which are pre-defined according to the notion doc
 *            https://www.notion.so/futureverse/FuturePass-OIDC-Tech-Debt-Design-Doc-6a3c34ec725d40d0b561ad732bd8319b?pvs=4#a9399f6ccebe4964b2960a15801bd3ba
 *
 *  EFG     : Digital value possibly from 001 to 999.
 *            It defines the specific event under a certain sub-category
 */

const GENERAL_LOG_CODE = 1000000

type CodeType = 'Log' | 'Response' | 'Streaming'

enum MainCategory {
  SECURITY = '20',
  PERFORMANCE = '30',
  FUNCTIONALITY = '40',
}

enum SecuritySubCategory {
  AUTHENTICATION = '01',
  AUTHORIZATION = '02',
  LOGIN = '03',
  LOGOUT = '04',
  ACCESS_CONTROL = '05',
  DATA_SENSITIVITY = '06',
}

enum PerformanceSubCategory {
  RESPONSE = '01',
  ERROR = '02',
}

enum FunctionalitySubCategory {
  REGISTER = '01',
  WALLET = '02',
  DEVICE = '03',
  API = '04',
  INTERNAL = '05', // this is not in the doc but can be used for utils, codec, ......
  OPENID_EVENT = '06',
  EVENT_QUEUE = '07',
}

const categoryMap: { [key in MainCategory]?: string[] } = {
  [MainCategory.SECURITY]: Object.values(SecuritySubCategory),
  [MainCategory.PERFORMANCE]: Object.values(PerformanceSubCategory),
  [MainCategory.FUNCTIONALITY]: Object.values(FunctionalitySubCategory),
}

// TODO: create an api to easily search the code ?
const CodeDescriptions: Record<string, string> = {
  2001001: 'Successful authentication',
  2001002: 'Failed authentication',
  2001003: 'Multi-factor authentication was used',

  2001101: 'Failed to validate hCaptcha',
  2001102: 'Failed to validate hCaptcha multiple times',
  2001103: 'Suspicious activity detected',
  2001104: 'Invalid frontend proxy url detected',

  2002001: 'Successful authorization',
  2002002: 'Failed authorization',

  2003000: 'Successfully login',
  2003001: 'Successfully login ( Accept T&C and Creating a new FP )',
  2003002: 'Successfully login ( With Wagmi )',
  2003003: 'Successfully login ( With Xaman )',
  2003004: 'Successfully login ( With Google )',
  2003005: 'Successfully login ( With Facebook )',
  2003006: 'Successfully login ( With Email )',
  2003007: 'Successfully login ( With Twitter )',
  2003008: 'Successfully login ( With Tiktok )',
  2003009: 'Successfully login ( With Apple )',

  2003200: 'Failed to login ( unknown internal server error )',
  2003201: 'Failed to login ( invalid login details )',
  2003202: 'Failed to login ( failed to accept T&C )',
  2003203: 'Failed to login ( invalid custodial login auth response )',

  2003230: 'Failed to login ( with Google )',
  2003231: 'Failed to login ( with Google Callback )',
  2003240: 'Failed to login ( with Email sending otp )',
  2003241: 'Failed to login ( with Email Callback verifying otp )',
  2003250: 'Failed to login ( with Facebook )',
  2003251: 'Failed to login ( with Facebook Callback )',
  2003260: 'Failed to login ( with Twitter )',
  2003261: 'Failed to login ( with Twitter Callback )',
  2003270: 'Failed to login ( with Tiktok )',
  2003271: 'Failed to login ( with Tiktok Callback )',
  2003280: 'Failed to login ( with Apple )', // failed at first step, when auth with apple is initiated
  2003281: 'Failed to login ( with Apple Callback )', // failed second step, when callback is received from apple.
  2003282: 'Failed to login ( with Apple /user )', // failed at third step, when user cannot be resolved from apple callback

  2004001: 'Failed to logout',

  2005001: 'No ip address found',
  2005002: 'Client IP is blacklisted',
  2005003: 'Client IP is ratelimited',
  2005004: 'Interaction started for ip',
  2005005: 'Invalid JWT',
  2005006: 'Expired JWT',

  2005101: 'Failed to verify SIWE message',
  2005102: 'Xrpl login error',
  2005103: 'Invalid login hint',
  2005104: 'Invalid login promote',
  2005105: 'Error destroying existing session before login',

  4001001: 'Non-custodial account registration',
  4001002: 'Custodial account registration',
  4001003: 'User accepts T&C',
  4001011: 'FP created by Wagmi login',
  4001012: 'FP created by Xaman login',
  4001013: 'FP created by Google login',
  4001014: 'FP created by Facebook login',
  4001015: 'FP created by Email login',
  4001016: 'FP created by Twitter login',
  4001017: 'FP created by Tiktok login',

  4003001: 'User Agent',

  4004101: 'Invalid Account Linker (linked-futurepass) api response',
  4004102: 'Invalid Account Linker (linked-eoa) api response',
  4004103: 'Failed to send otp with twilio service',
  4004104: 'Failed to verify the otp with twilio service',
  4004105: 'Invalid sub',
  4004106: 'Failed to send otp with Email',

  4004501: 'Foundation API -- Create key',
  4004502: 'Foundation API -- Get key',
  4004503: 'Twilio API -- Send otp',
  4004504: 'Twilio API -- Verify otp',
  4004505: 'Twilio API -- Lookup phone number',
  4004506: 'Mailer API -- Send email',
  4004507: 'Twilio -- failed to init rate limit',

  4004510: 'Launchdarkly -- failed to init the service',
  4004511: 'Launchdarkly -- invalid response',

  4004600: 'Failed to get tenant assets',

  4004700: 'Failed to decode the API response',
  4004800: 'Failed to validate the request from identity provider frontend',
  4004801:
    'Failed to redirect to identity provider frontend request to backend',

  4005001: 'Failed to decode the data',
  4005003: 'Failed to generate nonce for siwe',
  4005004: 'Failed to verify nonce for siwe',

  4005005: 'Unauthorized custodial access',

  4005006: 'Failed to verify nonce for xrpl',

  4005101: 'Failed to get interaction',
  4005102: 'Bad interaction',
  4005103: 'Failed to retrieve FuturePass address for a given EOA',

  4005888: 'Invalid error code used',
  4005998: 'Captured error',
  4005999: 'Unknown system error',

  4006000: 'OIDC Provider Error', // https://github.com/panva/node-oidc-provider/blob/main/lib/helpers/errors.js

  4006010: 'Event for backchannel.error',
  4006011: 'Event for jwks.error',
  4006012: 'Event for server_error',
  4006013: 'Event for userinfo.error',
  4006014: 'Event for discovery.error',
  4006015: 'Event for revocation.error',
  4006017: 'Event for introspection.error',
  4006018: 'Event for pushed_authorization_request.error',

  4006020: 'Event for registration_read.error',
  4006021: 'Event for registration_create.error',
  4006022: 'Event for registration_delete.error',
  4006023: 'Event for registration_update.error',

  4007000: 'Futurepass creation queue',

  // ... (Other code descriptions)
}

const CUSTOM_COLORS = Object.freeze({
  trace: '\u001b[36m', //cyan,
  debug: '\u001b[34m', //blue,
  info: '\u001b[32m', //green,
  warn: '\u001b[33m', //yellow,
  error: '\u001b[31m', //red,
  fatal: '\u001b[41m\u001b[37m', //red background with white text",
})

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we might extend this class later
export class CodeSystem {
  private static getVerifyEventCode = (eventCode: string): number => {
    if (eventCode === GENERAL_LOG_CODE.toString()) {
      return GENERAL_LOG_CODE
    }

    const main = eventCode.slice(0, 2)
    const sub = eventCode.slice(2, 4)
    const event = eventCode.slice(4, 7)

    if (
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- it is safe here since the code is fully controlled
      !!categoryMap[main as MainCategory]?.includes(sub) &&
      /^[0-9]{3}$/.test(event)
    ) {
      return parseInt(eventCode)
    }

    identityProviderBackendLogger.error(
      `Invalid event code used: ${eventCode}`,
      4005888
    )
    return GENERAL_LOG_CODE
  }

  static getCode(eventCode: number, codeType: CodeType): string {
    return `${codeType.charAt(0)}${CodeSystem.getVerifyEventCode(
      eventCode.toString()
    )}`
  }

  static getDescription(codeWithPrefix: string): string | undefined {
    // Remove the prefix (L or R) to look up the description
    const code = codeWithPrefix.substring(1)
    return CodeDescriptions[code]
  }
}

const LogData = t.type({
  serviceName: t.string,
  experience: t.union([t.null, t.string]),
  experienceHost: t.union([t.null, t.string]),
  methodName: t.string,
  code: t.union([t.undefined, t.string]),
  msg: t.string,
  params: t.union([t.undefined, t.JsonArray]),
  color: t.string,
})

type LogData = t.TypeOf<typeof LogData>

const LogDataInputOptions = t.type({
  serviceName: t.optional(t.string),
  methodName: t.optional(t.string),
  code: t.optional(t.number),
  params: t.optional(t.JsonArray),
})

type LogDataInputOptions = t.TypeOf<typeof LogDataInputOptions>

class IdentityProviderBackendLogger {
  private static instance: IdentityProviderBackendLogger | null = null

  private constructor() {
    // No need to do anything
  }

  public static getInstance(): IdentityProviderBackendLogger {
    if (!IdentityProviderBackendLogger.instance) {
      IdentityProviderBackendLogger.instance =
        new IdentityProviderBackendLogger()
    }

    return IdentityProviderBackendLogger.instance
  }

  private logger = pino({
    level: loggerLevel,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: isDevelopment,
        translateTime: true,
        singleLine: true,
        ignore:
          'pid,hostname,serviceName,experience,experienceHost,methodName,code,params,color',
        messageFormat: (() => {
          switch (loggerLevel) {
            case 'debug':
              return (() => {
                if (isDevelopment) {
                  return `{color}[srv={serviceName}][experience={experience}][experienceHost={experienceHost}][method={methodName}][code={code}]:{msg}:[params={params}]${CUSTOM_COLORS.trace}`
                }
                return '[srv={serviceName}][experience={experience}][experienceHost={experienceHost}][method={methodName}][code={code}]:{msg}:[params={params}]'
              })()

            case 'info':
            default:
              return '[experience={experience}][experienceHost={experienceHost}][method={methodName}][code={code}]:{msg}'
          }
        })(),
      },
    },
    mixin() {
      const data = {
        ...getTraceData(),
      }
      return data
    },
  })

  public debug(message: string, logDataInputOption?: unknown) {
    // use this when you want to debug the code
    this.logger.debug(
      this.createLogData(message, logDataInputOption, CUSTOM_COLORS.debug)
    )
  }

  public info(message: string, logDataInputOption?: unknown) {
    // use this when you want to metering something
    this.logger.info(
      this.createLogData(message, logDataInputOption, CUSTOM_COLORS.info)
    )
  }

  public warn(message: string, logDataInputOption?: unknown) {
    // use this when something unexpected happens but not fail the service
    // e.g. decoding the api response
    this.logger.warn(
      this.createLogData(message, logDataInputOption),
      CUSTOM_COLORS.warn
    )
  }

  public stream(message: string, code: number) {
    // use this when you want to metering something
    if (!isDevelopment && this.isStreaming(code)) {
      this.logger.info(this.createStreamData(message, code))
    }
  }

  private isStreaming(code: number) {
    // add other logics here if required

    if (code === 4006000) {
      // 400600 is the error code used to present all OIDC native errors, it is too generic which should not be streamed onto the cloud
      // we have more specific error code used and streamed for different error types
      return false
    }

    return true
  }

  public streamApiData(
    message: string,
    code: number,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    responseCode?: string,
    startTime?: number
  ): number {
    // use this when you want to metering api calls
    const currentTime = Date.now()
    const requestStartTime = startTime ?? currentTime
    const duration = currentTime - requestStartTime

    const type = startTime == null ? 'Request' : 'Response'

    const apiMessage = responseCode
      ? `[${method}][${type}][responseCode:${responseCode}][duration:${duration}]${message}`
      : `[${method}][${type}]${message}`

    if (!isDevelopment && this.isStreaming(code)) {
      this.logger.info(this.createStreamData(apiMessage, code))
    }
    return currentTime
  }

  public error(
    message: string,
    errorCode: number,
    logDataInputOption?: unknown
  ) {
    // use this when something fails the service
    // e.g. try-catch errors
    const logDataInput = CO.hush(LogDataInputOptions.decode(logDataInputOption))
    this.logger.error(
      this.createLogData(
        message,
        logDataInput != null
          ? { ...logDataInput, code: errorCode }
          : { code: errorCode },
        CUSTOM_COLORS.error
      )
    )

    // all the error must be streamed
    this.stream(message, errorCode)
  }

  public getLogger() {
    return this.logger
  }

  private createLogData = (
    message: string,
    logDataInputOption?: unknown,
    color: string = CUSTOM_COLORS.trace
  ): LogData => {
    const logDataInput = CO.hush(LogDataInputOptions.decode(logDataInputOption))
    const parameters = CO.hush(t.JsonArray.decode(logDataInput?.params))

    const experience = ExperienceManager.getExperience()

    // TODO: this may not be the best place to set the default values, it totally depends on how we want to use them
    return {
      msg: message,
      serviceName: logDataInput?.serviceName ?? 'idp-b',
      experience: experience?.experienceClientId ?? 'n/a',
      experienceHost: experience?.experienceHost ?? 'n/a',
      methodName: logDataInput?.methodName ?? 'undefined',
      code: CodeSystem.getCode(logDataInput?.code ?? GENERAL_LOG_CODE, 'Log'),
      params: parameters ?? [],
      color,
    }
  }

  private createStreamData = (message: string, code: number): LogData => {
    // We don't want to stream all the info to AWS OpenSearch since it costs too much and it is just for metering
    // We care about the code and message only here but can be extended later
    const experience = ExperienceManager.getExperience()

    return {
      msg: message,
      serviceName: 'idp-b',
      experience: experience?.experienceClientId ?? 'n/a',
      experienceHost: experience?.experienceHost ?? 'n/a',
      methodName: '',
      code: CodeSystem.getCode(code, 'Streaming'),
      params: [],
      color: '',
    }
  }
}

export const identityProviderBackendLogger =
  IdentityProviderBackendLogger.getInstance()
