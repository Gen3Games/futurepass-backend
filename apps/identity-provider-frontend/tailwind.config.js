const { join } = require('path')
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        colorBrand: '#000000',
        colorPrimary: '#ffffff',
        colorSecondary: '#999999',
        colorTertiary: '#767676',
        colorQuaternary: '#4b4b4b',
        transparent: 'transparent',
        grey800: '#262626',
      },
      fontFamily: {
        ObjektivMk1Thin: ['ObjektivMk1Thin'],
        ObjektivMk1Medium: ['ObjektivMk1Medium'],
        ObjektivMk1XBold: ['ObjektivMk1XBold'],
      },
      fontSize: {
        fontExtraSmall: '12px',
        fontSmall: '14px',
        fontHead: '18px',
        fontMedium: '16px',
        fontLarge: '30px',
        fontExtraLarge: '36px',
      },
      spacing: {
        extraLarge: '32px',
        large: '20px',
        medium: '18px',
        normal: '16px',
        small: '12px',
        extraSmall: '8px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1280px',
        xl: '1281px',
      },
    },
  },
  plugins: [],
}
