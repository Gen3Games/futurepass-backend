import { PaletteMode, PaletteOptions } from '@mui/material'

const DarkColors = {
  primary: {
    main: '#FFF',
    dark: '#000',
  },
  dark: {
    main: '#000',
    dark: '#FFF',
  },
  secondary: {
    main: '#424242',
    light: '#7E7E7E',
    dark: '#1B1B1B',
  },
  success: {
    main: '#008936',
    light: '#005220',
    dark: '#002910',
  },
  info: {
    main: '#FFF',
    light: '#FFF',
    dark: '#1B1B1B',
  },
  warning: {
    main: '#FAB400',
    light: '#966C00',
    dark: '#251B00',
  },
  error: {
    main: '#E71E1E',
    light: '#8B1212',
    dark: '#450909',
  },
  text: {
    primary: '#FFF',
    secondary: '#7E7E7E',
    disabled: '#4D4D4D',
  },
  divider: '#dcdcdc',
  background: {
    default: '#000',
    paper: '#1B1B1B',
  },
  grey: {
    50: '#F7F7F7',
    100: '#E0E0E0',
    200: '#BDBDBD',
    300: '#999',
    400: '#7E7E7E',
    500: '#666',
    600: '#4D4D4D',
    700: '#424242',
    800: '#1B1B1B',
    900: '#000',
  },
  action: {
    active: '#FFF',
    hover: '#FFF',
    selected: 'rgba(0, 0, 0, 0.51)',
    disabled:
      'linear-gradient(0deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), #FFFFFF',
    disabledBackground:
      'linear-gradient(0deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.9)), #FFFFFF',
    focused: 'rgba(256, 256, 256, 0.44)',
  },
}

const LightColors = {
  primary: {
    main: '#000',
    dark: '#FFF',
  },
  dark: {
    main: '#FFF',
    dark: '#000',
  },
  secondary: {
    main: '#E0E0E0',
    light: '#F7F7F7',
    dark: '#6F6F6F',
  },
  success: {
    main: '#12D960',
    light: '#E7FFEA',
    dark: '#008936',
  },
  info: {
    main: '#E0E0E0',
    light: '#F7F7F7',
    dark: '#E0E0E0',
  },
  warning: {
    main: '#F8CC5B',
    light: '#FEF6E0',
    dark: '#FAB400',
  },
  error: {
    main: '#E26060',
    light: '#FCE4E4',
    dark: '#E71E1E',
  },
  text: {
    primary: '#000',
    secondary: '#6F6F6F',
    disabled: '#BDBDBD',
  },
  divider: '#dcdcdc',
  background: {
    default: '#FFF',
    paper: '#F7F7F7',
  },
  grey: {
    50: '#FFF',
    100: '#F7F7F7',
    200: '#F0F0F0',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#7E7E7E',
    600: '#6F6F6F',
    700: '#4D4D4D',
    800: '#424242',
    900: '#1B1B1B',
  },
  action: {
    active: '#000',
    hover: '#000',
    selected: '#F3F3F3',
    disabled:
      'linear-gradient(0deg, rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0.97)), #000000;',
    disabledBackground:
      'linear-gradient(0deg, rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0.97)), #000000;',
    focused: 'rgba(256, 256, 256, 0.44)',
  },
}

export const createPalette = (
  colorMode: PaletteMode = 'dark'
): PaletteOptions => ({
  mode: colorMode,
  ...(colorMode === 'dark' ? DarkColors : LightColors),
})
