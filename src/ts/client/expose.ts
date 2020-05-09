
// Expose the API to JS
// TODO: expose file, copy, element, undo, page, view,
export function exposeModule(win: Window, obj: any) {
  // tslint:disable
  win['silex'] = {
    ...win['silex'],
    ...obj,
  }
}

