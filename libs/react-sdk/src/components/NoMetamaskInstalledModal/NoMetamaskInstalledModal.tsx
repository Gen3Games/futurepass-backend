import { Box, Divider } from '@mui/material'
import { Button } from '../Button/Button'
import { IconFactory } from '../IconFactory/IconFactory'
import { IconFont } from '../IconFont/IconFont'
import { Modal } from '../Modal/Modal'
import { Typography } from '../Typography/Typography'

type Props = {
  handleGoBack: () => void
}

export const NoMetamaskInstalledModal = ({
  handleGoBack,
}: Props): JSX.Element => {
  return (
    <Modal
      id="no-metamask-installed_modal"
      /**
       * These tailwind usages should be fine as classNames will be resolved
       * by the component-library
       */
      className="max-w-[326px] md:max-w-[636px] rounded-lg px-0 pt-4 pb-0"
      contentClassName="px-0 !pb-0"
      headerClassName="px-8"
      header={
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <IconFont name="warning" fontSize={24} />
          <Typography variant="body1">MetaMask not installed</Typography>
        </div>
      }
    >
      <Divider
        sx={{
          borderColor: 'secondary.main',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          padding: '2rem',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          You need to install MetaMask to continue. Please install MetaMask then
          refresh the page.{' '}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { md: 'row', lg: 'column-reverse' },
            justifyContent: 'center',
            width: { md: 'unset', lg: '100%' },
            gap: '1rem',
          }}
        >
          <Button
            id="no-metamask-installed_button_go-back"
            variant="text"
            sx={{
              whiteSpace: 'nowrap',
              width: { md: 'auto', lg: '100%' },
            }}
            onClick={handleGoBack}
          >
            Go back
          </Button>
          <Button
            id="no-metamask-installed_button_install"
            sx={{
              width: { md: 'auto', lg: '100%' },
            }}
            variant="outlined"
            startIcon={<IconFactory name="Metamask" />}
          >
            <a
              target="_blank"
              href="https://metamask.io/download/"
              rel="noreferrer"
            >
              Install MetaMask
            </a>
          </Button>
        </Box>
      </div>
    </Modal>
  )
}

export default NoMetamaskInstalledModal
