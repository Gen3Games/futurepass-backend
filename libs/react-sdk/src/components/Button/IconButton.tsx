import { styled, useTheme, Button, ButtonProps } from '@mui/material'
import { ButtonColors } from '../../styles/designTokens/button'

interface IconButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  selected?: boolean
}

const StyledButton = styled(Button)`
  padding: 0;

  &.MuiButton-sizeLarge {
    min-width: 52px;
  }

  &.MuiButton-sizeMedium {
    min-width: 44px;
  }

  &.MuiButton-sizeSmall {
    min-width: 36px;
  }

  .MuiButton-startIcon {
    margin: 0;
  }
`

export const IconButton = ({
  selected,
  color = 'primary',
  variant = 'contained',
  children,
  ...props
}: IconButtonProps) => {
  const theme = useTheme()
  const variantStyle = ButtonColors(theme)[variant]
  const selectedStyle = variantStyle.hover
  return (
    <StyledButton
      style={{
        ...(selected && {
          color: selectedStyle?.color?.[color],
          background: selectedStyle?.background?.[color],
          borderColor: selectedStyle?.borderColor?.[color],
        }),
      }}
      {...props}
      color={color}
      variant={variant}
      startIcon={children}
    />
  )
}

export default IconButton
