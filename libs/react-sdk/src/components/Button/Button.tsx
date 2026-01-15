import {
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
  useTheme,
} from '@mui/material'
import { ButtonColors } from '../../styles/designTokens/button'

export const Button = <C extends React.ElementType>({
  to,
  children,
  color = 'primary',
  variant = 'contained',
  loading = false,
  disabled = false,
  selected = false,
  component,
  ...props
}: ButtonProps<
  C,
  { component?: C; selected?: boolean; loading?: boolean }
>) => {
  const theme = useTheme()
  const variantStyle = ButtonColors(theme)[variant]
  const selectedStyle = variantStyle.hover

  return (
    <MuiButton
      to={to}
      role={to && 'link'}
      disabled={loading || disabled}
      startIcon={loading && <CircularProgress size={20} color="inherit" />}
      color={color}
      component={component}
      variant={variant}
      style={{
        ...(selected && {
          color: selectedStyle?.color?.[color],
          background: selectedStyle?.background?.[color],
          borderColor: selectedStyle?.borderColor?.[color],
        }),
      }}
      {...props}
    >
      {children}
    </MuiButton>
  )
}

export default Button
