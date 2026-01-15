import { Theme } from '@mui/material'
import { objektivMk1FontFamily } from './fonts'
import {
  fontWeightThin,
  fontWeightBold,
  fontWeightLight,
  fontWeightMedium,
  fontWeightRegular,
} from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- it is from component library
export const createTypography = (theme: Theme): any => ({
  h1: {
    ...theme.typography.h1,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(64),
    lineHeight: theme.typography.pxToRem(83),
    letterSpacing: theme.typography.pxToRem(0),
    [theme.breakpoints.down('md')]: {
      fontSize: theme.typography.pxToRem(40),
      lineHeight: theme.typography.pxToRem(52),
    },
  },
  h2: {
    ...theme.typography.h2,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(44),
    lineHeight: theme.typography.pxToRem(61),
    letterSpacing: theme.typography.pxToRem(-0.5),
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(36),
      lineHeight: theme.typography.pxToRem(50.4),
    },
  },
  h3: {
    ...theme.typography.h3,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(36),
    lineHeight: theme.typography.pxToRem(43.2),
    letterSpacing: theme.typography.pxToRem(0),
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(30),
      lineHeight: theme.typography.pxToRem(36),
    },
  },
  h4: {
    ...theme.typography.h4,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(28),
    lineHeight: theme.typography.pxToRem(33.6),
    letterSpacing: theme.typography.pxToRem(0),
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(24),
      lineHeight: theme.typography.pxToRem(28.8),
    },
  },
  h5: {
    ...theme.typography.h5,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(22),
    lineHeight: theme.typography.pxToRem(26.4),
    letterSpacing: theme.typography.pxToRem(0),
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(18),
      lineHeight: theme.typography.pxToRem(21.6),
    },
  },
  h6: {
    ...theme.typography.h6,
    fontWeight: fontWeightThin,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(18),
    lineHeight: theme.typography.pxToRem(21.6),
    [theme.breakpoints.down('sm')]: {
      fontSize: theme.typography.pxToRem(16),
      lineHeight: theme.typography.pxToRem(19.2),
    },
  },
  subtitle1: {
    ...theme.typography.subtitle1,
    fontWeight: fontWeightBold,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(18),
    lineHeight: theme.typography.pxToRem(26.64),
  },
  subtitle2: {
    ...theme.typography.subtitle2,
    fontWeight: fontWeightLight,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(18),
    lineHeight: theme.typography.pxToRem(26.64),
  },
  body1: {
    ...theme.typography.body1,
    fontWeight: fontWeightBold,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(16),
    lineHeight: theme.typography.pxToRem(23.66),
  },
  body2: {
    ...theme.typography.body2,
    fontWeight: fontWeightLight,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(16),
    lineHeight: theme.typography.pxToRem(23.68),
  },
  button: {
    ...theme.typography.button,
    fontWeight: fontWeightBold,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(14),
    lineHeight: theme.typography.pxToRem(16.8),
  },
  caption: {
    ...theme.typography.caption,
    fontWeight: fontWeightRegular,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(12),
    lineHeight: theme.typography.pxToRem(17.76),
  },
  captionBold: {
    ...theme.typography.caption,
    fontWeight: fontWeightBold,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(12),
    lineHeight: theme.typography.pxToRem(17.76),
  },
  overline: {
    ...theme.typography.overline,
    fontWeight: fontWeightMedium,
    fontFamily: objektivMk1FontFamily,
    fontSize: theme.typography.pxToRem(10),
    lineHeight: theme.typography.pxToRem(12),
  },
})
