import * as events from './utils/pubsub';

let projects_collection;

let projects_container;

let todo_form;

const resetTodoForm = function resetTodoFormInputs () {
  todo_form.querySelector('input[name=title]').value = "";
  todo_form.querySelector('textarea[name=description]').value = "";
  todo_form.querySelector('input[name=due-date]').value = "";
}

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
  etc.textContent = "etc";
  etc.addEventListener('click', etcOpenHandler);

  const menu = div.appendChild(document.createElement('ul'));

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

const createProjectElement = function createProjectDisplayElement (project) {
  const section = document.createElement('section');
  section.classList.add('project');
  section.setAttribute('id', 'project-' + project.id);

  const h2 = section.appendChild(document.createElement('h2'));
  h2.appendChild(document.createTextNode(project.title));

  const add_todo_btn = section.appendChild(document.createElement('button'));
  add_todo_btn.appendChild(document.createTextNode("Add todo"));
  add_todo_btn.addEventListener('click', (event) => {
    todo_form.classList.remove('hidden');
    todo_form.querySelector('input[name="project-id"]').setAttribute('value', project.id);
    todo_form.querySelector('input[name=title]').focus();
    resetTodoForm();    
  });

  const todos_container = section.appendChild(document.createElement('div'));
  todos_container.classList.add('project-todos');

  return section;
};

const deleteTodoHandler = function (event) {
  const todo_id = this.getAttribute("data-todo-id");
  const element = document.querySelector("#" + "todo-" + todo_id);
  element.parentElement.removeChild(element);
  events.publish("delete-todo", {todo_id: Number(todo_id)});
  console.log("delete");
};

const createTodoElement = function createTodoDisplayElement (todo) {
  const div = document.createElement('div');
  div.classList.add('todo');
  div.setAttribute('id', 'todo-' + todo.id);

  /* checkbox */
  const check = div.appendChild(document.createElement('input'));
  check.setAttribute('type', 'checkbox');

  /* title and date */
  const title = div.appendChild(document.createElement('span'));
  title.classList.add('title');
  title.appendChild(document.createTextNode(todo.title));
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
  let title = div.querySelector('span');
  title.textContent = todo.title;
};

const initialize = function initializeUserInterface (projects) {
  projects_collection = projects;

  projects_container = document.querySelector("#projects-container");

  todo_form = document.querySelector('#todo-form');
  todo_form.querySelector(".close-btn").addEventListener('click', (event) => {
    todo_form.classList.add('hidden');
  });
  todo_form.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    // collect data
    const data = {};
    todo_form.querySelectorAll('input').forEach(input => {
      let name = input.getAttribute('name');
      name = name.replace('-', '_');
      const value = input.value;

      data[name] = value;
    });
    console.log(data);

    // 2. send event to app
    events.publish('new-todo', data);
    
    // close form
    todo_form.classList.add('hidden');
  });

  projects_collection.each(project => {
    const project_element = projects_container.appendChild(createProjectElement(project));
    const todos_container = project_element.querySelector('.project-todos');
    project.todos.each(todo => {
      const todo_element = createTodoElement(todo);
      todos_container.appendChild(todo_element);
    });
  });
};

const addTodo = function (todo) {
  const project_id = todo.project_id;
  
  const project_div = document.querySelector("#project-" + project_id);

  if (project_div) {
    let todo_div = project_div.querySelector("#todo-" + todo.id);

    todo_div = todo_div || project_div.appendChild(createTodoElement(todo));
  }


}

export { initialize, events, addTodo };