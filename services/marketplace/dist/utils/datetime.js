"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDatetimeString = toDatetimeString;
/** ISO datetime string without milliseconds, e.g. 2026-02-07T01:32:37Z */
function toDatetimeString(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
