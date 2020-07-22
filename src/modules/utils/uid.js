/*
  Utility for creating unique random identifiers

  Makes generators that can create random integers to be used as identifiers.
*/

const makeUIDTracker = function makeUIDTracker () {
  const uids = new Set();

  const markID = function markIDasUsed (id) {
    uids.add(id);
  };
  
  const getID = function getID () {
    let id;

    do {
      id = parseInt(Math.random() * Number.MAX_SAFE_INTEGER);
    } while (uids.has(id));

    markID(id);

    return id;
  };

  const freeID = function freeID (id) {
    uids.delete(id);
  };

  return {
    getID,
    freeID,
    markID,
  }
}

export default makeUIDTracker;