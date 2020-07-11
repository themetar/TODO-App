import {etcMenu, scrollIndicator} from './components';
import * as events from '../utils/pubsub';
import {formatRelative, formatDistanceToNow, differenceInCalendarDays} from 'date-fns';

const formatDate = function (date) {
  const now = new Date();
  const difference = differenceInCalendarDays(date, now);
  return Math.abs(difference) < 7 ? formatRelative(date, now).split(" at ")[0] : formatDistanceToNow(date, {addSuffix: true});
}

let projects_collection;

let projects_container;

let scroll_controll;

let todo_form;

let add_project_button;

let project_form;

const openForm = function openForm (form, params = {}) {
  form.classList.remove('hidden');
  form.firstElementChild.reset();
  for (const input of form.querySelectorAll("input[type=hidden]")) input.value = "";
  for (const key in params) {
    const element = form.querySelector("[name=" + key + "]");
    const value = params[key] && params[key].toISOString ? params[key].toISOString().substr(0, 10) : params[key];  // for due_date
    if (element) element.value = value;
  }
  form.querySelector('input[name=title]').focus();
}

const closeForm = function closeForm (form) {
  form.classList.add('hidden');
};

const editProjectHandler = function editProjectHandler (event) {
  const project_id = this.getAttribute("data-project-id");
  console.log("edit-project");
  events.publish("edit-project", {project_id: Number(project_id)});
};

const deleteProjectHandler = function deleteProjectHandler (event) {
  const project_id = this.getAttribute("data-project-id");
  const element = document.querySelector("#" + "project-" + project_id);
  element.parentElement.removeChild(element);
  events.publish("delete-project", {project_id: Number(project_id)});
  scroll_controll.reconfig();
  console.log("delete project");
};

const createProjectElement = function createProjectDisplayElement (project) {
  const section = document.createElement('section');
  section.classList.add('project');
  section.setAttribute('id', 'project-' + project.id);

  const header = section.appendChild(document.createElement("header"));

  const h2 = header.appendChild(document.createElement('h2'));
  h2.appendChild(document.createTextNode(project.title));

  header.appendChild(etcMenu([
    {text: "Edit", data: {"project-id": project.id}, handler: editProjectHandler},
    {text: "Delete", data: {"project-id": project.id}, handler: deleteProjectHandler},
  ]));

  const add_todo_btn = section.appendChild(document.createElement('button'));
  add_todo_btn.appendChild(document.createTextNode("Add todo"));
  add_todo_btn.addEventListener('click', (event) => {
    openForm(todo_form, {"project-id": project.id});  
  });

  const todos_container = section.appendChild(document.createElement('div'));
  todos_container.classList.add('project-todos');

  return section;
};

const updateProjectElement = function updateProjectDisplayElement (element, project) {
  const title = element.querySelector('h2');
  title.textContent = project.title;
};

const deleteTodoHandler = function (event) {
  const todo_id = this.getAttribute("data-todo-id");
  const element = document.querySelector("#" + "todo-" + todo_id);
  element.parentElement.removeChild(element);
  events.publish("delete-todo", {todo_id: Number(todo_id)});
  console.log("delete");
};

const editTodoHandler = function editTodoHandler (event) {
  let todo_id = this.parentElement.getAttribute("id");
  todo_id = todo_id.replace("todo-", "");
  
  events.publish("edit-todo", {todo_id: todo_id});
};

const markTodoHandler = function (event) {
  let todo_id = this.parentElement.parentElement.getAttribute("id");
  todo_id = todo_id.replace("todo-", "");
  console.log("change", this.checked);
  events.publish("update-todo", {todo_id, done: this.checked});
};

const createTodoElement = function createTodoDisplayElement (todo) {
  const div = document.createElement('div');
  div.classList.add('todo');
  div.setAttribute('id', 'todo-' + todo.id);

  /* checkbox */
  const label = div.appendChild(document.createElement("label"));
  label.classList.add("check");
  const checkbox = label.appendChild(document.createElement('input'));
  checkbox.setAttribute('type', 'checkbox');
  checkbox.addEventListener('change', markTodoHandler);
  const checkmark = label.appendChild(document.createElement("span"));
  checkmark.classList.add("checkmark");

  /* title and date */
  const title = div.appendChild(document.createElement('span'));
  title.classList.add('title');
  title.addEventListener("click", editTodoHandler);

  const date = div.appendChild(document.createElement('span'));
  date.classList.add('due-date');

  /* etc menu */
  div.appendChild(etcMenu([{text: "Delete", data: {"todo-id": todo.id}, handler: deleteTodoHandler}]));

  /* set values */
  updateTodoElement(div, todo);

  return div;
};

