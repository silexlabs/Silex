// Set up global polyfills for JSDOM environment
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock canvas for GrapesJS
const mockCanvas = {
  getContext: () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Array(4) }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  }),
  toDataURL: () => '',
  addEventListener: () => {},
  removeEventListener: () => {},
  width: 0,
  height: 0,
};

// Mock HTMLCanvasElement
global.HTMLCanvasElement = function() {
  return mockCanvas;
};

// Mock other canvas-related methods
global.createCanvas = () => mockCanvas;
global.Image = function() {
  this.onload = () => {};
  this.onerror = () => {};
  this.src = '';
  this.width = 0;
  this.height = 0;
};

// Canvas is now mocked via moduleNameMapper in jest config

// Suppress canvas-related console warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args.join(' ');
  if (!message.includes('canvas') && !message.includes('Canvas')) {
    originalConsoleWarn(...args);
  }
};