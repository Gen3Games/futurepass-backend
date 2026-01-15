import { Dispatch, SetStateAction, useState } from 'react'

// TODO: use a codec
export function useLocalStorage<T>(
  key: string | undefined,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined' || key == null) {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)

      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.error(error)

      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== 'undefined' && key != null) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const removeValue = () => {
    if (typeof window !== 'undefined' && key != null) {
      window.localStorage.removeItem(key)
    }
  }

  return [storedValue, setValue, removeValue]
}
