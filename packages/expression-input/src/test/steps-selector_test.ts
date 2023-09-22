/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {StepsSelector} from '../steps-selector.js';

import {fixture, assert} from '@open-wc/testing';
import {html} from 'lit/static-html.js';

suite('steps-selector', () => {
  test('is defined', () => {
    const el = document.createElement('steps-selector');
    assert.instanceOf(el, StepsSelector);
  });
});
