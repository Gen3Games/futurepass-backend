import { Theme } from '@mui/material'

import { BehaviorColors, ColorKey, getColor } from '../theme/utils'

type VariantStyles = {
  [key in 'contained' | 'outlined' | 'text' | 'disabled']: BehaviorColors
}

export const generateButtonVariant = (
  theme: Theme,
  variant: 'contained' | 'outlined' | 'text' | 'disabled',
  color: ColorKey
) => {
  const styles: VariantStyles = ButtonColors(theme)
  const variantStyles = styles[variant]

  return {
    color: getColor(color, variantStyles.color),
    background: getColor(color, variantStyles.background),
    borderColor: getColor(color, variantStyles.borderColor),

    '&:hover': {
      color: getColor(color, variantStyles.hover?.color),
      borderColor: getColor(color, variantStyles.hover?.borderColor),
      background: getColor(color, variantStyles.hover?.background),
    },

    '&:active': {
      color: getColor(color, variantStyles.active?.color),
      borderColor: getColor(color, variantStyles.active?.borderColor),
      background: getColor(color, variantStyles.active?.background),
    },
  }
}

export const ButtonColors = (theme: Theme): VariantStyles => ({
  contained: {
    background: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
    },
    color: {
      primary: theme.palette.primary.dark,
      secondary: theme.palette.primary.main,
    },
    borderColor: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
    },
    hover: {
      background: {
        primary: theme.palette.primary.dark,
        secondary: theme.palette.primary.dark,
      },
      color: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.main,
      },
      borderColor: {
        primary: theme.palette.text.primary,
        secondary: theme.palette.text.secondary,
      },
    },
    active: {
      background: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.main,
      },
      color: {
        primary: theme.palette.text.secondary,
        secondary: theme.palette.text.secondary,
      },
      borderColor: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.main,
      },
    },
  },
  outlined: {
    color: {
      primary: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
      dark: theme.palette.dark.main,
    },
    borderColor: {
      primary: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
      dark: theme.palette.dark.main,
    },
    hover: {
      background: {
        primary: theme.palette.action.hover,
        secondary: theme.palette.text.secondary,
        dark: theme.palette.dark.main,
      },
      color: {
        primary: theme.palette.primary.dark,
        secondary: theme.palette.primary.dark,
        dark: theme.palette.dark.dark,
      },
      borderColor: {
        primary: theme.palette.action.hover,
        secondary: theme.palette.text.secondary,
        dark: theme.palette.dark.dark,
      },
    },
    active: {
      background: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.main,
        dark: theme.palette.dark.main,
      },
      color: {
        primary: theme.palette.text.secondary,
        secondary: theme.palette.primary.dark,
        dark: theme.palette.text.secondary,
      },
      borderColor: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.grey[500],
        dark: theme.palette.dark.main,
      },
    },
  },
  text: {
    color: {
      primary: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
      dark: theme.palette.dark.main,
    },
    hover: {
      background: {
        primary: theme.palette.grey[400],
        secondary: theme.palette.grey[800],
        dark: theme.palette.grey[50],
      },
      color: {
        primary: theme.palette.text.primary,
        secondary: theme.palette.secondary.light,
      },
    },
    active: {
      background: {
        primary: theme.palette.primary.main,
        secondary: theme.palette.primary.main,
        dark: theme.palette.grey[50],
      },
      color: {
        primary: theme.palette.text.secondary,
        secondary: theme.palette.text.secondary,
        dark: theme.palette.grey[400],
      },
    },
  },
  disabled: {
    color: {
      primary: theme.palette.text.disabled,
      secondary: theme.palette.text.disabled,
    },
    background: {
      primary: theme.palette.action.disabledBackground,
      secondary: theme.palette.action.disabledBackground,
    },
  },
})
