import { Alert, AlertColor, Snackbar, SnackbarProps } from '@mui/material'
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react'
import { IconFont } from '../components'

type GlobalSnackAlert = {
  isOpen: boolean
  openAlert: (
    message: string | React.ReactNode,
    type?: AlertColor,
    config?: SnackbarProps
  ) => void
  closeAlert: () => void
}

const GlobalSnackAlertContext = createContext<GlobalSnackAlert | null>(null)

const GlobalSnackAlertProvider: FC<PropsWithChildren> = ({ children }) => {
  const [type, setType] = useState<AlertColor>('success')
  const [openAlert, setOpenAlert] = useState(false)
  const [snackBarConfig, setSnackBarConfig] = useState<SnackbarProps>({
    anchorOrigin: {
      horizontal: 'right',
      vertical: 'top',
    },
  })
  const [alertMessage, setAlertMessage] = useState<string | React.ReactNode>()

  const handleClose = useCallback(() => {
    setOpenAlert(false)
  }, [])

  const handleOpen = useCallback(
    (
      message: string | React.ReactNode,
      _type: AlertColor = 'success',
      config?: SnackbarProps
    ) => {
      setOpenAlert(true)
      setAlertMessage(message)
      setType(_type)
      if (config) {
        setSnackBarConfig((prevConfig) => ({
          ...prevConfig,
          ...config,
        }))
      }
    },
    []
  )

  return (
    <GlobalSnackAlertContext.Provider
      value={{
        isOpen: openAlert,
        openAlert: handleOpen,
        closeAlert: handleClose,
      }}
    >
      {children}
      <Snackbar
        open={openAlert}
        ClickAwayListenerProps={{ onClickAway: () => null }}
        onClose={handleClose}
        {...snackBarConfig}
      >
        <Alert
          onClose={handleClose}
          severity={type}
          iconMapping={{
            success: <IconFont name="check_circle" fontSize={24} />,
            //Hide the 'open_in_new' icon since there is currently no link available. Keep the code in place just in case we would like to display some information later.
            info: (
              <IconFont name="open_in_new" fontSize={24} className="hidden" />
            ),
            error: <IconFont name="info" fontSize={24} />,
          }}
          variant="outlined"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </GlobalSnackAlertContext.Provider>
  )
}

export const useSnackAlert = () => {
  const value = useContext(GlobalSnackAlertContext)
  if (value == null) {
    throw new Error(`Must be used inside GlobalSnackAlertProvider`)
  }

  return value
}

export default GlobalSnackAlertProvider
