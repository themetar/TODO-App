let projects_collection;

let projects_container;

let todo_form;

const resetTodoForm = function resetTodoFormInputs () {
  todo_form.querySelector('input[name=title]').value = "";
  todo_form.querySelector('textarea[name=description]').value = "";
  todo_form.querySelector('input[name=due-date]').value = "";
}

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

const createTodoElement = function createTodoDisplayElement (todo) {
  const div = document.createElement('div');
  div.classList.add('todo');
  div.setAttribute('id', 'todo-' + todo.id);

  const title = div.appendChild(document.createElement('span'));
  title.appendChild(document.createTextNode(todo.title));

  /*
   todo buttons here
  */

  return div;
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

export { initialize };