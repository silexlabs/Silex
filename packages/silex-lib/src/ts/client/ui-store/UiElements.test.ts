import { getUiElements } from './UiElements'

beforeEach(() => {
  document.body.innerHTML = `
    <iframe src="about:blank" id="silex-stage-iframe"></iframe>
    <iframe src="about:blank" id="silex-file-explorer"></iframe>
    <div class="silex-context-menu"></div>
    <div class="silex-menu"></div>
    <div class="silex-bread-crumbs"></div>
    <div class="silex-page-tool"></div>
    <div class="silex-html-editor"></div>
    <div class="silex-css-editor"></div>
    <div class="silex-js-editor"></div>
    <div class="silex-settings-dialog"></div>
    <div class="silex-dashboard"></div>
    <div class="silex-property-tool"></div>
    <div class="silex-text-format-bar"></div>
    <div class="silex-workspace"></div>
    <div class="vertical-splitter"></div>
  `
})

test('get all ui elements', () => {
  expect(getUiElements()).toMatchSnapshot()
})