const updateTodoElement = function (div, todo) {
  const title = div.querySelector('span.title');
  title.textContent = todo.title;
  const due_date = div.querySelector("span.due-date");
  due_date.textContent = todo.due_date && formatDate(todo.due_date) || "";
  const checkbox = div.querySelector("input[type=checkbox]");
  if (todo.done != checkbox.checked) checkbox.checked = todo.done;
  if (todo.done)
    div.classList.add("done");
  else
    div.classList.remove("done");
};

const initialize = function initializeUserInterface (projects) {
  projects_collection = projects;

  const app_menu = document.querySelector("#app-menu");
  const app_menu_btn = document.querySelector("#app-menu-button");

  const menuOpen = () => {
      app_menu.classList.add("open");
      app_menu_btn.classList.add("open");
  };

  const menuClose = () => {
    if (app_menu.classList.contains("open")) {
      app_menu.classList.remove("open");
      app_menu_btn.classList.remove("open");
    }
  };

  app_menu_btn.addEventListener("click", _ => {
    if (app_menu.classList.contains("open"))
      menuClose();
    else
      menuOpen();
  });

  app_menu.querySelector("ul").addEventListener("click", menuClose);

  project_form = document.querySelector("#project-form");

  add_project_button = document.querySelector("#add-project-btn");
  add_project_button.addEventListener("click", event => {
    openForm(project_form);
  });

  project_form.querySelector(".close-btn").addEventListener("click", event => {
    closeForm(project_form);
  });

  project_form.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();

    // collect data
    const data = {};
    project_form.querySelectorAll('input, textarea').forEach(input => {
      let name = input.getAttribute('name');
      name = name.replace('-', '_');
      const value = input.value;

      data[name] = value;
    });

    // 2. send event to 
    if (data.project_id != "")
      events.publish("update-project", data);
    else
      events.publish("new-project", data);
    
    // close form
    closeForm(project_form);    
  });

  projects_container = document.querySelector("#projects-container");

  todo_form = document.querySelector('#todo-form');
  todo_form.querySelector(".close-btn").addEventListener('click', (event) => {
    closeForm(todo_form);
  });
  todo_form.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    // collect data
    const data = {};
    todo_form.querySelectorAll('input, textarea').forEach(input => {
      let name = input.getAttribute('name');
      name = name.replace('-', '_');
      const value = input.value;

      data[name] = value;
    });
    console.log(data);

    // 2. send event to 
    if (data.todo_id != "")
      events.publish("update-todo", data);
    else
      events.publish('new-todo', data);
    
    // close form
    closeForm(todo_form);
  });

  for (const project of projects_collection) {
    const project_element = projects_container.appendChild(createProjectElement(project));
    const todos_container = project_element.querySelector('.project-todos');
    project.todos.each(todo => {
      const todo_element = createTodoElement(todo);
      todos_container.appendChild(todo_element);
    });
  }

  scroll_controll = scrollIndicator(projects_container);
  scroll_controll.element.classList.add("scroller");
  document.querySelector("#content").appendChild(scroll_controll.element);
};

const addTodo = function (todo) {
  const project_id = todo.project_id;
  
  const project_div = document.querySelector("#project-" + project_id);

  if (project_div) {
    const container = project_div.querySelector('.project-todos');

    let todo_div = container.querySelector("#todo-" + todo.id);

    todo_div = todo_div || container.appendChild(createTodoElement(todo));
  }


}

const editTodo = function showEditTodoForm (todo) {
  const _todo = Object.assign({"todo-id": todo.id, "project-id": todo.project_id, "due-date": todo.due_date}, todo);
  console.log(_todo);
  openForm(todo_form, _todo);
}

const updateTodo = function (todo) {
  const element = document.querySelector("#todo-" + todo.id);
  updateTodoElement(element, todo);
}

const addProject = function (project) {
  projects_container.appendChild(createProjectElement(project));
  scroll_controll.reconfig();
}

const editProject = function showEditProjectForm (project) {
  const _project = Object.assign({"project-id": project.id}, project);
  console.log(_project);
  openForm(project_form, _project);
};

const updateProject = function (project) {
  const element = document.querySelector("#project-" + project.id);
  updateProjectElement(element, project);
};

export { initialize, events, addProject, editProject, updateProject, addTodo, editTodo, updateTodo };