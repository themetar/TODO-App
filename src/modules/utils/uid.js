/*
  Utility for creating unique random identifiers

  Makes generators that can create random integers to be used as identifiers.
*/

const makeUIDTracker = function makeUIDTracker () {
  const uids = [];

  const markID = function markIDasUsed (id) {
    uids.push(id);
  };
  
  const getID = function getID () {
    let id;

    do {
      id = parseInt(Math.random() * Number.MAX_SAFE_INTEGER);
    } while (uids.includes(id));

    markID(id);

    return id;
  };

  const freeID = function freeID (id) {
    if (uids.includes(id)) uids.splice(uids.indexOf(id), 1);
  };

  return {
    getID,
    freeID,
    markID,
  }
}

export default makeUIDTracker;