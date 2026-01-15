# @futureverse/stateboss

```
yarn add @futureverse/stateboss
```

## Features

- Seamless & type-safe state management
  - Export porcelain interfaces from containers
  - Access interface from anywhere in the hierarchy
- First class logging support (via `@sylo/logger`)
  - Completely optional
  - Containers always get a contextualized logger
  - Ships with no-op and console.log loggers
  - Grab a logger anywhere with `useLogger`

## Example

```typescript
import React from 'react'
import * as L from '@sylo/logger'
import { createContainer, LoggerProvider, useLogger, Logger } from '@futureverse/stateboss'

function useCounterImpl(logger: Logger): {
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

const { Provider: CounterProvider, useContainer: useCounter } = createContainer(useCounterImpl)

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
```

## Maintainers

- [Felix Schlitter](https://github.com/felixschl) (Author)
- [Darpan Patil](https://github.com/developer-darpan)
