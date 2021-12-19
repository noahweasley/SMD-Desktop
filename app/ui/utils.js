'use-strict'

// the next siblings
module.exports.getNextSiblings = function(elem) {
    var sibs = [];
    while (elem = elem.nextSibling) {
        sibs.push(elem);
    }
    return sibs;
}

// this will start from the current element and get all the
// previous siblings
module.exports.getPreviousSiblings = function(elem) {
    var sibs = [];
    while (elem = elem.previousSibling) {
        sibs.push(elem);
    }
    return sibs;
}

// this will start from the first child of the current element's
// parent and get all the siblings
module.exports.getAllSiblings = function(elem) {
    var sibs = [];
    elem = elem.parentNode.firstChild;
    while (elem = elem.nextSibling) {
        sibs.push(elem);
    }
    return sibs;
}