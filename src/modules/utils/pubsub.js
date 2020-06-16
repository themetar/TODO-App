/*
  Publish - subscribe events
*/

const handlers = new Map();

const subscribe = function (event_name, handler_fn) {
  if (handlers.has(event_name)) {
    const array = handlers.get(event_name);
    if (!array.inludes(handler_fn)) array.push(handler_fn);
  } else {
    handlers.set(event_name, [handler_fn]);
  }
};

const publish = function (event_name, data) {
  if (handlers.has(event_name))
    handlers.get(event_name).forEach(handler_fn => { handler_fn(event_name, data); });
};

export { subscribe, publish };