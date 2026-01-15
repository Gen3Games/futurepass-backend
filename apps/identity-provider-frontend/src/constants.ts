import * as sdk from '@futureverse/experience-sdk'
import { environment } from './environments/environment'

export const stage = sdk.hush(sdk.Stage.decode(environment.NX_PUBLIC_STAGE))
