import { Box, Divider, Typography, styled } from '@mui/material'
import React from 'react'
import { Button } from '../../atom/Button/Button'
import IconButton from '../../atom/Button/IconButton'
import { IconFontName, IconFont } from '../../atom/IconFont/IconFont'

type Action = { title: string; onClick: () => void; disabled?: boolean }

type Props = {
  title: string
  contents: React.ReactNode
  cancelTitle?: string
  iconFontName?: IconFontName
  primaryAction?: Action
  secondaryAction?: Action
  onCancel?: () => void
  onClose?: () => void
}

const InfoModal = ({
  iconFontName,
  title,
  contents,
  primaryAction,
  cancelTitle,
  secondaryAction,
  onClose,
  onCancel,
}: Props): JSX.Element => {
  const handleOnCancel = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onCancel?.()
    },
    [onCancel]
  )

  return (
    <StyledContainer>
      <StyledTopContent>
        <div>
          {iconFontName && <IconFont name={iconFontName} fontSize={20} />}
          <Typography variant="subtitle1" align="left">
            {title}
          </Typography>
        </div>
        {onClose != null && (
          <IconButton variant="text" aria-label="Close" onClick={onClose}>
            <IconFont name="close" />
          </IconButton>
        )}
      </StyledTopContent>
      <Divider />
      <StyledMainContent>{contents}</StyledMainContent>
      <StyledButtonContent>
        {onCancel != null && (
          <Button
            className="px-0 md:px-5"
            variant="text"
            onClick={handleOnCancel}
          >
            {cancelTitle ?? 'Cancel'}
          </Button>
        )}
        {secondaryAction != null && (
          <Button
            variant="outlined"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              secondaryAction.onClick()
            }}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.title}
          </Button>
        )}
        {primaryAction != null && (
          <Button
            variant="outlined"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              primaryAction.onClick()
            }}
            disabled={primaryAction.disabled}
          >
            {primaryAction.title}
          </Button>
        )}
      </StyledButtonContent>
    </StyledContainer>
  )
}

const StyledContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  background: 'black',
  width: '100%',
  border: '1px solid #767676',
  borderRadius: '0.5rem',
  maxHeight: '100vh',
  overflow: 'auto',

  // Hide the scrollbar for webkit-based browsers (Chrome, Safari, Edge)
  '&::-webkit-scrollbar': {
    display: 'none',
  },

  // Hide the scrollbar for Firefox
  scrollbarWidth: 'none',
  '-ms-overflow-style': 'none',

  [theme.breakpoints.up('md')]: {
    width: '648px',
  },
}))

const StyledTopContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '2rem',

  '& > div': {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
  },
})

const StyledMainContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  padding: '2rem',
})

const StyledButtonContent = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  paddingInline: '2rem',
  paddingBottom: '2rem',
  alignSelf: 'flex-end',
  gap: '1rem',
})

export default InfoModal
