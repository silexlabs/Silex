import { Constants } from '../../constants'
import { Notification } from '../components/Notification'
import { UiState, LOADING } from './types'
import { getBody, getSelectedElements } from '../element-store/filters'
import { getCurrentPage } from '../page-store/filters'
import { getSite } from '../site-store/index'
import { getSiteIFrame, getSiteWindow } from '../components/SiteFrame'
import { openPageDom } from '../page-store/dom'
import { updateElements } from '../element-store/index'

export function onChangeUi(prev: UiState, ui: UiState) {
  if (ui.mobileEditor) {
    document.body.classList.add(Constants.MOBILE_MODE_CSS_CLASS)
    if (!getSite().enableMobile) {
      Notification.alert('Mobile editor warning', `
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

  if (prev && prev.currentPageId !== ui.currentPageId) {
    // open the new current page
    openPageDom(getSiteWindow(), getCurrentPage())

    // FIXME: observer should not update store
    setTimeout(() => {
      const selection = getSelectedElements()
      const toDeselect = selection
        .filter((el) => !!el.pageNames.length && !el.pageNames.includes(ui.currentPageId))
        .map((el) => ({
          ...el,
          selected: false,
        }))
      updateElements(toDeselect
        .concat(toDeselect.length === selection.length ? [{
          ...getBody(),
          selected: true,
        }] : []))
    }, 0)
  }
}
