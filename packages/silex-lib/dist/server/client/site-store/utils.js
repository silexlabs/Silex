"use strict";
/**
 * @fileoverview Utilities to manupulate site data
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPseudoClassData = void 0;
const constants_1 = require("../../constants");
/**
 * build an array of all the data we provide to Prodotype for the "text"
 * template
 */
function getPseudoClassData(styleData) {
    // return all pseudo classes in all visibility object
    // flatten
    // build an object for each pseudoClass
    // build an object for each existing visibility
    return constants_1.Constants.STYLE_VISIBILITY
        .map((visibility) => {
        return {
            visibility,
            data: styleData.styles[visibility],
        };
    })
        .filter((obj) => !!obj.data)
        .map((vData) => {
        const arrayOfPCData = [];
        for (const pcName in vData.data) {
            arrayOfPCData.push({
                visibility: vData.visibility,
                pseudoClass: pcName,
                /* unused, the data is in data */
                data: vData.data[pcName],
            });
        }
        return arrayOfPCData;
    })
        .reduce((acc, val) => acc.concat(val), []);
}
exports.getPseudoClassData = getPseudoClassData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvY2xpZW50L3NpdGUtc3RvcmUvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBR0gsK0NBQTJDO0FBRTNDOzs7R0FHRztBQUNILFNBQWdCLGtCQUFrQixDQUFDLFNBQW9CO0lBQ3JELHFEQUFxRDtJQUNyRCxVQUFVO0lBQ1YsdUNBQXVDO0lBQ3ZDLCtDQUErQztJQUMvQyxPQUFPLHFCQUFTLENBQUMsZ0JBQWdCO1NBQ2hDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1FBQ2xCLE9BQU87WUFDTCxVQUFVO1lBQ1YsSUFBSSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1NBQ25DLENBQUE7SUFDSCxDQUFDLENBQUM7U0FDRCxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1NBQzNCLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ2IsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFBO1FBQ3hCLEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtZQUMvQixhQUFhLENBQUMsSUFBSSxDQUFDO2dCQUNqQixVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLFdBQVcsRUFBRSxNQUFNO2dCQUNuQixpQ0FBaUM7Z0JBQ2pDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQzthQUN6QixDQUFDLENBQUE7U0FDSDtRQUNELE9BQU8sYUFBYSxDQUFBO0lBQ3RCLENBQUMsQ0FBQztTQUNELE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDNUMsQ0FBQztBQTFCRCxnREEwQkMifQ==