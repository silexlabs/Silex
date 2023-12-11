import { StepsSelectorItem } from '../steps-selector-item';
import { fixture, assert } from '@open-wc/testing';
import { html } from 'lit/static-html.js';
suite('Steps selector item', () => {
    test('is defined', () => {
        const el = document.createElement('steps-selector-item');
        assert.instanceOf(el, StepsSelectorItem);
    });
    test('renders with default values', async () => {
        var _a, _b, _c, _d, _e, _f, _g;
        const shadowRoot = (await fixture(html `<steps-selector-item></steps-selector-item>`)).shadowRoot;
        assert.equal((_a = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="icon"]')) === null || _a === void 0 ? void 0 : _a.assignedNodes().length, 0);
        assert.equal((_b = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="name"]')) === null || _b === void 0 ? void 0 : _b.assignedNodes().length, 0);
        assert.equal((_c = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="tags"]')) === null || _c === void 0 ? void 0 : _c.assignedNodes().length, 0);
        assert.equal((_d = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="type"]')) === null || _d === void 0 ? void 0 : _d.assignedNodes().length, 0);
        assert.equal((_e = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="errorText"]')) === null || _e === void 0 ? void 0 : _e.assignedNodes().length, 0);
        assert.equal((_f = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="edit-options-button"]')) === null || _f === void 0 ? void 0 : _f.assignedNodes().length, 0);
        assert.isTrue(((_g = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="edit-options-button"]')) === null || _g === void 0 ? void 0 : _g.childNodes.length) > 1); // > 1 because of it has text nodes in addintion to the default svg
    });
    test('renders with a set HTML body', async () => {
        var _a, _b, _c, _d, _e, _f;
        const el = await fixture(html `
      <steps-selector-item>
        <div slot="icon">Test icon</div>
        <div slot="name">Test name</div>
        <div slot="tags"><ul><li>Test tag</li></ul></div>
        <div slot="values"><ul><li>Test value</li></ul></div>
        <div slot="helpText">Test help text</div>
        <div slot="errorText">Test error text</div>
      </steps-selector-item>
    `);
        const shadowRoot = el.shadowRoot;
        assert.equal((_a = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="icon"]')) === null || _a === void 0 ? void 0 : _a.assignedNodes()[0].textContent, 'Test icon');
        assert.equal((_b = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="name"]')) === null || _b === void 0 ? void 0 : _b.assignedNodes()[0].textContent, 'Test name');
        assert.equal((_c = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="tags"]')) === null || _c === void 0 ? void 0 : _c.assignedNodes()[0].textContent, 'Test tag');
        assert.equal((_d = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="errorText"]')) === null || _d === void 0 ? void 0 : _d.assignedNodes()[0].textContent, 'Test error text');
        assert.equal((_e = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="edit-options-button"]')) === null || _e === void 0 ? void 0 : _e.assignedNodes().length, 0);
        assert.isTrue(((_f = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="edit-options-button"]')) === null || _f === void 0 ? void 0 : _f.childNodes.length) > 1); // > 1 because of it has text nodes in addintion to the default svg
    });
    test('hide edit options button when no-options-editor attribute is set', async () => {
        const el = await fixture(html `<steps-selector-item no-options-editor></steps-selector-item>`);
        const shadowRoot = el.shadowRoot;
        // Make sure that everything is normal
        assert.isNotNull((shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="icon"]')));
        // Then check that the edit options button is not there
        assert.isNull((shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('slot[name="edit-options-button"]')));
    });
});
//# sourceMappingURL=steps-selector-item_test.js.map