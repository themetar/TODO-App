import {Todo, Project} from './modules/todos';
import * as UI from './modules/ui';

const todos = Todo.all();
if (todos.length === 0) {
  const project = Project.make({title: "default"});
  project.save();
  console.log("create new")
  Todo.make({title: "Something", project_id: project.id}).save();
  Todo.make({title: "Other", description: "text text text", project_id: project.id}).save();
}

console.log(todos.length);

todos.forEach(todo => console.log(todo, todo.id));

console.log( todos.map(td => {
    let o = Object.assign({}, td);
    o.title = o.title.toUpperCase();
    o.description = "uppercased";
    return o;
  }) );

todos.forEach(todo => console.log(todo));

UI.initialize(Project.all().sort((a, b) => a.created_at - b.created_at), Todo.all().sort((a, b) => a.created_at - b.created_at));

UI.events.subscribe('new-todo', (event, data) => {
  console.log("new todo handler");
  console.log(event);
  console.log(data);

  const todo = Todo.make(data);
  todo.save();

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
  const todo = Todo.findByID(data.todo_id);
  todo.delete();
});

UI.events.subscribe("new-project", (_, data) => {
  const project = Project.make(data);
  project.save();
  UI.addProject(project);
});

UI.events.subscribe("edit-project", (event, data) => {
  const project = Project.findByID(data.project_id);
  UI.editProject(project);
});

UI.events.subscribe("update-project", (event, data) => {
  const project = Project.findByID(data.project_id);
  project.update(data);
  UI.updateProject(project);
});

UI.events.subscribe("delete-project", (_, data) => {
  const project = Project.findByID(data.project_id);
  Todo.all().filter(todo => todo.project_id === project.id).forEach(todo => todo.delete());
  project.delete();
});
