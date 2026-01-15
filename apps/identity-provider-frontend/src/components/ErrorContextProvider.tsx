import React from 'react'

interface ErrorContextType {
  errorCode: string | null
  setErrorCode: (code: string | null) => void
}

export const ErrorContext = React.createContext<ErrorContextType | undefined>(
  undefined
)

interface ErrorProviderProps {
  children: React.ReactNode
}

export const ErrorContextProvider: React.FC<ErrorProviderProps> = ({
  children,
}) => {
  const [errorCode, setErrorCode] = React.useState<string | null>(null)

  return (
    <ErrorContext.Provider value={{ errorCode, setErrorCode }}>
      {children}
    </ErrorContext.Provider>
  )
}

export default ErrorContextProvider
