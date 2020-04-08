import { PageData } from '../page/types';
import { getUi, updateUi } from './store';

export const openPage = (item: PageData) => updateUi({
  ...getUi(),
  currentPageId: item.id,
})
