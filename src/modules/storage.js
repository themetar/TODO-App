/*
  Storage utility
*/

const available = !!(window && window.localStorage);

const readAll = function readAllObjectsFromStorage (processors = {}) {
  if (available) {
    const len = localStorage.length;
    
    for (let i = 0; i < len; i++) {
      const key = localStorage.key(i);
      for (let prefix in processors) {
        if (processors.hasOwnProperty(prefix)) {
          if (processors[prefix]) {
            const fn = processors[prefix];
            if (key.match("^" + prefix))
              fn(JSON.parse(localStorage.getItem(key))); 
          }
        }
      }
    }
  }
};

const storeItem = function storeObject (prefix, item) {
  if (available) {
    localStorage.setItem(prefix + item.id, JSON.stringify(item));
  }
}

const deleteItem = function deleteObject (prefix, item) {
  if (available) {
    localStorage.removeItem(prefix + item.id);
  }
}

export { available, readAll, storeItem, deleteItem };