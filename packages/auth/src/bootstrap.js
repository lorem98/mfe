import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory, createMemoryHistory } from "history";
import App from "./App";

/**
 * mount — the single integration point consumed by the container via
 * Module Federation.  It renders the Auth sub-app into the supplied DOM
 * element and returns a control object so the container can keep both
 * routing histories in sync.
 *
 * Options
 * -------
 * onSignIn       — callback fired after a successful sign-in / sign-up so
 *                  the container can update its auth state.
 * onNavigate     — callback fired whenever the auth app navigates; lets the
 *                  container mirror the path in its own history.
 * defaultHistory — override the internal history (used in dev isolation).
 * initialPath    — starting path for the memory history when embedded
 *                  (e.g. "/auth/signin").
 */
const mount = (el, { onSignIn, onNavigate, defaultHistory, initialPath } = {}) => {
  const history =
    defaultHistory ||
    createMemoryHistory({ initialEntries: [initialPath || "/auth/signin"] });

  if (onNavigate) {
    history.listen(onNavigate);
  }

  ReactDOM.render(<App history={history} onSignIn={onSignIn} />, el);

  return {
    onParentNavigate({ pathname: nextPathname }) {
      const { pathname } = history.location;

      if (pathname !== nextPathname) {
        history.push(nextPathname);
      }
    },
  };
};

// ─── Dev isolation ───────────────────────────────────────────────────────────
// When the auth app is started standalone (npm start inside packages/auth),
// the HTML page includes a dedicated root div.  We detect this and mount
// directly with a real browser history so the address bar works.
if (process.env.NODE_ENV === "development") {
  const devRoot = document.querySelector("#_auth-dev-root");

  if (devRoot) {
    mount(devRoot, { defaultHistory: createBrowserHistory() });
  }
}

// Exported and consumed by the container through the "auth/AuthApp" remote.
export { mount };
