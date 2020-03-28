import { Constants } from '../../constants'
import { UiData, LOADING } from './types'
import { getSite } from '../site/store'
import { SilexNotification } from '../utils/Notification'
import { getSiteIFrame } from '../components/SiteFrame'
import { setEditMode, hideScrolls } from '../components/StageWrapper'

export function onChangeUi(prev: UiData, ui: UiData) {
  if (ui.mobileEditor) {
    document.body.classList.add(Constants.MOBILE_MODE_CSS_CLASS)
    if (!getSite().enableMobile) {
      SilexNotification.alert('Mobile editor warning', `
        Warning: you are entering the mobile editor, but your website is not configured to support it,
        so you need to open the menu "File", then "Settings" and "Enable mobile version".
      `, () => {})
    }
  } else {
    document.body.classList.remove(Constants.MOBILE_MODE_CSS_CLASS)
  }

  switch (ui.loading) {
    case LOADING.SILEX:
      document.body.classList.add(Constants.LOADING_SILEX_CSS_CLASS)
      setEditMode(false)
      hideScrolls(true)
      break
    case LOADING.WEBSITE:
      getSiteIFrame().classList.add(Constants.LOADING_SITE_CSS_CLASS)
      setEditMode(false)
      hideScrolls(true)
      break
    default:
      getSiteIFrame().classList.remove(Constants.LOADING_SITE_CSS_CLASS)
      document.body.classList.remove(Constants.LOADING_SILEX_CSS_CLASS)
      setEditMode(true)
      hideScrolls(false)
  }
}
