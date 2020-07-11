import {Todo, addProject, deleteTodo, deleteProject, todos, projects} from './modules/todos';
import * as UI from './modules/ui';

if (todos.length === 0) {
  const project = addProject({title: "default"});
  console.log("create new")
  project.addTodo({title: "Something"});
  project.addTodo({title: "Other", description: "text text text"});
}

console.log(todos.length);

todos.each(todo => console.log(todo, todo.id));

console.log( todos.map(td => {
    let o = Object.assign({}, td);
    o.title = o.title.toUpperCase();
    o.description = "uppercased";
    return o;
  }) );

todos.each(todo => console.log(todo));

projects.each(prj => {
      console.log(prj);
      console.log(prj.todos);
      prj.todos.each(td => console.log(prj.id, td));
    });

UI.initialize(projects);

UI.events.subscribe('new-todo', (event, data) => {
  console.log("new todo handler");
  console.log(event);
  console.log(data);

  let proj = (function (){
    let project;
    projects.each(proj => {
      if (proj.id == data.project_id) project = proj; return;
    });
    return project;
  }());

  let todo = proj.addTodo(data);

  UI.addTodo(todo);
});

UI.events.subscribe("edit-todo", (event, data) => {
  const todo = Todo.findByID(data.todo_id);
  UI.editTodo(todo);
});

UI.events.subscribe("update-todo", (event, data) => {
  const todo = Todo.findByID(data.todo_id);
  todo.update(data);
  UI.updateTodo(todo);
});

UI.events.subscribe("delete-todo", (_, data) => {
  deleteTodo(data.todo_id);
});

UI.events.subscribe("new-project", (_, data) => {
  const project = addProject(data);
  UI.addProject(project);
});

UI.events.subscribe("edit-project", (event, data) => {
  const project = projects.find({id: data.project_id});
  UI.editProject(project);
});

UI.events.subscribe("update-project", (event, data) => {
  const project = projects.find({id: data.project_id});
  project.update(data);
  UI.updateProject(project);
});

UI.events.subscribe("delete-project", (_, data) => {
  const project = projects.find({id: data.project_id});
  project.todos.each(td => deleteTodo(td.id));
  deleteProject(project.id);
});
