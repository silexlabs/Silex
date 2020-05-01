import { Constants } from '../../constants'
import { SilexNotification } from '../utils/Notification'
import { UiState, LOADING } from './types'
import { getCurrentPage } from '../page-store/filters';
import { getSite } from '../site-store/index'
import { getSiteIFrame, getSiteWindow } from '../components/SiteFrame';
import { openPageDom } from '../page-store/dom';

export function onChangeUi(prev: UiState, ui: UiState) {
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
      break
    case LOADING.WEBSITE:
      getSiteIFrame().classList.add(Constants.LOADING_SITE_CSS_CLASS)
      break
    default:
      getSiteIFrame().classList.remove(Constants.LOADING_SITE_CSS_CLASS)
      document.body.classList.remove(Constants.LOADING_SILEX_CSS_CLASS)
  }

  openPageDom(getSiteWindow(), getCurrentPage())
}
