"use strict";
/**
 * @fileoverview Silex config available to index.pug as silex.config
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    /**
     * debug mode
     */
    debug: false,
    /**
     * Link of the menu
     */
    WIKI_SILEX: 'https://github.com/silexlabs/Silex/wiki',
    /**
     * Link in property tool dialog
     * this is also hard coded in property-tool.pug
     */
    WIKI_SILEX_CUSTOM_CSS_CLASS: 'https://github.com/silexlabs/Silex/wiki/Silex-CSS-editor#custom-css-classes',
    /**
     * Link of the menu
     */
    CROWD_FUNDING: 'http://crowdfunding.silex.me/',
    /**
     * Link of the menu
     */
    ISSUES_SILEX: 'https://github.com/silexlabs/Silex/issues?state=open',
    /**
     * Link of the menu
     */
    DOWNLOADS_TEMPLATE_SILEX: 'https://github.com/silexlabs/Silex/issues?labels=template&state=open',
    /**
     * Link of the menu
     */
    DOWNLOADS_WIDGET_SILEX: 'https://github.com/silexlabs/Silex/issues?labels=widget&state=open',
    /**
     * Link of the menu
     */
    ABOUT_SILEX_LABS: 'http://www.silexlabs.org/',
    /**
     * Link of the menu
     */
    SUBSCRIBE_SILEX_LABS: 'http://eepurl.com/F48q5',
    /**
     * Link of the menu
     */
    SOCIAL_DIASPORA: 'https://diasp.org/people/f37438103a9b013250aa2a0000053625',
    /**
     * Link of the menu
     */
    SOCIAL_TWITTER: 'http://twitter.com/silexlabs',
    /**
     * Link of the menu
     */
    SOCIAL_FB: 'http://www.facebook.com/silexlabs',
    /**
     * Link of the menu
     */
    FORK_CODE: 'https://github.com/silexlabs/Silex',
    /**
     * Link of the menu
     */
    CONTRIBUTE: 'https://github.com/silexlabs/Silex/wiki/Contribute',
    /**
     * Single site mode, skip the dashboard and get the site from the URL
     * Option to be provided by the client side
     */
    singleSiteMode: false,
    componentFolders: ['./prodotype/components'],
    /**
     * The main application menu
     */
    shortcuts: [
        {
            label: 'New File',
            id: 'file.new',
            key: 'n',
            altKey: true,
        },
        {
            label: 'Open File...',
            id: 'file.open',
            key: 'o',
            ctrlKey: true,
        },
        {
            label: 'Save File',
            id: 'file.save',
            key: 's',
            ctrlKey: true,
        },
        {
            label: 'Save As...',
            id: 'file.saveas',
            key: 's',
            ctrlKey: true,
            shiftKey: true,
        },
        /////////////////////////////////////////////////
        {
            label: 'Publish',
            id: 'file.publish',
            key: 'p',
            ctrlKey: true,
        },
        {
            label: 'Settings...',
            id: 'file.publish.settings',
            key: 'o',
            altKey: true,
        },
        {
            label: 'Move Up',
            id: 'edit.position.up',
            key: 'ArrowUp',
            modifiers: false,
            input: false,
        },
        {
            label: 'Move Down',
            id: 'edit.position.down',
            key: 'ArrowDown',
            modifiers: false,
            input: false,
        },
        {
            label: 'Move Left',
            id: 'edit.position.left',
            key: 'ArrowLeft',
            modifiers: false,
            input: false,
        },
        {
            label: 'Move Right',
            id: 'edit.position.right',
            key: 'ArrowRight',
            modifiers: false,
            input: false,
        },
        {
            label: 'Move Up in the DOM',
            id: 'edit.move.up',
            key: 'ArrowUp',
            altKey: true,
            input: false,
        },
        {
            label: 'Move Down in the DOM',
            id: 'edit.move.down',
            key: 'ArrowDown',
            altKey: true,
            input: false,
        },
        {
            label: 'Move Top',
            id: 'edit.move.to.top',
            key: 'ArrowUp',
            shiftKey: true,
            altKey: true,
            input: false,
        },
        {
            label: 'Move Bottom',
            id: 'edit.move.to.bottom',
            key: 'ArrowDown',
            shiftKey: true,
            altKey: true,
            input: false,
        },
        {
            label: 'Copy',
            id: 'edit.copy.selection',
            key: 'c',
            ctrlKey: true,
            input: false,
        },
        {
            label: 'Paste',
            id: 'edit.paste.selection',
            key: 'v',
            ctrlKey: true,
            input: false,
        },
        {
            label: 'Duplicate',
            id: 'edit.duplicate.selection',
            key: 'D',
            ctrlKey: true,
            input: false,
        },
        {
            label: 'Undo',
            id: 'edit.undo',
            key: 'z',
            ctrlKey: true,
            input: false,
        },
        {
            label: 'Redo',
            id: 'edit.redo',
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
            input: false,
        },
        {
            label: 'Delete selection',
            id: 'edit.delete.selection',
            key: 'Delete',
            input: false,
        },
        {
            label: 'Empty selection',
            id: 'edit.empty.selection',
            key: 'Escape',
            input: false,
        },
        {
            label: 'Rename page',
            id: 'edit.rename.page',
            key: 'r',
            altKey: true,
        },
        // {
        //   label: 'Delete page',
        //   id: 'edit.delete.page',
        //   key: 'p',
        //   altKey: true,
        //   shiftKey: true,
        // },
        {
            label: 'Preview',
            id: 'view.file',
            key: 'v',
            altKey: true,
        },
        {
            label: 'Preview in Responsize',
            id: 'view.file.responsize',
            key: 'v',
            shiftKey: true,
            altKey: true,
        },
        /////////////////////////////////////////////////
        {
            label: 'Mobile editor',
            id: 'tools.mobile.mode',
            key: 'm',
            altKey: true,
        },
        {
            label: 'Next tab in the property tool',
            id: 'tools.next.property',
            key: 'l',
            altKey: true,
        },
        {
            label: 'Previous tab in the property tool',
            id: 'tools.prev.property',
            key: 'l',
            shiftKey: true,
            altKey: true,
        },
        /////////////////////////////////////////////////
        {
            label: 'HTML <head> editor',
            id: 'view.open.htmlHeadEditor',
            key: 'e',
            altKey: true,
        },
        {
            label: 'JS scripts editor',
            id: 'view.open.jsEditor',
            key: 'j',
            altKey: true,
        },
        {
            label: 'CSS styles editor',
            id: 'view.open.cssEditor',
            key: 'd',
            altKey: true,
        },
        // {
        //   label: 'Open file browser',
        //   id: 'view.open.fileExplorer',
        // },
        {
            label: 'Text box',
            id: 'insert.text',
            key: 't',
            altKey: true,
        },
        {
            label: 'Image...',
            id: 'insert.image',
            key: 'i',
            altKey: true,
        },
        {
            label: 'Container',
            id: 'insert.container',
            key: 'c',
            altKey: true,
        },
        {
            label: 'HTML box',
            id: 'insert.html',
            key: 'h',
            altKey: true,
        },
        {
            label: 'Section',
            id: 'insert.section',
            key: 's',
            altKey: true,
        },
        /////////////////////////////////////////////////
        {
            label: 'New page',
            id: 'insert.page',
            key: 'p',
            altKey: true,
        },
    ],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xpZW50Q29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3RzL2NsaWVudC9DbGllbnRDb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFVSxRQUFBLE1BQU0sR0FBRztJQUVwQjs7T0FFRztJQUNILEtBQUssRUFBRSxLQUFLO0lBRVo7O09BRUc7SUFDSCxVQUFVLEVBQUUseUNBQXlDO0lBRXJEOzs7T0FHRztJQUNILDJCQUEyQixFQUFFLDZFQUE2RTtJQUUxRzs7T0FFRztJQUNILGFBQWEsRUFBRSwrQkFBK0I7SUFFOUM7O09BRUc7SUFDSCxZQUFZLEVBQUUsc0RBQXNEO0lBRXBFOztPQUVHO0lBQ0gsd0JBQXdCLEVBQUUsc0VBQXNFO0lBRWhHOztPQUVHO0lBQ0gsc0JBQXNCLEVBQUUsb0VBQW9FO0lBRTVGOztPQUVHO0lBQ0gsZ0JBQWdCLEVBQUUsMkJBQTJCO0lBRTdDOztPQUVHO0lBQ0gsb0JBQW9CLEVBQUUseUJBQXlCO0lBRS9DOztPQUVHO0lBQ0gsZUFBZSxFQUFFLDJEQUEyRDtJQUU1RTs7T0FFRztJQUNILGNBQWMsRUFBRSw4QkFBOEI7SUFFOUM7O09BRUc7SUFDSCxTQUFTLEVBQUUsbUNBQW1DO0lBRTlDOztPQUVHO0lBQ0gsU0FBUyxFQUFFLG9DQUFvQztJQUUvQzs7T0FFRztJQUNILFVBQVUsRUFBRSxvREFBb0Q7SUFFaEU7OztPQUdHO0lBQ0gsY0FBYyxFQUFFLEtBQUs7SUFDckIsZ0JBQWdCLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQztJQUU1Qzs7T0FFRztJQUNILFNBQVMsRUFBRTtRQUNUO1lBQ0UsS0FBSyxFQUFFLFVBQVU7WUFDakIsRUFBRSxFQUFFLFVBQVU7WUFDZCxHQUFHLEVBQUUsR0FBRztZQUNSLE1BQU0sRUFBRSxJQUFJO1NBQ2I7UUFDRDtZQUNFLEtBQUssRUFBRSxjQUFjO1lBQ3JCLEVBQUUsRUFBRSxXQUFXO1lBQ2YsR0FBRyxFQUFFLEdBQUc7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