import {
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material'
import { useFutureverse } from '../../providers'
import { Typography, Button, IconFont } from '../index'

type Props = {
  onOkClick: () => void
}

function UnsupportedNetwork({ onOkClick }: Props): JSX.Element {
  const { CONSTANTS } = useFutureverse()
  const Trn = CONSTANTS.CHAINS.TRN
  return (
    <StyledCard
      id="unsupported-network_card"
      variant="outlined"
      sx={{
        overflowY: 'scroll',
      }}
    >
      <Typography
        variant="h3"
        sx={{
          marginBlockEnd: '2rem',
        }}
        textAlign="center"
      >
        What the FuturePass?!
      </Typography>
      <Section variant="body2" color="secondary.light" textAlign="center">
        The wallet you tried to connect with does not support The Root Network
        which is required to use this experience.
      </Section>
      <Section variant="body2" color="secondary.light" textAlign="center">
        Please see if you can add it as a custom network or use a different
        wallet.
      </Section>
      <Accordion
        sx={{
          background: 'none',
          marginBottom: '20px',
        }}
      >
        <AccordionSummary>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Root Network Information
            </Typography>
            <IconFont name="info" fontSize={16} color="text.secondary" />
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Add in the following information to manually add the network:
            </Typography>
            {/* TODO: confirmation information is correct once config PR is merged */}
            <div>
              <Typography variant="body1" color="text.secondary">
                {`Network name: `}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {Trn.name}
              </Typography>
            </div>

            <div>
              <Typography variant="body1" color="text.secondary">
                {`Network RPC URL: `}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {Trn.rpcUrls.default.http}
              </Typography>
            </div>

            <div>
              <Typography variant="body1" color="text.secondary">
                {`Chain ID: `}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {Trn.id}
              </Typography>
            </div>

            <div>
              <Typography variant="body1" color="text.secondary">
                {`Currency symbol: `}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {Trn.nativeCurrency.symbol}
              </Typography>
            </div>

            <div>
              <Typography variant="body1" color="text.secondary">
                {`Currency decimals: `}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {Trn.nativeCurrency.decimals}
              </Typography>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
      <Button
        id="unsupported-network_button"
        variant="outlined"
        onClick={onOkClick}
        sx={{
          width: '50%',
        }}
      >
        Ok
      </Button>
    </StyledCard>
  )
}

export default UnsupportedNetwork

const StyledCard = styled(Card)(({ theme }) => ({
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 8,

  [theme.breakpoints.up('md')]: {
    width: 648,
    padding: 48,
  },
}))

const Section = styled(Typography)({
  marginBottom: 20,
})
