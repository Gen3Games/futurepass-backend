import { CreateStyled } from '@emotion/styled'
import { Palette } from '@mui/material/styles'

// Currently, we are only using these five font weights. However, we may consider adding XBold and Black weights if there is a need for them in the future.
export const fontWeightThin = 250
export const fontWeightLight = 300
export const fontWeightRegular = 400
export const fontWeightMedium = 500
export const fontWeightBold = 700

const NormalColorValueReg = /^#[a-zA-Z0-9]{3,6}$/

export const getThemeColor = (
  paletteOptions: Palette,
  color: string
): string => {
  if (NormalColorValueReg.test(color)) {
    return color
  }
  const colorKeyPath = color.split('.')
  const firstPath = colorKeyPath[0] as keyof Palette
  if (colorKeyPath.length > 1 && firstPath) {
    const firstObj = paletteOptions[firstPath]
    const secondPath = colorKeyPath[1] as keyof typeof firstObj
    if (firstObj) {
      return firstObj[secondPath]
    }
  }
  return paletteOptions.primary.main
}

// From https://github.com/emotion-js/emotion/issues/2193
// Allow easy filtering props that are only used for styling and should not be passed to the DOM
export const transientPropCheck: Parameters<CreateStyled>[1] = {
  shouldForwardProp: (propName: string) => !propName.startsWith('$'),
}

export type ColorKey = 'primary' | 'secondary' | 'dark'

export type Colors = {
  [key in
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning'
    | 'dark']?: string
}

export const getColor = (color: ColorKey, colorOptions?: Colors) => {
  if (colorOptions?.[color]) {
    return colorOptions[color]
  }
  return ''
}

export interface BehaviorColors {
  color?: Colors
  borderColor?: Colors
  background?: Colors
  hover?: {
    color?: Colors
    borderColor?: Colors
    background?: Colors
  }
  active?: {
    color?: Colors
    borderColor?: Colors
    background?: Colors
  }
}
