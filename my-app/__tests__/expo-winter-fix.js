/**
 * Expo Winter Runtime Fix
 * This file provides mocks for Expo Winter runtime to prevent scope errors in tests
 */

// Mock TextDecoderStream and TextEncoderStream if they don't exist
if (typeof global.TextDecoderStream === 'undefined') {
    global.TextDecoderStream = class TextDecoderStream {
        constructor() {}
    };
}

if (typeof global.TextEncoderStream === 'undefined') {
    global.TextEncoderStream = class TextEncoderStream {
        constructor() {}
    };
}

// Mock __ExpoImportMetaRegistry to prevent scope errors
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
    global.__ExpoImportMetaRegistry = new Map();
}

// Export empty object to satisfy module requirements
module.exports = {};
