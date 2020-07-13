/*
  Projects and Todos data model
*/

import makeUIDTracker from './utils/uid';
import collection from './utils/collection';
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


const todos_arr = []; // array to store collection of all todos

/* Project object factory */

const project_prototype = (function projectPrototypeIIF () {

  const project_todos = new Map();  // asociation between projects and todos

  const addTodo = function addTodoThroughProject (todo_data) {
    const todo = Todo.make(Object.assign({}, todo_data, {project_id: this.id}));

    todos_arr.push(todo); // add to all todos

    // add to project's todos
    const _todos = (project_todos.has(this.id) && project_todos || project_todos.set(this.id, [])).get(this.id);
    _todos.push(todo);

    todo.save();

    return todo;
  };

  const removeTodo = function removeTodoFromProject (todo_data) {
    const _todos = project_todos.has(this.id) && project_todos.get(this.id);
    if (_todos) {
      _todos.splice(_todos.findIndex(t => t.id == todo_data.id), 1);
    }
  };

  const project_todos__colls = new Map();

  const collectionForProject = function (prj_id) {
    if (!project_todos.has(prj_id)) {
      project_todos.set(prj_id, todos_arr.filter(td => td.project_id === prj_id));
    }

    if (!project_todos__colls.has(prj_id)) {
      project_todos__colls.set(prj_id, collection(project_todos.get(prj_id)));
    }

    return project_todos__colls.get(prj_id);
  };
  
  return {
    addTodo,
    removeTodo,
    get todos () {
      return collectionForProject(this.id);
    },
  };
}());

const Project = makeMaker("project", ({title, description = "", id = null}) => { return {title, description, id};});

const makeProject = function makeProject_Factory (project_data) {

  const project_obj = Project.make(project_data);

  return Object.assign(Object.create(project_prototype), project_obj);
}

const projects_arr = [];  // to store collection of all projects

/* Exposed collections of projects and todos */

const projects = collection(projects_arr);

/* Initialize from storage */

Storage.readAll({
  todo: data => { todos_arr.push(Todo.make(data)); },
  project: data => { projects_arr.push(makeProject(data)); },
});

export {projects, Todo, Project};