import { Typography as MuiTypography, TypographyProps } from '@mui/material'

export function Typography({
  children,
  color,
  ...props
}: // below code <'span', { component?: 'span' }> is for solving issue that cannot pass component prop to Typography, for more details, please refer to https://mui.com/material-ui/guides/typescript/#complications-with-the-component-prop
TypographyProps<'span', { component?: 'span' }>) {
  return (
    <MuiTypography color={color ?? 'inherit'} {...props}>
      {children}
    </MuiTypography>
  )
}

export default Typography
