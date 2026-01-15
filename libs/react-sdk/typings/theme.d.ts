import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: false // removes the `xs` breakpoint
    sm: true
    md: true
    lg: true
    xl: true
    xxl: true
  }
}

declare module '@mui/material/styles/createPalette' {
  interface ToastPalette {
    error: string
    success: string
  }

  interface ExtraPaletteOptions {
    dark: SimplePaletteColorOptions
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- this is needed for MUI integration
  interface Palette extends ExtraPaletteOptions {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- this is needed for MUI integration
  interface PaletteOptions extends ExtraPaletteOptions {}

  interface SimplePaletteColorOptions {
    xlight?: string
    secondary?: string
  }

  interface TypeText {
    mid: string
    grey: string
  }

  interface TypeBackground {
    dark: string
    teal: string
    light: string
    xlight: string
    darkTeal: string
    purple: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface -- this is needed for MUI integration
  interface PaletteColor extends ColorPartial {}
}

declare module '@mui/material/styles/createTypography' {
  interface ExtraTypographyOptions {
    fontFamilySecondary?: string
    fontWeightSemiBold: Tyopgraphy.FontWeight
  }

  interface Typography extends ExtraTypographyOptions {
    captionBold: CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    captionBold: CSSProperties
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    dark: string
  }
}
