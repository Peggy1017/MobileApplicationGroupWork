/**
 * Jest Preset Configuration
 * This file sets up global mocks BEFORE any modules are imported
 * Fixes Expo Winter runtime issues
 */

// CRITICAL: These must be set before ANY imports
// Mock TextDecoder and TextEncoder
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = class TextDecoder {
        decode(input) {
            if (typeof input === 'string') return input;
            return String.fromCharCode.apply(null, new Uint8Array(input));
        }
    };
}

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = class TextEncoder {
        encode(input) {
            const utf8 = [];
            for (let i = 0; i < input.length; i++) {
                let charcode = input.charCodeAt(i);
                if (charcode < 0x80) utf8.push(charcode);
                else if (charcode < 0x800) {
                    utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
                } else {
                    utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
                }
            }
            return new Uint8Array(utf8);
        }
    };
}

if (typeof global.TextDecoderStream === 'undefined') {
    global.TextDecoderStream = class TextDecoderStream {};
}

if (typeof global.TextEncoderStream === 'undefined') {
    global.TextEncoderStream = class TextEncoderStream {};
}

// Mock structuredClone - required by Expo Winter
if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = function structuredClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    };
}

// Mock __ExpoImportMetaRegistry - this is the key fix
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
    global.__ExpoImportMetaRegistry = new Map();
}

// Also mock on window if it exists
if (typeof window !== 'undefined') {
    if (typeof window.__ExpoImportMetaRegistry === 'undefined') {
        window.__ExpoImportMetaRegistry = new Map();
    }
    if (typeof window.TextDecoder === 'undefined') {
        window.TextDecoder = global.TextDecoder;
    }
    if (typeof window.TextEncoder === 'undefined') {
        window.TextEncoder = global.TextEncoder;
    }
    if (typeof window.TextDecoderStream === 'undefined') {
        window.TextDecoderStream = global.TextDecoderStream;
    }
    if (typeof window.TextEncoderStream === 'undefined') {
        window.TextEncoderStream = global.TextEncoderStream;
    }
    if (typeof window.structuredClone === 'undefined') {
        window.structuredClone = global.structuredClone;
    }
}

module.exports = {};
