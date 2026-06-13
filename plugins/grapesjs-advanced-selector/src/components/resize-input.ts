const MIN_WIDTH = 5

export default class ResizeInputComponent extends HTMLInputElement {
  constructor() {
    super()
    this.addEventListener('input', () => this.adjustWidth())
    this.adjustWidth()
    requestAnimationFrame(() => this.adjustWidth())
  }

  adjustWidth() {
    this.style.width = `${Math.max(this.value?.length, MIN_WIDTH)}ch`
  }

}

if (!customElements.get('resize-input')) {
  customElements.define('resize-input', ResizeInputComponent, { extends: 'input' })
}
