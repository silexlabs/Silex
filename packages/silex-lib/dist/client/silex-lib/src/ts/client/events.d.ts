export declare enum ClientEvent {
    STARTUP_START = "silex:startup:start",/* Loading is over and Silex is starting */
    STARTUP_END = "silex:startup:end",/* Silex is ready to be used */
    GRAPESJS_START = "silex:grapesjs:start",/* GrapesJS is about to be initialized, it is time to edit config.grapesJsConfig */
    GRAPESJS_END = "silex:grapesjs:end",/* GrapesJS is ready to be used, `editor` is passed as an argument */
    PUBLICATION_UI_OPEN = "silex:publication-ui:open",/* The publication UI is opened, you can access it with { publicationUi } */
    PUBLICATION_UI_CLOSE = "silex:publication-ui:close",/* The publication UI is closed, you can access it with { publicationUi } */
    PUBLISH_BEFORE = "silex:publish:before",/* Publication is about to start, you can read+write {projectData, siteSettings} */
    PUBLISH_START = "silex:publish:start",/* Publication starts, you can read+write project data/settings, use publication manager/ui, prevent publication {projectData, siteSettings, publicationManager, prenventDefault} */
    PUBLISH_PAGE = "silex:publish:page",/* Publication of a page, read+write settings and page data, use publication manager and prevent publication { siteSettings, pageSettings, page, publicationManager, preventDefault } */
    PUBLISH_DATA = "silex:publish:data",/* Just before we send the published data to the server, read+write all publication data, check PublicationData type in types.ts { data, publicationManager } */
    PUBLISH_END = "silex:publish:end",/* Publication is over, the argument is the publication result with {success: boolean, message: string} */
    PUBLISH_ERROR = "silex:publish:error",/* Publication failed, the argument is the publication result with {success: boolean, message: string} */
    PUBLISH_LOGIN_START = "silex:publish:login:start",/* The user is about to login before publication, you can read+write connector data and use publication manager and prevent publication {connector, publicationManager, preventDefault} */
    PUBLISH_LOGIN_END = "silex:publish:login:end",
    ASSET_WRITE_END = "silex:asset:write:end",
    WRITE_END = "silex:write:end",
    SETTINGS_OPEN = "silex:settings:open",/* The settings dialog is opened */
    SETTINGS_CLOSE = "silex:settings:close",/* The settings dialog is closed */
    SETTINGS_SAVE_START = "silex:settings:save:start",/* The settings dialog is closed and the settings are about to be saved */
    SETTINGS_SAVE_END = "silex:settings:save:end",/* The settings dialog is closed and the settings are saved */
    SETTINGS_SECTION_CHANGE = "silex:settings:section-change"
}
