import React from 'react'
import { useDisconnect } from 'wagmi'

export default function FVLogout() {
  const { disconnectAsync } = useDisconnect()

  React.useEffect(() => {
    async function performLogout() {
      // clear the idp-f
      await disconnectAsync()
      window.localStorage.clear()

      // clear idp-b
      await fetch('/logout', { method: 'POST', credentials: 'same-origin' })

      window.location.replace(
        document.referrer === window.location.href
          ? window.location.origin
          : document.referrer
      )
    }

    void performLogout()
  }, [disconnectAsync])

  // eslint-disable-next-line react/jsx-no-useless-fragment -- we need return this otherwise it won't be a valid JSX component
  return <></>
}
