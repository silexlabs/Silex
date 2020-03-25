import { ElementData, ElementType } from '../element/types'
import { addElement, selectBody } from '../element/dispatchers'
import { getDomElement } from '../element/dom'
import { deleteElements } from '../element/store'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { SilexNotification } from '../utils/Notification'
import { setImageUrl } from '../element/dom'
import { getSiteDocument } from '../ui/UiElements'

/**
 * open file explorer, choose an image and add it to the stage
 */
export function browseAndAddImage(parent: ElementData) {
  // this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
  FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
  .then((fileInfo) => {
    if (fileInfo) {
      // undo checkpoint
      //   //  this.undoCheckPoint();

      // create the element
      const [imgData, parentData] = addElement(ElementType.IMAGE, parent);
      const img = getDomElement(getSiteDocument(), imgData);

      // load the image
      // FIXME: src should be set with flux
      setImageUrl(img, fileInfo.absPath, (element, imgElement) => {
          // this.tracker.trackAction('controller-events', 'success', 'insert.image', 1);
        },
        (element: HTMLElement, message: string) => {
          SilexNotification.notifyError('Error: I did not manage to load the image. \n' + message);
          deleteElements([imgData]);
          // this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
        },
      );
    }
  })
  .catch((error) => {
    SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
    // this.tracker.trackAction('controller-events', 'error', 'insert.image', -1);
  });
}
