// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// 1. MOCK SOCKET.IO
// We fake the socket connection so tests don't try to hit port 5001
jest.mock('./utils/socket', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
}));

// 2. MOCK LEAFLET (The Map)
// Maps are hard to render in a test console, so we replace them with a dummy div
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => <div></div>,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>
}));

// 3. MOCK NAVIGATOR (Geolocation)
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn()
};
global.navigator.geolocation = mockGeolocation;

// 4. MOCK TEXT ENCODER (Fixes a common Jest bug in JSDOM environment)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;