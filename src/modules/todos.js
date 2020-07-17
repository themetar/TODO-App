/*
  Projects and Todos data model
*/

import makeUIDTracker from './utils/uid';
import * as Storage from './storage';

/*  Records 

    Requirements from the data model:
     - get all records ,e.d. all projects
     - find by id
     - make new record
     - records:
        * save
        * update
        * delete 
*/

const makeMaker = function (prefix, validator) {
  const uids = makeUIDTracker();

  const __all = [];

  const _save = function () {
    __all.push(this.id);
    Storage.storeItem(prefix, this);
  }

  const _update = function (properties) {
    const valid = validator(properties);
    for (const prop in properties)
      if (this.hasOwnProperty(prop)) this[prop] = valid[prop];
    this.save();
  };

  const _delete = function () {
    uids.freeID(this.id);
    __all.splice(__all.indexOf(this.id), 1);
    Storage.deleteItem(prefix, this);
  }

  const make = function (properties) {
    const obj = validator(properties);

    if (obj.hasOwnProperty("id") && obj.id != null) {
      obj.id = parseInt(obj.id);
      uids.markID(obj.id);
    } else {
      obj.id = uids.getID();
    }

    if (properties.hasOwnProperty("created_at")) {
      obj.created_at = new Date(properties.created_at);
    } else {
      obj.created_at = new Date();
    }

    return Object.assign(obj, {update: _update, save: _save, delete: _delete});
  };

  const findByID = function (id) {
    const data = Storage.readItem(prefix, id);
    if (data)
      return make(data);
  };

  const all = function () {
    let objects = [];
    
    if (__all.length === 0) {
      const processor = {};
      processor[prefix] = (data) => {
        const o = make(data);
        objects.push(o);
        __all.push(o.id);
      };
      Storage.readAll(processor);
    } else {
      objects = __all.map(id => findByID(id));
    }

    return objects;
  };

  return {make, findByID, all};
};

/* Todo object factory */

const validProperties = function ({title, project_id, description = "", due_date = null, done = false, id = null}) {
  project_id = parseInt(project_id);

  due_date = due_date || null;                // swap all falsey values with null
  due_date = due_date && new Date(due_date);  // convert to Date if not null
  
  return {
    title,
    project_id,
    description,
    due_date,
    done,
    id,
  };
};

const Todo = makeMaker("todo", validProperties);

const Project = makeMaker("project", ({title, description = "", id = null}) => { return {title, description, id};});

export {Todo, Project};