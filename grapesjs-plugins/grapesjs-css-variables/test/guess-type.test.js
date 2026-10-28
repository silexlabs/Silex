import { test } from 'node:test'
import assert from 'node:assert'
import { guessType } from '../src/guess-type.js'

// The browser decides in the editor; this stands for it on a few values
const supports = (property, value) => property === 'color'
  ? /^(#|rgb|hsl|color-mix\(|red$|transparent$)/.test(value)
  : /^(-?[\d.]+(px|rem|%)?|calc\(.*\)|clamp\(.*\))$/.test(value)

test('guesses the type of a variable from its value', () => {
  assert.strictEqual(guessType('red', supports), 'color')
  assert.strictEqual(guessType('color-mix(in srgb, red 50%, blue)', supports), 'color')
  assert.strictEqual(guessType('clamp(1rem, 2vw, 2rem)', supports), 'size')
  assert.strictEqual(guessType('"Inter", sans-serif', supports), 'font-family')
})
