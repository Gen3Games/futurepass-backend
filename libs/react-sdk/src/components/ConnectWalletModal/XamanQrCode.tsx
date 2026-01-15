import { Box, styled } from '@mui/material'
import React from 'react'
import { CreatedPayload } from 'xumm-sdk/dist/src/types'
import { Button, Loader, Typography } from '../index'

type XamanQrCodeProps = {
  payload: CreatedPayload
}

const ImageWrapper = styled(Box)({
  backgroundColor: '#2C49FF',
  position: 'relative',
})

export default function XamanQrCode({
  payload,
}: XamanQrCodeProps): JSX.Element {
  const [showQrCode, setShowQrCode] = React.useState(!payload.pushed)

  return (
    <Box display="flex" flexDirection="column" justifyContent="flex-start">
      {showQrCode ? (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography
            variant="body2"
            justifySelf="flex-start"
            marginBottom="32px"
            color="text.secondary"
          >
            If you did not receive a signature request in your Xaman wallet,
            scan the QR code to retry.
          </Typography>
          <ImageWrapper>
            <img
              src={payload.refs.qr_png}
              alt="XRP QR code"
              style={{
                width: '100%',
                backgroundColor: '#2C49FF',
                aspectRatio: 1,
                marginInline: 'auto',
                display: 'flex',
                padding: '10px',
                maxWidth: '338px',
              }}
            />
          </ImageWrapper>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Please authorize FuturePass in your mobile wallet.
          </Typography>
          <Box display="flex" justifyContent="center" marginBlock="48px">
            <Loader />
          </Box>
          <Typography
            variant="caption"
            marginTop="48px"
            marginBottom="12px"
            color="text.secondary"
          >
            Didn&apos;t receive a signature request in wallet?
          </Typography>
          <Button
            variant="text"
            onClick={() => {
              setShowQrCode(true)
            }}
            sx={{ paddingLeft: '0px' }}
          >
            Scan QR code instead
          </Button>
        </Box>
      )}
    </Box>
  )
}
