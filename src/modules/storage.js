/*
  Storage utility
*/

const available = !!(window && window.localStorage);

const key = (prefix, id) => `${prefix}-${id}`;

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
    localStorage.setItem(key(prefix, item.id), JSON.stringify(item));
  }
}

const readItem = function readObject (prefix, id) {
  if (available) {
    const item_key = key(prefix, id);
    console.log(item_key)
    const data = localStorage.getItem(item_key);
    if (data)
      return JSON.parse(data);
  }
}

const deleteItem = function deleteObject (prefix, item) {
  if (available) {
    localStorage.removeItem(key(prefix, item.id));
  }
}

export { available, readAll, storeItem, readItem, deleteItem };