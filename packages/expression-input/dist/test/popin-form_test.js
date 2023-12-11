import { PopinForm } from '../popin-form';
import { fixture, assert } from '@open-wc/testing';
import { html } from 'lit/static-html.js';
suite('popin-form', () => {
    test('is defined', () => {
        const el = document.createElement('popin-form');
        assert.instanceOf(el, PopinForm);
    });
    test('renders with default values', async () => {
        const el = await fixture(html `<popin-form></popin-form>`);
        assert.shadowDom.equalSnapshot(el);
    });
    test('renders with a set HTML body', async () => {
        var _a;
        //const el = await fixture(html`<popin-form><div slot="body">Test body</div>Test default</popin-form>`)
        const el = await fixture(html `<popin-form><head id="test">Test default</head></popin-form>`);
        const slot = (_a = el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('slot.default');
        const nodes = slot.assignedNodes();
        assert.equal(nodes.length, 1);
        assert.equal(nodes[0].textContent, 'Test default');
    });
    test('hides when lose focus', async () => {
        const el = await fixture(html `<popin-form><head>Test</head></popin-form>`);
        el.focus();
        el.blur();
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.equal(getComputedStyle(el).display, 'none');
        assert.equal(el.hasAttribute('hidden'), true);
    });
    test('do not hide when lose focus with autoclose set to false', async () => {
        const el = await fixture(html `<popin-form no-auto-close><head>Test</head></popin-form>`);
        el.focus();
        el.blur();
        await new Promise(resolve => setTimeout(resolve, 0));
        assert.notEqual(getComputedStyle(el).display, 'none');
    });
    test('hides when hidden attribute is set', async () => {
        const el = await fixture(html `<popin-form hidden><head>Test</head></popin-form>`);
        assert.equal(getComputedStyle(el).display, 'none');
    });
});
//# sourceMappingURL=popin-form_test.js.map