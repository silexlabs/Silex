import { Font } from './types'
import { Constants } from '../../constants'
import {setFonts} from './dom'

const FONT1: Font = {
  family: 'font1 family',
  href: 'font1 href',
}

const FONT2: Font = {
  family: 'font2 family',
  href: 'font2 href',
}

beforeAll(() => {
  document.write(`<html><head></head><body></body></html>`)
})

test('add font', () => {
  setFonts(document, [FONT1])
  const font1El = document.querySelector(`link[href='${FONT1.href}']`)
  expect(font1El).not.toBeNull()
  expect(font1El.className).toBe(Constants.CUSTOM_FONTS_CSS_CLASS)
})

test('remove font', () => {
  setFonts(document, [FONT1])
  setFonts(document, [FONT2])
  const font1El = document.querySelector(`link[href='${FONT1.href}']`)
  const font2El = document.querySelector(`link[href='${FONT2.href}']`)
  expect(font2El).not.toBeNull()
  expect(font1El).toBeNull()
})

test('update font url', () => {
  setFonts(document, [FONT1])
  setFonts(document, [{
    ...FONT1,
    href: 'new href',
  }])
  const font1El = document.querySelector(`link[href='${FONT1.href}']`)
  const font1ElNew = document.querySelector(`link[href='new href']`)
  expect(font1ElNew).not.toBeNull()
  expect(font1El).toBeNull()
})

test('update font name', () => {
  setFonts(document, [FONT1])
  setFonts(document, [{
    ...FONT1,
    family: 'new family',
  }])
  const font1Els = document.querySelectorAll(`link[href='${FONT1.href}']`)
  expect(font1Els).toHaveLength(1)
})

