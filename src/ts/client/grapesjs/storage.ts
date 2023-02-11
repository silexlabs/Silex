import { WebsiteData } from '../../types'

export default function(editor, opts) {
  // add symbols to the website
  editor.on('storage:start:store', (data: WebsiteData) => {
    data.files = editor.Pages.getAll().map(page => {
      const component = page.getMainComponent()
      return {
        html: editor.getHtml({ component }),
        css: editor.getCss({ component })
      }
    })
    console.log('storage:start:store', data)
  })

//   const { Storage } = editor;
//
//   Storage.add('remote-local', {
//     async store(data, success, error) {
//       console.log('store store', arguments)
//       const localStorage = Storage.get('local');
//       const { local } = Storage.getConfig().options
//       await localStorage.store(data, null, { key: `gjsProject-zzzzzzzzzzzz` });
//       const remoteStorage = Storage.get('remote');
//       await remoteStorage.store(data, Storage.getConfig().options.remote);
//     },
//
//     async load() {
//       console.log('load')
//       try {
//         const remoteStorage = Storage.get('remote');
//         const localStorage = Storage.get('local');
//         console.log(await local)
//         return await localStorage.load(Storage.getConfig().options.local) ||
//           await remoteStorage.load(Storage.getConfig().options.remote);
//       } catch (err) {
//         console.error(err)
//         error(err)
//       }
//     },
//   });
}
