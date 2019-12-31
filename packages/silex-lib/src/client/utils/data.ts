import { DataModel } from '../../types';
import { crudIdKey } from '../flux/crud-store';

const withCrudId = (arr: any[]) => arr.map((item) => ({
  ...item,
  [crudIdKey]: Symbol(),
}))

export const dataModelFromJson = (json: any): DataModel => ({
  site: json.site,
  elements: withCrudId(json.elements).map((el) => ({
    ...el,
    selected: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
  })),
  pages: withCrudId(json.pages).map((p) => ({
    ...p,
    opened: false, // do not keep selection, this is also done when saving  @see WebsiteRouter
  })),
})
