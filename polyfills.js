// Buffer polyfill for React Native and Web
import { Buffer } from 'buffer';

// Make Buffer available globally
global.Buffer = Buffer;

// Also ensure window.Buffer exists for web environments
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}
