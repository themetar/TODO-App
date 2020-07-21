import {Todo, Project} from './modules/todos';
import * as UI from './modules/ui';

const todos = Todo.all();
if (todos.length === 0) {
  let project = Project.make({title: "Tasks"});
  project.save();
  Todo.make({title: "Add todos with the ADD button",
              project_id: project.id,
            }).save();
  Todo.make({title: "Click/tap the title to edit",
              description: "You can change the description or the due date.",
              due_date: new Date(),
              project_id: project.id,
            }).save();
  Todo.make({title: "Use the checkbox to mark as done",
              description: ";)",
              due_date: new Date(Date.now() + 2*24*36e5),
              project_id: project.id,
            }).save();
  Todo.make({title: "Open the item menu for other actions",
              project_id: project.id,
            }).save();

  project = Project.make({title: "New Project"});
  project.save();
  Todo.make({title: "Add a new project from the app menu",
              due_date: new Date(Date.now() + 7*24*36e5),
              project_id: project.id,
            }).save();
}

UI.initialize(Project.all().sort((a, b) => a.created_at - b.created_at), Todo.all().sort((a, b) => a.created_at - b.created_at));

UI.events.subscribe('new-todo', (event, data) => {
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
