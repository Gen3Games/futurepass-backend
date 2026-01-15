import { UserAuthenticationMethod, hush } from '@futureverse/experience-sdk'
import { useMemo } from 'react'
import { useFutureverse } from '../providers'

/**
 * Hook to retrieve the user's authentication method from their session.
 *
 * This function uses `useFutureverse` to get the `userSession`, and then
 * determines the user's authentication method by decoding the session's profile.
 * If the method is 'fv:google' or 'fv:facebook', it adds the email to the
 * authentication method object before returning it.
 *
 * @returns {object|null} An object representing the user's authentication method, or null if the session is not available. The returned object can have the following structure:
 *
 * - For 'fv:email' method:
 *   ```json
 *   {
 *     "method": "fv:email",
 *     "email": "user@example.com"
 *   }
 *   ```
 *
 * - For 'fv:google' or 'fv:facebook' methods:
 *   ```json
 *   {
 *     "method": "fv:google" | "fv:facebook",
 *     "email": "user@example.com" // Email is added back to the object
 *   }
 *   ```
 *
 * - For 'fv:twitter' methods:
 *   ```json
 *   {
 *     "method": "fv:twitter",
 *   }
 *   ```
 *
 *  * - For 'fv:tiktok' methods:
 *   ```json
 *   {
 *     "method": "fv:tiktok",
 *   }
 *   ```
 *
 *  *  * - For 'fv:apple' methods:
 *   ```json
 *   {
 *     "method": "fv:apple",
 *   }
 *   ```
 *
 * - For 'wagmi' method:
 *   ```json
 *   {
 *     "method": "wagmi",
 *     "eoa": "0x1234567890abcdef1234567890abcdef12345678"
 *   }
 *   ```
 *
 * - For 'xaman' method:
 *   ```json
 *   {
 *     "method": "xaman",
 *     "rAddress": "rExampleAddress"
 *   }
 *   ```
 */
export function useAuthenticationMethod() {
  const { userSession } = useFutureverse()

  return useMemo(() => {
    if (userSession == null) {
      return null
    }

    const userAuthenticationMethod = hush(
      UserAuthenticationMethod.decode(userSession.user?.profile.sub)
    )

    if (
      userAuthenticationMethod?.method === 'fv:google' ||
      userAuthenticationMethod?.method === 'fv:facebook'
    ) {
      // we know that we cannot get ipd email by only decoding profile.sub, so we need add email back to this object before returning it
      userAuthenticationMethod.email = userSession.user?.profile.email
    }

    return userAuthenticationMethod
  }, [userSession])
}
