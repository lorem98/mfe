import React from "react";
import ReactDOM from "react-dom";
import { createMemoryHistory, createBrowserHistory } from "history";
import App from "./App";

// Mount function to start up the app
const mount = (el, { onNavigate, defaultHistory }) => {
  // Use a default memory history for embedded usage (container).
  // When running the marketing app in development isolation we pass
  // a browser history below so the address bar updates. For embedded
  // use (the container) we keep `createMemoryHistory()` to avoid
  // interfering with the container's routing.
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
    // In development when running the marketing app in isolation
    // use a browser history so the address bar and refresh work.
    mount(devRoot, { defaultHistory: createBrowserHistory() });
  }
}

// We are running through container
// and should export the mount function
export { mount };
