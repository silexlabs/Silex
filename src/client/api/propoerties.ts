import { ElementType } from '../element/types';
import { FileExplorer } from '../components/dialog/FileExplorer'
import { SilexNotification } from '../utils/Notification'
import { addElementCentered } from '../element/dispatchers';
import { deleteElements } from '../element/store'
import { getDomElement, setImageUrl } from '../element/dom';
import { getSiteDocument } from '../components/SiteFrame'

/**
 * open file explorer, choose an image and add it to the stage
 */
export function browseAndAddImage(componentName: string) {
  // this.tracker.trackAction('controller-events', 'request', 'insert.image', 0);
  FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
  .then((fileInfo) => {
    if (fileInfo) {

      // create the element
      const [imgData] = addElementCentered(ElementType.IMAGE, componentName);
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
