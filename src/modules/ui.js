let projects_collection;

let projects_container;

const createProjectElement = function createProjectDisplayElement (project) {
  const section = document.createElement('section');
  section.classList.add('project');
  section.setAttribute('id', 'project-' + project.id);

  const h2 = section.appendChild(document.createElement('h2'));
  h2.appendChild(document.createTextNode(project.title));

  /*
   project buttons here
  */

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