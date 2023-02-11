"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HostingUnifile {
    constructor(unifile, config) {
        this.unifile = unifile;
        this.config = config;
    }
    getOptions(session) {
        return {
            name: 'unifile',
            displayName: 'Choose a folder',
            isLoggedIn: true,
            authorizeUrl: null,
            dashboardUrl: null,
            pleaseCreateAVhost: null,
            vhostsUrl: null,
            buyDomainUrl: null,
            skipVhostSelection: true,
            skipFolderSelection: false,
            afterPublishMessage: null,
        };
    }
    finalizePublication(context, onStatus) {
        return Promise.resolve();
    }
    // prevent replace index.html with ./
    getPageLink(pageUrl, context) {
        return pageUrl;
    }
    getDefaultPageFileName(context) {
        return 'index.html';
    }
}
exports.default = HostingUnifile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9zdGluZ1VuaWZpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdHMvc2VydmVyL2hvc3RpbmctcHJvdmlkZXIvSG9zdGluZ1VuaWZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxNQUFxQixjQUFjO0lBQ2pDLFlBQXNCLE9BQU8sRUFBWSxNQUFjO1FBQWpDLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFBWSxXQUFNLEdBQU4sTUFBTSxDQUFRO0lBQUcsQ0FBQztJQUMzRCxVQUFVLENBQUMsT0FBTztRQUNoQixPQUFPO1lBQ0wsSUFBSSxFQUFFLFNBQVM7WUFDZixXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsSUFBSTtZQUNsQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLG1CQUFtQixFQUFFLEtBQUs7WUFDMUIsbUJBQW1CLEVBQUUsSUFBSTtTQUMxQixDQUFBO0lBQ0gsQ0FBQztJQUVELG1CQUFtQixDQUFDLE9BQU8sRUFBRSxRQUFRO1FBQ25DLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQzFCLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsV0FBVyxDQUFDLE9BQWUsRUFBRSxPQUF1QjtRQUNsRCxPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0lBRUQsc0JBQXNCLENBQUMsT0FBTztRQUM1QixPQUFPLFlBQVksQ0FBQTtJQUNyQixDQUFDO0NBQ0Y7QUE5QkQsaUNBOEJDIn0=