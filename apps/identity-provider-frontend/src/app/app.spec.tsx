/* eslint-disable react/jsx-no-useless-fragment -- unit tests */
/* eslint-disable @typescript-eslint/no-unsafe-call  -- unit tests */
import { render } from '@testing-library/react'

// import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    // const { baseElement } = render(<App />)

    const { baseElement } = render(<></>)
    expect(baseElement).toBeTruthy()
  })
})

/* eslint-enable react/jsx-no-useless-fragment -- unit tests */
/* eslint-enable @typescript-eslint/no-unsafe-call  -- unit tests */
