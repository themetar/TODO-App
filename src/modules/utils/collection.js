/* read-only collections */

const collection = function makeACollectionOf (of) {
  return {
    map: function (fn) { return of.map(fn); },
    each: function (fn) { of.forEach(fn); },
    find: function (params) {
      for (let item of of) {
        let acc = true;
        for (const prop in params) acc = acc && (params[prop] == item[prop]);
        if (acc) return item;
      }
    },
    get length () { return of.length; },
  };
}

export default collection;