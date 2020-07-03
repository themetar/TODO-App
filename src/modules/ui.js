import * as events from './utils/pubsub';
import { deleteProject } from './todos';

let projects_collection;

let projects_container;

let scroll_controll;

let todo_form;

let add_project_button;

let project_form;

const resetForm = function resetFormInputs (form) {
  for (const input of form.querySelectorAll("input"))
    input.value = "";
  
  const textarea = form.querySelector('textarea[name=description]');
  if (textarea) textarea.value = "";
}

const openForm = function openForm (form, params = {}) {
  form.classList.remove('hidden');
  resetForm(form);
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

const etcOpenHandler = function (event) {
  const menu = this.parentElement;

  const off = (e) => {
    if (e === event) return;

    menu.classList.remove('open');
    document.removeEventListener('click', off);
  }

  if (!menu.classList.contains('open')) {
    menu.classList.add('open');
    document.addEventListener('click', off);
  }
};

const etcMenu = function (structure) {
  const div = document.createElement('div');
  div.classList.add('etc-menu');

  const etc = div.appendChild(document.createElement('div'));
  etc.classList.add("etc");
  etc.appendChild(document.createElement("span"));
  etc.addEventListener('click', etcOpenHandler);

  const menu = div.appendChild(document.createElement('ul'));
  menu.classList.add("menu");

  for (const entry of structure) {
    const li = menu.appendChild(document.createElement('li'));
    li.textContent = entry.text;
    if (entry.data) {
      for (const datum in entry.data) li.setAttribute("data-" + datum, entry.data[datum]);
    }
    if (entry.handler) li.addEventListener('click', entry.handler);
  }

  return div;
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
  if (todo.done) div.classList.add("done");

  /* checkbox */
  const label = div.appendChild(document.createElement("label"));
  label.classList.add("check");
  const check = label.appendChild(document.createElement('input'));
  check.setAttribute('type', 'checkbox');
  check.checked = todo.done;
  check.addEventListener('change', markTodoHandler);
  const checkmark = label.appendChild(document.createElement("span"));
  checkmark.classList.add("checkmark");

  /* title and date */
  const title = div.appendChild(document.createElement('span'));
  title.classList.add('title');
  title.appendChild(document.createTextNode(todo.title));
  title.addEventListener("click", editTodoHandler);

  const date = div.appendChild(document.createElement('span'));
  date.classList.add('due-date');
  date.appendChild(document.createTextNode(todo.due_date ? todo.due_date : ""));

  /*
   todo etc menu here
  */
  div.appendChild(etcMenu([{text: "Delete", data: {"todo-id": todo.id}, handler: deleteTodoHandler}]));

  return div;
};

const updateTodoElement = function (div, todo) {
  const title = div.querySelector('span.title');
  title.textContent = todo.title;
  const due_date = div.querySelector("span.due-date");
  due_date.textContent = todo.due_date;
  if (todo.done)
    div.classList.add("done");
  else
    div.classList.remove("done");
};

const scrollIndicator = function scrollIndicator (scroll_div) {
  let page;
  let pages;

  const element = document.createElement("div");

  const _setStyles = function () {
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children.item(i);
      child.classList.remove("active");
      if (i == page) child.classList.add("active");
    }
  }

  const reconfig = function () {
    pages = scroll_div.children.length;

    console.log("pages", pages);

    let num_segments = element.children.length;
    if (num_segments < pages) {
      for(let i = num_segments; i < pages; i++) {
        const segment = element.appendChild(document.createElement("div"));
        segment.classList.add("segment");

        segment.addEventListener("click", _ => {
          scroll_div.scrollTo({left: i * scroll_div.clientWidth, behavior: "smooth"});
        });
      }
    } else {
      const children = Array.prototype.slice.call(element.children, pages, num_segments);
      children.forEach(child => {
        element.removeChild(child);
      });
    }

    page = Math.round(scroll_div.scrollLeft / scroll_div.clientWidth);

    _setStyles();
  };

  scroll_div.addEventListener("scroll", _ => {
    const _page = Math.round(scroll_div.scrollLeft / scroll_div.clientWidth);

    if (_page !== page) {
      page = _page;
      _setStyles();
    }
  });

  reconfig();

  return {element, reconfig};
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

  projects_collection.each(project => {
    const project_element = projects_container.appendChild(createProjectElement(project));
    const todos_container = project_element.querySelector('.project-todos');
    project.todos.each(todo => {
      const todo_element = createTodoElement(todo);
      todos_container.appendChild(todo_element);
    });
  });

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