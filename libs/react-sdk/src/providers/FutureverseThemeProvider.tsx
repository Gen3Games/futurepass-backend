import {
  CssBaseline,
  PaletteMode,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react'

import GlobalStyles from '../styles/GlobalStyles'
import createAppTheme from '../styles/theme'
import GlobalSnackAlertProvider from './GlobalSnackAlertProvider'

export const ColorModeContext = createContext<{
  colorMode: PaletteMode
  toggleColorMode: (mode?: PaletteMode) => void
}>({ colorMode: 'dark', toggleColorMode: () => void 0 })

export const FutureverseThemeProvider = ({
  children,
}: PropsWithChildren<unknown>) => {
  const [colorMode, setColorMode] = useState<PaletteMode>('dark')

  const toggleColorMode = useCallback((mode?: PaletteMode) => {
    if (mode !== undefined) {
      setColorMode(mode)
    } else {
      setColorMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'))
    }
  }, [])

  const theme = createAppTheme(colorMode)

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <CssBaseline />
          <GlobalStyles />
          <GlobalSnackAlertProvider>{children}</GlobalSnackAlertProvider>
        </StyledEngineProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = () => {
  const { colorMode, toggleColorMode } = useContext(ColorModeContext)
  return { colorMode, toggleColorMode }
}

export default FutureverseThemeProvider
