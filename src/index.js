import {addProject, todos, projects} from './modules/todos';

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
