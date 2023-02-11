"use strict";
/**
 * @fileoverview Cross platform, it needs to run client and server side
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeDataToDom = void 0;
const constants_1 = require("../../constants");
/**
 * write elements and pages data to the dom for the components and scripts to use
 */
function writeDataToDom(doc, data) {
    let tag = doc.querySelector('.' + constants_1.Constants.JSON_STYLE_TAG_CLASS_NAME);
    if (!tag) {
        tag = doc.createElement('script');
        tag.classList.add(constants_1.Constants.JSON_STYLE_TAG_CLASS_NAME);
    }
    // prevent from beeing deactivated in WebsiteRouter
    tag.setAttribute(constants_1.Constants.STATIC_ASSET_ATTR, '');
    // set its content
    tag.innerHTML = `
    window.silex = window.silex || {}
    window.silex.data = ` + JSON.stringify({
        site: {
            width: data.site.width,
        },
        pages: data.pages,
    });
    // always insert as first child before all scripts
    tag.type = 'text/javascript';
    doc.head.insertBefore(tag, doc.head.firstChild);
}
exports.writeDataToDom = writeDataToDom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9zdG9yZS9kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFHSCwrQ0FBMkM7QUFFM0M7O0dBRUc7QUFDSCxTQUFnQixjQUFjLENBQUMsR0FBaUIsRUFBRSxJQUFvQjtJQUNwRSxJQUFJLEdBQUcsR0FBc0IsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEdBQUcscUJBQVMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0lBQ3pGLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDUixHQUFHLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNqQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBUyxDQUFDLHlCQUF5QixDQUFDLENBQUE7S0FDdkQ7SUFDRCxtREFBbUQ7SUFDbkQsR0FBRyxDQUFDLFlBQVksQ0FBQyxxQkFBUyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ2pELGtCQUFrQjtJQUNsQixHQUFHLENBQUMsU0FBUyxHQUFHOzt5QkFFTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkMsSUFBSSxFQUFFO1lBQ0osS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSztTQUN2QjtRQUNELEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztLQUVsQixDQUFDLENBQUE7SUFDRixrREFBa0Q7SUFDbEQsR0FBRyxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQTtJQUM1QixHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBckJELHdDQXFCQyJ9