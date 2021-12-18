'use-strict'

// the next siblings
export function getNextSiblings(elem) {
    var sibs = [];
    while (elem = elem.nextSibling) {
        sibs.push(elem);
    }
    return sibs;
}

// this will start from the current element and get all the
// previous siblings
export function getPreviousSiblings(elem) {
    var sibs = [];
    while (elem = elem.previousSibling) {
        sibs.push(elem);
    }
    return sibs;
}

// this will start from the first child of the current element's
// parent and get all the siblings
export function getAllSiblings(elem) {
    var sibs = [];
    elem = elem.parentNode.firstChild;
    while (elem = elem.nextSibling) {
        sibs.push(elem);
    }
    return sibs;
}