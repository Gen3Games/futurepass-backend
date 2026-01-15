import { Card, CardContent, CardHeader, CardProps } from '@mui/material'
import { FC, PropsWithChildren } from 'react'

import { IconButton } from '../Button/IconButton'
import { IconFont } from '../IconFont/IconFont'

export type ModalProps = {
  header: React.ReactNode
  contentClassName?: string
  headerClassName?: string
  handleClose?: () => void
}

export const Modal: FC<PropsWithChildren<ModalProps & CardProps>> = ({
  header,
  className,
  contentClassName,
  headerClassName,
  children,
  handleClose,
  ...props
}) => {
  return (
    <Card
      variant="outlined"
      className={className}
      sx={{
        padding: '16px',
        color: 'primary.main',
        backgroundColor: 'primary.dark',
      }}
      onClick={(e) => {
        e.stopPropagation()
      }}
      {...props}
    >
      <CardHeader
        action={
          handleClose != null && (
            <IconButton
              aria-label="close"
              variant="text"
              color="primary"
              onClick={handleClose}
            >
              <IconFont name="close" />
            </IconButton>
          )
        }
        title={header}
        className={headerClassName}
      />
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}

export default Modal
