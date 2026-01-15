import React from 'react'
import { useTranslation } from 'react-i18next'
import { CreatedPayload } from 'xumm-sdk/dist/src/types'
import RoundedButton from './RoundedButton'

type XamanQrCodeProps = {
  payload: CreatedPayload
}

export default function XamanQrCode({
  payload,
}: XamanQrCodeProps): JSX.Element {
  const [showQrCode, setShowQrCode] = React.useState(!payload.pushed)

  const { t: translate } = useTranslation()

  return (
    <div
      id="xaman-qr-code"
      className="xaman-qr-code w-[375px] gap-extraLarge pl-extraLarge pr-extraLarge pb-extraLarge flex flex-col border-none h-screen justify-start md:border-[1px] md:border-colorQuaternary md:border-solid md:h-fit rounded-sm "
    >
      <h1
        id="xaman-qr-code__heading"
        className="xaman-qr-code__heading font-ObjektivMk1XBold pt-extraLarge pr-extraLarge text-fontHead"
      >
        {translate('xaman-qr-code.xaman-qr-code__heading')}
      </h1>
      {showQrCode ? (
        <div
          id="xaman-qr-code__show-qr"
          className="xaman-qr-code__show-qr container"
        >
          <div
            id="xaman-qr-code__show-qr_message"
            className="xaman-qr-code__show-qr_message font-ObjektivMk1Thin font-normal leading-[1.48] text-white text-fontMedium"
          >
            {translate('xaman-qr-code.xaman-qr-code__show-qr_message')}
          </div>
          <div className="mt-[32px]" />
          <div className="bg-[#2C49FF]">
            <img
              src={payload.refs.qr_png}
              alt="XRP QR code"
              id="xaman-qr-code__show-qr_image"
              className="xaman-qr-code__show-qr_image flex w-full bg-white rounded-lg aspect-square p-[10px] max-w-[338px]"
            />
          </div>
        </div>
      ) : (
        <div
          id="xaman-qr-code__hide-qr"
          className="xaman-qr-code__hide-qr container"
        >
          <div className="mt-[48px]" />
          <div
            id="xaman-qr-code__hide-qr_message-1"
            className="xaman-qr-code__hide-qr_message-1 font-ObjektivMk1Thin font-normal leading-[1.48] text-white text-fontMedium"
          >
            {translate('xaman-qr-code.xaman-qr-code__hide-qr_message-1')}
          </div>
          <div className="mt-[24px]" />
          <div
            id="xaman-qr-code__hide-qr_message-2"
            className="xaman-qr-code__hide-qr_message-2 ont-ObjektivMk1Thin font-normal leading-[1.48] text-white text-fontMedium"
          >
            {translate('xaman-qr-code.xaman-qr-code__hide-qr_message-2')}
          </div>

          <div className="mt-[12px]" />
          <div
            id="xaman-qr-code__hide-qr_message-3"
            className="xaman-qr-code__hide-qr_message-3 font-ObjektivMk1Thin font-normal text-fontSmall leading-[1.11]"
          >
            {translate('xaman-qr-code.xaman-qr-code__hide-qr_message-3')}
          </div>
          <div className="mt-[12px]" />
          <RoundedButton
            variant="no-border"
            onClick={() => {
              setShowQrCode(true)
            }}
            id="xaman-qr-code__hide-qr_show-qr-button"
            className="xaman-qr-code__hide-qr_show-qr-button"
          >
            {translate('xaman-qr-code.xaman-qr-code__hide-qr_show-qr-button')}
          </RoundedButton>
        </div>
      )}
    </div>
  )
}
