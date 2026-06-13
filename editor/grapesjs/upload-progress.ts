import { Editor } from 'grapesjs'

export default function pluginUploadProgress(editor: Editor) {
  const assetManager = editor.AssetManager
  const barIntervals = new WeakMap<HTMLDivElement, number>()

  editor.on('asset:upload:start', () => {
    const header = document.querySelector('.gjs-am-assets-header') as HTMLDivElement | null
    if (!header || header.querySelector('.gjs-upload-bar')) return

    const bar = document.createElement('div')
    bar.className = 'gjs-upload-bar'
    bar.style.cssText = `
      height: 4px;
      background: #28a745;
      width: 0%;
      margin-top: 4px;
      transition: width 0.2s ease;
    `
    header.appendChild(bar)

    let percent = 0
    const interval = setInterval(() => {
      percent = Math.min(percent + Math.random() * 10, 95)
      bar.style.width = `${percent}%`
    }, 200)

    barIntervals.set(bar, interval as unknown as number)
  })

  const cleanup = (success = true) => {
    const bar = document.querySelector('.gjs-upload-bar') as HTMLDivElement | null
    if (!bar) return

    const interval = barIntervals.get(bar)
    if (interval) {
      clearInterval(interval)
      barIntervals.delete(bar)
    }

    if (!success) bar.style.background = '#dc3545'
    bar.style.width = '100%'
    setTimeout(() => bar.remove(), success ? 1000 : 2000)
  }

  editor.on('asset:upload:end', () => cleanup(true))
  editor.on('asset:upload:error', () => cleanup(false))
}
