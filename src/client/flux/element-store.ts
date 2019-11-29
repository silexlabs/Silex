import { SelectableState,  } from '../../../node_modules/drag-drop-stage-component/src/ts/Types'
import { SilexType, SilexId } from '../../Constants'

export interface ElementData {
  pageNames: string[],
  classes: string[],
  type: SilexType,
  id: SilexId,
  idx: number,
  parentId: SilexId,
  enableDrag: boolean,
  enableDrop: boolean,
  enableResize: boolean,
}
export enum ElementAction {
  INITIALIZE = 'ELEMENT_INITIALISE',
  CREATE = 'ELEMENT_CREATE',
  DELETE = 'ELEMENT_DELETE',
  UPDATE = 'ELEMENT_UPDATE',
}

export const elementReducer = (state: ElementData[] = [], action: any): any => {
  switch (action.type) {
    default: return state
  }
}
