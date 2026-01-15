import { type ILogger, noopLogger, prefix } from '@sylo/logger'
import React from 'react'

export type { ILogger } from '@sylo/logger'

const EMPTY: unique symbol = Symbol()
const Context = React.createContext<ILogger | typeof EMPTY>(EMPTY)

export type ContainerProviderProps<State = void> =
  React.PropsWithChildren<State>

export interface Container<Value, State = void> {
  Provider: React.ComponentType<ContainerProviderProps<State>>
  useContainer: () => Value
}

export function LoggerProvider(
  props: ContainerProviderProps<{ scope?: string; logger?: ILogger }>
): React.ReactElement {
  const logger = useLogger(props.scope, props.logger)
  return <Context.Provider value={logger}>{props.children}</Context.Provider>
}

export function useLogger(scope?: string, overrideLogger?: ILogger): ILogger {
  let logger = React.useContext(Context)
  if (overrideLogger != null) {
    logger = overrideLogger
  }
  if (logger === EMPTY) {
    logger = noopLogger
  }
  return useLocal(scope ?? null, logger)
}

function useLocal(scope: string | null, logger: ILogger): ILogger {
  return React.useMemo(() => {
    return local(scope, logger)
  }, [scope, logger])
}

export function local(scope: string | null, logger: ILogger): ILogger {
  if (scope != null) {
    return logger.local(prefix(`[${scope}]`))
  }
  return logger
}

/**
 * Create a container blessed with the capability to call 'useLogger' with a
 * custom 'scope.' The given scope is prepended to all logs the logger emits.
 * Nested containers chain all parent contexts.
 */
export function createContainer<Value, Props = any>(
  useHook: (logger: ILogger, props: Props) => Value,
  options?: {
    dynamicScope?: (state: Value) => string
    componentName?: string
    wrapper?: (props: {
      value: Value
      children: React.ReactNode
    }) => React.ReactElement
  }
): Container<Value, Props> {
  const LocalContext = React.createContext<Value | typeof EMPTY>(EMPTY)
  const result: Container<Value, Props> = {
    Provider(props: ContainerProviderProps<Props>) {
      const parentLogger = useLogger()
      const selfLogger = useLocal(options?.componentName ?? null, parentLogger)
      const value = useHook(selfLogger, props)
      const kidsLogger = useLocal(
        options?.dynamicScope != null ? options.dynamicScope(value) : null,
        parentLogger
      )
      return (
        <LoggerProvider logger={kidsLogger}>
          <LocalContext.Provider value={value}>
            {options?.wrapper == null ? (
              props.children
            ) : (
              <options.wrapper value={value}>{props.children}</options.wrapper>
            )}
          </LocalContext.Provider>
        </LoggerProvider>
      )
    },
    useContainer(): Value {
      const value = React.useContext(LocalContext)
      if (value === EMPTY) {
        throw new Error(
          `Component must be wrapped with <${
            options?.componentName ?? 'Container'
          }.Provider>`
        )
      }
      return value
    },
  }
  /* override the function's name for easier tracing of issues */
  if (options?.componentName != null) {
    const name = `${options.componentName}.Provider`
    Object.defineProperty(result.Provider, 'name', { value: name })
    result.Provider.displayName = name
  }
  return result
}
