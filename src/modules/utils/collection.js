/* read-only collections */

const collection = function makeACollectionOf (of) {
  return {
    map: function (fn) { return of.map(fn); },
    each: function (fn) { of.forEach(fn); },
    get length () { return of.length; },
  };
}

export default collection;