import { useTranslation } from 'react-i18next'

export default function UnsupportedBrowser() {
  const { t: translate } = useTranslation()
  // TODO: add content based on upcoming designs
  return (
    <div id="unsupported-browser" className="unsupported-browser">
      {translate('unsupported-browser.unsupported-browser__text')}
    </div>
  )
}
