import {etcMenu, scrollIndicator} from './components';
import * as events from '../utils/pubsub';
import {formatRelative, formatDistanceToNow, differenceInCalendarDays} from 'date-fns';

const formatDate = function (date) {
  const now = new Date();
  const difference = differenceInCalendarDays(date, now);
  return Math.abs(difference) < 7 ? formatRelative(date, now).split(" at ")[0] : formatDistanceToNow(date, {addSuffix: true});
}

let projects_container;

let scroll_controll;

let todo_form_div;

let project_form_div;

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

  document.body.style.overflowY = "hidden";
}

const closeForm = function closeForm (form) {
  form.classList.add('hidden');

  document.body.style.overflowY = "visible";
};

/* Project UI element */

const editProjectHandler = function editProjectHandler (event) {
  const project_id = this.getAttribute("data-project-id");
  events.publish("edit-project", {project_id: Number(project_id)});
};

const deleteProjectHandler = function deleteProjectHandler (event) {
  const project_id = this.getAttribute("data-project-id");
  const element = document.querySelector("#" + "project-" + project_id);
  element.parentElement.removeChild(element);
  events.publish("delete-project", {project_id: Number(project_id)});
  scroll_controll.reconfig();
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
  add_todo_btn.addEventListener('click', (event) => {
    openForm(todo_form_div, {"project-id": project.id});  
  });

  const todos_container = section.appendChild(document.createElement('div'));
  todos_container.classList.add('project-todos');

  return section;
};

const updateProjectElement = function updateProjectDisplayElement (element, project) {
  const title = element.querySelector('h2');
  title.textContent = project.title;
};

/* Todo UI element */

const deleteTodoHandler = function (event) {
  const todo_id = this.getAttribute("data-todo-id");
  const element = document.querySelector("#" + "todo-" + todo_id);
  element.parentElement.removeChild(element);
  events.publish("delete-todo", {todo_id: Number(todo_id)});
};

const editTodoHandler = function editTodoHandler (event) {
  let todo_id = this.parentElement.getAttribute("id");
  todo_id = todo_id.replace("todo-", "");
  
  events.publish("edit-todo", {todo_id: todo_id});
};

const markTodoHandler = function (event) {
  let todo_id = this.parentElement.parentElement.getAttribute("id");
  todo_id = todo_id.replace("todo-", "");
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

/*
  Exposed action methods
  */

const initialize = function initializeUserInterface (all_projects, all_todos) {

  /* Set up app menu */

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

  const add_project_button = document.querySelector("#add-project-btn");
  add_project_button.addEventListener("click", event => {
    openForm(project_form_div);
  });

  /* Set up new/edit forms */

  project_form_div  = document.querySelector("#project-form");
  todo_form_div     = document.querySelector('#todo-form');

  const _closeHandler = (event) => closeForm(event.target.parentElement.parentElement.parentElement);

  project_form_div.querySelector(".close-btn").addEventListener("click", _closeHandler);
  todo_form_div.querySelector(".close-btn").addEventListener('click', _closeHandler);

  const _submitHandlerFor = type => event => {
    event.preventDefault();

    const form = event.target;

    // collect data
    const data = {};
    form.querySelectorAll('input, textarea').forEach(input => {
      let name = input.getAttribute('name');
      name = name.replace('-', '_');
      const value = input.value;

      data[name] = value;
    });

    // 2. send event to 
    const out_event = (data[type +"_id"] != "") ? "update" : "new";
    events.publish(out_event + "-" + type, data);
    
    // close form
    closeForm(form.parentElement);    
  };

  project_form_div.querySelector("form").addEventListener("submit", _submitHandlerFor("project"));
  todo_form_div.querySelector('form').addEventListener('submit', _submitHandlerFor("todo"));

  /* Initialize stored projects / todos */

  projects_container = document.querySelector("#projects-container");  

  for (const project of all_projects) {
    projects_container.appendChild(createProjectElement(project));
  }

  for (const todo of all_todos) {
    const project_element = projects_container.querySelector("#project-" + todo.project_id);
    const todos_container = project_element.querySelector('.project-todos');
    todos_container.appendChild(createTodoElement(todo));
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

    let todo_div = container.appendChild(createTodoElement(todo));

    todo_div.scrollIntoView({behavior: "smooth"});
  }
}

const editTodo = function showEditTodoForm (todo) {
  const _todo = Object.assign({"todo-id": todo.id, "project-id": todo.project_id, "due-date": todo.due_date}, todo);
  openForm(todo_form_div, _todo);
}

const updateTodo = function (todo) {
  const element = document.querySelector("#todo-" + todo.id);
  updateTodoElement(element, todo);
}

const addProject = function (project) {
  const project_section = createProjectElement(project);
  projects_container.appendChild(project_section);
  scroll_controll.reconfig();
  project_section.scrollIntoView({behavior: "smooth"});
}

const editProject = function showEditProjectForm (project) {
  const _project = Object.assign({"project-id": project.id}, project);
  openForm(project_form_div, _project);
};

const updateProject = function (project) {
  const element = document.querySelector("#project-" + project.id);
  updateProjectElement(element, project);
};

export { initialize, events, addProject, editProject, updateProject, addTodo, editTodo, updateTodo };