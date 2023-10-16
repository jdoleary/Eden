// This entire file is modified from https://github.com/dweidner/markdown-it-attribution/blob/master/index.js

import type Token from "../lib/markdown-it/lib/token.js";

/**
 * An enumeration of token types.
 *
 * @type {Object<string,string>}
 */
export const TokenType = {
    BLOCKQUOTE_OPEN: 'blockquote_open',
    BLOCKQUOTE_CLOSE: 'blockquote_close'
};

/**
 * Default options of the parser plugin.
 *
 * @type {Object}
 */
export const Defaults = {
    classNameContainer: 'c-blockquote',
    classNameAttribution: 'c-blockquote__attribution',
    marker: '—', // EM dash
    removeMarker: true
};




/**
 * Determine whether the given value is an integer.
 *
 * @param {*} value The value to inspect.
 * @return {Boolean}
 */
export function isInteger(value: number | string): value is number {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}

/**
 * Determine whether a given string is empty.
 *
 * @param {string} str The string to inspect.
 * @return {Boolean}
 */
export function isEmpty(str: string) {
    return !str || (str.length === 0) || (str.trim().length === 0);
}

/**
 * Determine whether the given property exists.
 *
 * @param {Object} obj The object to inspect.
 * @param {string} prop The property to test for.
 * @return {Boolean}
 */
export function has(obj: any, prop: string) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Determines whether a string begins with the characters of a another string.
 *
 * @param {string} str The string to inspect.
 * @param {string} needle The string to search for.
 * @return {Boolean}
 */
export function startsWith(str: string, needle: string) {
    return str.slice(0, needle.length) === needle;
}

/**
 * Remove whitespace from the beginning of a string.
 *
 * @param {string} str The string to trim.
 * @return {string}
 */
export function trimStart(str: string) {
    return str.replace(/^\s+/, '');
}

/**
 * Remove whitespace from the end of a string.
 *
 * @param {string} str The string to trim.
 * @return {string}
 */
export function trimEnd(str: string) {
    return str.replace(/\s+$/, '');
}

/**
 * Insert multiple items at the given index position.
 *
 * @param {Array} array The array to add items to.
 * @param {Object[]} items One or multiple items to add.
 * @param {Number} position The index position at which to add the items.
 */
export function insertAt(array: any[], items: any[], position: number) {
    for (let i = 0, l = items.length; i < l; i++) {
        array.splice(position + i, 0, items[i]);
    }
}

/**
 * Remove all items between the given indices.
 *
 * @param {Array} array The array to remove items from.
 * @param {Number} [from=0] The index to start from.
 * @param {Number} [to=array.length-1] The index at which to stop deletion.
 * @return {Number}
 */
export function remove(array: any[], from: number, to: number) {
    from = isInteger(from) ? from : 0;
    to = isInteger(to) ? to : array.length - 1;

    const amount = to - from;
    const items = array.splice(from, amount);

    return items.length;
}

/**
 * Determine whether the given object has equal property values.
 *
 * @param {Object} obj The object to inspect.
 * @param {Object} props The collection of property values to test.
 * @return {Boolean}
 */
export function matches(obj: any, props: any) {
    for (const prop in props) {
        if (has(props, prop) && (props[prop] !== obj[prop])) {
            return false;
        }
    }

    return true;
}

/**
 * Find the index of the first token that has equal property values.
 *
 * @param {MarkdownIt.Token[]} tokens A token stream to search within.
 * @param {Object<string,*>} props A collection of key<->value pairs to match against.
 * @param {Number} [position=0] The start index to start searching from.
 * @return {Number}
 */
export function findToken(tokens: Token[], props: any, position: number) {
    position = isInteger(position) ? position : 0;

    for (let i = position, l = tokens.length; i < l; i++) {
        if (matches(tokens[i], props)) {
            return i;
        }
    }

    return -1;
}

/**
 * Find the index position of a given marker in a string.
 *
 * NOTE: An attribution marker either has to be the first character of a
 * string or it has to be immediately following a soft break/line break.
 *
 * @param {string} str The string to search within.
 * @param {string} marker The marker to search for.
 * @return {Number}
 */
export function findMarker(str: string, marker: string) {
    // Return early if the paragraph starts with the marker.
    if (startsWith(str, marker)) {
        return 0;
    }

    // Search for the marker following a soft break.
    const length = marker.length;
    const position = str.indexOf('\n' + marker, length + 1);

    return (position > length) ? position + 1 : -1;
}