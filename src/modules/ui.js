let projects_collection;

let projects_container;

const initialize = function initializeUserInterface (projects) {
  projects_collection = projects;

  projects_container = document.querySelector("#projects-container");

  projects_container.appendChild(document.createTextNode("Hello App"));

  projects_collection.each(project => {
    const h1 = projects_container.appendChild(document.createElement('h1'));
    h1.appendChild(document.createTextNode(project.title));
    const table = projects_container.appendChild(document.createElement('table'));
    project.todos.each(todo => {
      const tr = table.appendChild(document.createElement('tr'));
      for (let prop in todo) {
        const td = tr.appendChild(document.createElement('td'));
        td.appendChild(document.createTextNode(todo[prop]));
      }
    });
  });
};

export { initialize };