/**
 * Returns the indices where searchStr appears in the text.
 * @param searchStr string we are looking for
 * @param text text to look for searchStr
 * @returns index array
 */
export function getIndicesOf(searchStr: string, text: string): number[] {
    var searchStrLen = searchStr.length;
    if (searchStrLen === 0) {
        return [];
    }
    var startIndex = 0, index, indices = [];
    while ((index = text.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

/**
 * Computes the minimum of two numbers if they are both positive.
 * Otherwise, returns undefined if both are negative and the positive value
 * if only one is negative.
 * @param a
 * @param b
 * @returns
 */
export function minNoNegative(a: number, b: number) {
    if (a === b && b === -1) {
        return undefined;
    }
    if (a === -1) {
        return b;
    }
    if (b === -1) {
        return a;
    }
    return Math.min(a, b);
}
