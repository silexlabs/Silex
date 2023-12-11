/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { StepsSelector } from '../steps-selector.js';
import { assert } from '@open-wc/testing';
suite('steps-selector', () => {
    test('is defined', () => {
        const el = document.createElement('steps-selector');
        assert.instanceOf(el, StepsSelector);
    });
});
//# sourceMappingURL=steps-selector_test.js.map