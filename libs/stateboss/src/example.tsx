import React from 'react'
import * as L from '@sylo/logger'
import {
  createContainer,
  LoggerProvider,
  useLogger,
  ILogger,
} from './Container'

function useCounterImpl(logger: ILogger): {
  increment(): void
  decrement(): void
  counter: number
} {
  const [counter, setCounter] = React.useState(0)
  const increment = React.useCallback(() => {
    logger.d('incrementing!')
    setCounter((x) => x + 1)
  }, [])
  const decrement = React.useCallback(() => {
    logger.d('decrementing!')
    setCounter((x) => x - 1)
  }, [])
  return {
    counter,
    increment,
    decrement,
  }
}

const { Provider: CounterProvider, useContainer: useCounter } =
  createContainer(useCounterImpl)

function MyComponent() {
  const { counter, increment, decrement } = useCounter()
  const logger = useLogger()
  React.useEffect(() => {
    logger.d('counter updated: ', counter)
  }, [counter, /* stable: */ logger])
  return (
    <div>
      <div>counter: {counter}</div>
      <div>
        <button onClick={increment}>+</button>
        <button onClick={decrement}>-</button>
      </div>
    </div>
  )
}

function MyApp() {
  return (
    <LoggerProvider logger={L.consoleLogger}>
      <CounterProvider>
        <MyComponent />
      </CounterProvider>
    </LoggerProvider>
  )
}
