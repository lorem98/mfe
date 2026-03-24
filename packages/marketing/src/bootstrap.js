import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory } from "history";
import App from "./App";

// Mount function to start up the app
const mount = (el, { onNavigate, defaultHistory }) => {
  // Create a memory history for the marketing app
  /* This is required to allow the marketing app to use its own routing in isolation from the container app.
  Avoid using BrowserHistory in the marketing app as it will cause issues with routing 
  when the marketing app is used in isolation or when 
  the container app is refreshed on a route other than the root route. 
  If we are in development and in isolation, use BrowserHistory to enable navigation via the address bar.
  */
  const history = defaultHistory || createMemoryHistory();

  if (onNavigate) {
    history.listen(onNavigate);
  }

  ReactDOM.render(<App history={history} />, el);

  return {
    onParentNavigate({ pathname: nextPathname }) {
      const { pathname } = history.location;

      if (pathname !== nextPathname) {
        history.push(nextPathname);
      }
    },
  };
};

// If we are in development and in isolation
// call mount immediately
if (process.env.NODE_ENV === "development") {
  const devRoot = document.querySelector("#_marketing-dev-root");

  if (devRoot) {
    mount(devRoot, { defaultHistory: createMemoryHistory() });
  }
}

// We are running through container
// and should export the mount function
export { mount };
