import * as objectPath from '../../../node_modules/object-path/index.js';
import { DataSources, SiteData } from '../site/types';
import { getData } from '../flux/store';
import { getSiteDocument } from '../ui/UiElements';
import { setDescription, setDescriptionSocial, setEnableMobile, setFaviconPath, setFonts, setHeadScript, setHeadStyle, setLang, setThumbnailSocialPath, setTitle, setTitleSocial, setTwitterSocial, setWebsiteWidth, writeDataToDom, setStyle } from '../site/dom';
import { SilexNotification } from '../utils/Notification';
import { getBody } from '../element/filters';
import { updateElements } from '../element/store'

export function onChangeSite(prev: SiteData, site: SiteData) {
  const doc = getSiteDocument()
  // here headUser is not needed because we do not want it in the dom, it will be injected at save on the server side
  if (!prev || prev.headStyle !== site.headStyle) { setHeadStyle(doc, site.headStyle) }
  if (!prev || prev.headScript !== site.headScript) { setHeadScript(doc, site.headScript) }
  if (!prev || prev.title !== site.title) { setTitle(doc, site.title) }
  if (!prev || prev.description !== site.description) { setDescription(doc, site.description) }
  if (!prev || prev.enableMobile !== site.enableMobile) { setEnableMobile(doc, site.enableMobile) }
  if (!prev || prev.faviconPath !== site.faviconPath) { setFaviconPath(doc, site.faviconPath) }
  if (!prev || prev.thumbnailSocialPath !== site.thumbnailSocialPath) { setThumbnailSocialPath(doc, site.thumbnailSocialPath) }
  if (!prev || prev.descriptionSocial !== site.descriptionSocial) { setDescriptionSocial(doc, site.descriptionSocial) }
  if (!prev || prev.titleSocial !== site.titleSocial) { setTitleSocial(doc, site.titleSocial) }
  if (!prev || prev.lang !== site.lang) { setLang(doc, site.lang) }
  if (!prev || prev.twitterSocial !== site.twitterSocial) { setTwitterSocial(doc, site.twitterSocial) }
  if (!prev || prev.dataSources !== site.dataSources) { loadDataSources(site.dataSources, true) }
  if (!prev || prev.fonts !== site.fonts) { setFonts(doc, site.fonts) }
  if (!prev || prev.width !== site.width) {
    // store a style to all section containers
    // TODO: set a min-width to all sections instead
    setWebsiteWidth(doc, site.width)
    // set a minimum width to the body
    // TODO: is this useful?
    const body = getBody()
    if (body) { // FIXME: (!body) happens at start of Silex but it should not?
      updateElements([{
        from: body,
        to: {
          ...body,
          style: {
            ...body.style,
            desktop: {
              ...body.style.desktop,
              'min-width': site.width + 'px',
            },
          },
        },
      }])
    }
  }
  if(!prev || prev.prodotypeDependencies !== site.prodotypeDependencies) {
    const head = getSiteDocument().head
    // remove all dependencies
    Array.from(head.querySelectorAll('[data-dependency]'))
      .forEach((tag: HTMLElement) => tag.remove())

    // and add them back
    // prodotypeDependencies is the object returned by getDependencies: {
    //   "test-comp":
    //     [{
    //         "script": [{
    //             "src": "https://code.jquery.com/jquery-2.1.4.min.js"
    //         }],
    //         "link": [{
    //             "rel": "stylesheet",
    //             "href": "https://cdnjs.cloudflare.com/ajax/libs/unslider/2.0.3/css/unslider.css"
    //         }]
    //     }]
    //   }
    //  }
    Object.keys(site.prodotypeDependencies)
    .forEach((compName) => {
      const deps = site.prodotypeDependencies[compName]
      deps.forEach((depObj) => {
        Object.keys(depObj)
        .forEach((tagName) => {
          const dep = depObj[tagName]
          dep.forEach((depTagObj) => {
            const el = doc.createElement(tagName)
            el.setAttribute('data-dependency', '');
            Object.keys(depTagObj)
            .forEach((attrName) => {
              el.setAttribute(attrName, depTagObj[attrName])
            })
            head.appendChild(el);
          })
        })
      })
    })
  }
  if(!prev || prev.style !== site.style) {
    const head = getSiteDocument().head

    // remove all dependencies
    Array.from(head.querySelectorAll('[data-style-id]'))
      .forEach((tag: HTMLElement) => tag.remove())

    // and add them back
    Object.keys(site.style)
    .forEach((className) => {
      const styleData = site.style[className]
      Object.keys(styleData)
      .forEach((visibility) => {
        const visibilityData = styleData[visibility]
        Object.keys(visibilityData)
        .forEach((pseudoClassName) => {
          const pseudoClassData = visibilityData[pseudoClassName]
          setStyle(className, pseudoClassName, visibility, pseudoClassData, styleData.displayName)
        })
      })

    })
  }
  // save data to the dom for front-end.js
  writeDataToDom(doc, getData())
}

async function loadDataSources(dataSources: DataSources, reload): Promise<DataSources> {
  try {
    const dataSourcesClone = { ...dataSources };
    return (await Promise.all(Object.keys(dataSourcesClone).map(async (name) => {
      const dataSource = dataSourcesClone[name];
      if (reload || !dataSource.data || !dataSource.structure) {
        const res = await fetch(dataSource.href);
        const data = await res.json();
        const root = objectPath.get(data, dataSource.root);
        const first = objectPath.get(root, '0');
        dataSource.data = data;
        dataSource.structure = {};
        if (first) {
          Object.keys(first).forEach((key) => dataSource.structure[key] = getDataSourceType(first[key]));
        }
        return {name, dataSource};
      }
    }))).reduce((prev, cur) => prev[cur.name] = cur.dataSource, {});
  } catch (err) {
    console.error('could not load data sources', err);
    SilexNotification.alert('Error', `There was an error loading the data sources: ${err}`, () => { throw err; });
  }
}
function getDataSourceType(value) {
  return Array.isArray(value) ? 'array' : typeof(value);
}
