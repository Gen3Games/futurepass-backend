import { useCallback, useMemo } from 'react'
import { App, Credentials } from 'realm-web'
import { useFutureverse } from '../providers'

export function useRealmApp() {
  const { CONSTANTS } = useFutureverse()

  const app = useMemo(
    () => new App({ id: CONSTANTS.MISC.MONGO_APP_ID }),
    [CONSTANTS.MISC.MONGO_APP_ID]
  )

  return useCallback(async () => {
    if (!app.currentUser) {
      await app.logIn(Credentials.anonymous())
    } else {
      await app.currentUser.refreshCustomData()
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return app.currentUser!.accessToken!
  }, [])
}
