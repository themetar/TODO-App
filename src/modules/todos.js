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

  const _save = function () {
    Storage.storeItem(prefix, this);
  }

  const _update = function (properties) {
    const valid = validator(properties);
    for (const prop of valid)
      if (this.hasOwnProperty(prop)) this[prop] = valid[prop];
    this.save();
  };

  const _delete = function () {
    uids.freeID(this.id);
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

  return {make, findByID};
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
    update: function (project) {
      for (const prop of ["title", "description"])
        if (project.hasOwnProperty(prop)) this[prop] = project[prop];
      Storage.storeItem("project", this);
    },
  };
}());

const projectIDs = makeUIDTracker();

const makeProject = function makeProject_Factory ({title, description = "", id = null}) {
  let oid;
  
  if (id) {
    oid = parseInt(id);
    projectIDs.markID(oid);
  } else {
    oid = projectIDs.getID();
  }

  const project_obj = {
    title,
    description,
    get id () { return oid; },
  };

  return Object.assign(Object.create(project_prototype), project_obj);
}

const projects_arr = [];  // to store collection of all projects

/* Exposed method for creating Projects */

const addProject = function makeAndStoreNewProject (project_data) {
  const project = makeProject(project_data);
  projects_arr.push(project);
  Storage.storeItem("project", project);
  return project;
}

/* Exposed method for deleting Projects */

const deleteProject = function (id) {
  const index = projects_arr.findIndex(project => project.id === id);
  // remove from array
  const project = projects_arr.splice(index, 1)[0];
  // delete
  Storage.deleteItem("project", project);
};

/* Exposed collections of projects and todos */

const todos = collection(todos_arr);
const projects = collection(projects_arr);


/* Exposed method for deleting todos */

const deleteTodo = function (id) {
  const index = todos_arr.findIndex(todo => todo.id === id);
  // delete from arr
  const todo = todos_arr.splice(index, 1)[0];
  // remove from project
  const project = projects_arr.find(proj => proj.id === todo.project_id);
  project.removeTodo(todo);
  // delete from storage
  todo.delete();
};

/* Initialize from storage */

Storage.readAll({
  todo: data => { todos_arr.push(Todo.make(data)); },
  project: data => { projects_arr.push(makeProject(data)); },
});

export {addProject, deleteProject, deleteTodo, todos, projects, Todo};