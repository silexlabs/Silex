import { PageState } from '../page-store/types';
import { getUi, updateUi } from './index';
import { store } from '../store/index'

export const openPage = (item: PageState, ui = getUi(), dispatch = store.dispatch) => updateUi({
  ...ui,
  currentPageId: item.id,
}, dispatch)
