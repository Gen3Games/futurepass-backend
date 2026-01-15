import { PaletteMode, createTheme } from '@mui/material'

import { breakpoints } from './breakpoints'
import { createPalette } from './colors'
import { overrideComponents } from './components'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ThemeCache = new Map<PaletteMode, any>()

const createAppTheme = (colorMode: PaletteMode) => {
  if (ThemeCache.has(colorMode)) {
    return ThemeCache.get(colorMode)
  }

  const theme = createTheme({
    palette: createPalette(colorMode),
    breakpoints,
  })

  theme.shadows[1] = '0px 0px 20px rgba(0, 0, 0, 0.15)'

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  theme.components = overrideComponents(theme)

  ThemeCache.set(colorMode, theme)
  return theme
}

export default createAppTheme
