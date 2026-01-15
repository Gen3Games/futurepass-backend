import { styled, css, useTheme } from '@mui/material'
import { getThemeColor, transientPropCheck } from '../../styles/theme/utils'

export type IconFontName =
  | 'send'
  | 'dashboard'
  | 'category'
  | 'lock'
  | 'content_copy'
  | 'visibility'
  | 'visibility_off'
  | 'check_circle'
  | 'more_vert'
  | 'open_in_new'
  | 'account_circle'
  | 'chevron_left'
  | 'chevron_right'
  | 'warning'
  | 'verified'
  | 'close'
  | 'logout'
  | 'expand_more'
  | 'cancel'
  | 'language'
  | 'delete'
  | 'info'
  | 'add'
  | 'remove'
  | 'redeem'
  | 'mail'
  | 'swap_horiz'
  | 'arrow_forward'
  | 'arrow_downward'
  | 'help'
  | 'access_time'
  | 'refresh'
  | 'arrow_outward'
  | 'auto_awesome'
  | 'hide_source'
  | 'settings'
  | 'expand_less'
  | 'arrow_circle_up'
  | 'arrow_circle_down'
  | 'account_balance_wallet'
  | 'email'

interface IconFontProps {
  name: IconFontName
  fill?: boolean
  color?: string
  fontSize?: string | number
  className?: string
  style?: React.CSSProperties
}

const IconFontWrapper = styled(
  'div',
  transientPropCheck
)(
  ({ $color, $fill }: { $color: string; $fill?: boolean }) => css`
    display: flex;
    align-items: center;
    max-width: 24px;
    color: ${$color};
    font-variation-settings: 'FILL' ${$fill ? 1 : 0}, 'wght' 400, 'GRAD' 0,
      'opsz' 48;
  `
)

// IconFont component can be used to centralise the way we import svg icons
//  and make easier to switch between icons just by changing the iconName property.
export const IconFont: React.FC<IconFontProps> = ({
  name,
  fill = false,
  fontSize = 24,
  color,
  ...props
}) => {
  const theme = useTheme()
  const renderingColor = color ? getThemeColor(theme.palette, color) : 'inherit'

  return (
    <IconFontWrapper
      $color={renderingColor || 'inherit'}
      $fill={fill}
      {...props}
    >
      <span
        className="material-symbols-outlined"
        style={{
          color: 'inherit',
          fontSize,
        }}
      >
        {name}
      </span>
    </IconFontWrapper>
  )
}

export default IconFont

export type { IconFontProps }
