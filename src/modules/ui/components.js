/*****************
  UI components
******************/

/*
  etc menu
  */

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
/* --- */

/*
  Screen-like scroll indicator / control
  */

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
/* --- */

export {etcMenu, scrollIndicator};