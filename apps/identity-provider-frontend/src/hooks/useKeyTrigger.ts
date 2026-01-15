import * as React from 'react'

type KeyTriggerHandler = (event: KeyboardEvent) => void
interface UseKeyTriggerOptions {
  key: string
  onKeyDown: KeyTriggerHandler
}

export const useKeyTrigger = ({ key, onKeyDown }: UseKeyTriggerOptions) => {
  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key) {
        onKeyDown(event)
      }
    },
    [key, onKeyDown]
  )

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}
