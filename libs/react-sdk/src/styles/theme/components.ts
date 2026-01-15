import { Theme } from '@mui/material/styles'
import { ButtonColors, generateButtonVariant } from '../designTokens/button'
import {
  objektivFontFaceLt,
  objektivFontFaceTh,
  objektivFontFaceRg,
  objektivFontFaceMd,
  objektivFontFaceBd,
  objektivMk1FontFamily,
} from './fonts' //objektivFontFace,
import { createTypography } from './typography'

import {
  fontWeightThin,
  fontWeightBold,
  fontWeightRegular,
  fontWeightLight,
} from './utils'

// Overrides are assigned here so we can use theme.breakpoints
// Defaults can be deleted. These are used to test that Storybook Mui theming works

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const overrideComponents = (theme: Theme): any => ({
  MuiCssBaseline: {
    styleOverrides: [
      objektivFontFaceLt,
      objektivFontFaceTh,
      objektivFontFaceRg,
      objektivFontFaceMd,
      objektivFontFaceBd,
    ].join('\n'),
  },
  MuiTypography: {
    styleOverrides: {
      ...createTypography(theme),
    },
  },
  MuiContainer: {
    styleOverrides: {
      root: {
        [theme.breakpoints.up('lg')]: {
          maxWidth: 1280,
        },
      },
    },
  },
  MuiListItemText: {},
  MuiButton: {
    defaultProps: {
      variant: 'contained',
      disableElevation: true,
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'unset',
        borderRadius: 32,
        lineHeight: theme.typography.pxToRem(16.8),
        letterSpacing: 0.46,
        fontSize: 14,
        fontWeight: fontWeightBold,
        fontFamily: objektivMk1FontFamily,
        '&:hover': {
          backgroundColor: 'transparent',
        },
        '&.Mui-disabled': {
          border: 'none',
          color: ButtonColors(theme).disabled.color?.primary,
          background: ButtonColors(theme).disabled.background?.primary,
        },
      },
      sizeLarge: {
        height: 52,
        padding: `0.5rem ${theme.typography.pxToRem(24)}`,
      },
      sizeMedium: {
        height: 44,
        padding: `0.5rem ${theme.typography.pxToRem(20)}`,
      },
      sizeSmall: {
        height: 36,
        padding: `0.5rem ${theme.typography.pxToRem(16)}`,
      },
      containedPrimary: {
        border: `1px solid ${theme.palette.text.primary}`,
        ...generateButtonVariant(theme, 'contained', 'primary'),
      },
      containedSecondary: {
        border: `1px solid ${theme.palette.text.primary}`,
        ...generateButtonVariant(theme, 'contained', 'secondary'),
      },
      outlinedPrimary: {
        ...generateButtonVariant(theme, 'outlined', 'primary'),
      },
      outlinedSecondary: {
        ...generateButtonVariant(theme, 'outlined', 'secondary'),
      },
      outlinedDark: {
        ...generateButtonVariant(theme, 'outlined', 'dark'),
      },
      textPrimary: {
        ...generateButtonVariant(theme, 'text', 'primary'),
      },
      textSecondary: {
        ...generateButtonVariant(theme, 'text', 'secondary'),
      },
      textDark: {
        ...generateButtonVariant(theme, 'text', 'dark'),
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        background: 'transparent',
        color: theme.palette.primary.main,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        color: theme.palette.primary.main,
        borderBottomColor: theme.palette.secondary.main,
        padding: '30px 0',
      },
      head: {
        borderBottomColor: theme.palette.primary.main,
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        backgroundColor: theme.palette.primary.dark,
        position: 'absolute',
      },
    },
  },

  MuiTabs: {
    styleOverrides: {
      indicator: {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },

  MuiTab: {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        fontWeight: fontWeightBold,
        fontFamily: objektivMk1FontFamily,
        fontSize: theme.typography.pxToRem(14),
        lineHeight: theme.typography.pxToRem(16.8),
        textTransform: 'none',
        color: theme.palette.text.primary,
        opacity: 0.7,
        transition: 'opacity 0.5s ease',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 0,
          height: 2,
          opacity: 0,
          backgroundColor: theme.palette.primary.main,
          transition: 'all 0.5s ease',
        },
        '&:hover': {
          opacity: 1,
          '&::after': {
            opacity: 1,
            width: '100%',
          },
        },
        '&.Mui-selected': {
          opacity: 1,
        },
        '&.Mui-disabled': {
          color: theme.palette.text.disabled,
          opacity: 0.5,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        padding: 4,
        '&:hover': {
          backgroundColor: 'rgba(0,0,0,0.25)',
        },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        fontWeight: fontWeightBold,
        fontSize: theme.typography.pxToRem(12),
        lineHeight: theme.typography.pxToRem(20),
        fontFamily: theme.typography.fontFamily,
        letterSpacing: 0.4,
        color: theme.palette.text.grey,
        textDecorationColor: theme.palette.text.grey,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: theme.palette.secondary.main,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 4 },
    },
  },
  MuiAutocomplete: {
    styleOverrides: {
      paper: { marginTop: 'unset', backgroundColor: 'transparent' },
    },
  },
  MuiDialog: {
    styleOverrides: {
      root: {
        backdropFilter: 'blur(5px)',
      },
      paper: {
        width: 'auto',
        maxWidth: 1082,
        overflow: 'hidden',
        borderRadius: 8,
        backgroundImage: 'none',

        [theme.breakpoints.down('md')]: {
          alignItems: 'flex-start',
          height: '100%',
        },
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        padding: theme.spacing(6, 5),
        [theme.breakpoints.down('sm')]: {
          padding: theme.spacing(3, 2),
        },
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      arrow: true,
      // Tap to open tooltip on touch devices
      enterTouchDelay: 0,
    },
    styleOverrides: {
      tooltip: {
        background: theme.palette.primary.main,
        color: theme.palette.primary.dark,
        fontSize: '12px',
        lineHeight: 1.48,
        padding: '4px 8px',
        ...theme.typography.caption,
      },
      arrow: {
        width: '2em',
        color: theme.palette.primary.main,
        height: '1.4em',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root.Mui-error': {
          background: theme.palette.error.main,

          '& fieldset': {
            borderColor: theme.palette.error.light,
          },
          '&:hover fieldset': {
            borderColor: theme.palette.error.light,
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.error.light,
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        background: 'transparent',
        fontWeight: fontWeightThin,
        borderColor: theme.palette.secondary.main,
        fontSize: theme.typography.pxToRem(16),
        lineHeight: theme.typography.pxToRem(24),
        letterSpacing: 0.15,
        height: 50,
        '&.Mui-disabled': {
          color: theme.palette.text.disabled,
          borderColor: theme.palette.secondary.main,
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.secondary.main,
          },
        },
        '&.Mui-disabled:hover': {
          '.MuiOutlinedInput-notchedOutline': {
            border: `1px solid ${theme.palette.secondary.main}`,
          },
        },
        '&.Mui-focused': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
        },
        '&:hover': {
          '.MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: theme.palette.primary.main,
          },
          '.MuiInputLabel-root': {
            color: theme.palette.primary.main,
          },
        },
      },
      notchedOutline: {
        borderColor: theme.palette.text.secondary,
      },
    },
  },
  MuiFilledInput: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        background: theme.palette.background.paper,
        fontSize: theme.typography.pxToRem(16),
        lineHeight: theme.typography.pxToRem(24),
        letterSpacing: 0.15,
        height: 50,
        '&::before': {
          borderColor: theme.palette.secondary.main,
        },
        '&.Mui-disabled': {
          color: theme.palette.text.disabled,
          borderColor: theme.palette.secondary.main,
        },
        '&.Mui-focused': {
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        },
        '&.Mui-error': {
          color: theme.palette.primary.main,
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: theme.palette.text.secondary,
        fontSize: theme.typography.pxToRem(16),
        lineHeight: theme.typography.pxToRem(16),
        fontWeight: fontWeightLight,
        letterSpacing: 0.15,
        '&.Mui-focused': {
          color: theme.palette.primary.main,
          fontWeight: fontWeightRegular,
        },
        '&.Mui-error': {
          color: theme.palette.error.light,
        },
        '&.Mui-disabled': {
          color: theme.palette.text.disabled,
          borderColor: theme.palette.secondary.main,
        },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        fontSize: theme.typography.pxToRem(12),
        lineHeight: theme.typography.pxToRem(20),
        letterSpacing: 0.4,
        marginLeft: 0,
        '&.Mui-error': {
          color: theme.palette.error.main,
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 16,
        '.MuiAlert-icon': {
          color: theme.palette.text.primary,
        },
      },
      '.MuiAlert-action': {
        '&:hover': {
          backgroundColor: theme.palette.grey[600],
          borderRadius: '100%',
        },
      },
      message: {
        fontFamily: objektivMk1FontFamily,
        fontSize: theme.typography.pxToRem(14),
        lineHeight: theme.typography.pxToRem(17.76),
        fontWeight: theme.typography.fontWeightBold,
        color: theme.palette.text.primary,
      },
      action: {
        marginRight: 0,
        marginLeft: 12,
        padding: 0,
        color: theme.palette.text.primary,
      },

      filledInfo: {
        backgroundColor: theme.palette.primary.main,
      },
      icon: {
        padding: 7,
      },
      outlinedInfo: {
        borderColor: theme.palette.info.main,
      },
      outlinedSuccess: {
        borderColor: theme.palette.success.main,
      },
      outlinedWarning: {
        borderColor: theme.palette.warning.main,
      },
      outlinedError: {
        borderColor: theme.palette.error.main,
      },
      standardInfo: {
        backgroundColor: theme.palette.info.dark,
      },
      standardError: {
        backgroundColor: theme.palette.error.dark,
      },
      standardWarning: {
        backgroundColor: theme.palette.warning.dark,
      },
      standardSuccess: {
        backgroundColor: theme.palette.success.dark,
      },
    },
  },
  MuiChip: {
    defaultProps: { color: 'primary', size: 'medium' },
    styleOverrides: {
      root: {
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: fontWeightBold,
        fontFamily: objektivMk1FontFamily,
        lineHeight: 1.48,
        maxHeight: '26px',
        transition: 'color 0.15s',
      },
      label: { padding: '0px' },
      sizeSmall: { padding: '3px 8px' },
      sizeMedium: { padding: '4px' },
      colorPrimary: {
        border: `1px solid ${theme.palette.primary.main}`,
      },
      filled: {
        '&.MuiChip-colorPrimary': {
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: 'transparent',
            border: `1px solid ${theme.palette.primary.main}`,
            color: theme.palette.text.primary,
          },
        },
        '&.MuiChip-colorSecondary': {
          border: `1px solid ${theme.palette.grey['100']}`,
          background: theme.palette.grey['100'],
          color: theme.palette.text.primary,
        },
      },
      filledNonClickable: {
        '&.MuiChip-colorPrimary': {
          backgroundColor: theme.palette.primary.main,
        },
        '&.MuiChip-colorSecondary': {
          border: `1px solid ${theme.palette.grey['100']}`,
          background: theme.palette.grey['100'],
          color: theme.palette.text.primary,
        },
      },
      outlinedPrimary: {
        border: `1px solid ${theme.palette.primary.main}`,
        '&.Mui-disabled': {
          opacity: 1,
          color: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
        },
      },
      outlinedSecondary: {
        border: `1px solid ${theme.palette.secondary.main}`,
        color: theme.palette.text.disabled,
      },
      icon: {
        margin: 0,
        padding: 0,
        paddingRight: '4px',
      },
      deleteIcon: {
        color: 'inherit',
        transition: 'none',
        margin: 0,
        paddingLeft: '4px',

        '&:hover': {
          color: 'inherit',
        },
      },
      deleteIconSmall: {
        width: '16px',
        height: '16px',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderColor: theme.palette.secondary.light,
        backgroundColor: theme.palette.primary.dark,
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: {
        paddingTop: theme.typography.pxToRem(6),
        paddingBottom: theme.typography.pxToRem(6),
        paddingLeft: theme.typography.pxToRem(10),
        paddingRight: theme.typography.pxToRem(10),
        fontWeight: fontWeightRegular,
        borderBottom: `1px solid ${theme.palette.secondary.main}`,
        '&:hover': {
          backgroundColor: theme.palette.info.dark,
        },
        '.MuiSelect-select': {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
        '.MuiSelect-icon': {
          right: 10,
        },
        '&.Mui-disabled:hover': {
          backgroundColor: 'transparent',
        },
        '&.Mui-disabled:hover .MuiOutlinedInput-notchedOutline': {
          border: `1px solid ${theme.palette.secondary.main}`,
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      root: {
        '.MuiDrawer-paper': {
          borderRadius: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          borderColor: theme.palette.secondary.main,
          backgroundColor: theme.palette.primary.dark,
        },
      },
    },
  },

  MuiList: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiMenuItem: {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: {
        padding: theme.typography.pxToRem(10),
        fontWeight: fontWeightRegular,
        backgroundColor: theme.palette.primary.dark,
        borderBottom: `1px solid ${theme.palette.secondary.main}`,
        '&:hover': {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.info.dark,
        },
        '&.Mui-selected': {
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.secondary.main,
          '&:hover': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.info.dark,
          },
        },
      },
    },
  },
})
